export default class StringableMap<K, V> {
    map: Map<K, V>;
    constructor(arg?: Array<[K, V]>);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    has(key: K): boolean;
    toJSON(): [K, V][];
    entries(): Iterable<[K, V]>;
    keys(): Iterable<K>;
    static fromJSON<K, V>(json: string): StringableMap<K, V>;
}
