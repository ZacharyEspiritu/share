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

package org.crypto.share.emm;

import javax.annotation.Nonnull;
import java.util.List;

/**
 * Represents a token used in an {@link org.crypto.share.emm.DlsDEncryptedMultimap}
 * {@link org.crypto.share.emm.DlsDEncryptedMultimap#query(SearchToken)} operation.
 */
public class SearchToken {
    private @Nonnull final List<String> oldSubtokens;
    private @Nonnull final List<String> newSubtokens;

    public SearchToken(final List<String> oldSubtokens, final List<String> newSubtokens) {
        this.oldSubtokens = oldSubtokens;
        this.newSubtokens = newSubtokens;
    }

    public @Nonnull final List<String> getOldSubtokens() {
        return oldSubtokens;
    }

    public @Nonnull final List<String> getNewSubtokens() {
        return newSubtokens;
    }
}
