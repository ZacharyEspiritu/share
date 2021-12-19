/// <reference types="node" />
/**
 * An implementation of the EHT object from the SHARE paper.
 */
export default class EHT<T> {
    #private;
    values: Array<T>;
    tableSize: number;
    hashKey: Buffer;
    /**
     * Constructs an EHT instance with the given tableSize and hashKey.
     *
     * The hashKey should be the result of EHT.pickHashKey on the set of
     * strings to be included in the hash domain; otherwise, collisions may
     * occur.
     */
    constructor(tableSize: number, hashKey: Buffer);
    /**
     * Adds the given (key, value) pair to the EHT.
     */
    add(key: string, value: T): void;
    /**
     * Returns the size of the EHT.
     *
     * Note that this returns the number of entries allocated for the EHT,
     * not the total number of records actually stored in the EHT.
     */
    getTableSize(): number;
    [Symbol.iterator](): {
        next(): IteratorResult<[number, T]>;
    };
    static pickHashKey(lst: Iterable<string>, tableSize: number): Buffer;
    toJSON(): {
        values: T[];
        tableSize: number;
        hashKey: Buffer;
    };
}
