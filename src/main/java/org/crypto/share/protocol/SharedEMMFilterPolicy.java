package org.crypto.share.protocol;

import javax.annotation.Nonnull;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class SharedEMMFilterPolicy implements FilterPolicy<Integer, String, String> {

    private @Nonnull final TokenGenerator generator;

    public SharedEMMFilterPolicy(final TokenGenerator generator) {
        this.generator = generator;
    }

    @Override
    public Map<String, String> filter(ServerInterface<Integer, String, String> server,
                       ClientCredentials credentials,
                       ClientContext context,
                       String plaintextLabel) {
        Integer counter = server.getLabelState(context, plaintextLabel);

        try {
            List<String> tokens = generateSearchTokens(credentials.getLabelKey(), plaintextLabel,
                                                       counter);
            return server.queryRecords(context, tokens);
        } catch (Exception e) {
            System.out.println("Something bad happened!");
            return null;
        }
    }

    private List<String> generateSearchTokens(final byte[] labelKey, final String label,
                                              final Integer counter)
            throws UnsupportedEncodingException {

        // The array iterates from [1, counter] instead of [0, counter - 1] since
        // versionCounter.getCounter() returns the last used counter.
        final List<String> result = new ArrayList<>(counter);
        for (int i = SingleEMMUpdatePolicy.INITIAL_COUNTER_VALUE; i <= counter; i++) {
            result.add(generator.generateLabelToken(labelKey, label, counter).toString());
        }
        return result;
    }
}
