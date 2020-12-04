package org.crypto.share.protocol;

import java.io.UnsupportedEncodingException;
import java.util.Map;

public interface FilterPolicy<StateType, LabelType, ValueType> {
    Map<String, String> filter(ServerInterface<StateType, LabelType, ValueType> server,
                               ClientCredentials credentials,
                               ClientContext context,
                               String plaintextLabel);
}

