const express = require('express');
const app = express();
const port = 8082;
const path = require('path');

app.use(express.static(__dirname + '/client'));
app.use(express.urlencoded({extended: true}));
app.use(express.json()) // To parse the incoming requests with JSON payloads


const server = app.listen(port, function () {
  console.log('Listening on port %d', server.address().port);
});


app.post('/oprf', async function(req,res) {  
  var input = req.body.input;
 
  console.log("oprf: ", input)
  // update database

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log("Successful oprf")
  res.status(200).send(JSON.stringify("Success"));
});