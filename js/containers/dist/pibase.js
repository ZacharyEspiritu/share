'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const simplecrypto_1 = require("simplecrypto");
/**
 * Simple implementation of \Pi_{bas}.
 *
 * By default, \Pi_{bas} is response-revealing. Set isResponseRevealing = false
 * to have response-hiding properties.
 */
class PiBase {
    /**
     * Initializer for the PiBase scheme.
     */
    constructor(isResponseRevealing = true) {
        this.isResponseRevealing = isResponseRevealing;
        this.entries = new Map();
    }
    /**
     * Returns a JSON blob representing the serialized form of the
     * calling PiBase instance.
     */
    toJson() {
        return JSON.stringify(this.entries);
    }
    /**
     * Converts the given JSON blob (representing a PiBase instance that
     * was previously serialized with .toJson) into a PiBase instance.
     */
    static fromJson(json) {
        return Object.assign(new PiBase(), JSON.parse(json));
    }
    /**
     * Encrypts the given multimap instance using the PiBase scheme and
     * stores the encrypted result in the calling PiBase instance.
     *
     * Returns the secret key.
     */
    setup(map) {
        this.entries = new Map();
        const key = (0, simplecrypto_1.secureRandom)(32);
        for (const keyword of map.keys()) {
            const labelKey = (0, simplecrypto_1.hkdf)(key, keyword + "label");
            const valueKey = (0, simplecrypto_1.hkdf)(key, keyword + "value");
            let counter = 0;
            if (map instanceof Map) {
                const value = map.get(keyword);
                const encryptedLabel = (0, simplecrypto_1.hmac)(labelKey, counter.toString()).toString();
                const encryptedValue = (0, simplecrypto_1.symmetricEncrypt)(valueKey, JSON.stringify(value));
                this.entries.set(encryptedLabel, encryptedValue);
            }
            else { // (map instanceof Multimap)
                for (const value of map.get(keyword)) {
                    const encryptedLabel = (0, simplecrypto_1.hmac)(labelKey, counter.toString()).toString();
                    const encryptedValue = (0, simplecrypto_1.symmetricEncrypt)(valueKey, JSON.stringify(value));
                    counter += 1;
                    this.entries.set(encryptedLabel, encryptedValue);
                }
            }
        }
        return key;
    }
    /**
     * Computes a PiBase search token over the given secret key and
     * keyword.
     */
    static token(key, keyword, isResponseRevealing = true) {
        const labelKey = (0, simplecrypto_1.hkdf)(key, keyword + "label");
        if (isResponseRevealing) {
            const valueKey = (0, simplecrypto_1.hkdf)(key, keyword + "value");
            return new PiBaseSearchToken(labelKey, valueKey);
        }
        else {
            return new PiBaseSearchToken(labelKey);
        }
    }
    /**
     * Consumes a search token generated by the PiBase.token algorithm
     * and queries the encrypted structure for the records corresponding
     * to the token. Returns a JavaScript Set corresponding to the result.
     *
     * If this.isResponseRevealing = true, the returned Set is composed
     * of plaintext values. Otherwise, the returned Set is composed of
     * ciphertext values that need to be decrypted by a call to
     * PiBase.resolve.
     */
    query(searchToken) {
        const result = new Set();
        let counter = 0;
        while (true) {
            const encryptedLabel = (0, simplecrypto_1.hmac)(searchToken.labelKey, counter.toString()).toString();
            const encryptedValue = this.entries.get(encryptedLabel);
            if (encryptedValue) {
                if (this.isResponseRevealing && searchToken.valueKey) {
                    const plaintextValue = JSON.parse((0, simplecrypto_1.symmetricDecrypt)(searchToken.valueKey, encryptedValue));
                    result.add(plaintextValue);
                }
                else {
                    result.add(encryptedValue);
                }
                counter += 1;
            }
            else {
                break;
            }
        }
        return result;
    }
}
exports.default = PiBase;
class PiBaseSearchToken {
    constructor(labelKey, valueKey) {
        this.labelKey = labelKey;
        this.valueKey = valueKey;
    }
}
