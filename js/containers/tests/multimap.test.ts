import 'jest'
import Multimap from '../src/multimap'

describe('Multimap', () => {
    let multimap: Multimap

    beforeEach(() => {
        multimap = new Multimap()
    })

    it('should be instantiable without an iterable', async () => {
        expect(multimap).toBeInstanceOf(Multimap)
    })

    it('should be instantiable with an iterable', async () => {
        multimap = new Multimap([
            ["key1", ["value1", "value2"]],
            ["key2", ["value3"]]
        ])

        expect(multimap).toBeInstanceOf(Multimap)

        expect(multimap.get("key1")).toBeDefined()
        expect(multimap.get("key1")).toEqual(["value1", "value2"])

        expect(multimap.get("key2")).toBeDefined()
        expect(multimap.get("key2")).toEqual(["value3"])
    })
})

describe('Multimap.set and Multimap.get', () => {
    let multimap: Multimap

    beforeEach(() => {
        multimap = new Multimap()
    })

    it('should allow multiple keys', async () => {
        expect(multimap).toBeInstanceOf(Multimap)

        multimap.set("a", "0")
        multimap.set("a", "1")
        multimap.set("a", "2")
        multimap.set("b", "3")
        multimap.set("c", "4")
        multimap.set("c", "5")

        expect(multimap.get("a")).toBeDefined()
        expect(multimap.get("a")).toEqual(["0", "1", "2"])

        expect(multimap.get("b")).toBeDefined()
        expect(multimap.get("b")).toEqual(["3"])

        expect(multimap.get("c")).toBeDefined()
        expect(multimap.get("c")).toEqual(["4", "5"])
    })
})

describe('Multimap.delete', () => {
    let multimap: Multimap

    beforeEach(() => {
        multimap = new Multimap()
        multimap.set("key", "0")
        multimap.set("key", "1")
        multimap.set("key", "2")

        expect(multimap.get("key")).toBeDefined()
        expect(multimap.get("key")).toEqual(["0", "1", "2"])
    })

    it('should return false if the key does not exist in the multimap', async () => {
        expect(multimap).toBeInstanceOf(Multimap)

        expect(multimap.delete("does not exist")).toBe(false)
    })

    it('should return true if the input already exists', async () => {
        expect(multimap.delete("key", "1")).toBe(true)
    })

    it('should return false if the key exists, but the value does not exist in the multimap', async () => {
        expect(multimap.delete("key", "3")).toBe(false)
    })

    it('should return true and delete the whole key if only the key is specified', async () => {
        expect(multimap.delete("key")).toBe(true)
        expect(multimap.get("key")).toBeUndefined()
    })

    it('should return false if the entry was previously deleted', async () => {
        expect(multimap.delete("key", "1")).toBe(true)
        expect(multimap.delete("key", "1")).toBe(false)

        expect(multimap.delete("key")).toBe(true)
        expect(multimap.delete("key")).toBe(false)
    })
})

describe('Multimap.keys', () => {
    let multimap: Multimap

    beforeEach(() => {
        multimap = new Multimap()
    })

    it('should be an iterable', async () => {
        expect(multimap).toBeInstanceOf(Multimap)

        multimap.set("a", "0")
        multimap.set("b", "1")
        multimap.set("c", "2")

        const seenKeys = new Set()
        for (const key of multimap.keys()) {
            seenKeys.add(key)
        }
        expect(seenKeys).toEqual(new Set(["a", "b", "c"]))
    })
})
