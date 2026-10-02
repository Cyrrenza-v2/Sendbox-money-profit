export class IdempotencyEngine {
  constructor(){ this.completed=new Map(); }
  async run(requestId,operation){
    if(!requestId) throw new Error("REQUEST_ID_REQUIRED");
    if(this.completed.has(requestId)) throw new Error("DUPLICATE_REQUEST_ID");
    const result=await operation();
    this.completed.set(requestId,result);
    return result;
  }
}
