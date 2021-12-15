import 'jest'
import Multimap from '../src/multimap'

describe('Multimap', () => {
    let multimap: Multimap

    beforeEach(() => {
        multimap = new Multimap()
    })

    it('should allow one to instantiate a multimap without an iterable', async () => {
        expect(multimap).toBeInstanceOf(Multimap)
    })

    it('should allow one to instantiate a multimap with an iterable', async () => {
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

    it('should allow one to add multiple keys', async () => {
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

    it('should allow one to delete keys', async () => {
        expect(multimap).toBeInstanceOf(Multimap)

        expect(multimap.delete("key")).toBe(false)

        multimap.set("key", "0")
        multimap.set("key", "1")
        multimap.set("key", "2")

        expect(multimap.delete("key", "1")).toBe(true)

        expect(multimap.delete("key", "3")).toBe(false)

        expect(multimap.get("key")).toBeDefined()
        expect(multimap.get("key")).toEqual(["0", "2"])

        expect(multimap.delete("key")).toBe(true)

        expect(multimap.get("key")).toBeUndefined()

        expect(multimap.delete("key")).toBe(false)
    })

    it('should have iterable keys', async () => {
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
