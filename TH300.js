var xmlhttp;
var xmlhttpC;
var netsetup = new Uint8Array(24);
// var IS = 0;
// var TS = 0;
var CRCCal = new Uint8Array(8);
if (window.XMLHttpRequest)
  {
    xmlhttp = new XMLHttpRequest();
    xmlhttpC = new XMLHttpRequest();
	//xmlhttp.timeout = 500;
  }
else
  {
    xmlhttp =new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttpC = new ActiveXObject("Microsoft.XMLHTTP");
  }

function getvalue()
  {  
    xmlhttp.open("GET","http://192.168.0.111/",true);
	// xmlhttp.setRequestHeader("Connection","close");
	xmlhttp.timeout = 800;
	xmlhttp.ontimeout = function(){xmlhttp.abort();}
    xmlhttp.responseType = "arraybuffer";
    xmlhttp.send();
  }  

function modbus06(cmd)
{
xmlhttpC.open("POST","http://192.168.0.111/",true);
xmlhttpC.setRequestHeader("Content-Type", "application/x-binary");
xmlhttpC.send(cmd.buffer);	
}

function modbus16(cmd)
{
xmlhttpC.open("POST","http://192.168.0.111",true);
xmlhttpC.setRequestHeader("Content-Type", "application/x-binary");
xmlhttpC.send(cmd.buffer);		
	
}

function SetNet() //0xff表示EEPROM，0x01 write，0x00 read
{
var ee = new Uint8Array(26);
var eetemp = new Uint8Array(22);
ee.set([0xFF, 0x01,0x00,0x00],0);
 for(i=0;i<6;i++){
	eetemp[i] = parseInt(document.getElementById("netsp[" + i + "]").value,16);
 }
 for(i=6;i<22;i++){
	eetemp[i] = parseInt(document.getElementById("netsp[" + i + "]").value,10);
 }
 ee.set(eetemp,4);
//alert(ee);
modbus16(ee);
}

function SetSMS()
{
  var SMSString;
  var SMShex = new Uint8Array(50);
  SMShex.set([0xFF, 0x01,0x00,0x19],0);
}

function run()
{
var runhex = new Uint8Array([0x01, 0x06, 0x9c, 0x41, 0x00, 0x01, 0x36, 0x4e]);
modbus06(runhex);
}

function stop()
  {
	var stophex = new Uint8Array([0x01, 0x06, 0x9c, 0x41, 0x00, 0x00, 0xf7, 0x8e]);
    modbus06(stophex);
  }

function steps() //怪異，名稱用step
{
  var stepshex = new Uint8Array([0x01, 0x06, 0x9C, 0x42, 0x00, 0x01, 0xC6, 0x4E]);
  modbus06(stepshex);
}  

function synctime()
{
  var now = new Date();
  var synctimehex = new Uint8Array(21);
  var nowhex = new Uint8Array(12);
//  var twodata = new FormData();
  nowhex = [Math.floor(now.getFullYear()/ 0x100), now.getFullYear() % 0x100, 0x00, now.getMonth()+1, 0x00, now.getDate(), 0x00, now.getHours(), 0x00, now.getMinutes(), 0x00, now.getSeconds()];
//  nowhex = [0x07,0xdf,0x00,0xc,0x00,0x0c,0x00,0x15,0x00,0x37,0x00,0x23];//,0xdf,0x85]
  var temphex = new Uint8Array([0x01, 0x10, 0x9C, 0xB0, 0x00, 0x06, 0x0C]);
  synctimehex.set(temphex,0);
  synctimehex.set(nowhex,7);
  synctimehex.set(GetCRC(synctimehex),19);
//  alert(synctimehex);
  // twodata.append("cmd",synctimehex);
  // twodata.append("no",12);
  // modbus16(twodata);
  modbus16(synctimehex);
  //alert(synctimehex);
}  

function eeprom()
{
  RWEEPROM();	
}

function DICheck(DIDec)
{
 var DIbin = "0000".slice(0,4-DIDec.toString(2).length) + DIDec.toString(2);
 var alarmstring = "";
// alert(DIbin);
  for(i=0;i<4;i++){
  if(DIbin[i] == 1) {
	 alarmstring = alarmstring + DI[i][0] + DI[i][1] + DI[i][2];
  }	 
 }
 $("#DIAlarm").html(alarmstring);
}

function DOCheck(DODec)
{
 var DObin = DODec.toString(2);
 var DObin = "00000000".slice(0,8-DIDec.toString(2).length) + DODec.toString(2);
 
}


