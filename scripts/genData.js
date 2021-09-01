const vars = require("../js/variables")
const faker = require("faker")
const fs = require('fs')

const num_parties = process.argv[2]
const num_rows = process.argv[3]

all_data = []

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min+1)+min);
}

function randomElement(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function weightedRandom(input) {
    let items = []
    let weights = []

    for (const item in input) {
        items.push(item)
        weights.push(input[item])
    }
    for (let i = 0; i < weights.length; i++)
        weights[i] += weights[i - 1] || 0;
    
    var random = Math.random() * weights[weights.length - 1];
    
    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;
    
    return items[i];

}

function selectColumns() {
    let columns = []
    let totalCols = vars.ALL.length
    // deep copy
    let weights = JSON.parse(JSON.stringify(vars.weights)); 
    let numCols = randomBetween(Math.floor(totalCols/2), totalCols)

    for (let i = 0; i < numCols; i++) {
        let col = weightedRandom(weights)
        columns.push(col)
        delete weights[col]
    }
    return columns
}

function createHeader(cols) {
    header = []
    for (let i = 0; i < vars.ALL.length; i++) {
        if (cols.includes(vars.ALL[i])) {
           header.push(vars.ALL[i])
        }
    }
    return header
}

function populateRow(row, cols) {
    let returned_row = []

    for (let i = 0; i < row.length; i++) {
        if (cols.includes(vars.ALL[i])) {
           
            returned_row.push(row[i])
        }
    }
    return returned_row
}

function create_row() {
    let FIRST_NAME = faker.name.firstName()
    let LAST_NAME = faker.name.lastName()
    let SOCIAL_SEC = faker.datatype.uuid()
    let GENDER = faker.name.gender()
    let BIRTH_DATE = faker.date.past()
    let ST_ADDR_1 = faker.address.streetAddress()
    let ST_ADDR_2= faker.address.streetAddress()
    let TOWN = faker.address.city()
    let ZIP = faker.address.zipCode()
    let WEIGHT = randomBetween(90, 255)
    let HEIGHT =  randomBetween(57, 88)
    let SMOKER = randomElement([0,1])
    let TREATMENT = randomBetween(0,4)
    let TREAT_SUCCESS = randomElement([0,1])
    let OVERALL_OUTCOME = randomBetween(0,100)

    return [FIRST_NAME, LAST_NAME, SOCIAL_SEC, GENDER, BIRTH_DATE,
        ST_ADDR_1, ST_ADDR_2, TOWN, ZIP, WEIGHT, HEIGHT, SMOKER, 
        TREATMENT, TREAT_SUCCESS, OVERALL_OUTCOME]
}

for (let i = 0; i < num_rows; i++) {
    all_data.push(create_row())
}

for (let i = 0; i < num_parties; i++) {
    let selectedCols = selectColumns()
    let rows_to_select = randomBetween(Math.floor(all_data.length/4), all_data.length)

    all_data = shuffle(all_data)
    party_data = []

    for (let j = 0; j < rows_to_select; j++) {
        party_data.push(populateRow(all_data[j], selectedCols))
    }
 
    header = createHeader(selectedCols)
    data = [header].concat(party_data)

    let csvContent = "";

    data.forEach(function(rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });

    try {
        fs.writeFileSync("test_data/" + i.toString() + ".csv", csvContent)
        //file written successfully
      } catch (err) {
        console.error(err)
      }
}
