import StringableMap from "./stringable-map";
import EHT from "./eht";
export declare type PartyID = string;
export declare type ColumnID = Array<string>;
export declare type LinkingLevel = number;
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
    columnMap: StringableMap<ColumnID, StringableMap<LinkingLevel, EHT<T>>>;
    /**
     * Initializes an ELS structure for the given set of ColumnIDs and
     * number of linking levels.
     */
    constructor(columnIds?: Iterable<ColumnID>, numLinkLevels?: number, setOfLinkTags?: Array<Array<string>>);
    /**
     * Returns a reference to the EHT corresponding to the given
     * ColumnID and LinkingLevel pair.
     */
    getTable(columnId: ColumnID, linkLevel: LinkingLevel): EHT<T> | undefined;
    getColumns(): Iterable<ColumnID>;
    toJSON(): {
        columnMap: StringableMap<ColumnID, StringableMap<number, EHT<T>>>;
    };
    static fromJSON(json: string): ELS<any>;
}
