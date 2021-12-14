/**
 * A multimap.
 */
class Multimap {
    constructor(iterable) {
        this.map = new Map();

        if (iterable) {
            // We want to have a reference to the same `this` in the closure, so
            // we use this `self` variable to maintain the reference.
            const self = this;
            iterable.forEach(function(i) {
                self.map.set(i[0], i[1]);
            });
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
        } else {
            let entry = this.map.get(key);
            let idx = entry.indexOf(val);
            if (idx != -1) {
                entry.splice(idx, 1);
                return true;
            }
        }

        return false;
    }

    keys() {
        return Multimap.#makeIterator(this.map.keys())
    }

    static #makeIterator(iterator){
        if (Array.isArray(iterator)) {
            let nextIndex = 0;
            return {
                next() {
                    if (nextIndex < iterator.length) {
                        return {value: iterator[nextIndex++], done: false};
                    } else {
                        return {done: true};
                    }
                }
            };
        }

        return iterator;
    }
}

module.exports = Object.freeze({
    Multimap,
});
