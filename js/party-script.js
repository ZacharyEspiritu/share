const axios = require('axios');
const paillierBigint = require('paillier-bigint')
const bigintConversion = require('bigint-conversion')
const crypto = require("crypto")

const fs = require("fs");
const variables = require('./variables');

const simplecrypto = require("simplecrypto");

const { register, serialize, deserialize } = require('god-tier-serializer')

const containers = require("containers");
const Multimap = containers.Multimap;
const PiBase = containers.PiBase;
const EHT = containers.EHT;
const ELS = containers.ELS;
const StringableMap = containers.StringableMap;
register(Multimap.prototype, 'Multimap')
register(PiBase.prototype, 'PiBase')
register(EHT.prototype, 'EHT')
register(ELS.prototype, 'ELS')
register(StringableMap.prototype, 'StringableMap')

const debug = require("debug");
const logSetup = debug('dataowner-setup');

var party = process.argv[2]
var cmd = process.argv[3]
var dataOwnerId = process.argv[4]

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
    const FILE_PATH = "../scripts/test_data/" + dataOwnerId + ".csv"
    var fileContents = fs.readFileSync(FILE_PATH).toString().split("\n");

    for (let i = 0; i < fileContents.length; i++) {
        var row = fileContents[i].trim().split(",")

        if (row.length > 1) {
            contents.push(row)
        }
    }
    header = contents.shift()
    return [header, contents]
}

