package org.crypto.share.protocol;

import javax.annotation.Nonnull;

public class ClientCredentials {

    private @Nonnull final byte[] counterKey;
    private @Nonnull final byte[] labelKey;
    private @Nonnull final byte[] valueKey;

    public ClientCredentials(final byte[] counterKey, final byte[] labelKey, final byte[] valueKey) {
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
}
