import test from "node:test"; import assert from "node:assert/strict"; import {ReconciliationEngine} from "../../monitoring/reconciliationEngine.js";
test("reconciliation detects mismatch and requests trading pause",async()=>{const r=await new ReconciliationEngine(null).runReconciliation(100,100.02);assert.equal(r.status,"MISMATCH_DETECTED");assert.equal(r.actionTaken,"REAL_TRADING_PAUSED_AND_ALERT_EMITTED");});
test("matching balances continue",async()=>{const r=await new ReconciliationEngine(null).runReconciliation(100,100);assert.equal(r.status,"MATCH");});
