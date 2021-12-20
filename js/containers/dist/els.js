'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stringable_map_1 = __importDefault(require("./stringable-map"));
const eht_1 = __importDefault(require("./eht"));
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
class ELS {
    /**
     * Initializes an ELS structure for the given set of ColumnIDs and
     * number of linking levels.
     */
    constructor(columnIds, numLinkLevels, setOfLinkTags) {
        this.columnMap = new stringable_map_1.default();
        if (columnIds !== undefined && numLinkLevels !== undefined && setOfLinkTags !== undefined) {
            const numRecords = setOfLinkTags.length;
            const tableSize = numRecords ** 2;
            console.log("Generating hash keys for", numLinkLevels, "levels and table size", tableSize);
            const perLevelTags = zip(setOfLinkTags).map((x) => new Set(x));
            const hashKeysPerLevel = new Map();
            for (let linkLevel = 0; linkLevel < numLinkLevels; linkLevel++) {
                const tableKey = eht_1.default.pickHashKey(perLevelTags[linkLevel], tableSize);
                hashKeysPerLevel.set(linkLevel, tableKey);
                console.log("Generated key for level", linkLevel);
            }
            for (const columnId of columnIds) {
                const levelMap = new stringable_map_1.default();
                for (let linkLevel = 0; linkLevel < numLinkLevels; linkLevel++) {
                    const eht = new eht_1.default(tableSize, hashKeysPerLevel.get(linkLevel));
                    levelMap.set(linkLevel, eht);
                }
                this.columnMap.set(columnId, levelMap);
            }
        }
    }
    /**
     * Returns a reference to the EHT corresponding to the given
     * ColumnID and LinkingLevel pair.
     */
    getTable(columnId, linkLevel) {
        var _a, _b;
        return (_b = (_a = this.columnMap.get(columnId)) === null || _a === void 0 ? void 0 : _a.get(linkLevel)) !== null && _b !== void 0 ? _b : undefined;
    }
    getColumns() {
        return this.columnMap.keys();
    }
    toJSON() {
        return {
            columnMap: this.columnMap,
        };
    }
    static fromJSON(json) {
        const parsed = JSON.parse(json);
        const columnMap = new stringable_map_1.default(parsed.columnMap);
        for (const [key, value] of columnMap.entries()) {
            const ehtMap = value.map(function (x) {
                const [key, ehtObject] = x;
                const eht = new eht_1.default(ehtObject.tableSize, ehtObject.hashKey);
                eht.values = ehtObject.values;
                return [key, eht];
            });
            const subMap = new stringable_map_1.default(ehtMap);
            columnMap.set(key, subMap);
        }
        return Object.assign(new ELS(), { columnMap });
    }
}
exports.default = ELS;
function zip(arrays) {
    return arrays[0].map(function (_, i) {
        return arrays.map(function (array) { return array[i]; });
    });
}
