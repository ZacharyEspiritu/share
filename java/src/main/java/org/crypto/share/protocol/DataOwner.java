package org.crypto.share.protocol;

import com.google.common.collect.Multimap;

import javax.annotation.Nonnull;

public class DataOwner {

    private @Nonnull final ClientContext context;
    private @Nonnull final ClientCredentials credentials;
    private @Nonnull final ServerInterface<Integer, String, String> server;
    private @Nonnull final UpdatePolicy<Integer, String, String> updatePolicy;

    public DataOwner(final ServerInterface<Integer, String, String> server,
                     final ClientContext context,
                     final ClientCredentials credentials,
                     final UpdatePolicy<Integer, String, String> updatePolicy) {
        this.server = server;
        this.context = context;
        this.credentials = credentials;
        this.updatePolicy = updatePolicy;
    }

    /**
     * Update the EMM with mapping.
     */
    public void update(final Multimap<String, String> plaintextRecords) {
        updatePolicy.update(server, credentials, context, plaintextRecords);
    }
}
