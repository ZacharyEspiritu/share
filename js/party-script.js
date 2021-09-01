const axios = require('axios');
const paillierBigint = require('paillier-bigint')
const bigintConversion = require('bigint-conversion')



const fs = require("fs");

var party = process.argv[2]
var cmd = process.argv[3]
var party_num = process.argv[4]

const DATAOWNER = "DATAOWNER"
const ANALYST = "ANALYST"

const INIT = "INIT"
const SETUP = "SETUP"
const QUERY = "QUERY"

const SERVER_ADDR = "http://localhost:8083"
const OPRF_ADDR = "http://localhost:8082"

// number of variables for a regression
const VARIABLE_THRESHOLD = 3;
const LEVELS = 9

function readFile() {
    const contents = []
    const FILE_PATH = "../scripts/test_data/0.csv"
    var fileContents = fs.readFileSync(FILE_PATH).toString().split("\n");

    for (index in fileContents) {
        var row = fileContents[index].split(",")

        console.log(row.length)
        if (row.length > 1) {
            contents.push(row)
        }

        // row.forEach(v => {
        //     console.log(v)
        // });
    }
    return contents
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
            console.log(res.data)
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

    console.log("encryptedSums", encryptedSums)

    // add columns
    for (let i = 1; i < encryptedValues.length; i++) {
        for (let j in encryptedValues[i]) {
            encryptedSums[j] = analystPublicKey.addition(encryptedSums[j], encryptedValues[i][j]);
        }
    }

    // console.log("privatekey", analystPrivateKey)
    // for (let i in encryptedSums) {

        // console.log(analystPrivateKey.decrypt(encryptedSums[i]))
    // }

    // for (var i in encryptedValues) {
    //     var row = encryptedValues[i]

    // }

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
        var processedFile = readFile()

        paillierProcess(processedFile, analystPublicKey);

        axios.post(OPRF_ADDR + '/oprf', {
            "input": JSON.stringify(processedFile),
        }).then((res) => {
            console.log("OPRF response:", res.data);
            
        });

        console.log(processedFile)

    });

    //
    //
    //

    // axios.post(SERVER_ADDR + "/setup", {
    //     "schema": "schema",
    //     "emm_filter": "emm filter",
    //     "edx_data": "edx data"
    // }).then((res) => {
    //     console.log("Server setup response:", res.data);
    // });


}


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
