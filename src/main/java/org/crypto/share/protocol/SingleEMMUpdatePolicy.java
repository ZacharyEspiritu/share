package org.crypto.share.protocol;

import com.google.common.collect.Multimap;
import org.crypto.share.emm.UpdateType;

import javax.annotation.Nonnull;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

/**
 * In this update policy, the policy maintains a local state of counters.
 */
public class SingleEMMUpdatePolicy implements UpdatePolicy<Integer, String, String> {

    static final int INITIAL_COUNTER_VALUE = 0;

    private @Nonnull final HashMap<String, Integer> counters;
    private @Nonnull final TokenGenerator generator;

    public SingleEMMUpdatePolicy(final TokenGenerator generator) {
        this.counters = new HashMap<>();
        this.generator = generator;
    }

    @Override
    public void update(ServerInterface<Integer, String, String> server,
                       ClientCredentials credentials, ClientContext context,
                       Multimap<String, String> plaintextRecords) {
        List<UpdateToken<String, String>> tokens = new ArrayList<>();

        UpdateType operation = UpdateType.INSERT;
        for (String plaintextLabel : plaintextRecords.keySet()) {
            Collection<String> plaintextValues = plaintextRecords.get(plaintextLabel);

            Integer counter = counters.getOrDefault(plaintextLabel, INITIAL_COUNTER_VALUE);
            for (String plaintextValue : plaintextValues) {
                counter++;
                try {
                    UpdateToken<String, String> updateToken =
                            generator.generateUpdateToken(credentials.getLabelKey(),
                                                            credentials.getValueKey(),
                                                            plaintextLabel,
                                                            plaintextValue,
                                                            operation,
                                                            counter);
                    tokens.add(updateToken);
                }
                catch (Exception e) {
                    System.out.println("Something bad happened! " + e.toString());
                }
            }
            counters.put(plaintextLabel, counter);
        }

        server.updateDatabase(context, tokens);
    }
}
