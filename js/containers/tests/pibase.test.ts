'use strict'

import 'jest'
import Multimap from '../src/multimap'
import PiBase from '../src/pibase'

describe('PiBase', () => {
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
