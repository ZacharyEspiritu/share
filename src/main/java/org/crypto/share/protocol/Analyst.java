package org.crypto.share.protocol;

import javax.annotation.Nonnull;
import java.util.Map;

public class Analyst {

    private @Nonnull final ClientContext context;
    private @Nonnull final ClientCredentials credentials;
    private @Nonnull final ServerInterface<Integer, String, String> server;
    private @Nonnull final FilterPolicy<Integer, String, String> filterPolicy;

    public Analyst(final ServerInterface<Integer, String, String> server,
                   final ClientContext context,
                   final ClientCredentials credentials,
                   final FilterPolicy<Integer, String, String> filterPolicy) {
        this.server = server;
        this.context = context;
        this.credentials = credentials;
        this.filterPolicy = filterPolicy;
    }

    public Map<String, String> query(final String plaintextLabel) {
        return filterPolicy.filter(server, credentials, context, plaintextLabel);
    }
}
