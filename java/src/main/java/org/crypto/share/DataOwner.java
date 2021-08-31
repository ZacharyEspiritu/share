/**
 * Copyright 2020, Brown University, Providence, RI.
 *
 *                         All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and
 * its documentation for any purpose other than its incorporation into a
 * commercial product or service is hereby granted without fee, provided
 * that the above copyright notice appear in all copies and that both
 * that copyright notice and this permission notice appear in supporting
 * documentation, and that the name of Brown University not be used in
 * advertising or publicity pertaining to distribution of the software
 * without specific, written prior permission.
 *
 * BROWN UNIVERSITY DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE,
 * INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR ANY
 * PARTICULAR PURPOSE.  IN NO EVENT SHALL BROWN UNIVERSITY BE LIABLE FOR
 * ANY SPECIAL, INDIRECT OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

package org.crypto.share;

import com.google.common.collect.Multimap;
import org.crypto.share.emm.*;
import org.crypto.share.util.RandomSet;
import org.crypto.sse.CryptoPrimitives;

import javax.annotation.Nonnull;
import javax.crypto.NoSuchPaddingException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

public class DataOwner {

    private @Nonnull final Server server;
    private @Nonnull final SharePrivateKey sharePrivateKey;

    public DataOwner(SharePrivateKey sharePrivateKey, Server server) {
        this.server = server;
        this.sharePrivateKey = sharePrivateKey;
    }

    /**
     * Adds the Multimap plaintextData to the server.
     */
    public void updateServerWithMultimap(final Multimap<String, String> plaintextData)
            throws InvalidAlgorithmParameterException, NoSuchAlgorithmException,
                   NoSuchPaddingException, NoSuchProviderException, InvalidKeyException,
                   IOException {
        HashMap<String, byte[]> updateTokens = new HashMap<>();

        UpdateType operation = UpdateType.INSERT;
        for (String plaintextLabel : plaintextData.keySet()) {
            Collection<String> plaintextValues = plaintextData.get(plaintextLabel);

            VersionCounter versionCounter = claimVersionCounterRange(plaintextLabel,
                                                                     plaintextValues.size());

            int version = versionCounter.getVersion();
            int counter = versionCounter.getCounter();
            for (String plaintextValue : plaintextValues) {
                counter++;
                UpdateToken updateToken = generateUpdateToken(sharePrivateKey.getLabelKey(),
                                                              sharePrivateKey.getValueKey(),
                                                              plaintextLabel,
                                                              plaintextValue,
                                                              operation,
                                                              version,
                                                              counter);
                updateTokens.put(updateToken.getLabel(), updateToken.getValue());
            }
        }

        System.out.println("        sending update tokens to server: " + updateTokens);
        server.addUpdateTokens(updateTokens);
    }

    private RandomSet<String> allLabels = new RandomSet<>();        // L_mm
    private RandomSet<String> searchedLabels = new RandomSet<>();   // S_e
    private Set<String> stashOfSearchedLabels = new HashSet<>();    // L_sr  Multimap<String,
    // byte[]>
    private Set<String> stashOfUnsearchedLabels = new HashSet<>();  // L_un

    private @Nonnull final ConcurrentHashMap<String, VersionCounter> oldVersionCounters = new ConcurrentHashMap<>();
    private @Nonnull final ConcurrentHashMap<String, VersionCounter> newVersionCounters = new ConcurrentHashMap<>();

    /**
     * Executes a two-party protocol (between this {@link DataOwner} instance and the
     * {@link Server}) that merges the old dictionary into the new dictionary.
     *
     * @param labelKey
     * @param valueKey
     * @param deamortizationRate
     */
    private void rebuild(final byte[] labelKey, final byte[] valueKey, int deamortizationRate) {
//        searchedLabels.stream().filter(oldVersionCounters::containsKey).forEach(label -> {
//            VersionCounter versionCounter = oldVersionCounters.remove(label);
//
//            try {
//                SearchToken oldTokens = new SearchToken(generateSearchSubtokens(labelKey, label,
//                                                                                versionCounter),
//                                                        new ArrayList<>());
//                List<byte[]> encryptedResults = resolveResults(valueKey, server.filter(oldTokens));
//            } catch (UnsupportedEncodingException e) {
//                e.printStackTrace();
//            }
//
//            // query on old dictionary
//            // compute and set to S otk
//        });
//
//        Consumer<String> removeElement = s -> {
//            System.out.println(s + " " + list.size());
//            if (s != null && s.equals("A")) {
//                list.remove("D");
//            }
//        };
//
//        for (String label : stream.iterator())) {
//        }
    }

    private static List<String> resolveResults(final byte[] valueKey,
                                               final List<byte[]> ciphertextResults)
            throws InvalidAlgorithmParameterException, NoSuchAlgorithmException,
                   NoSuchPaddingException, NoSuchProviderException, InvalidKeyException,
                   IOException {
        List<String> result = new ArrayList<String>();
        List<String> suppress = new ArrayList<String>();

        for (byte[] ciphertextBytes : ciphertextResults) {
            byte[] plaintextBytes = CryptoPrimitives.decryptAES_CTR_String(ciphertextBytes,
                                                                           valueKey);
            String plaintext = new String(plaintextBytes).split("\t\t\t")[0];
            int plaintextLength = plaintext.length();
            int plaintextLengthMinusOp = plaintextLength - 1;
            if (plaintext.substring(plaintextLengthMinusOp, plaintextLength).equals("+")) {
                result.add(plaintext.substring(0, plaintextLengthMinusOp));
            }
            else {
                suppress.add(plaintext.substring(0, plaintextLengthMinusOp));
            }
        }

        for (String plaintext : suppress) {
            result.remove(plaintext);
        }

        return result;
    }

    private List<String> generateSearchSubtokens(final byte[] labelKey, final String label,
                                                 final VersionCounter versionCounter)
            throws UnsupportedEncodingException {
        final int version = versionCounter.getVersion();
        final int counter = versionCounter.getCounter();

        // The array iterates from [1, counter] instead of [0, counter - 1] since
        // versionCounter.getCounter() returns the last used counter.
        final List<String> result = new ArrayList<>(counter);
        for (int i = DlsDEncryptedMultimap.INITIAL_COUNTER_VALUE; i <= counter; i++) {
            String concatenatedLabel = label + version + i;
            byte[] hmac = CryptoPrimitives.generateHmac(labelKey, concatenatedLabel);
            result.add(Base64.getEncoder().encodeToString(hmac));
        }
        return result;
    }

    private UpdateToken generateUpdateToken(byte[] labelKey, byte[] valueKey,
                                            String label,
                                            String value,
                                            UpdateType operation,
                                            int version,
                                            int counter)
            throws IOException, InvalidAlgorithmParameterException, NoSuchAlgorithmException,
                   NoSuchPaddingException, NoSuchProviderException, InvalidKeyException {
        byte[] labelSubtoken = CryptoPrimitives.generateHmac(labelKey,
                                                             label + version + counter);
        byte[] valueSubtoken = CryptoPrimitives.encryptAES_CTR_String(
                valueKey, CryptoPrimitives.randomBytes(16),
                value + operation.toString(), 48);
        return new UpdateToken(Base64.getEncoder().encodeToString(labelSubtoken),
                               valueSubtoken);
    }

    private VersionCounter claimVersionCounterRange(String label, int numValues) {
        while (true) {
            VersionCounter versionCounter = server.getNewVersionCounterForLabel(label);
            // TODO: actually encrypt these values, probably need a key3 for this
            int plaintextStart = versionCounter.getCounter();
            int encryptedStart = plaintextStart;
            int encryptedEnd = plaintextStart + numValues;
            if (server.requestRange(label, encryptedStart, encryptedEnd)) {
                return versionCounter;
            }
        }
    }

    private byte[] encryptInt(int value, byte[] encryptionKey)
            throws InvalidAlgorithmParameterException, NoSuchAlgorithmException,
                   NoSuchPaddingException, NoSuchProviderException, InvalidKeyException,
                   IOException {
        byte[] iv = CryptoPrimitives.randomBytes(16);
        return CryptoPrimitives.encryptAES_CBC(encryptionKey, iv, intToByteArray(value));
    }

    private byte[] intToByteArray(int value) {
        return ByteBuffer.allocate(4).putInt(value).array();
    }

    private int byteArrayToInt(byte[] bytes) {
        return ByteBuffer.wrap(bytes).getInt();
    }
}
