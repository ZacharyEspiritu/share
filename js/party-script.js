const axios = require('axios');
const paillierBigint = require('paillier-bigint')
const bigintConversion = require('bigint-conversion')
const crypto = require("crypto")

const fs = require("fs");
const variables = require('./variables');

const simplecrypto = require("simplecrypto");

const containers = require("containers");
const Multimap = containers.Multimap;
const PiBase = containers.PiBase;

const debug = require("debug");
const logSetup = debug('dataowner-setup');

var party = process.argv[2]
var cmd = process.argv[3]
var party_num = process.argv[4]

const DATAOWNER = "DATAOWNER"
const ANALYST = "ANALYST"

const INIT = "INIT"
const SETUP = "SETUP"
const QUERY = "QUERY"

const MAX_LINKING_LEVEL = 8

const SERVER_ADDR = "http://localhost:8083"
const OPRF_ADDR = "http://localhost:8082"

// number of variables for a regression
const VARIABLE_THRESHOLD = 3;
const LEVELS = 9

let analystSecretKeys = {}

function readFile() {
    const contents = []
    const FILE_PATH = "../scripts/test_data/" + party_num + ".csv"
    var fileContents = fs.readFileSync(FILE_PATH).toString().split("\n");

    for (let i = 0; i < fileContents.length; i++) {
        var row = fileContents[i].split(",")

        if (row.length > 1) {
            contents.push(row)
        }

        // row.forEach(v => {
        //     console.log(v)
        // });
    }
    header = contents.shift()
    return [header, contents]
}

function init_analyst() {

    paillierBigint.generateRandomKeys(3072).then((analystKey) => {

        var hexPublicKey = {
            "n": bigintConversion.bigintToHex(analystKey.publicKey.n),
            "g": bigintConversion.bigintToHex(analystKey.publicKey.g)
        }

        var keypair = simplecrypto.pkeKeyGen()

        analystSecretKeys = {"aheSk": analystKey.privateKey, "sk": keypair.privateKey}

        axios.post(SERVER_ADDR + '/postAnalystPublicKeys', {
            "analystId": "analyst",
            "ahePk": JSON.stringify(hexPublicKey),
            "pk": keypair.publicKey

        }).then((res) => {
            // console.log(res.data)
        });
    });
}

function paillierProcess(processedFile, analystPublicKey) {

    encryptedValues = []

    for (var i in processedFile) {
        var row = processedFile[i]

        encryptedRow = []

        for (var j in row) {
            var value = bigintConversion.textToBigint(row[j]);
            encryptedRow.push(value)
        }

        encryptedValues.push(encryptedRow);
    }

    encryptedSums = encryptedValues[0]


    // add columns
    for (let i = 1; i < encryptedValues.length; i++) {
        for (let j in encryptedValues[i]) {
            encryptedSums[j] = analystPublicKey.addition(encryptedSums[j], encryptedValues[i][j]);
        }
    }

    return encryptedSums
    // for (let i in encryptedSums) {

        // console.log(analystPrivateKey.decrypt(encryptedSums[i]))
    // }

    // for (var i in encryptedValues) {
    //     var row = encryptedValues[i]

    // }

}

/**
 * A hash table of fixed size.
 */
class EncryptedHashTable {
    constructor(hashKey, size) {
        this.values = [];
        this.length = 0;
        this.size = BigInt(size);
        this.hashKey = hashKey;
    }

    add(key, value) {
        const hash = EncryptedHashTable.calculateHash(this.hashKey, key);
        if (!this.values.hasOwnProperty(hash)) {
           this.values[hash] = {};
        }
        if (!this.values[hash].hasOwnProperty(key)) {
           this.length++;
        }
        this.values[hash][key] = value;
    }

    static calculateHash(hashKey, key, tableSize) {
        return simplecrypto.hmac(hashKey, key).readBigInt64BE() % tableSize;
    }

