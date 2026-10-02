export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  try{
    const {requireAdmin}=await import("../../backend/authGuard.js");
    const {SecureOrderProcessor}=await import("../../backend/secureOrderProcessor.js");
    const {RealExecutionEngine}=await import("../../backend/realExecutionEngine.js");
    const {riskEngine}=await import("../../backend/riskEngine.js");
    const auth=await requireAdmin(req);
    if(process.env.REAL_TRADING_ENABLED!=="true") return res.status(503).json({error:"REAL_TRADING_DISABLED"});
    const body=typeof req.body==="object"?req.body:JSON.parse(req.body||"{}");
    if(body.mode!=="REAL"||body.confirmation!=="EXPLICIT") return res.status(400).json({error:"EXPLICIT_REAL_CONFIRMATION_REQUIRED"});
    const processor=new SecureOrderProcessor({
      realExecutor:async ({order})=>{
        const risk=riskEngine.validateOrder("REAL",{...order,amount:order.stake});
        if(!risk.allowed){const e=new Error(risk.reason);e.statusCode=409;throw e;}
        return new RealExecutionEngine().submitRealOrder({amount:order.stake,symbol:order.symbol,side:order.side,duration:order.duration,durationUnit:order.durationUnit,currency:order.currency});
      },
      isRealTradingEnabled:()=>process.env.REAL_TRADING_ENABLED==="true"
    });
    const result=await processor.process({auth,params:{...body,stake:body.amount,mode:"REAL"},confirmation:true});
    return res.status(200).json(result);
  }catch(error){ return res.status(Number(error.statusCode)||((error.code==="VALIDATION_FAILED")?400:500)).json({error:error.message||"INTERNAL_ERROR"}); }
}
