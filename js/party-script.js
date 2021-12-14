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

function symmetricEncrypt(key, plaintext) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(plaintext);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function symmetricDecrypt(key, ciphertext) {
    const iv = Buffer.from(ciphertext.iv, 'hex');
    const encryptedText = Buffer.from(ciphertext.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

/**
 * A multimap.
 */
class Multimap {
    constructor(iterable) {
        this.map = new Map();

        if (iterable) {
            // We want to have a reference to the same `this` in the closure, so
            // we use this `self` variable to maintain the reference.
            const self = this;
            iterable.forEach(function(i) {
                self.map.set(i[0], i[1]);
            });
        }
    }

    get(key) {
        return this.map.get(key);
    }

    set(key, val) {
        const args = Array.prototype.slice.call(arguments);
        key = args.shift();

        let entry = this.map.get(key);
        if (!entry) {
            entry = [];
            this.map.set(key, entry);
        }

        Array.prototype.push.apply(entry, args);
        return this;
    }

    delete(key, val) {
        if (!this.map.has(key)) {
            return false;
        }

        if (arguments.length == 1) {
            this.map.delete(key);
            return true;
        } else {
            let entry = this.map.get(key);
            let idx = entry.indexOf(val);
            if (idx != -1) {
                entry.splice(idx, 1);
                return true;
            }
        }

        return false;
    }

    keys() {
        return Multimap.#makeIterator(this.map.keys())
    }

    static #makeIterator(iterator){
        if (Array.isArray(iterator)) {
            let nextIndex = 0;
            return {
                next() {
                    if (nextIndex < iterator.length) {
                        return {value: iterator[nextIndex++], done: false};
                    } else {
                        return {done: true};
                    }
                }
            };
        }

        return iterator;
    }
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

/**
 * Response-revealing implementation of PiBase.
 */
class PiBase {
    constructor(multimap, isResponseRevealing = false) {
        this.entries = {};
        this.key = randomValueHex(32);
        this.isResponseRevealing = isResponseRevealing;

        for (const keyword of multimap.keys()) {
            const labelKey = hexToBytes(hmac(this.key, keyword + "label"));
            const valueKey = hexToBytes(hmac(this.key, keyword + "value"));
            let counter = 0;
            for (const value of multimap.get(keyword)) {
                const encryptedLabel = hmac(labelKey, counter.toString());
                const encryptedValue = symmetricEncrypt(valueKey, value);
                counter += 1;
                this.entries[encryptedLabel] = encryptedValue;
            }
        }
    }

    toJson() {
        return JSON.stringify(this.entries)
    }

    token(keyword) {
        const labelKey = hexToBytes(hmac(this.key, keyword + "label"));
        let searchToken = {labelKey: labelKey}

        if (this.isResponseRevealing) {
            const valueKey = hexToBytes(hmac(this.key, keyword + "value"));
            searchToken.valueKey = valueKey;
        }

        return searchToken;
    }

    query(searchToken) {
        const result = new Set();
        let counter = 0;
        while (true) {
            const encryptedLabel = hmac(searchToken.labelKey, counter.toString());
            if (!(encryptedLabel in this.entries)) {
                break;
            }

            const encryptedValue = this.entries[encryptedLabel];
            if (this.isResponseRevealing) {
                const plaintextValue = symmetricDecrypt(searchToken.valueKey, encryptedValue);
                result.add(plaintextValue);
            } else {
                result.add(encryptedValue);
            }

            counter += 1;
        }

        return result;
    }
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

        console.log("Setting up multimap...")
        const mmFilter = new Multimap();
        mmFilter.set("a", "0");
        mmFilter.set("a", "1");
        mmFilter.set("a", "2");
        mmFilter.set("b", "3");
        mmFilter.set("c", "4");
        mmFilter.set("c", "5");

        for (const key of mmFilter.keys()) {
            console.log(key, mmFilter.get(key));
        }

        console.log("Setting up EMM...")
        const emmFilter = new PiBase(mmFilter);
        console.log(emmFilter);
        console.log(emmFilter.query(emmFilter.token("a")))

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
