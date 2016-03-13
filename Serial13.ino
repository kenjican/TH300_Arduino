/****************************
 * Kenji 2015 Oct 8 Mega2560
 * Serial 和電腦通訊,38400,N,8,1
 * Serial1 和TH300通訊，38400,N,8,1
 * Serial3 和Sim900A通訊，38400，N,8,1
 * Serial2 和煒煌打印機通訊，19200,n,8,1
 * EERPOM規劃前400個byte作為資料位置，每個位置2bytes。資料長度為前後兩個位置相減。前5個bytes分別是mac,ip,dns,gateway,subnet。EEPROM
 * 可以用browser寫入，alarm的內容寫在網頁，不放在EEPROM。SMS的內容寫在EEPROM，javascript是UTF16，要轉成UTF8
 * EEPROM規劃：
 * 0-21. 0-5:MAC, 6-9:IP, 10-13:DNS,14-17:Gateway,18-21:subnet 
 * 22-29 為讀取狀態的modbus 03控制碼
 * 3000-4095作為SMS的內容，每50個bytes為一個短信內容，分為21-22組，每組25個字，用UCS2編碼。短信的上限是70個字，25個字也很夠了.或者分成
 * 更多組，每組的字數減少
 */

#include <SPI.h>
#include <Ethernet.h>
#include <EEPROM.h>
#include <avr/wdt.h>
//#include <utility/w5100.h>

byte cmd[8] = {0x01, 0x03, 0x75, 0x95, 0x00, 0x1B, 0x0F, 0xE1};//取TH300暫存器30301-30127，共27個資料，54個bytes
byte resp[59];//前三個byte分別是機號01，功能代碼03，應答數據27個，最後兩個bytes是crc，所以回傳bytes數是59個bytes
String S, TPV, TSV, HPV, S_Cloud; //S是要寫進sd卡的CSV格式TPV,HPV是要上傳到yeelink的溫濕度PV。S_Cloud是上傳到yeelink的json
//因為要方便計算json長度，所以都放在S_Cloud

unsigned short int Printer_timer = 60;//煒煌打印週期，秒
unsigned short int Cloud_Timer = 30;//上傳yeelink的週期，秒
unsigned short int SMS_Timer = 30; //SMS的Timer,秒
unsigned short int resp_counter = 0;//取多少個bytes，可以做成動態的，看發送什麼modbus指令而定。
unsigned short int Alarm_delay = 30;//sms警報第一次和下次延遲時間,30秒
unsigned short int err = 0;//累計CRC的錯誤值

//byte mac[] = { 0x28, 0xE3, 0x47, 0x5E, 0x90, 0x86 };// W5100的mac
//byte ip[] = { 192, 168, 0, 111 };//W5100的IP

EthernetServer server(80);//Server監聽80port

byte Cloud_server[] = {42, 96, 164, 52}; //yeelink的url
byte sms_server[] = {192, 168, 0, 12}; //安卓手機的gateway
EthernetClient Cloud;//連接到yeelink的client
EthernetClient SMSServer;//Client 連接到安卓手機的SMS gateway


/*
*GetValue 傳送取值的控制碼到TH300
*/

void GetValue() {
  //  for (int i = 0; i < 8; i++) {
  Serial1.write(cmd, 8);
  //  }
}

/*
* TIMER1,compare A,interrupt。每秒interrupt呼叫一次
* 每秒送一次控制碼給TH300取值，printer timer，cloud timer都每秒累積1
* printer煒煌打印機沒60秒印一次。cloud yeelink每30秒上傳一次
*/

ISR(TIMER1_COMPA_vect)
{
  //  Serial.println(S);
  //  Serial.println("free memory : " + freeMemory());
  GetValue();
  //  delay(100);
  //  getrx();
  Printer_timer += 1;
  Cloud_Timer += 1;

  if (Printer_timer >= 30) {
    //Serial2.println(S);
    //ShowSockStatus();
    Printer_timer = 0;
  }
  //  if (Cloud_Timer >= 30) {
  //    Yeelink_Cloud();
  //    Cloud_Timer = 0;
  //  }
  //ShowSockStatus();
  //  Serial.println(serv);

}


/*
* ifavail 會呼叫 CRCCheck，驗證回傳值的CRC是否正確。如果錯就return false
* 然後ifavail馬上再取一次值*
*/

bool CRCCheck(byte* CalCRC, int ArraySize) {
  unsigned short int CRC = 0xffff;
  const unsigned short int XorConst = 0xA001;
  unsigned short int CRC_C = CalCRC[(ArraySize - 1)] << 8 | CalCRC[(ArraySize - 2)];

  for (int i = 0; i < ArraySize - 2; i++) {
    CRC = CRC ^ CalCRC[i];
    for (int j = 0; j <= 7; j++) {
      if (CRC % 2 == 0) {
        CRC = CRC / 2;
      } else {
        CRC = (CRC - 1 ) / 2;
        CRC = CRC ^ XorConst;
      }
    }
  }

  if (CRC == CRC_C) {
    return true;
  } else {
    return false;
  }
}

