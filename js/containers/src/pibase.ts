'use strict'

import Multimap from "./multimap"

import { hmac, hkdf, secureRandom, symmetricEncrypt, symmetricDecrypt, Ciphertext } from "simplecrypto"

type PiBaseSearchToken = {
    labelKey: string
    valueKey?: string
}

/**
 * Simple implementation of \Pi_{bas}.
 *
 * By default, \Pi_{bas} is response-revealing. Set isResponseRevealing = false
 * to have response-hiding properties.
 */
export default class PiBase<K, V> {
    isResponseRevealing: boolean
    entries: Map<string, Ciphertext>

    /**
     * Initializer for the PiBase scheme.
     */
    constructor(isResponseRevealing: boolean = true) {
        this.isResponseRevealing = isResponseRevealing
        this.entries = new Map()
    }

    /**
     * Returns a JSON blob representing the serialized form of the
     * calling PiBase instance.
     */
    toJSON(): string {
        return JSON.stringify({
            isResponseRevealing: this.isResponseRevealing,
            entries: [...this.entries],
        })
    }

    /**
     * Converts the given JSON blob (representing a PiBase instance that
     * was previously serialized with .toJSON) into a PiBase instance.
     */
    static fromJSON<L, W>(json: string): PiBase<L, W> {
        const parsedJson = JSON.parse(json)
        return Object.assign(new PiBase(), {
            isResponseRevealing: parsedJson.isResponseRevealing,
            entries: new Map(parsedJson.entries),
        })
    }

    /**
     * Encrypts the given multimap instance using the PiBase scheme and
     * stores the encrypted result in the calling PiBase instance.
     *
     * Returns the secret key.
     */
    setup(map: Multimap<K, V>|Map<K, V>): string {
        this.entries = new Map()

        const key = secureRandom(32)
        let valueKey = hkdf(key, "value")
        for (const keyword of map.keys()) {
            const labelKey = hkdf(key, keyword + "label")
            if (this.isResponseRevealing) {
                valueKey = hkdf(key, keyword + "value")
            }
            let counter = 0

            if (map instanceof Map) {
                const value = map.get(keyword);
                const encryptedLabel = hmac(labelKey, counter.toString())
                const encryptedValue = symmetricEncrypt(valueKey, JSON.stringify(value))
                this.entries.set(encryptedLabel, encryptedValue)
            }
            else { // (map instanceof Multimap)
                for (const value of map.get(keyword)) {
                    const encryptedLabel = hmac(labelKey, counter.toString())
                    const encryptedValue = symmetricEncrypt(valueKey, JSON.stringify(value))
                    counter += 1
                    this.entries.set(encryptedLabel, encryptedValue)
                }
            }

        }

        return key
    }

    /**
     * Computes a PiBase search token over the given secret key and
     * keyword.
     */
    static token(key: string, keyword: string, isResponseRevealing: boolean = true): PiBaseSearchToken {
        const labelKey = hkdf(key, keyword + "label")

        if (isResponseRevealing) {
            const valueKey = hkdf(key, keyword + "value")
            return { labelKey, valueKey }
        } else {
            return { labelKey }
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
    query(searchToken: PiBaseSearchToken): Set<string|Ciphertext> {
        const result = new Set<string|Ciphertext>()
        let counter = 0
        while (true) {
            const encryptedLabel = hmac(searchToken.labelKey, counter.toString())
            const encryptedValue = this.entries.get(encryptedLabel)
            if (encryptedValue) {
                if (this.isResponseRevealing && searchToken.valueKey) {
                    const plaintextValue = JSON.parse(symmetricDecrypt(searchToken.valueKey, encryptedValue))
                    result.add((plaintextValue as string))
                } else {
                    result.add((encryptedValue as Ciphertext))
                }
                counter += 1
            } else {
                break
            }
        }
        return result
    }

    /**
     * Decrypts the given set of ciphertexts as returned by a call to
     * PiBase.query on a response-hiding PiBase instance.
     */
    static resolve(key: string, ciphertexts: Set<Ciphertext>): Set<string> {
        const valueKey = hkdf(key, "value")
        const result = new Set<string>()
        for (const ciphertext of ciphertexts) {
            const plaintext = JSON.parse(symmetricDecrypt(valueKey, ciphertext))
            result.add((plaintext as string))
        }
        return result
    }
}
