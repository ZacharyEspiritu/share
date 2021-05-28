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

import javax.annotation.Nonnull;
import java.util.HashMap;
import java.util.List;

public class Server {

    private @Nonnull DlsDEncryptedMultimap emm;

    public Server(DlsDEncryptedMultimap initialEmm) {
        this.emm = initialEmm;
    }

    public VersionCounter getNewVersionCounterForLabel(final String label) {
        return emm.getNewVersionCounterForLabel(label);
    }

    public VersionCounter getOldVersionCounterForLabel(final String label) {
        return emm.getOldVersionCounterForLabel(label);
    }

    /**
     * Requests a range of tokens for a given label from the server.
     *
     * encryptedStart really means "previous".
     *
     * TODO(zespirit): Actually encrypt encryptedStart and encryptedEnd.
     */
    public synchronized boolean requestRange(final String label, final int encryptedStart,
                                             final int encryptedEnd) {
        VersionCounter versionCounter = emm.getNewVersionCounterForLabel(label);

        // This checks to see that the server-side version counter hasn't
        // been updated (that is, it matches with the client's range request):
        if (versionCounter.getCounter() != encryptedStart) {
            return false; // Client needs to try again.
        }

        // Update the new-state with the newly requested counter:
        emm.setVersionCounterForLabel(label, new VersionCounter(emm.getCurrentGlobalVersion(),
                                                                encryptedEnd));
        return true;
    }

    /**
     * Adds update tokens to the EMM.
     */
    public void addUpdateTokens(final HashMap<String, byte[]> updateTokens) {
        emm.updateMultiple(updateTokens);
    }

    /**
     * Performs a filter operation for the given label.
     */
    public List<byte[]> filter(final SearchToken searchToken) {
        return emm.query(searchToken);
    }
}
