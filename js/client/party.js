server_ip = "localhost:8083"
oprf_ip = "localhost:8082"

analystPublicKey = "dac56ba60fe8696b97d24a0b7a88f1bb";

function run() {
    console.log("HELLOWORLD!")
    init()
    


    
}

function init() {
  $.post('http://' + server_ip + '/postAnalystPublicKey', {
    "analystId": "analyst",
    "publicKey": analystPublicKey
  }, function(response) {
    console.log("Server setup response:", response);
    // const timeEnd = performance.now();
    // console.log("Total time (ms): ", timeEnd - timeStart);
  });

  $.post('http://' + server_ip + '/retrieveAnalystPublicKey', {
    "analystId": "analyst",
  }, function(response) {
    console.log("Analyst public key:", response);
    // const timeEnd = performance.now();
    // console.log("Total time (ms): ", timeEnd - timeStart);
  });

}

function setup() {

  $.post('http://' + server_ip + '/setup', {
    "schema": "schema",
    "emm_filter": "emm filter",
    "edx_data": "edx data"
  }, function(response) {
    console.log("Server setup response:", response);
    // const timeEnd = performance.now();
    // console.log("Total time (ms): ", timeEnd - timeStart);
});
$.post('http://' + oprf_ip + '/oprf', {
  "input": "input",
}, function(response) {
  console.log("OPRF response:", response);
  // const timeEnd = performance.now();
  // console.log("Total time (ms): ", timeEnd - timeStart);
});
}


function setupHT() {

}