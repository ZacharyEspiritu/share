'use strict'

const simplecrypto = require("../simplecrypto")

/**
 * Response-revealing implementation of PiBase.
 */
class PiBase {
    constructor(multimap, isResponseRevealing = false) {
        this.entries = {};
        this.key = simplecrypto.secureRandom(32);
        this.isResponseRevealing = isResponseRevealing;

        for (const keyword of multimap.keys()) {
            const labelKey = simplecrypto.hmac(this.key, keyword + "label");
            const valueKey = simplecrypto.hmac(this.key, keyword + "value");
            let counter = 0;
            for (const value of multimap.get(keyword)) {
                const encryptedLabel = simplecrypto.hmac(labelKey, counter.toString());
                const encryptedValue = simplecrypto.symmetricEncrypt(valueKey, value);
                counter += 1;
                this.entries[encryptedLabel] = encryptedValue;
            }
        }
    }

    toJson() {
        return JSON.stringify(this.entries);
    }

    static fromJson(json) {
        return JSON.parse(json);
    }

    token(keyword) {
        const labelKey = simplecrypto.hmac(this.key, keyword + "label");
        let searchToken = {labelKey: labelKey}

        if (this.isResponseRevealing) {
            const valueKey = simplecrypto.hmac(this.key, keyword + "value");
            searchToken.valueKey = valueKey;
        }

        return searchToken;
    }

    query(searchToken) {
        const result = new Set();
        let counter = 0;
        while (true) {
            const encryptedLabel = simplecrypto.hmac(searchToken.labelKey, counter.toString());
            if (!(encryptedLabel in this.entries)) {
                break;
            }

            const encryptedValue = this.entries[encryptedLabel];
            if (this.isResponseRevealing) {
                const plaintextValue = simplecrypto.symmetricDecrypt(searchToken.valueKey, encryptedValue);
                result.add(plaintextValue);
            } else {
                result.add(encryptedValue);
            }

            counter += 1;
        }

        return result;
    }
}

module.exports = PiBase