/*
* loop到TH300有資料回傳就呼叫ifavail
* ifavail把資料讀進resp（這時應該檢查資料長度是否59，如果不是，就重發控制碼)
* 如果資料正確，第一優先是檢查是否有警報。CheckAlarm
* if(sizeof(resp) == 59),這個是後來加的。如果crc正確就存到sd卡
*/

void ifavail() {

  int i = 0;
  while (Serial1.available() > 0) {
    resp[i] = Serial1.read();
    i += 1;
  }

  if (CRCCheck(resp, sizeof(resp))) {
    S = "";
    TSV = (String)((float)(resp[3] << 8 | resp[4]) / 100 - 100);
    //TSV = "18.54";
    S = S + TSV + ",";
    //TPV = (String)((float)(resp[5] << 8 | resp[6]) / 100 - 100);
    S = S + TPV + ",";
    S = S + (String)((float)(resp[7] << 8 | resp[8]) / 100) + ",";
    S = S + (String)((float)(resp[9] << 8 | resp[10]) / 10) + ",";
    //HPV = (String)((float)(resp[11] << 8 | resp[12]) / 10);
    //HPV = "75.3";
    S = S + HPV + ",";
    S = S + (String)((float)(resp[13] << 8 | resp[14]) / 100);
  } else {
    GetValue();
    err += 1;
    //    Serial.println("CRC錯誤 ：" + err);
  }
}

//void Check_Alarm() {
//  if (resp[26] >= 1 && Alarm_delay == 30) {
//    SMSServer.flush();
//    //    Serial.println("ALARM");
//    SMSServer.connect(sms_server, 9090);
//    SMSServer.println("GET /sendsms?phone=13013786354&text=繁體简体にほんご HTTP/1.1");
//    SMSServer.println("Host: 192.168.0.12");
//    SMSServer.println("Accept: */*");
//    SMSServer.println("Connection: close");
//    SMSServer.println();
//    SMSServer.stop();
//    Alarm_delay -= 1;
//    if (Alarm_delay == 0) {
//      Alarm_delay = 30;
//    }
//  } else if (resp[26] == 0) {
//    Alarm_delay = 30;
//  }
//}


/*
* 一些設定。
*/



/*
 * 原本用softwareserial在loop里，如果rx有資料，就會讀取。
 * 但在loop里用hardware serial，取值有錯誤，不知為何。
 * 改成用serialEvent1，這應該是serial 1的rx interrupt
 * 數值就正確了
 */

void serialEvent1() {

  while (Serial1.available()) {
    resp[resp_counter] = Serial1.read();
    resp_counter += 1;
    //Serial.print(Serial1.read());
  }
  //Serial.println(resp_counter);
  if (resp_counter > 58) {
    ifavail();
    //memcpy(resp,resptemp,59);
    resp_counter = 0;
  }
  //   sei();
}

/*
* 在timer1，timer cloud累積到30，就呼叫yeelink)_cloud
*
*
*/


void Yeelink_Cloud() {
  //Cloud.flush();

  //    ShowSockStatus();
  S_Cloud = "[{\"sensor_id\":177080,\"value\":45.03},{\"sensor_id\":177081,\"value\":80.0}]";
  S_Cloud = "POST /v1.1/device/158677/datapoints/ HTTP/1.1\r\nHost: api.yeelink.net\r\nU-ApiKey:\
  67d53f8a4b9009ead6a9d9f527de8842\r\nContent-Length: 72\r\n\r\n" + S_Cloud;
  //S_Cloud =  S + "Content-Length: " + (String)(S_Cloud.length()) + "\r\n\r\n";
  Cloud.connect(Cloud_server, 80);
  Cloud.println(S_Cloud);
  Cloud.stop();
}



