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
import org.crypto.share.emm.UpdateToken;
import org.crypto.share.emm.UpdateType;
import org.crypto.share.emm.VersionCounter;
import org.crypto.sse.CryptoPrimitives;

import javax.annotation.Nonnull;
import javax.crypto.NoSuchPaddingException;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.util.Base64;
import java.util.Collection;
import java.util.HashMap;

public class DataOwner {

    private @Nonnull final Server server;
    private @Nonnull final PrivateKey privateKey;

    public DataOwner(PrivateKey privateKey, Server server) {
        this.server = server;
        this.privateKey = privateKey;
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

            VersionCounter versionCounter = lockVersionCounterRange(plaintextLabel,
                                                                    plaintextValues.size());
            int version = versionCounter.getVersion();
            int counter = versionCounter.getCounter();

            for (String plaintextValue : plaintextValues) {
                counter++;
                UpdateToken updateToken = generateUpdateToken(privateKey.getLabelKey(),
                                                              privateKey.getValueKey(),
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

    private VersionCounter lockVersionCounterRange(String label, int numValues) {
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
