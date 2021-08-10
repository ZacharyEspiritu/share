server_ip = "localhost:8083"
oprf_ip = "localhost:8082"

function run() {
    console.log("HELLOWORLD!")
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

function init() {
  
}

function setup() {

}


function setupHT() {

}