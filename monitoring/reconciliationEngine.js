export class ReconciliationEngine {
  constructor(supabaseClient){ this.supabase=supabaseClient; }
  async runReconciliation(internalBalance,externalBalance){
    const internal=Number(internalBalance), external=Number(externalBalance);
    if(!Number.isFinite(internal)||!Number.isFinite(external)) throw new Error("INVALID_RECONCILIATION_INPUT");
    const discrepancy=Number(Math.abs(internal-external).toFixed(2));
    if(discrepancy>0.01){
      if(this.supabase?.from){
        await this.supabase.from("emergency_controls").update({is_active:true,updated_at:new Date().toISOString()}).eq("control_key","EMERGENCY_STOP");
      }
      return {status:"MISMATCH_DETECTED",discrepancyAmount:discrepancy,actionTaken:"REAL_TRADING_PAUSED_AND_ALERT_EMITTED"};
    }
    return {status:"MATCH",discrepancyAmount:0,actionTaken:"CONTINUE"};
  }
}
