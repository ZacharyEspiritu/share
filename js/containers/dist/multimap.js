'use strict';
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _Multimap_makeIterator;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A multimap.
 */
class Multimap {
    constructor(iterable) {
        this.map = new Map();
        if (iterable) {
            for (const i of iterable) {
                this.map.set(i[0], i[1]);
            }
        }
    }
    get(key) {
        return this.map.get(key);
    }
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
    delete(key, val) {
        if (!this.map.has(key)) {
            return false;
        }
        if (arguments.length == 1) {
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
