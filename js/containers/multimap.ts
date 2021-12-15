'use strict'

/**
 * A multimap.
 */
export default class Multimap<K, V> {
    map: Map<K, Array<V>>

    constructor(iterable?: Iterable<[K, Array<V>]>) {
        this.map = new Map()

        if (iterable) {
            // We want to have a reference to the same `this` in the closure, so
            // we use this `self` variable to maintain the reference.
            for (const i of iterable) {
                this.map.set(i[0], i[1])
            }
        }
    }

    get(key: K): Array<V>|undefined {
        return this.map.get(key)
    }

    set(key: K, val: V): Multimap<K, V> {
        const args = Array.prototype.slice.call(arguments)
        key = args.shift()

        let entry = this.map.get(key)
        if (!entry) {
            entry = []
            this.map.set(key, entry)
        }

        Array.prototype.push.apply(entry, args)
        return this
    }

    delete(key: K, val: V): boolean {
        if (!this.map.has(key)) {
            return false
        }

        if (arguments.length == 1) {
            this.map.delete(key)
            return true
        } else {
            let entry = this.map.get(key)
            if (entry) {
                let idx = entry.indexOf(val)
                if (idx != -1) {
                    entry.splice(idx, 1)
                    return true
                }
            }
        }

        return false
    }

    keys(): Iterable<K> {
        return Multimap.#makeIterator(this.map.keys())
    }

    static #makeIterator<T>(iterator: Iterable<T>): Iterable<T> {
        if (Array.isArray(iterator)) {
            return {
                [Symbol.iterator]() {
                    let nextIndex = 0;

                    return {
                        next(): IteratorResult<T> {
                            if (nextIndex < iterator.length) {
                                return {value: iterator[nextIndex++], done: false}
                            } else {
                                return {value: iterator[nextIndex], done: true}
                            }
                        }
                    }
                }
            }
        }

        return iterator
    }
}

