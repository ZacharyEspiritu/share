'use strict'

import { hmac, secureRandom } from "simplecrypto"

/**
 * The number of bytes needed to represent a big_uint64 type in an
 * ArrayBuffer.
 */
const BIG_UINT64_SIZE = 8

/**
 * An implementation of the EHT object from the SHARE paper.
 */
export default class EHT<T> {
    values: Array<T>
    tableSize: number
    hashKey: Buffer

    /**
     * Constructs an EHT instance with the given tableSize and hashKey.
     *
     * The hashKey should be the result of EHT.pickHashKey on the set of
     * strings to be included in the hash domain; otherwise, collisions may
     * occur.
     */
    constructor(tableSize: number, hashKey: Buffer) {
        this.values = Array(tableSize)
        this.tableSize = tableSize
        this.hashKey = hashKey
    }

    /**
     * Adds the given (key, value) pair to the EHT.
     */
    add(key: string, value: T): void {
        const hash = EHT.#calculateHash(this.hashKey, key, this.tableSize)
        this.values[hash] = value
    }

    /**
     * Returns the size of the EHT.
     *
     * Note that this returns the number of entries allocated for the EHT,
     * not the total number of records actually stored in the EHT.
     */
    getTableSize(): number {
        return this.tableSize
    }

    /**
     * Populates all empty spaces in the EHT with the value returned
     * by an application of defaultThunk.
     */
    populateEmptySpaces(defaultThunk: () => T): void {
        for (let index = 0; index < this.tableSize; index++) {
            if (this.values[index] === undefined) {
                this.values[index] = defaultThunk()
            }
        }
    }

    static #calculateHash(hashKey: Buffer, key: string, tableSize: number): number {
        return hmac(hashKey, key).readUInt32BE() % tableSize;
    }

    static pickHashKey(lst: Iterable<string>, tableSize: number) {
        while (true) {
            const hashKey: Buffer = secureRandom(32)
            const collisionTable: Set<number> = new Set()

            let recordCount = 0
            let hadCollision = false

            for (const elt of lst) {
                recordCount++
                let hash = EHT.#calculateHash(hashKey, elt, tableSize)
                if (collisionTable.has(hash)) {
                    console.log("Collision after", recordCount,
                                "records for table size", tableSize)
                    hadCollision = true
                    break
                }
                collisionTable.add(hash)
            }

            if (!hadCollision) {
                console.log("Found key")
                return hashKey
            }
        }
    }

    toJSON() {
        return {
            values: this.values,
            tableSize: this.tableSize,
            hashKey: this.hashKey,
        }
    }
}
