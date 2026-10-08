//+------------------------------------------------------------------+
//| VELTRION_MT5_SandboxTrader.mq5                                   |
//| Demo-only MT5 command executor for VELTRION.                     |
//| Real-account execution is intentionally rejected.                |
//+------------------------------------------------------------------+
#property strict
#property version "1.0"

#include <Trade/Trade.mqh>

input string BridgeBaseUrl = "https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/mt5-bridge";
input string BridgeToken = "";          // VELTRION bridge token; never your MT5 password
input string VeltrionUserId = "";       // VELTRION Supabase Auth user UUID
input int PollSeconds = 3;
input double MaxVolume = 0.10;
input int MaxDeviationPoints = 30;

CTrade trade;
datetime lastPoll = 0;

string JsonEscape(string s)
{
   StringReplace(s, "\\", "\\\\");
   StringReplace(s, """, "\"");
   StringReplace(s, "\r", "\\r");
   StringReplace(s, "\n", "\\n");
   return s;
}

string JStr(string s){ return """+JsonEscape(s)+"""; }
string JNum(double v){ return DoubleToString(v,8); }

string JsonStringValue(string json,string key)
{
   string needle="""+key+""";
   int p=StringFind(json,needle);
   if(p<0) return "";
   p=StringFind(json,":",p+StringLen(needle));
   if(p<0) return "";
   p++;
   while(p<StringLen(json) && (StringGetCharacter(json,p)==' ' || StringGetCharacter(json,p)=='\t')) p++;
   if(p>=StringLen(json) || StringGetCharacter(json,p)!='"') return "";
   p++;
   int e=p;
   while(e<StringLen(json))
   {
      if(StringGetCharacter(json,e)=='"' && (e==p || StringGetCharacter(json,e-1)!='\\')) break;
      e++;
   }
   return e>p?StringSubstr(json,p,e-p):"";
}

double JsonNumberValue(string json,string key)
{
   string needle="""+key+""";
   int p=StringFind(json,needle);
   if(p<0) return 0;
   p=StringFind(json,":",p+StringLen(needle));
   if(p<0) return 0;
   p++;
   while(p<StringLen(json) && (StringGetCharacter(json,p)==' ' || StringGetCharacter(json,p)=='\t')) p++;
   int e=p;
   while(e<StringLen(json))
   {
      ushort ch=StringGetCharacter(json,e);
      if((ch>='0'&&ch<='9')||ch=='-'||ch=='+'||ch=='.'||ch=='e'||ch=='E') e++;
      else break;
   }
   return StringToDouble(StringSubstr(json,p,e-p));
}

bool IsSandbox()
{
   ENUM_ACCOUNT_TRADE_MODE mode=(ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   return mode!=ACCOUNT_TRADE_MODE_REAL;
}

string CommandUrl()
{
   return BridgeBaseUrl+"/commands?user_id="+VeltrionUserId+
          "&server="+AccountInfoString(ACCOUNT_SERVER)+
          "&login="+string((long)AccountInfoInteger(ACCOUNT_LOGIN));
}

void SendResult(string commandId,string status,string ticket,double price,double profit,string errorCode,string message)
{
   string payload="{";
   payload+=""command_id":"+JStr(commandId);
   payload+=","status":"+JStr(status);
   payload+=","mt5_ticket":"+JStr(ticket);
   payload+=","price":"+JNum(price);
   payload+=","profit":"+JNum(profit);
   payload+=","error_code":"+JStr(errorCode);
   payload+=","message":"+JStr(message);
   payload+=","raw":{"retcode":"+string((long)trade.ResultRetcode())+"}";
   payload+="}";

   char data[],result[];
   string responseHeaders;
   int bytes=StringToCharArray(payload,data,0,-1,CP_UTF8);
   if(bytes>0) ArrayResize(data,bytes-1);

   string headers="Content-Type: application/json\r\nx-mt5-bridge-token: "+BridgeToken+"\r\n";
   ResetLastError();
   int code=WebRequest("POST",BridgeBaseUrl+"/command-result",headers,10000,data,result,responseHeaders);
   if(code!=200)
      Print("VELTRION command-result failed HTTP=",code," error=",GetLastError(),
            " response=",CharArrayToString(result,0,-1,CP_UTF8));
}

void ExecuteCommand(string commandJson)
{
   string commandId=JsonStringValue(commandJson,"id");
   string environment=JsonStringValue(commandJson,"environment");
   string symbol=JsonStringValue(commandJson,"symbol");
   string side=JsonStringValue(commandJson,"side");
   double volume=JsonNumberValue(commandJson,"volume");
   double sl=JsonNumberValue(commandJson,"stop_loss");
   double tp=JsonNumberValue(commandJson,"take_profit");

   if(commandId=="" || symbol=="" || side=="" || volume<=0)
      return;

   if(environment!="sandbox" || !IsSandbox())
   {
      SendResult(commandId,"REJECTED","","0",0,"REAL_EXECUTION_LOCKED","VELTRION sandbox trader rejects real-account commands.");
      return;
   }

   if(volume>MaxVolume)
   {
      SendResult(commandId,"REJECTED","","0",0,"MAX_VOLUME_EXCEEDED","Requested volume exceeds the EA safety limit.");
      return;
   }

   if(!SymbolSelect(symbol,true))
   {
      SendResult(commandId,"REJECTED","","0",0,"SYMBOL_UNAVAILABLE","MT5 could not select the requested symbol.");
      return;
   }

   trade.SetAsyncMode(false);
   trade.SetDeviationInPoints(MaxDeviationPoints);

   bool ok=false;
   if(side=="BUY")
      ok=trade.Buy(volume,symbol,0,sl,tp,"VELTRION "+commandId);
   else if(side=="SELL")
      ok=trade.Sell(volume,symbol,0,sl,tp,"VELTRION "+commandId);
   else
   {
      SendResult(commandId,"REJECTED","","0",0,"INVALID_SIDE","Only BUY and SELL are supported.");
      return;
   }

   string ticket=string((long)trade.ResultOrder());
   string msg=trade.ResultRetcodeDescription();
   string retcode=string((long)trade.ResultRetcode());

   if(ok)
      SendResult(commandId,"EXECUTED",ticket,trade.ResultPrice(),trade.ResultProfit(),retcode,msg);
   else
      SendResult(commandId,"REJECTED",ticket,trade.ResultPrice(),0,retcode,msg);
}

void PollCommands()
{
   if(BridgeToken=="" || VeltrionUserId=="") return;
   if(!IsSandbox()) return;

   char data[],result[];
   string responseHeaders;
   string headers="x-mt5-bridge-token: "+BridgeToken+"\r\n";
   ResetLastError();

   int code=WebRequest("GET",CommandUrl(),headers,10000,data,result,responseHeaders);
   if(code!=200)
   {
      Print("VELTRION command poll failed HTTP=",code," error=",GetLastError());
      return;
   }

   string response=CharArrayToString(result,0,-1,CP_UTF8);
   int p=StringFind(response,""commands":[");
   if(p<0) return;
   p=StringFind(response,"{",p);
   if(p<0) return;

   // The bridge returns commands oldest-first. Process the first claimed command.
   int depth=0;
   bool inString=false;
   int end=-1;
   for(int i=p;i<StringLen(response);i++)
   {
      ushort ch=StringGetCharacter(response,i);
      if(ch=='"' && (i==0 || StringGetCharacter(response,i-1)!='\\')) inString=!inString;
      if(inString) continue;
      if(ch=='{') depth++;
      if(ch=='}')
      {
         depth--;
         if(depth==0){ end=i; break; }
      }
   }
   if(end>p) ExecuteCommand(StringSubstr(response,p,end-p+1));
}

int OnInit()
{
   if(PollSeconds<2) PollSeconds=2;
   if(MaxVolume<=0) MaxVolume=0.10;
   EventSetTimer(PollSeconds);
   Print("VELTRION MT5 SANDBOX TRADER started.");
   Print("REAL accounts are rejected by design.");
   Print("Add this URL to MT5 WebRequest allowed URLs: ",BridgeBaseUrl);
   return(INIT_SUCCEEDED);
}

void OnTimer()
{
   PollCommands();
}

void OnDeinit(const int reason)
{
   EventKillTimer();
}

void OnTick(){}