xmlhttp.onreadystatechange = function()
  {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
      {
        var v = new DataView(xmlhttp.response);
        $("#TPV").html((v.getUint16(5,false)/100-100).toFixed(2));
        $("#TSV").html((v.getUint16(3,false)/100-100).toFixed(2));
        $("#TMV").html((v.getUint16(7,false)/100).toFixed(2));
        $("#HSV").html((v.getUint16(9,false)/10).toFixed(1));
        $("#HPV").html((v.getUint16(11,false)/10).toFixed(1));
        $("#HMV").html((v.getUint16(13,false)/100).toFixed(2));
        $("#TON").html(v.getUint8(15,false));
        $("#IS").html(v.getUint8(16,false));
        $("#DRS").html(v.getUint8(17,false));
        $("#TS").html(v.getUint8(18,false));
//        $("#SAS").html(v.getUint8(19,false));//not used
        $("#PAS").html(v.getUint8(20,false));//left 4 bits are SAS,right 4 bits are PAS
        $("#OC").html(v.getUint16(21,false));//HY's document is wrong,replace OC with DO instead
        $("#DO").html(v.getUint16(23,false));//but OC's signal is not stable ,,,,bug
		DOCheck(v.getuint16(23,false));
        $("#DI").html(v.getUint16(25,false));
		DICheck(v.getUint16(25,false));
        $("#FP").html(v.getUint16(27,false));//1:Fix, 0:Program
        $("#RH").html(v.getUint16(29,false));
        $("#RM").html(v.getUint16(31,false));
        $("#RS").html(v.getUint16(33,false));
        $("#SRH").html(v.getUint16(35,false));
        $("#SRM").html(v.getUint16(37,false));
        $("#SSH").html(v.getUint16(39,false));//mistake
        $("#SSM").html(v.getUint16(41,false));//mistake
        $("#RPNo").html(v.getUint16(43,false));
        $("#RSNo").html(v.getUint16(45,false));
        $("#PRRNo").html(v.getUint16(47,false));
        $("#PRSNo").html(v.getUint16(49,false));
        $("#LRNo").html(v.getUint16(51,false));
        $("#LSNo").html(v.getUint16(53,false));


/*       if (IS != v.getUint8(16,false))
        { 
          IS = v.getUint8(16,false);
          InnerSignal();
        }
        if (TS != v.getUint8(18,false))
        {
          TS = v.getUint8(18,false);
          TimeSignal();
        }        
  */
     xmlhttp.abort();
        }
  }
function MakeWS(address,temp)
{

  address = address.toString(16);
  temp = temp.toString(16);
  //var CRCCal = new Uint8Array(8);
  CRCCal[0] = 1;
  CRCCal[1] = 6;
  CRCCal[2] = parseInt(address.substring(0,2),16);
  CRCCal[3] = parseInt(address.substring(2,4),16);
  CRCCal[4] = parseInt(temp.substring(0,2),16);
  CRCCal[5] = parseInt(temp.substring(2,4),16);
  GetCRC();
  //GetCRC(CRCCal);
}

function GetCRC(cmdnocrc)
{
  //alert(cmdnocrc.length);
  var CRC = 0xffff;
  var XorConst = 0xA001;

  for(i=0;i<=cmdnocrc.length-3;i++)
{
  CRC = CRC ^ cmdnocrc[i];
  for(j=0;j<=7;j++)
  {
    if (CRC % 2 == 0)
    {
        CRC = CRC / 2;
    }

    else
    {
        CRC = (CRC -1) /2;
        CRC = CRC ^ XorConst;
    }
  }

}
// CRCCal[7] = parseInt(CRC.toString(16).substring(0,2),16);
// CRCCal[6] = parseInt(CRC.toString(16).substring(2,4),16);
//alert(CRC);
var tempCRC = new Uint8Array(2);
tempCRC[0] = parseInt(CRC.toString(16).substring(2,4),16);
tempCRC[1] = parseInt(CRC.toString(16).substring(0,2),16);

  return tempCRC;
}


// function GetCRC()
// {
  // var CRC = 0xffff;
  // var XorConst = 0xA001;

  // for(i=0;i<=CRCCal.byteLength-3;i++)
// {
  // CRC = CRC ^ CRCCal[i];
  // for(j=0;j<=7;j++)
  // {
    // if (CRC % 2 == 0)
    // {
        // CRC = CRC / 2;
    // }

    // else
    // {
        // CRC = (CRC -1) /2;
        // CRC = CRC ^ XorConst;
    // }
  // }

// }
// CRCCal[7] = parseInt(CRC.toString(16).substring(0,2),16);
// CRCCal[6] = parseInt(CRC.toString(16).substring(2,4),16);

//alert(CRCCal.length);

// xmlhttpC.open("POST","http://192.168.0.111/",true);

// xmlhttpC.responseType = "arraybuffer";
//xmlhttpC.overrideMimeType('text/plain; charset=x-user-defined-binary')
// xmlhttpC.send(CRCCal);
// }

//getvalue();

setInterval(function(){getvalue()},1000);

function str2ab(){
  var smsbuff= new Uint16Array($("#SMS1").val().length);
  //var smstext = "";
  for(i=0;i < $("#SMS1").val().length;i++){
	   smsbuff[i] = $("#SMS1").val().charCodeAt(i);
	   //smstext = smstext + smsbuff[i].toString(16);
  }
  alert(smsbuff);
  //$("#SMS1").html = smstext;
  //alert(smstext);
}

function toUTF8Array(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff))
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}