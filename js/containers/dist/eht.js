'use strict';
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _EHT_calculateHash;
Object.defineProperty(exports, "__esModule", { value: true });
const simplecrypto_1 = require("simplecrypto");
/**
 * The number of bytes needed to represent a big_uint64 type in an
 * ArrayBuffer.
 */
const BIG_UINT64_SIZE = 8;
/**
 * An implementation of the EHT object from the SHARE paper.
 */
class EHT {
    /**
     * Constructs an EHT instance with the given tableSize and hashKey.
     *
     * The hashKey should be the result of EHT.pickHashKey on the set of
     * strings to be included in the hash domain; otherwise, collisions may
     * occur.
     */
    constructor(tableSize, hashKey) {
        this.values = Array(tableSize);
        this.tableSize = tableSize;
        this.hashKey = hashKey;
    }
    /**
     * Adds the given (key, value) pair to the EHT.
     */
    add(key, value) {
        const hash = __classPrivateFieldGet(EHT, _a, "m", _EHT_calculateHash).call(EHT, this.hashKey, key, this.tableSize);
        this.values[hash] = value;
    }
    /**
     * Returns the size of the EHT.
     *
     * Note that this returns the number of entries allocated for the EHT,
     * not the total number of records actually stored in the EHT.
     */
    getTableSize() {
        return this.tableSize;
    }
    /**
     * Populates all empty spaces in the EHT with the value returned
     * by an application of defaultThunk.
     */
    populateEmptySpaces(defaultThunk) {
        for (let index = 0; index < this.tableSize; index++) {
            if (this.values[index] === undefined) {
                this.values[index] = defaultThunk();
            }
        }
    }
    static pickHashKey(lst, tableSize) {
        while (true) {
            const hashKey = (0, simplecrypto_1.secureRandom)(32);
            const collisionTable = new Set();
            let recordCount = 0;
            let hadCollision = false;
            for (const elt of lst) {
                recordCount++;
                let hash = __classPrivateFieldGet(EHT, _a, "m", _EHT_calculateHash).call(EHT, hashKey, elt, tableSize);
                if (collisionTable.has(hash)) {
                    console.log("Collision after", recordCount, "records for table size", tableSize);
                    hadCollision = true;
                    break;
                }
                collisionTable.add(hash);
            }
            if (!hadCollision) {
                console.log("Found key");
                return hashKey;
            }
        }
    }
    toJSON() {
        return {
            values: this.values,
            tableSize: this.tableSize,
            hashKey: this.hashKey,
        };
    }
}
exports.default = EHT;
_a = EHT, _EHT_calculateHash = function _EHT_calculateHash(hashKey, key, tableSize) {
    return Buffer.from((0, simplecrypto_1.hmac)(hashKey, key), simplecrypto_1.STRING_ENCODING).readUInt32BE() % tableSize;
};
