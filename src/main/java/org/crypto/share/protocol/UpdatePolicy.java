package org.crypto.share.protocol;

import com.google.common.collect.Multimap;

/**
 * An {@link UpdatePolicy} dictates how a {@link Client} performs updates.
 *
 * @param <StateType>
 * @param <LabelType>
 * @param <ValueType>
 */
public interface UpdatePolicy<StateType, LabelType, ValueType> {
    void update(ServerInterface<StateType, LabelType, ValueType> server,
                ClientCredentials credentials,
                ClientContext context,
                Multimap<LabelType, ValueType> plaintextRecords);
}