function init_analyst() {
    paillierBigint.generateRandomKeys(1024).then((analystKey) => {
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

const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

async function setup_dataowner() {
    /**
     * Read the data owner's record from the specified CSV on the
     * command line.
     */
    const [columnNames, records] = readFile()
    logSetup("Read %d records.", records.length)

    /**
     * Request the server's public key data and initialize the
     * necessary client-side key structures.
     */
    const publicKeyRequest = await axios.post(
        SERVER_ADDR + '/getAnalystPublicKeys',
        { "analystId": "analyst" }
    )

    const hexPublicKey = JSON.parse(publicKeyRequest.data.ahePk)
    const analystPk = publicKeyRequest.data.pk

    const bigIntPublicKey = {
        n: bigintConversion.hexToBigint(hexPublicKey.n),
        g: bigintConversion.hexToBigint(hexPublicKey.g),
    }

    const analystPublicKey = new paillierBigint.PublicKey(bigIntPublicKey.n, bigIntPublicKey.g)

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
            // console.log(JSON.stringify({ columnName, columnValue }));
            mmFilter.set(JSON.stringify({ columnName, columnValue }), { tkData, tkLink })
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
    const keys = { keyData, keyLink, keyFilter }
    // const pkeEncryptedKey = simplecrypto.pkeEncrypt(analystPk, JSON.stringify(key))

    /**
     * Serialize the encrypted structures.
     */
    const eds = { edxData, edxLink, emmFilter }
    console.log(eds.edxData)

    const postSetupResponse = await axios.post(
        SERVER_ADDR + '/postSetup',
        { data: serialize({ dataOwnerId, keys, eds }) }
    )

    // TODO(zespirit): Missing PKE encryption here.

    /**
     * Initialize an ELS ("encrypted linking structure") object.
     *
     * This generates the internal hash tables (and their keys) in such
     * a way that the linking tags (as given by linkingTags) for the same
     * linking level do not result in collisions, as needed by the
     * functionality requirements for the ELS structure.
     */
    logSetup("Initializing the ELS...")
    const elsContainer = {}
    const myEls = new ELS(columnNames, variables.NUM_LINK_LEVELS, linkingTags)
    elsContainer[dataOwnerId] = myEls

    /**
     * Set up the AHE-encrypted values inside of the ELS object.
     */
    for (const columnName of variables.NUMERICAL) {
        logSetup("Initializing ELS data for column", columnName)
        const columnIndex = getColumnIndex(columnName, columnNames)
        for (let linkLevel = 0; linkLevel < variables.NUM_LINK_LEVELS; linkLevel++) {
            const eht = myEls.getTable(columnName, linkLevel)
            for (const [linkTag, recordId, record] of recordsWithIdsAndTags) {
                const subTag = linkTag[linkLevel]
                const columnValue = record[columnIndex]
                const numValue = BigInt(parseInt(columnValue))
                eht.add(subTag, analystPublicKey.encrypt(numValue))
            }
            /**
             * Populate the remaining empty spaces with encryptions of 1.
             */
            logSetup("Populating remaining empty spaces...")
            // eht.populateEmptySpaces(() => analystPublicKey.encrypt(1n))
        }
    }
    logSetup("Done with ELS setup.")

    /**
     * Perform multiplications with other ELS structures contributed
     * by other parties.
     */
    logSetup("Retrieving previous ELS tables...")
    const getPreviousTablesResponse = await axios.get(SERVER_ADDR + '/getPreviousTables')
    const previousTables = deserialize(getPreviousTablesResponse.data.response)
    logSetup(`Retrieved ${Object.keys(previousTables).length} previous tables.`)

    for (const [otherDataOwnerId, otherEls] of Object.entries(previousTables)) {
        logSetup(`Computing pairwise table with data owner ${otherDataOwnerId}...`)
        const otherColumns = Array.from(otherEls.getColumns())
        const columnPairs = cartesian(
            otherColumns,
            variables.NUMERICAL
        ).map((arr) => { return arr.join("|") })

        const newEls = new ELS(columnPairs, variables.NUM_LINK_LEVELS, linkingTags)

        for (const otherColumn of otherColumns) {
            for (let linkLevel = 0; linkLevel < variables.NUM_LINK_LEVELS; linkLevel++) {
                const otherEht = otherEls.getTable(otherColumn, linkLevel)

                for (const myColumn of variables.NUMERICAL) {
                    const myColumnIndex = getColumnIndex(myColumn, columnNames)

                    logSetup(`Populating table for ${myColumn} & ${otherColumn} at level ${linkLevel}...`)
                    const newEht = newEls.getTable([otherColumn, myColumn].join("|"), linkLevel)

                    for (const [myLinkTag, _, myRecord] of recordsWithIdsAndTags) {
                        const mySubTag = myLinkTag[linkLevel]
                        const myPlaintext = BigInt(parseInt(myRecord[myColumnIndex]))
                        const otherCiphertext = otherEht.get(mySubTag) ?? analystPublicKey.encrypt(0n)
                        newEht.add(mySubTag, analystPublicKey.multiply(otherCiphertext, myPlaintext))
                    }

                    /**
                     * Populate the remaining empty spaces with encryptions of 0.
                     */
                    logSetup("Populating remaining empty spaces...")
                    // newEht.populateEmptySpaces(() => analystPublicKey.encrypt(0n))
                }
            }
        }
        elsContainer[[otherDataOwnerId, dataOwnerId]] = newEls
    }

    logSetup("Sending new ELS tables to the server...")
    const postNewTablesResponse = await axios.post(
        SERVER_ADDR + '/postNewTables',
        { data: serialize(elsContainer) }
    )
    logSetup("All done!")
}

function query_analyst() {

    let tokens = {}
    axios.get(SERVER_ADDR + '/getKeys', {
        "analystId": "analyst"}).then((res) => {

            let keys = res.data;

            for (let dataOwner in keys) {

                let k = keys[dataOwner].keyFilter;

                console.log("test")
                var tk = PiBase.token(k, JSON.stringify({
                    "columnName": "LAST_NAME",
                    "columnValue": "Dietrich"
                }));
                console.log("test2")


                tokens[dataOwner] = tk;
            }


            console.log("tokens!")
            console.log(tokens)
            axios.post(SERVER_ADDR + '/postQuery', {
              "query": serialize(tokens)
            }).then((res) => {

                console.log(res.data)

                let deserialized = deserialize(res.data.response)
                console.log(deserialized)

                for (let dataOwner in keys) {
                    let k = keys[dataOwner].keyData

                    let data = (deserialized[dataOwner])
                    let plaintext = PiBase.resolve(k, data)
                    console.log(plaintext)   
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

    if (cmd == QUERY) {
        query_analyst()
    }
}
