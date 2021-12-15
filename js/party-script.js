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

        axios.post(SERVER_ADDR + '/postAnalystPublicKey', {
            "analystId": "analyst",
            "publicKey": JSON.stringify(hexPublicKey)
        }).then((res) => {
            // console.log(res.data)
        });

        analystPrivateKey = analystKey.privateKey
    });
}

// function init_dataowner() {
//     axios.post(SERVER_ADDR + '/retrieveAnalystPublicKey', {
//         "analystId": "analyst",
//     }).then((res) => {
//         var hexPublicKey = res.data

//         var bigIntPublicKey = {
//             "n": bigintConversion.hexToBigint(hexPublicKey.n),
//             "g": bigintConversion.hexToBigint(hexPublicKey.g),
//         }

//         var publicKey = new paillierBigint.PublicKey(bigIntPublicKey.n, bigIntPublicKey.g)
//         console.log("TEST", publicKey)
//     });
// }

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

    // console.log("encryptedSums", encryptedSums)

    // add columns
    for (let i = 1; i < encryptedValues.length; i++) {
        for (let j in encryptedValues[i]) {
            encryptedSums[j] = analystPublicKey.addition(encryptedSums[j], encryptedValues[i][j]);
        }
    }

    return encryptedSums
    // console.log("privatekey", analystPrivateKey)
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

    /**
     * Some unfinished code related to AHE sums computed using
     * the server's public key.
     */
    const publicKeyRequest = await axios.post(
        SERVER_ADDR + '/retrieveAnalystPublicKey',
        { "analystId": "analyst" }
    )
    const hexPublicKey = publicKeyRequest.data

    var bigIntPublicKey = {
        "n": bigintConversion.hexToBigint(hexPublicKey.n),
        "g": bigintConversion.hexToBigint(hexPublicKey.g),
    }

    var analystPublicKey = new paillierBigint.PublicKey(bigIntPublicKey.n, bigIntPublicKey.g)

    var encryptedSums = paillierProcess(records, analystPublicKey);

    // SEND KEYS TO SERVER!!!!
    axios.post(SERVER_ADDR + '/postEncryptedDataKeys', {
        "dataOwnerId": party_num.toString(),
        "encryptedDataKeys": JSON.stringify({"structure": "some hex values!"})
    }).then((res) => {
        console.log("keys!!", res.data)
    });

    /**
     * Compute linking tags via the OPRF.
     */
    console.log("sending to oprf")

    /**
     * We assume that the returned pids are in the same order as
     * the input records; that is, that the pids have a 1:1
     * correspondence to the record that they're associated with.
     */
    const oprfRequest = await axios.post(
        OPRF_ADDR + '/oprf',
        { "input": JSON.stringify(records) }
    )
    const pids = oprfRequest.data

    /**
     * We generate the recordIds for each record here before the
     * zip so that we can zip together the PIDs and the RIDs
     * with their associated records easily in the following line.
     */
    const recordIds = records.map(function(_, _) {
        return simplecrypto.secureRandom(32).toString()
    })

    /**
     * This associates each record with its associated PID and RID.
     */
    const recordsWithIdsAndTags = zip([pids, recordIds, records])

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
    const edxData = new PiBase(false)
    const keyData = edxData.setup(dxData)

    const edxLink = new PiBase(true)
    const keyLink = edxLink.setup(dxLink)

    /**
     * Set up MM^filter.
     */
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
     */
    const emmFilter = new PiBase(false)
    const keyFilter = emmFilter.setup(mmFilter)

    // TODO(zespirit): Missing PKE encryption here.

    // setup HT starts here?
    const numPreviousParties = 3; // TODO(zespirit): Do this better

    // Initialize a hash function:
    const tableSize = BigInt(pids.length * pids.length)
    const hashKey = EncryptedHashTable.pickHashKeyWithNoCollisions(pids, tableSize)
    console.log("Found hash key:", hashKey)

    // Initialize all of the necesary hash tables.
    const ht1 = new EncryptedHashTable(hashKey, tableSize)

    const ht2s = new Array(numPreviousParties) // HT using 2 columns
    const ht3s = new Array(numPreviousParties) // HT using 3 columns
    for (let j = 0; j < numPreviousParties; j++) {
        ht2s[j] = new EncryptedHashTable(hashKey, tableSize)

        const ht3k = new Array(numPreviousParties)
        for (let k = 0; k < numPreviousParties; k++) {
            ht3k[k] = new EncryptedHashTable(hashKey, tableSize)
        }
        ht3s[j] = ht3k
    }
    console.log("Initialized all hash tables.")

    for (let record of records) {
        for (var col in columnNames) {
            var x = columnNames[col]
            if (x in variables.INDEPENDENT) {
                // do something
            }

            if (x in variables.DEPENDENT) {
                // do something
            }
        }
    }
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
