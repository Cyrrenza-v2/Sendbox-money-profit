import test from "node:test"; import assert from "node:assert/strict"; import {BalanceLedger} from "../../backend/balanceLedger.js";
test("ledger preserves cents without float drift",()=>{const l=new BalanceLedger(0.1);l.apply({requestId:"a",amount:0.2});assert.equal(l.getBalance(),0.3);});
test("duplicate request cannot mutate ledger twice",()=>{const l=new BalanceLedger(10);l.apply({requestId:"x",amount:5});assert.throws(()=>l.apply({requestId:"x",amount:5}),/DUPLICATE_REQUEST_ID/);assert.equal(l.getBalance(),15);});
