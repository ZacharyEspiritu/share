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

import org.crypto.share.emm.DlsDEncryptedMultimap;
import org.crypto.share.emm.SearchToken;
import org.crypto.share.emm.VersionCounter;
import org.crypto.share.util.RandomSet;
import org.crypto.sse.CryptoPrimitives;

import javax.annotation.Nonnull;
import javax.crypto.NoSuchPaddingException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class Analyst {

    private @Nonnull final Server server;
    private @Nonnull final SharePrivateKey sharePrivateKey;

    public Analyst(final SharePrivateKey sharePrivateKey, final Server server) {
        this.server = server;
        this.sharePrivateKey = sharePrivateKey;
    }

    /**
     * Operation for performing a filter operation on the dataset.
     */
    public List<String> filter(final String plaintextLabel)
            throws IOException, InvalidAlgorithmParameterException, NoSuchAlgorithmException,
                   NoSuchPaddingException, NoSuchProviderException, InvalidKeyException {
        // TODO: Rebuild protocol needs to happen here.
        final VersionCounter oldVersionCounter =
                server.getOldVersionCounterForLabel(plaintextLabel);
        final VersionCounter newVersionCounter =
                server.getNewVersionCounterForLabel(plaintextLabel);
        final SearchToken searchToken = generateSearchToken(sharePrivateKey.getLabelKey(),
                                                            sharePrivateKey.getValueKey(),
                                                            plaintextLabel,
                                                            oldVersionCounter,
                                                            newVersionCounter);

        final List<byte[]> ciphertextResults = server.filter(searchToken);
        return resolveResults(sharePrivateKey.getValueKey(), ciphertextResults);
    }

    private SearchToken generateSearchToken(final byte[] labelKey, final byte[] valueKey,
                                            final String label,
                                            final VersionCounter oldVersionCounter,
                                            final VersionCounter newVersionCounter)
            throws UnsupportedEncodingException {
        return new SearchToken(
                generateSearchSubtokens(labelKey, label, oldVersionCounter),
                generateSearchSubtokens(labelKey, label, newVersionCounter));
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

    private RandomSet<String> allLabels = new RandomSet<>();        // L_mm
    private RandomSet<String> searchedLabels = new RandomSet<>();   // S_e
    private Set<String> stashOfSearchedLabels = new HashSet<>();    // L_sr  Multimap<String,
    // byte[]>
    private Set<String> stashOfUnsearchedLabels = new HashSet<>();  // L_un

    private void rebuild(final byte[] labelKey, final byte[] valueKey, int deamortizationRate) {
        // If we assume parameter = 0 because state_set_search.size() = 0, because searched set is
        // 0.
        final boolean randomBit = (sampleBernoulliDistribution() < 0);

        if (!randomBit) {
            if (stashOfSearchedLabels.size() < deamortizationRate) {
                String randomLabel = searchedLabels.pollRandom(new SecureRandom());
                VersionCounter versionCounter = server.getOldVersionCounterForLabel(randomLabel);
            } else {
                for (int i = 0; i < deamortizationRate; i++) {

                }
            }
        } else {
            int count = deamortizationRate;
        }
    }

    private double sampleBernoulliDistribution() {
        byte[] randomBytes = CryptoPrimitives.randomBytes(4);
        return CryptoPrimitives.getLongFromByte(randomBytes, 32) / Math.pow(2, 31);
    }

    // from https://stackoverflow.com/a/51412979
    static <E> E getRandomSetElement(Set<E> set) {
        return set.stream().skip(new Random().nextInt(set.size())).findFirst().orElse(null);
    }
}
