'use strict'

import StringableMap from "./stringable-map"
import EHT from "./eht"

export type PartyID = string
export type ColumnID = Array<string>
export type LinkingLevel = number

/**
 * An implementation of the ELS object from the SHARE paper.
 *
 * [Column ID] -> [LinkingLevel] -> [LinkTag via EHT] ->
 *
 * {
 *     [ColumnA]: {
 *         0: EHT(),
 *         1: EHT(),
 *         ...
 *     },
 *     [ColumnB]: { ... },
 *     [ColumnA, ColumnC]: { ... },
 * }
 */
export default class ELS<T> {
    columnMap: StringableMap<ColumnID, StringableMap<LinkingLevel, EHT<T>>>

    /**
     * Initializes an ELS structure for the given set of ColumnIDs and
     * number of linking levels.
     */
    constructor(columnIds?: Iterable<ColumnID>, numLinkLevels?: number, setOfLinkTags?: Array<Array<string>>) {
        this.columnMap = new StringableMap()
        if (columnIds !== undefined && numLinkLevels !== undefined && setOfLinkTags !== undefined) {
            const numRecords = setOfLinkTags.length
            const tableSize = numRecords ** 2

            console.log("Generating hash keys for", numLinkLevels, "levels and table size", tableSize)
            const perLevelTags = zip(setOfLinkTags).map((x) => new Set(x))
            const hashKeysPerLevel = new Map();
            for (let linkLevel = 0; linkLevel < numLinkLevels; linkLevel++) {
                const tableKey = EHT.pickHashKey(perLevelTags[linkLevel], tableSize)
                hashKeysPerLevel.set(linkLevel, tableKey)
                console.log("Generated key for level", linkLevel)
            }

            for (const columnId of columnIds) {
                const levelMap: StringableMap<LinkingLevel, EHT<T>> = new StringableMap()
                for (let linkLevel = 0; linkLevel < numLinkLevels; linkLevel++) {
                    const eht = new EHT<T>(tableSize, hashKeysPerLevel.get(linkLevel))
                    levelMap.set(linkLevel, eht)
                }
                this.columnMap.set(columnId, levelMap)
            }
        }
    }

    /**
     * Returns a reference to the EHT corresponding to the given
     * ColumnID and LinkingLevel pair.
     */
    getTable(columnId: ColumnID, linkLevel: LinkingLevel): EHT<T>|undefined {
        return this.columnMap.get(columnId)?.get(linkLevel) ?? undefined
    }

    getColumns(): Iterable<ColumnID> {
        return this.columnMap.keys()
    }

    toJSON() {
        return {
            columnMap: this.columnMap,
        }
    }

    static fromJSON(json: string): ELS<any> {
        const parsed = JSON.parse(json)

        const columnMap = new StringableMap(parsed.columnMap)
        for (const [key, value] of columnMap.entries()) {
            const ehtMap: Array<[any, any]> = (value as Array<[any, any]>).map(function(x) {
                const [key, ehtObject] = x
                const eht = new EHT(ehtObject.tableSize, ehtObject.hashKey)
                eht.values = ehtObject.values
                return [key, eht]
            })
            const subMap = new StringableMap(ehtMap)
            columnMap.set(key, subMap)
        }

        return Object.assign(new ELS(), { columnMap })
    }
}

function zip(arrays: Array<Array<any>>) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}
