'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class StringableMap {
    constructor(arg) {
        this.map = new Map(arg);
    }
    get(key) {
        return this.map.get(key);
    }
    set(key, value) {
        this.map.set(key, value);
    }
    has(key) {
        return this.map.has(key);
    }
    toJSON() {
        return [...this.map];
    }
    entries() {
        return this.map.entries();
    }
    keys() {
        return this.map.keys();
    }
    static fromJSON(json) {
        return new StringableMap(JSON.parse(json));
    }
}
exports.default = StringableMap;
