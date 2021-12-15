'use strict';
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _Multimap_makeIterator;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A multimap data structure that supports multiple values associated
 * with the same key. In particular, multiple instances of the same
 * value may be associated with the same key.
 *
 * Multimap is implemented on top of the native Map class in JavaScript.
 * This means that Multimap remembers the order in which keys were
 * inserted into the Multimap. This also means that Multimap may
 * utilize object identity / hashing instead of object equality
 * operators.
 */
class Multimap {
    /**
     * Constructs a Multimap instance.
     *
     * The iterable parameter is optional. If specified, it populates the
     * Multimap with the given (key, values) tuples.
     */
    constructor(iterable) {
        this.map = new Map();
        if (iterable) {
            for (const i of iterable) {
                this.map.set(i[0], i[1]);
            }
        }
    }
    toJson() {
        return JSON.stringify(this.map);
    }
    /**
     * Retrieves the entries associated with the given key in the Multimap as
     * an Array of values.
     *
     * If the key doesn't exist, get returns an empty array.
     */
    get(key) {
        const result = this.map.get(key);
        if (result === undefined) {
            return [];
        }
        return result;
    }
    /**
     * Adds the entry (key, val) to the Multimap.
     *
     * set does not overwrite existing records---use delete if you need to
     * do that.
     */
    set(key, val) {
        const args = Array.prototype.slice.call(arguments);
        key = args.shift();
        let entry = this.map.get(key);
        if (!entry) {
            entry = [];
            this.map.set(key, entry);
        }
        Array.prototype.push.apply(entry, args);
        return this;
    }
    /**
     * Deletes the specified (key, val) pair from the Multimap. If the
     * specified (key, val) pair exists in the Multimap, delete returns
     * false; otherwise, it returns true.
     *
     * val is an optional argument. If val is not specified, delete
     * deletes _all_ entries associated with the given key from the
     * Multimap and returns true if the key already exists in the
     * Multimap; otherwise, it returns false.
     */
    delete(key, val) {
        if (!this.map.has(key)) {
            return false;
        }
        if (val === undefined) {
            this.map.delete(key);
            return true;
        }
        else {
            let entry = this.map.get(key);
            if (entry) {
                let idx = entry.indexOf(val);
                if (idx != -1) {
                    entry.splice(idx, 1);
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Returns an iterable over the keys of the Multimap.
     */
    keys() {
        return __classPrivateFieldGet(Multimap, _a, "m", _Multimap_makeIterator).call(Multimap, this.map.keys());
    }
}
exports.default = Multimap;
_a = Multimap, _Multimap_makeIterator = function _Multimap_makeIterator(iterator) {
    if (Array.isArray(iterator)) {
        return {
            [Symbol.iterator]() {
                let nextIndex = 0;
                return {
                    next() {
                        if (nextIndex < iterator.length) {
                            return { value: iterator[nextIndex++], done: false };
                        }
                        else {
                            return { value: iterator[nextIndex], done: true };
                        }
                    }
                };
            }
        };
    }
    return iterator;
};
