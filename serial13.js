var connectionId;
var GetPorts = chrome.serial.getDevices(function(ports){
	for(var i=0;i<ports.length;i++){
			var option = document.createElement('option');
		option.value = ports[i].path;
		option.text = ports[i].displayName ? ports[i].displayName : ports[i].path;
	  document.getElementById('port').appendChild(option);
	  console.log(ports[i].path);
	}
	document.getElementById('connect').addEventListener("click",ConnectPort);
	document.getElementById("sendc").addEventListener('click',onSend);
	chrome.serial.onReceive.addListener(onReceiveCallback);
});

var onConnectCallback = function(connectionInfo){
	connectionId = connectionInfo.connectionId;
	//console.log(connectionId);
}

var ConnectPort = function(){
	var e = document.getElementById('port');
	var port = e.options[e.selectedIndex].value;
	//var json = "{bitrate:" + port + "}";
	console.log(port);
	chrome.serial.connect(port, {bitrate:parseInt($("#baudrate").val(),10)}, onConnectCallback);
}

var stringReceived = '';

var onReceiveCallback = function (info) {
	//console.log(info.connectionId);
    if (info.connectionId == connectionId && info.data) {
      //var str = ab2str(info.data);
	  var ab = new Uint8Array(info.data);
	  console.log(ab.length);
	  //console.log(info.data.buffer(4));
	  //var str = info.data;
	  //console.log(typeof(str));
      // if (str.fromCharCode(str.length-1) === '\n') {
        // stringReceived += str.substring(0, str.length-1);
        // onLineReceived(stringReceived);
        // stringReceived = '';
      // } else {
		for(var i=0;i<ab.length;i++){
			stringReceived += String.fromCharCode(ab[i]);
		}
        //tringReceived += str;
		//console.log("received somthing");
//     }
    }
	document.getElementById('output').textContent = stringReceived;// + '\n';
  }

  var onSend = function(){
	  stringReceived="";
	  var a = document.getElementById("meirei").value;
	  //console.log(a);
	  //var b = new ArrayBuffer(a.length);
	  //b = [0x41,0x54,0x49,0x0D];
	  var b = str2ab(a);
	  b.set([0x0D],a.length);
	  var c = new Uint8Array(b);

	  // for (var i = 0;i < a.legnth,i++){
		  
	  // }
	  console.log(connectionId);
	  chrome.serial.send(connectionId,c.buffer,sendcb);
  };
  
  var sendcb = function(){console.log("sent ok");}

window.addEventListener('load',GetPorts);

function ab2str(buf) {
	var str = "";
	console.log(typeof(buf));
	for(i=0;i <buf.byteLength;i++){
		str += String.fromCharCode(buf[i]);
	}
  return str;
}

function str2ab(str) {
  var buf = new Uint8Array(str.length+1); // 1 bytes for each char

  for (var i=0, strLen=str.length; i<strLen; i++) {
    //bufView[i] = str.charCodeAt(i);
	buf[i] = str.charCodeAt(i);
  }
  
  //var bufView = new Uint8Array(buf);
  return buf;
  //return bufView.buffer;
}