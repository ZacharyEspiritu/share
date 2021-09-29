const axios = require('axios');
const paillierBigint = require('paillier-bigint')
const bigintConversion = require('bigint-conversion')
const crypto = require("crypto")
const fs = require("fs");
const variables = require('./variables');

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

function hmac(key, value) {
  return crypto
    .createHmac("sha256", new Buffer.from(key, 'hex'))
    .update(new Buffer.from(value))
    .digest('hex');
}

function randomValueHex(len) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, len) // return required number of characters
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
        return bigintConversion.hexToBigint(hmac(hashKey, key)) % tableSize;
    }

    static pickHashKeyWithNoCollisions(lst, tableSize) {
        while (true) {
            const hashKey = randomValueHex(32)
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

function getColumnIndex(x, header) {
    for (var i in header) {
        if (x == header[i]) {
            return i
        }
    }
}

function setup_dataowner() {
    axios.post(SERVER_ADDR + '/retrieveAnalystPublicKey', {
        "analystId": "analyst",
    }).then((res) => {

        var hexPublicKey = res.data

        var bigIntPublicKey = {
            "n": bigintConversion.hexToBigint(hexPublicKey.n),
            "g": bigintConversion.hexToBigint(hexPublicKey.g),
        }

        var analystPublicKey = new paillierBigint.PublicKey(bigIntPublicKey.n, bigIntPublicKey.g)

        // process data
        var [header, processedFile] = readFile()

        var encryptedSums = paillierProcess(processedFile, analystPublicKey);


        console.log("sending to oprf")
        axios.post(OPRF_ADDR + '/oprf', {
            "input": JSON.stringify(processedFile),
        }).then((res) => {
            console.log("OPRF response:", res.data);
            var pids = res.data;

            console.log(pids)

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

            for (let record of processedFile) {
                for (var col in header) {
                    var x = header[col]
                    if (x in variables.INDEPENDENT) {
                        // do something
                    }

                    if (x in variables.DEPENDENT) {
                        // do something
                    }
                }
            }
        });
    });
}

// function setup_HT_dataowner() {

//     const LINKING_LEVELS = 8
//     for (let linking_level = 0; linking_level < LINKING_LEVELS; linking_level++) {
//         var pid = "";

//         for all x
//     }
// }


// function query_analyst () {

// }

if (party == DATAOWNER) {
    // if (cmd == INIT) {
    //     init_dataowner()
    // }

    if (cmd == SETUP) {
        setup_dataowner()
    }
}

if (party == ANALYST) {
    if (cmd == INIT) {
        init_analyst()
    }
}
