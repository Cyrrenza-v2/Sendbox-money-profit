//+------------------------------------------------------------------+
//| VELTRION_MT5_ReadOnly.mq5                                       |
//| Read-only MT5 telemetry bridge. NEVER places/modifies trades.   |
//+------------------------------------------------------------------+
#property strict
#property version "1.0"
#property description "VELTRION read-only MT5 account/positions/orders/history bridge"

input string BridgeUrl = "https://qalowxnqngzsdlayqivr.supabase.co/functions/v1/mt5-bridge/heartbeat";
input string BridgeToken = "";          // VELTRION bridge token; never your MT5 password
input string VeltrionUserId = "";       // Your VELTRION Supabase Auth user UUID
input int HeartbeatSeconds = 5;
input int HistoryDays = 30;
input int MaxHistoryRows = 100;

string JsonEscape(string s)
{
   StringReplace(s,"\\","\\\\");
   StringReplace(s,""","\\"");
   StringReplace(s,"\r","\\r");
   StringReplace(s,"\n","\\n");
   return s;
}
string JStr(string s){ return """ + JsonEscape(s) + """; }
string JNum(double v){ return DoubleToString(v,8); }
string JTime(datetime t){ return JStr(TimeToString(t,TIME_DATE|TIME_SECONDS)); }

string PositionJson()
{
   string out="[";
   for(int i=0;i<PositionsTotal();i++)
   {
      ulong ticket=PositionGetTicket(i); if(ticket==0) continue;
      if(i>0) out+=",";
      out+="{";
      out+=""ticket":"+string((long)ticket);
      out+=","symbol":"+JStr(PositionGetString(POSITION_SYMBOL));
      out+=","type":"+string((long)PositionGetInteger(POSITION_TYPE));
      out+=","volume":"+JNum(PositionGetDouble(POSITION_VOLUME));
      out+=","price_open":"+JNum(PositionGetDouble(POSITION_PRICE_OPEN));
      out+=","price_current":"+JNum(PositionGetDouble(POSITION_PRICE_CURRENT));
      out+=","sl":"+JNum(PositionGetDouble(POSITION_SL));
      out+=","tp":"+JNum(PositionGetDouble(POSITION_TP));
      out+=","profit":"+JNum(PositionGetDouble(POSITION_PROFIT));
      out+=","swap":"+JNum(PositionGetDouble(POSITION_SWAP));
      out+=","magic":"+string((long)PositionGetInteger(POSITION_MAGIC));
      out+=","time":"+JTime((datetime)PositionGetInteger(POSITION_TIME));
      out+="}";
   }
   return out+"]";
}
string ActiveOrdersJson()
{
   string out="[";
   bool first=true;
   for(int i=0;i<OrdersTotal();i++)
   {
      ulong ticket=OrderGetTicket(i); if(ticket==0) continue;
      if(!first) out+=",";
      first=false;
      out+="{";
      out+=""ticket":"+string((long)ticket);
      out+=","symbol":"+JStr(OrderGetString(ORDER_SYMBOL));
      out+=","type":"+string((long)OrderGetInteger(ORDER_TYPE));
      out+=","state":"+string((long)OrderGetInteger(ORDER_STATE));
      out+=","volume_initial":"+JNum(OrderGetDouble(ORDER_VOLUME_INITIAL));
      out+=","volume_current":"+JNum(OrderGetDouble(ORDER_VOLUME_CURRENT));
      out+=","price_open":"+JNum(OrderGetDouble(ORDER_PRICE_OPEN));
      out+=","sl":"+JNum(OrderGetDouble(ORDER_SL));
      out+=","tp":"+JNum(OrderGetDouble(ORDER_TP));
      out+=","time_setup":"+JTime((datetime)OrderGetInteger(ORDER_TIME_SETUP));
      out+="}";
   }
   return out+"]";
}
string HistoryOrdersJson(datetime from,datetime to)
{
   if(!HistorySelect(from,to)) return "[]";
   string out="[";
   bool first=true;
   int total=HistoryOrdersTotal(),start=MathMax(0,total-MaxHistoryRows);
   for(int i=start;i<total;i++)
   {
      ulong ticket=HistoryOrderGetTicket(i); if(ticket==0) continue;
      if(!first) out+=",";
      first=false;
      out+="{";
      out+=""ticket":"+string((long)ticket);
      out+=","symbol":"+JStr(HistoryOrderGetString(ticket,ORDER_SYMBOL));
      out+=","type":"+string((long)HistoryOrderGetInteger(ticket,ORDER_TYPE));
      out+=","state":"+string((long)HistoryOrderGetInteger(ticket,ORDER_STATE));
      out+=","volume_initial":"+JNum(HistoryOrderGetDouble(ticket,ORDER_VOLUME_INITIAL));
      out+=","price_open":"+JNum(HistoryOrderGetDouble(ticket,ORDER_PRICE_OPEN));
      out+=","sl":"+JNum(HistoryOrderGetDouble(ticket,ORDER_SL));
      out+=","tp":"+JNum(HistoryOrderGetDouble(ticket,ORDER_TP));
      out+=","time_setup":"+JTime((datetime)HistoryOrderGetInteger(ticket,ORDER_TIME_SETUP));
      out+=","time_done":"+JTime((datetime)HistoryOrderGetInteger(ticket,ORDER_TIME_DONE));
      out+="}";
   }
   return out+"]";
}
string HistoryDealsJson(datetime from,datetime to)
{
   if(!HistorySelect(from,to)) return "[]";
   string out="[";
   bool first=true;
   int total=HistoryDealsTotal(),start=MathMax(0,total-MaxHistoryRows);
   for(int i=start;i<total;i++)
   {
      ulong ticket=HistoryDealGetTicket(i); if(ticket==0) continue;
      if(!first) out+=",";
      first=false;
      out+="{";
      out+=""ticket":"+string((long)ticket);
      out+=","order":"+string((long)HistoryDealGetInteger(ticket,DEAL_ORDER));
      out+=","position_id":"+string((long)HistoryDealGetInteger(ticket,DEAL_POSITION_ID));
      out+=","symbol":"+JStr(HistoryDealGetString(ticket,DEAL_SYMBOL));
      out+=","type":"+string((long)HistoryDealGetInteger(ticket,DEAL_TYPE));
      out+=","entry":"+string((long)HistoryDealGetInteger(ticket,DEAL_ENTRY));
      out+=","volume":"+JNum(HistoryDealGetDouble(ticket,DEAL_VOLUME));
      out+=","price":"+JNum(HistoryDealGetDouble(ticket,DEAL_PRICE));
      out+=","profit":"+JNum(HistoryDealGetDouble(ticket,DEAL_PROFIT));
      out+=","commission":"+JNum(HistoryDealGetDouble(ticket,DEAL_COMMISSION));
      out+=","swap":"+JNum(HistoryDealGetDouble(ticket,DEAL_SWAP));
      out+=","fee":"+JNum(HistoryDealGetDouble(ticket,DEAL_FEE));
      out+=","time":"+JTime((datetime)HistoryDealGetInteger(ticket,DEAL_TIME));
      out+="}";
   }
   return out+"]";
}
void SendSnapshot()
{
   if(BridgeToken=="" || VeltrionUserId=="")
   {
      Print("VELTRION bridge: configure BridgeToken and VeltrionUserId. MT5 password is NOT required.");
      return;
   }

   datetime to=TimeCurrent(),from=to-(HistoryDays*86400);
   ENUM_ACCOUNT_TRADE_MODE mode=(ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   string environment=(mode==ACCOUNT_TRADE_MODE_REAL)?"real":"sandbox";
   string payload="{";
   payload+=""user_id":"+JStr(VeltrionUserId);
   payload+=","broker":"+JStr(AccountInfoString(ACCOUNT_COMPANY));
   payload+=","server":"+JStr(AccountInfoString(ACCOUNT_SERVER));
   payload+=","login":"+string((long)AccountInfoInteger(ACCOUNT_LOGIN));
   payload+=","account_currency":"+JStr(AccountInfoString(ACCOUNT_CURRENCY));
   payload+=","environment":"+JStr(environment);
   payload+=","terminal_connected":true";
   payload+=","balance":"+JNum(AccountInfoDouble(ACCOUNT_BALANCE));
   payload+=","equity":"+JNum(AccountInfoDouble(ACCOUNT_EQUITY));
   payload+=","margin":"+JNum(AccountInfoDouble(ACCOUNT_MARGIN));
   payload+=","free_margin":"+JNum(AccountInfoDouble(ACCOUNT_MARGIN_FREE));
   payload+=","margin_level":"+JNum(AccountInfoDouble(ACCOUNT_MARGIN_LEVEL));
   payload+=","positions":"+PositionJson();
   payload+=","orders":"+ActiveOrdersJson();
   payload+=","history_orders":"+HistoryOrdersJson(from,to);
   payload+=","history_deals":"+HistoryDealsJson(from,to);
   payload+=","deals":[]";
   payload+="}";

   char data[],result[]; string responseHeaders;
   int bytes=StringToCharArray(payload,data,0,-1,CP_UTF8); ArrayResize(data,bytes-1);
   string headers="Content-Type: application/json\r\nx-mt5-bridge-token: "+BridgeToken+"\r\n";
   ResetLastError();
   int code=WebRequest("POST",BridgeUrl,headers,10000,data,result,responseHeaders);
   if(code==200)
      Print("VELTRION bridge heartbeat OK: ",CharArrayToString(result,0,-1,CP_UTF8));
   else
      Print("VELTRION bridge heartbeat failed. HTTP=",code," MT5Error=",GetLastError()," Response=",CharArrayToString(result,0,-1,CP_UTF8));
}
int OnInit()
{
   if(HeartbeatSeconds<2) HeartbeatSeconds=2;
   EventSetTimer(HeartbeatSeconds);
   Print("VELTRION MT5 read-only bridge started. No trading functions are used.");
   SendSnapshot();
   return(INIT_SUCCEEDED);
}
void OnTimer(){ SendSnapshot(); }
void OnDeinit(const int reason){ EventKillTimer(); }
void OnTick(){ }
