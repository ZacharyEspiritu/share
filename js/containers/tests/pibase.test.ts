'use strict'

import 'jest'
import Multimap from '../src/multimap'
import PiBase from '../src/pibase'

describe('PiBase with Multimap', () => {
    let pibase: PiBase
    let multimap: Multimap

    beforeEach(() => {
        pibase = new PiBase(true)

        multimap = new Multimap([
            ["a", ["0", "1", "2"]],
            ["b", ["3"]],
            ["c", ["4", "5"]],
        ])
    })

    it('should be queryable and return the correct result', async () => {
        const key = pibase.setup(multimap)
        expect(key).toBeDefined()

        const token = PiBase.token(key, "a")
        expect(token).toBeDefined()

        expect(pibase.query(token)).toEqual(new Set(["0", "1", "2"]))
    })

    it('should return an empty set when queried with a invalid token', async () => {
        const key = pibase.setup(multimap)
        expect(key).toBeDefined()

        const token = PiBase.token(key, "non-existing key")
        expect(token).toBeDefined()

        expect(pibase.query(token)).toEqual(new Set())
    })
})

describe('PiBase with Map', () => {
    let pibase: PiBase
    let map: Map

    beforeEach(() => {
        pibase = new PiBase(true)

        map = new Map()
        map.set("key1", "value1")
        map.set("key2", "value2")
        map.set("key3", "value3")
        map.set("key4", "value4")
    })

    it('should be queryable and return the correct result', async () => {
        const key = pibase.setup(map)
        expect(key).toBeDefined()

        const token1 = PiBase.token(key, "key1")
        expect(token1).toBeDefined()
        expect(pibase.query(token1)).toEqual(new Set(["value1"]))

        const token2 = PiBase.token(key, "key2")
        expect(token2).toBeDefined()
        expect(pibase.query(token2)).toEqual(new Set(["value2"]))

        const token3 = PiBase.token(key, "key3")
        expect(token3).toBeDefined()
        expect(pibase.query(token3)).toEqual(new Set(["value3"]))

        const token4 = PiBase.token(key, "key4")
        expect(token4).toBeDefined()
        expect(pibase.query(token4)).toEqual(new Set(["value4"]))
    })

    it('should return an empty set when queried with a invalid token', async () => {
        const key = pibase.setup(map)
        expect(key).toBeDefined()

        const token = PiBase.token(key, "non-existing key")
        expect(token).toBeDefined()

        expect(pibase.query(token)).toEqual(new Set())
    })
})
