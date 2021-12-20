'use strict'

import 'jest'
import ELS from '../src/els'
import StringableMap from '../src/stringable-map'

describe('ELS', () => {
    it('should be instantiable', async () => {
        const columnIds = ["A", "B", "C", "D", "E"]
        const numLinkLevels = 3
        const linkTags = [["1", "2", "3"], ["1b", "2b", "3b"]]
        const els = new ELS(columnIds, numLinkLevels, linkTags)

        for (const columnId of columnIds) {
            for (let linkLevel = 0; linkLevel < numLinkLevels; linkLevel++) {
                expect(els.getTable(columnId, linkLevel).getTableSize()).toEqual(4)
            }
        }
    })

    it('should be stringable', async () => {
        const map: StringableMap<string, number> = new StringableMap()
        map.set("A", 1)
        map.set("B", 2)
        map.set("C", 3)

        const serialized = JSON.stringify(map)
        const deserialized = StringableMap.fromJSON(serialized)

        expect(deserialized.get("A")).toEqual(1)
        expect(deserialized.get("B")).toEqual(2)
        expect(deserialized.get("C")).toEqual(3)
    })

    it('should be stringable', async () => {
        const columnIds = ["A", "B", "C", "D", "E"]
        const numLinkLevels = 3
        const linkTags = [["1", "2", "3"], ["1b", "2b", "3b"]]
        const els = new ELS(columnIds, numLinkLevels, linkTags)

        expect(els.getTable("A", 1)).toBeDefined()
        els.getTable("A", 1).add("test", 123)

        const serialized = JSON.stringify(els)
        const deserialized = ELS.fromJSON(serialized)

        expect(deserialized.getTable("A", 1)).toBeDefined()
    })
})
