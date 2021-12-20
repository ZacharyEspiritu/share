const express = require('express');
const app = express();
const port = 8083;
const path = require('path');

const containers = require("containers");
const jsgraphs = require('js-graph-algorithms');
const PiBase = containers.PiBase;

let analystPublicKeys = {};
let encryptedDataKeys = {};
let encryptedDataStructures = {};
let unserializedEDS = {};

app.use(express.static(__dirname + '/client'));
app.use(express.urlencoded({extended: true}));
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

app.post('/postSetup', async function(req, res) {
  let dataOwnerId = req.body.dataOwnerId;
  encryptedDataKeys[dataOwnerId] = req.body.keys; 
  encryptedDataStructures[dataOwnerId] = req.body.eds;

  // hash tables go in here too??

  console.log("Storing encrypted data keys ");
  res.status(200).send("Success: storing keys for dataowner: " + dataOwnerId);
});

app.post('/postQuery', async function(req, res) {
  let tks = req.body.query;

  query(JSON.parse(tks));
  console.log("Query success");
  res.status(200).send("test");
});

function unserialize() {
  for (dataOwner in encryptedDataStructures) {
    let parsed = JSON.parse(encryptedDataStructures[dataOwner])
    let edxData = PiBase.fromJSON(parsed.edxData);
    let emmFilter = PiBase.fromJSON(parsed.emmFilter);
    let edxLink = PiBase.fromJSON(parsed.edxLink);
    
    unserializedEDS[dataOwner] = {
      edxData, emmFilter, edxLink
    }
  }
}

function query(tks) {

  // if unserialized empty
  unserialize()

  filter(tks)
}

function filter(tks) {
  for (dataOwner in unserializedEDS) {
    try {
      let stk = PiBase.formatToken(Buffer.from(tks[dataOwner].labelKey.data), Buffer.from(tks[dataOwner].valueKey.data))
      let result = unserializedEDS[dataOwner].emmFilter.query(stk);
      
      result.forEach(function(value) {
        // console.log("value", value.tkData)
        // let labelKey = Buffer.from(value.tkData.labelKey.data)
        // console.log("labelkey", labelKey)
        // unserializedEDS[dataOwner].edxData.query(labelKey);
      })


    } catch (e) {
      console.log('error', e)
      continue
    }
  
  }

}

function link() {
  var g = new jsgraphs.Graph(6);
  for (dataOwner in encryptedDataStructures) {
   
  }
}