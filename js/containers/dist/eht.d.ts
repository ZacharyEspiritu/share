/**
 * An implementation of the EHT object from the SHARE paper.
 */
export default class EHT<T> {
    #private;
    values: Array<T>;
    tableSize: number;
    hashKey: string;
    /**
     * Constructs an EHT instance with the given tableSize and hashKey.
     *
     * The hashKey should be the result of EHT.pickHashKey on the set of
     * strings to be included in the hash domain; otherwise, collisions may
     * occur.
     */
    constructor(tableSize: number, hashKey: string);
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
    /**
     * Populates all empty spaces in the EHT with the value returned
     * by an application of defaultThunk.
     */
    populateEmptySpaces(defaultThunk: () => T): void;
    static pickHashKey(lst: Iterable<string>, tableSize: number): string;
    toJSON(): {
        values: T[];
        tableSize: number;
        hashKey: string;
    };
}
