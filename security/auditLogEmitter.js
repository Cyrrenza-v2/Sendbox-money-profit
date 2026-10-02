export class AuditLogEmitter {
  constructor(supabaseClient){ this.supabase=supabaseClient; }
  async logEvent(adminId,eventType,resourceId,previousState,newState,result,requestMeta={}) {
    const {error}=await this.supabase.from('audit_logs').insert([{
      admin_id:adminId,event_type:eventType,resource_id:resourceId,
      previous_state:previousState ?? null,new_state:newState ?? null,
      result:result ?? null,ip_address:requestMeta.ip || '0.0.0.0',
      device_agent:requestMeta.userAgent || 'Unknown',timestamp:new Date().toISOString()
    }]);
    if(error) throw new Error(`AUDIT_LOG_FAILED: ${error.message}`);
    return {ok:true};
  }
}
