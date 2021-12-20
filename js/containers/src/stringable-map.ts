'use strict'

export default class StringableMap<K, V> {
    map: Map<K, V>

    constructor(arg?: Array<[K, V]>) {
        this.map = new Map(arg)
    }

    get(key: K): V|undefined {
        return this.map.get(key)
    }

    set(key: K, value: V) {
        this.map.set(key, value)
    }

    has(key: K): boolean {
        return this.map.has(key)
    }

    toJSON() {
        return [...this.map]
    }

    entries(): Iterable<[K, V]> {
        return this.map.entries()
    }

    keys(): Iterable<K> {
        return this.map.keys()
    }

    static fromJSON<K, V>(json: string): StringableMap<K, V> {
        return new StringableMap(JSON.parse(json))
    }
}
