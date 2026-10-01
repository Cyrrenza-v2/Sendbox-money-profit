const DERIV_WS_URL = "wss://api.derivws.com/trading/v1/options/ws/public";

class DerivMarketService {
  constructor() { this.ws=null; this.subscribers=new Map(); this.symbols=new Map(); this.statusListeners=new Set(); this.reconnectTimer=null; this.heartbeatTimer=null; this.manualClose=false; this.nextReqId=1; }
  onStatus(cb){ this.statusListeners.add(cb); return ()=>this.statusListeners.delete(cb); }
  setStatus(s){ this.statusListeners.forEach(cb=>cb(s)); }
  connect(){
    if(this.ws && [WebSocket.OPEN,WebSocket.CONNECTING].includes(this.ws.readyState)) return;
    this.manualClose=false; this.setStatus("CONNECTING"); this.ws=new WebSocket(DERIV_WS_URL);
    this.ws.onopen=()=>{ this.setStatus("LIVE"); this.startHeartbeat(); this.send({active_symbols:"brief",req_id:this.nextReqId++}); this.subscribeAll(); };
    this.ws.onmessage=(event)=>{ let d; try{d=JSON.parse(event.data)}catch{return} if(d.error){this.setStatus("ERROR");return}
      if(d.msg_type==="active_symbols" && Array.isArray(d.active_symbols)){ this.symbols.clear(); d.active_symbols.forEach(i=>{const code=i.underlying_symbol||i.symbol; const name=i.underlying_symbol_name||i.display_name||code; if(code)this.symbols.set(code,{code,name,market:i.market})}); this.subscribeAll(); }
      if(d.msg_type==="tick" && d.tick){const cb=this.subscribers.get(d.tick.symbol); if(cb)cb(d.tick);}
    };
    this.ws.onerror=()=>this.setStatus("ERROR");
    this.ws.onclose=()=>{this.stopHeartbeat();this.ws=null;if(!this.manualClose){this.setStatus("RECONNECTING");clearTimeout(this.reconnectTimer);this.reconnectTimer=setTimeout(()=>this.connect(),3000)}else this.setStatus("DISCONNECTED")};
  }
  subscribeTick(symbol,cb){this.subscribers.set(symbol,cb);if(this.ws?.readyState===WebSocket.OPEN)this.send({ticks:symbol,subscribe:1,req_id:this.nextReqId++});}
  subscribeAll(){if(!this.ws||this.ws.readyState!==WebSocket.OPEN)return;for(const symbol of this.subscribers.keys())this.send({ticks:symbol,subscribe:1,req_id:this.nextReqId++});}
  getSymbolByName(pattern){const n=pattern.toLowerCase();return [...this.symbols.values()].find(i=>i.name.toLowerCase().includes(n)||i.code.toLowerCase().includes(n));}
  send(p){if(this.ws?.readyState===WebSocket.OPEN)this.ws.send(JSON.stringify(p));}
  startHeartbeat(){this.stopHeartbeat();this.heartbeatTimer=setInterval(()=>this.send({ping:1}),30000)}
  stopHeartbeat(){if(this.heartbeatTimer)clearInterval(this.heartbeatTimer);this.heartbeatTimer=null}
  disconnect(){this.manualClose=true;clearTimeout(this.reconnectTimer);this.stopHeartbeat();this.ws?.close();this.ws=null}
}
export const derivMarketService=new DerivMarketService();
