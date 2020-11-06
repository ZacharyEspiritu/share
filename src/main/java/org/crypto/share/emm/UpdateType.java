package org.crypto.share.emm;

public enum UpdateType {
    INSERT {
        public String toString() {
            return "+";
        }
    },
    DELETE {
        public String toString() {
            return "-";
        }
    };
}
