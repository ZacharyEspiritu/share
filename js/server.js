const express = require('express');
const app = express();
const port = 8083;
const path = require('path');

const jsgraphs = require('js-graph-algorithms');

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

let analystPublicKeys = {};
let encryptedDataKeys = {};
let encryptedDataStructures = {};
let unserializedEDS = {};
let previousTables = {}

app.use(express.static(__dirname + '/client'));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.json({limit: '50mb'})) // To parse the incoming requests with JSON payloads


const server = app.listen(port, function () {
  console.log('Listening on port %d', server.address().port);
});

app.get('/', async function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.sendFile((path.join(__dirname + '/client/index.html')));
});

app.post('/postAnalystPublicKeys', async function(req, res) {
  var ahePk = req.body.ahePk;
  var pk = req.body.pk;
  var analystId = req.body.analystId;
  analystPublicKeys[analystId] = {"ahePk": ahePk, "pk": pk};
  console.log("Storing analyst public key: ", analystId, analystPublicKeys);
  res.status(200).send("Success: storing analyst public key");
});

app.post('/getAnalystPublicKeys', async function(req, res) {
  var analystId = req.body.analystId;

  console.log("Retrieving analyst public key", analystId)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log("Successful setup")
  console.log("ANALYS PK", analystPublicKeys)
  res.status(200).send(analystPublicKeys[analystId]);

});

app.get('/getKeys', async function(req, res) {
  var analystId = req.body.analystId;

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log("Returning keys")
  res.status(200).send(encryptedDataKeys);

});

app.get('/getPreviousTables', async function(req, res) {
  res.status(200).send({ response: serialize(previousTables) })
})

app.post('/postNewTables', async (req, res) => {
  const newTables = deserialize(req.body.data)
  Object.assign(previousTables, newTables)
  console.log(previousTables)
  res.status(200).send("Success:")
})

app.post('/postSetup', async function(req, res) {
  const parsed = deserialize(req.body.data)

  /**
   * Save the encrypted structures.
   */
  const dataOwnerId = parsed.dataOwnerId;
  encryptedDataKeys[dataOwnerId] = parsed.keys;
  encryptedDataStructures[dataOwnerId] = parsed.eds;

  // TODO(zespirit): Encode the ELS structures.

  res.status(200).send("Success: stored structures for dataowner: " + dataOwnerId);
});

app.post('/postQuery', async function(req, res) {
  const tks = deserialize(req.body.query);
  const records = query(tks);
  res.status(200).send({ response: serialize(records) });
});

function query(tks) {
  var records = filter(tks);
  return records;
}

function filter(tks) {
  var records = {}
  for (dataOwner in encryptedDataStructures) {
    try {
      let result = encryptedDataStructures[dataOwner].emmFilter.query(tks[dataOwner]);
      console.log("result:", result)
      result.forEach(function(value) {
        var edxRes = encryptedDataStructures[dataOwner].edxData.query(value.tkData);
        edxRes.forEach(function(value) {
          if (dataOwner in records) {
            records[dataOwner].push(value)
          } else {
            records[dataOwner] = [value]
          }
        });
      })
    } catch (e) {
      console.log('error', e)
      continue
    }
  }
  return records;
}

function link() {
  var g = new jsgraphs.Graph(6);
  for (dataOwner in encryptedDataStructures) {
   
  }
}
