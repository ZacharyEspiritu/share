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
import org.crypto.sse.CryptoPrimitives;

import javax.annotation.Nonnull;
import javax.crypto.NoSuchPaddingException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class Analyst {

    private @Nonnull final Server server;
    private @Nonnull final PrivateKey privateKey;

    public Analyst(PrivateKey privateKey, Server server) {
        this.server = server;
        this.privateKey = privateKey;
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
        final SearchToken searchToken = generateSearchToken(privateKey.getLabelKey(),
                                                            privateKey.getValueKey(),
                                                            plaintextLabel,
                                                            oldVersionCounter,
                                                            newVersionCounter);

        final List<byte[]> ciphertextResults = server.filter(searchToken);
        return resolveResults(privateKey.getValueKey(), ciphertextResults);
    }

    private SearchToken generateSearchToken(byte[] labelKey, byte[] valueKey,
                                                  String label,
                                                  VersionCounter oldVersionCounter,
                                                  VersionCounter newVersionCounter)
            throws UnsupportedEncodingException {
        return new SearchToken(
                generateSearchSubtokens(labelKey, label, oldVersionCounter),
                generateSearchSubtokens(labelKey, label, newVersionCounter));
    }

    private List<String> generateSearchSubtokens(byte[] labelKey, String label,
                                             VersionCounter versionCounter)
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

    private static List<String> resolveResults(byte[] valueKey, List<byte[]> ciphertextResults)
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
            if (result.contains(plaintext)) {
                result.remove(plaintext);
            }
        }

        return result;
    }
}
