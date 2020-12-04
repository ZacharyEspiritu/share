package org.crypto.share.protocol;

import javax.annotation.Nonnull;

public class UpdateToken<LabelType, ValueType> {
    private @Nonnull
    final LabelType label;
    private @Nonnull final ValueType value;

    public UpdateToken(final LabelType label, final ValueType value) {
        this.label = label;
        this.value = value;
    }

    public final LabelType getLabel() {
        return label;
    }

    public final ValueType getValue() {
        return value;
    }

    private final static int IV_SIZE = 16;
    private final static int FILE_NAME_SIZE = 0;
}