    static pickHashKeyWithNoCollisions(lst, tableSize) {
        while (true) {
            const hashKey = simplecrypto.secureRandom(32)
            const collisionTable = {}

            let recordCount = 0
            let hadCollision = false

            // TODO(zespirit): Needs to account for linking levels
            for (const elt of lst) {
                recordCount++
                let hash = EncryptedHashTable.calculateHash(hashKey, elt, tableSize)
                if (collisionTable.hasOwnProperty(hash)) {
                    console.log(
                        "Collision at", hash, "after", recordCount,
                        "records out of", lst.length, "for hash table of size",
                        tableSize)
                    hadCollision = true
                    break
                }
                collisionTable[hash] = true
            }

            if (!hadCollision) {
                return hashKey
            }
        }
    }
}

function getColumnIndex(columnName, columnNames) {
    const columnIndex = columnNames.indexOf(columnName)
    if (columnIndex == -1) {
        return undefined
    }

    return columnIndex
}

function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
}

async function setup_dataowner() {
    /**
     * Read the data owner's record from the specified CSV on the
     * command line.
     */
    const [columnNames, records] = readFile()
    logSetup("Read %d records.", records.length)

    /**
     * Some unfinished code related to AHE sums computed using
     * the server's public key.
     */
    const publicKeyRequest = await axios.post(
        SERVER_ADDR + '/retrieveAnalystPublicKeys',
        { "analystId": "analyst" }
    )


    const hexPublicKey = JSON.parse(publicKeyRequest.data.ahePk)
    const analystPk = publicKeyRequest.data.pk

    const bigIntPublicKey = {
        n: bigintConversion.hexToBigint(hexPublicKey.n),
        g: bigintConversion.hexToBigint(hexPublicKey.g),
    }

    const analystPublicKey = new paillierBigint.PublicKey(bigIntPublicKey.n, bigIntPublicKey.g)

    const encryptedSums = paillierProcess(records, analystPublicKey);


    /**
     * Compute linking tags via the OPRF.
     *
     * We assume that the returned linking tags are in the same order as
     * the input records; that is, that the linking tags have a 1:1
     * correspondence to the record that they're associated with.
     */
    logSetup("Requesting linking tags from the OPRF server...")
    const oprfRequest = await axios.post(
        OPRF_ADDR + '/oprf',
        { "input": JSON.stringify(records) }
    )
    const linkingTags = oprfRequest.data
    logSetup("Received %d linking tags.", linkingTags.length)

    /**
     * We generate the recordIds for each record here before the
     * zip so that we can zip together the linking tags and the RIDs
     * with their associated records easily in the following line.
     */
    logSetup("Generating record IDs...")
    const recordIds = records.map(function(_, _) {
        return simplecrypto.secureRandom(32).toString()
    })
    logSetup("Generated %d record IDs.", recordIds.length)

    /**
     * This associates each record with its associated PID and RID.
     */
    const recordsWithIdsAndTags = zip([linkingTags, recordIds, records])

    /**
     * Initialize plaintext versions of the multimap and dictionary
     * structures to be converted to the encrypted data structure.
     */
    const mmFilter = new Multimap()
    const dxData = new Map()
    const dxLink = new Map()

    /**
     * Set up the record IDs for each record in DX^data and DX^link.
     */
    logSetup("Adding record IDs and tags to DX^data and DX^link...")
    for (const [linkTag, recordId, record] of recordsWithIdsAndTags) {
        dxData.set(recordId, record)
        dxLink.set(recordId, linkTag)
    }

    /**
     * Convert DX^data and DX^link into encrypted structures.
     *
     * The PiBase constructor consumes a boolean denoting whether or
     * not the PiBase instantiation is response-revealing (true) or
     * response-hiding (false).
     */
    logSetup("Encrypting DX^data and DX^link...")
    const edxData = new PiBase(false)
    const keyData = edxData.setup(dxData)

    const edxLink = new PiBase(true)
    const keyLink = edxLink.setup(dxLink)

    /**
     * Set up MM^filter.
     */
    logSetup("Setting up MM^filter...")
    for (const [linkTag, recordId, record] of recordsWithIdsAndTags) {
        const tkData = PiBase.token(keyData, recordId, false)
        const tkLink = PiBase.token(keyData, recordId, true)

        // TODO(zespirit): We only want to iterate over columns in
        //                 X^filter. This currently just iterates over
        //                 every column.
        for (const columnName of columnNames) {
            const columnIndex = getColumnIndex(columnName, columnNames)
            const columnValue = record[columnIndex]

            // We need to convert the MM^filter label to a string since
            // Map.get (which Multimap.get is implemented with) works off of
            // object identity, not equality.
            mmFilter.set(String({ columnName, columnValue }), { tkData, tkLink })
        }
    }

    /**
     * Convert MM^filter into an encrypted multimap.
     *
     * We set the PiBase constructor argument to true to denote that this is a
     * response-revealing multimap.
     */
    logSetup("Encrypting MM^filter...")
    const emmFilter = new PiBase(true)
    const keyFilter = emmFilter.setup(mmFilter)

    /**
     * Send the analyst the key.
     */
    const key = { keyData, keyLink, keyFilter }
    // const pkeEncryptedKey = simplecrypto.pkeEncrypt(key, JSON.stringify(key))
    // TODO get the analyst key, send it to pkeEncryptedKey

    /**
     * Serialize the encrypted structures.
     */
    const eds = { edxData, edxLink, emmFilter }

    // TODO(zespirit): Missing PKE encryption here.
    // TODO(zespirit): Send serializedEds to the server here.


    // TODO(zespirit): Retrieve previous HTs from server.

    // Initialize a hash function:
    logSetup("Initializing hash functions...")
    const tableSize = BigInt(linkingTags.length * linkingTags.length)
    const zippedTags = zip(linkingTags)
    let hashKey = undefined;
    for (const [linkingLevel, levelTags] of zippedTags.entries()) {
        hashKey = EncryptedHashTable.pickHashKeyWithNoCollisions(levelTags, tableSize)
        console.log("Found hash key for level", linkingLevel, ":", hashKey)
    }
    logSetup("Done initializing hash keys.")


    // Initialize all of the necesary hash tables.
    const ht1 = new EncryptedHashTable(hashKey, tableSize)

    for (const [linkTag, recordId, record] of recordsWithIdsAndTags) {
        // for (const [index, subTag] of linkTag.entries()) {
        //     const dxSums = new Map()
        //     // TODO(zespirit): We only want to iterate over columns in X^nums.
        //     for (const columnName of columnNames) {
        //         const columnIndex = getColumnIndex(columnName, columnNames)
        //         const columnValue = record[columnIndex]
        //         dxSums.set(columnName, analystPublicKey.encrypt())
        //     }
        // }
        // dxData.set(recordId, record)
        // dxLink.set(recordId, linkTag)
    }
    logSetup("Done initializing hash tables.")


    // // setup HT starts here?
    // const numPreviousParties = 3; // TODO(zespirit): Do this better

    // // // Initialize a hash function:
    // // const tableSize = BigInt(linkingTags.length * linkingTags.length)
    // // const hashKey = EncryptedHashTable.pickHashKeyWithNoCollisions(linkingTags, tableSize)
    // // console.log("Found hash key:", hashKey)

    // // // Initialize all of the necesary hash tables.
    // // const ht1 = new EncryptedHashTable(hashKey, tableSize)
    // const ht2s = new Array(numPreviousParties) // HT using 2 columns
    // const ht3s = new Array(numPreviousParties) // HT using 3 columns
    // for (let j = 0; j < numPreviousParties; j++) {
    //     ht2s[j] = new EncryptedHashTable(hashKey, tableSize)

    //     const ht3k = new Array(numPreviousParties)
    //     for (let k = 0; k < numPreviousParties; k++) {
    //         ht3k[k] = new EncryptedHashTable(hashKey, tableSize)
    //     }
    //     ht3s[j] = ht3k
    // }
    // console.log("Initialized all hash tables.")


    // // SEND KEYS TO SERVER!!!!
    // axios.post(SERVER_ADDR + '/postSetup', {
    //     "dataOwnerId": party_num.toString(),
    //     "encryptedDataKeys": JSON.stringify({"structure": "some hex values!"}),
    //     "encryptedDataStructures": JSON.stringify(eds)
    // }).then((res) => {
    //     console.log(res.data)
    // });


}

if (party == DATAOWNER) {
    if (cmd == SETUP) {
        setup_dataowner()
    }
}

if (party == ANALYST) {
    if (cmd == INIT) {
        init_analyst()
    }
}
