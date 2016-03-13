/*
Kenji 2015 Dec 20 于蘇州
舉例：
DI[0][0] 代表故障1的名稱
DI[0][1] 代表故障1的原因
DI[0][2] 代表故障1的排除方法
其他DI以此類推
*/
var DI = new Array(24);
for (i=0;i<24;i++){
	DI[i] = new Array(3);	
}

DI[0][0]="<BR>DI1:第二高温保护故障<BR>";
DI[0][1]="原因<BR>1:外部高温保护器高温保护设定值过低。<BR>2:温度湿度电热控制SSR零件损坏。<BR>3:DC/AC转换控制器输出SSR控制信号异常。<BR>4:主控制器控制功能信号异常<BR>";
DI[0][2]="排除<BR>1:外部高温保护器设定值重设定SET+10℃。<BR>2:检修电热控制SSR零件与散热片机座温度。<BR>3:检修主控制器与DC/AC转换控制器功能。<BR>4:联络铁木真公司保养维修单位派员检修故障。<BR>";

DI[1][0]="<BR>DI2:湿度电热空焚保护<BR>";
DI[1][1]="原因<BR>1:湿度控制用水断水空焚<BR>2:湿度电热控制SSR零件损坏<BR>3:DC/AC转控制器转出SSR控制信号异常<BR>4:主控制器控制功能信号异常<BR>";
DI[1][2]="排除<BR>1:补充湿度用水与检修湿度供水控制装置<BR>2:检修电热控制SSR零件与散热片机座温度<BR>3:检修主控制器与DC /AC 转换控制器功能<BR>4:联络铁木真公司保养维修单位派员检修故障<BR>";

DI[2][0]="<BR>DI3:压缩机C1过高压力保护<BR>";
DI[2][1]="原因<BR>1:设备周边环境温度过高（+30℃以上）<BR>2:气冷式冷凝器肮脏阻碍造成散热不良<BR>3:水冷式冷凝器冷却水不足或水垢散热不良<BR>4:冷凝器冷却风扇或冷却水塔装置故障<BR>";
DI[2][2]="排除<BR>1:改善设备周边环境温度空调或加强通风<BR>2:清理冷凝器或清理冷却水塔装置<BR>3:检修冷凝器冷却风扇或冷却水塔装置<BR>4:联络铁木真公司保养维修单位派员检修故障<BR>";

DI[3][0]="<BR>DI4:压缩机C2过高压力保护<BR>";
DI[3][1]="原因:<BR>1:设备周边环境温度过高（+30℃以上）<BR>2:气冷式冷凝器肮脏阻碍造成散热不良<BR>3:水冷式冷凝器冷却水不足或水垢散热不良<BR>4:冷凝器冷却风扇或冷却水塔装置故障<BR>5:压缩机C1冷媒不足或压缩机C1故障<BR>";
DI[3][2]="排除:<BR>1:改善设备周边环境温度空调或加强通风<BR>2:清理冷凝器或清理冷却水塔装置。<BR>3:检修冷凝器冷却风扇或冷却水塔装置。<BR>4:联络铁木真公司保养维修单位派员检修故障。<BR>";

/*
DO 代表輸出
*/
var DO = new Array(8);

DO[0]="";
DO[1]="";
DO[2]="";
DO[3]="";
DO[4]="";
DO[5]="";
DO[6]="";
DO[7]="";

/*
T訊號
*/
var T = new Array(8);
T[0]="一號壓縮機__五匹<BR>";
T[1]="二號壓縮機__兩匹<BR>";
T[2]="一號壓縮機3號電磁閥40%流量<BR>";
T[3]="一號壓縮機2號電磁閥40%流量<BR>";
T[4]="一號壓縮機1號電磁閥20%流量<BR>";
T[5]="二號壓縮機3號電磁閥40%流量<BR>";
T[6]="二號壓縮機2號電磁閥40%流量<BR>";
T[7]="二號壓縮機1號電磁閥20%流量<BR>";

/*
Inner Signal
*/
var IS = new Array(8);
IS[0] = "";
IS[1] = "";
IS[2] = "";
IS[3] = "";
IS[4] = "";
IS[5] = "";
IS[6] = "";
IS[7] = "";

/*
Time Signal  時間訊號
*/
var TS= new Array(8);
TS[0] = "";
TS[1] = "";
TS[2] = "";
TS[3] = "";
TS[4] = "";
TS[5] = "";
TS[6] = "";
TS[7] = "";

/*
系統警報SA，程式組警報PA
*/
var SA = new Array(8);
var PA = new Array(8);
SA[0]="";
SA[1]="";
SA[2]="";
SA[3]="";
SA[4]="";
SA[5]="";
SA[6]="";
SA[7]="";

PA[0]="";
PA[1]="";
PA[2]="";
PA[3]="";
PA[4]="";
PA[5]="";
PA[6]="";
PA[7]="";
