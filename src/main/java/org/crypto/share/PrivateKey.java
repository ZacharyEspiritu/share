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

import javax.annotation.Nonnull;
import java.util.Arrays;

public class PrivateKey {

    private @Nonnull final byte[] counterKey;
    private @Nonnull final byte[] labelKey;
    private @Nonnull final byte[] valueKey;

    public PrivateKey(final byte[] counterKey, final byte[] labelKey, final byte[] valueKey) {
        this.counterKey = counterKey;
        this.labelKey = labelKey;
        this.valueKey = valueKey;
    }

    public final byte[] getCounterKey() {
        return counterKey;
    }

    public final byte[] getLabelKey() {
        return labelKey;
    }

    public final byte[] getValueKey() {
        return valueKey;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if ((o == null) || (getClass() != o.getClass())) return false;
        PrivateKey privateKey = (PrivateKey) o;
        return Arrays.equals(counterKey, privateKey.counterKey)
                && Arrays.equals(labelKey, privateKey.labelKey)
                && Arrays.equals(valueKey, privateKey.valueKey);
    }

    @Override
    public int hashCode() {
        int result = Arrays.hashCode(counterKey);
        result = 31 * result + Arrays.hashCode(labelKey);
        result = 31 * result + Arrays.hashCode(valueKey);
        return result;
    }
}
