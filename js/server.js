const express = require('express');
const app = express();
const port = 8083;
const path = require('path');

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