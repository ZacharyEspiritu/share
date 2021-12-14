const express = require('express');
const app = express();
const port = 8083;
const path = require('path');


let analystPublicKeys = {};
let encryptedDataKeys = {};
// const clusion = require('./clusion');

app.use(express.static(__dirname + '/client'));
app.use(express.urlencoded({extended: true}));
app.use(express.json()) // To parse the incoming requests with JSON payloads


const server = app.listen(port, function () {
  console.log('Listening on port %d', server.address().port);
});

app.get('/', async function(req,res){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.sendFile((path.join(__dirname + '/client/index.html')));
});

app.post('/postAnalystPublicKey', async function(req, res) {
  var analystPublicKey = req.body.publicKey;
  var analystId = req.body.analystId;
  analystPublicKeys[analystId] = analystPublicKey;
  console.log("Storing analyst public key: ", analystId, analystPublicKey);
  res.status(200).send("Success: storing analyst public key");
});

app.post('/retrieveAnalystPublicKey', async function(req, res) {
  var analystId = req.body.analystId;

  console.log("Retrieving analyst public key", analystId)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log("Successful setup")
  res.status(200).send(analystPublicKeys[analystId]);

});


app.post('/postEncryptedDataKeys', async function(req, res) {
  let dataOwnerId = req.body.dataOwnerId;
  encryptedDataKeys[dataOwnerId] = req.body.encryptedDataKeys; 

  console.log("Storing encrypted data keys ");
  res.status(200).send("Success: storing keys for dataowner: " + dataOwnerId, 200);
});

app.post('/retrieveAnalystPublicKey', async function(req, res) {
  var dataOwnerId = req.body.dataOwnerId;

  console.log("Retrieving encrypted data keys", encryptedDataKeys)
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log("sent keys")
  res.status(200).send(encryptedDataKeys[dataOwnerId]);

});

app.post('/setup', async function(req,res) {  
  var schema = req.body.schema;
  var emm_filter = req.body.emm_filter;
  var edx_data = req.body.edx_data;

  console.log("setup: ", schema, emm_filter, edx_data)
  // update database

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log("Successful setup")
  res.status(200).send(JSON.stringify("Success"));
});