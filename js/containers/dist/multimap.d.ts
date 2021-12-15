/**
 * A multimap.
 */
export default class Multimap<K, V> {
    #private;
    map: Map<K, Array<V>>;
    constructor(iterable?: Iterable<[K, Array<V>]>);
    get(key: K): Array<V> | undefined;
    set(key: K, val: V): Multimap<K, V>;
    delete(key: K, val: V): boolean;
    keys(): Iterable<K>;
}
