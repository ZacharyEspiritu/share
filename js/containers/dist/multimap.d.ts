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
export default class Multimap<K, V> {
    #private;
    map: Map<K, Array<V>>;
    /**
     * Constructs a Multimap instance.
     *
     * The iterable parameter is optional. If specified, it populates the
     * Multimap with the given (key, values) tuples.
     */
    constructor(iterable?: Iterable<[K, Array<V>]>);
    /**
     * Retrieves the entries associated with the given key in the Multimap as
     * an Array of values.
     *
     * If the key doesn't exist, get returns an empty array.
     */
    get(key: K): Array<V>;
    /**
     * Adds the entry (key, val) to the Multimap.
     *
     * set does not overwrite existing records---use delete if you need to
     * do that.
     */
    set(key: K, val: V): Multimap<K, V>;
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
    delete(key: K, val?: V): boolean;
    /**
     * Returns an iterable over the keys of the Multimap.
     */
    keys(): Iterable<K>;
}