//void ShowSockStatus()
//{
//  for (int i = 0; i < 4; i++) {
//    Serial.print("Socket#");
//    Serial.print(i);
//    uint8_t s = W5100.readSnSR(i);
//    Serial.print(",:0x");
//    Serial.print(s, 16);
//    Serial.print(",");
//    Serial.print(W5100.readSnPORT(i));
//    Serial.print(" D:");
//    uint8_t dip[4];
//    W5100.readSnDIPR(i, dip);
//    //    for (int j = 0; j < 4; j++) {
//    //      Serial.print(dip[j], 10);
//    //      if (j < 3) Serial.print(".");
//    //    }
//    Serial.print(",");
//    Serial.print(W5100.readSnDPORT(i));
//    Serial.print(",");
//    Serial.print(W5100.readIR(), BIN);
//    Serial.print(",");
//    Serial.print(W5100.readSnIR(i), BIN);
//    Serial.print(",");
//    Serial.print(W5100.readSnTX_FSR(i));
//    Serial.print(",");
//    Serial.print(W5100.readSnTX_RD(i));
//    Serial.print(",");
//    Serial.print(W5100.readSnTX_WR(i));
//    Serial.print(",");
//    Serial.print(W5100.readSnRX_RSR(i));
//    Serial.print(",");
//    Serial.print(W5100.readSnRX_RD(i));
//    Serial.print(",");
//    Serial.print(W5100.readSnRX_WR(i));
//    Serial.print(",");
//    Serial.println(W5100.readSnCR(i));
//
//  }
//}
byte RWEEPROM(byte* EE, uint8_t leng){ //EE[1] 0x00讀，0x01寫
  uint16_t addr = EE[2]<<8 | EE[3];
//  Serial.println(EE[4]);
//  Serial.println(leng);
  byte ER[leng-4];
  if(EE[1] == 0x00){
    for(uint8_t i = 4;i < leng;i++){
     ER[i-4] = EEPROM.read(addr);
     addr++;
    }
    return 0;
  }else if(EE[1] == 0x01){
     for(uint8_t i = 4;i < leng;i++){
     EEPROM.write(addr,EE[i]);
     Serial.print(EE[i]);
     addr++;
     delay(5);
    }
    return 0;
    }
//  Serial.println(addr);
}

void setup() {
  SPI.setClockDivider(SPI_CLOCK_DIV2);
  Serial.begin(250000);
  Serial3.begin(38400);
  Serial2.begin(19200);
  Serial1.begin(38400);
  pinMode(10, OUTPUT);
  digitalWrite(10, HIGH);
  pinMode(4, OUTPUT);
  //digitalWrite(4, HIGH);

  TCCR1A = 0;
  TCCR1B = 0;
  TCNT1 = 0;
  OCR1A = 15624;// 16Mhz/1024/15625 = 1 sec
  TCCR1B |= (1 << WGM12 | 1 << CS12 | 1 << CS10);
  TIMSK1 |= (1 << OCIE1A);
//byte mac[] = { 0x28, 0xE3, 0x47, 0x5E, 0x90, 0x86 };// W5100的mac
//byte ip[] = { 192, 168, 0, 111 };//W5100的IP
byte netsetup[21];
for(uint8_t i = 0;i<22;i++){
  netsetup[i] = EEPROM.read(i);
}
byte mac[6],ip[4],dns[4],gateway[4],subnet[4];
memcpy(mac,&netsetup[0],6);
memcpy(ip,&netsetup[6],4);
memcpy(dns,&netsetup[10],4);
memcpy(gateway,&netsetup[14],4);
memcpy(subnet,&netsetup[18],4);
  Ethernet.begin(mac,ip,dns,gateway,subnet);
  server.begin();
  //  Serial.println(SPCR,BIN);
  //  Serial.println(SPSR,BIN);
}

/*
* polling，看80port和serial1的RX是否有資料進來，
* 或許監聽80port和Serial的rx都可以改成interrupt，但如何lock？
* 避免80port和rx在執行時被timer interrupt而造成資料錯誤，或反之？
*/

void loop() {
  if (Cloud_Timer >= 30) {
    Yeelink_Cloud();
    Cloud_Timer = 0;
  }
  EthernetClient client = server.available();  // try to get client

  if (client) {
    char c;
    c = client.read();
    if (c == 'G') {
      client.println("HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin:*\r\nContent-Type: text/html\r\nConnection: keep-alive\r\n");
      client.write(resp, 59);
      client.stop();
    }
    else if(c == 'P'){
      TIMSK1 |= (0 << OCIE1A);
      client.println("HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin:*\r\nAccess-Control-Allow-Headers: content-type\r\nAccess-Control-Request-Method: POST\r\nConnection: keep-alive\r\n");
      Serial1.flush();
      while (Serial1.available()) {
        c = Serial1.read();
      }
      while (client.available()) {
        if (client.read() == '\n' && client.read() == '\r' )
        {
          c = client.read();
          uint8_t j = client.available();
//          Serial.println(j);
          byte cmdc[j];
          for (uint8_t i = 0; i < j; i++) {
            cmdc[i] = client.read();
//          byte temp[8];
//           client.read(temp,8);
//            Serial1.write(client.read());
          }
          if (cmdc[0] != 0xff){
             Serial.write(cmdc,j);
            }else{
//              for(uint8_t i=1;i<j;i++){
//                EEPROM.write(i,cmdc[i]);
//                delay(100);
//                 }
             RWEEPROM(cmdc,j);
               }
        }
        else
        {
          c = client.read();
        }
      }
      client.stop();
      Serial1.flush();
      delay(100);
      while (Serial1.available()) {
       c = Serial1.read();
      }
    }
  }
}
