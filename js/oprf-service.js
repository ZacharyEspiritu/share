const express = require('express');
const app = express();
const port = 8082;
const path = require('path');
const crypto = require("crypto")

// var KEY = randomValueHex(32);
var KEY = "245a1bcdc51b7fd50a96a35d5ba5e58b"

app.use(express.static(__dirname + '/client'));
app.use(express.urlencoded({extended: true}));
app.use(express.json({limit: '50mb'})) // To parse the incoming requests with JSON payloads


const server = app.listen(port, function () {
  console.log('Listening on port %d', server.address().port);
});


// function randomValueHex(len) {
//   return crypto
//     .randomBytes(Math.ceil(len / 2))
//     .toString('hex') // convert to hexadecimal format
//     .slice(0, len) // return required number of characters
// }


app.post('/oprf', async function(req,res) {  
  var input = req.body.input;
  var inputArr = JSON.parse(input)
  var output = []

  // USING HMAC IN PLACE OF OPRF RN
  inputArr.forEach((row) => {
    // row.forEach((value) => {
      var out = crypto.createHmac("sha256",
      new Buffer.from(KEY, 'hex'))
      .update(new Buffer.from(JSON.stringify(row), 'utf-8'))
      .digest('hex');
      output.push(out)
    // });
  });
  
  console.log("OPRF output", output)

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log("Successful oprf")
  res.status(200).send(JSON.stringify(output));
});
