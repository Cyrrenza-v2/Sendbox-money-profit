import test from "node:test"; import assert from "node:assert/strict"; import {calculatePnl} from "../../backend/pnlCalculator.js";
test("BUY profit scales by lot size",()=>assert.equal(calculatePnl({side:"BUY",entryPrice:1.1,exitPrice:1.101,quantity:1}),100));
test("SELL loss is negative",()=>assert.equal(calculatePnl({side:"SELL",entryPrice:1.1,exitPrice:1.101,quantity:1}),-100));
test("P/L is rounded to cents",()=>assert.equal(calculatePnl({side:"BUY",entryPrice:1.1,exitPrice:1.100001,quantity:1}),0.10));
