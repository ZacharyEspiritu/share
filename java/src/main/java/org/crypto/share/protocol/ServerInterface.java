package org.crypto.share.protocol;

import java.util.Collection;
import java.util.Map;

// LabelType is the ENCRYPTED type, not the actual underlying string (i.e. it's "label ++ counter")
// ValueType is what's actually stored in the DB.
public interface ServerInterface<StateType, LabelType, ValueType> {
    void updateDatabase(ClientContext context,
                        Collection<UpdateToken<LabelType, ValueType>> tokens);
    Map<LabelType, ValueType> queryRecords(ClientContext context,
                                           Collection<LabelType> label);

    StateType getLabelState(ClientContext context, LabelType label);
    void setLabelState(ClientContext context, LabelType label, StateType newState);

    boolean reserveLabelRange(ClientContext context, LabelType label, StateType start,
                              StateType end);
}
