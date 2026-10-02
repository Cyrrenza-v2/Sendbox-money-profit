import test from "node:test"; import assert from "node:assert/strict"; import {RiskEngine} from "../../backend/riskEngine.js";
test("actual risk engine blocks >500 stake",()=>{const r=new RiskEngine({emergencyStopped:false});assert.equal(r.validateOrder("REAL",{stake:501}).reason,"MAX_ORDER_SIZE");});
test("actual risk engine blocks emergency stop",()=>{const r=new RiskEngine();assert.equal(r.validateOrder("REAL",{stake:1}).reason,"EMERGENCY_STOP_ACTIVE");});
