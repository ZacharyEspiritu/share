import Multimap from "./multimap";
import { Ciphertext } from "simplecrypto";
declare type PiBaseSearchToken = {
    labelKey: string;
    valueKey?: string;
};
/**
 * Simple implementation of \Pi_{bas}.
 *
 * By default, \Pi_{bas} is response-revealing. Set isResponseRevealing = false
 * to have response-hiding properties.
 */
export default class PiBase<K, V> {
    isResponseRevealing: boolean;
    entries: Map<string, Ciphertext>;
    /**
     * Initializer for the PiBase scheme.
     */
    constructor(isResponseRevealing?: boolean);
    /**
     * Returns a JSON blob representing the serialized form of the
     * calling PiBase instance.
     */
    toJSON(): string;
    /**
     * Converts the given JSON blob (representing a PiBase instance that
     * was previously serialized with .toJSON) into a PiBase instance.
     */
    static fromJSON<L, W>(json: string): PiBase<L, W>;
    /**
     * Encrypts the given multimap instance using the PiBase scheme and
     * stores the encrypted result in the calling PiBase instance.
     *
     * Returns the secret key.
     */
    setup(map: Multimap<K, V> | Map<K, V>): string;
    /**
     * Computes a PiBase search token over the given secret key and
     * keyword.
     */
    static token(key: string, keyword: string, isResponseRevealing?: boolean): PiBaseSearchToken;
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
    query(searchToken: PiBaseSearchToken): Set<string | Ciphertext>;
    /**
     * Decrypts the given set of ciphertexts as returned by a call to
     * PiBase.query on a response-hiding PiBase instance.
     */
    static resolve(key: string, ciphertexts: Set<Ciphertext>): Set<string>;
}
export {};
