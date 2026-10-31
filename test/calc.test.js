const test = require('node:test');
const assert = require('node:assert');
const { compute, roundQty } = require('../calc.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('stock long, 1% of 10k, no fees', () => {
  const r = compute({ asset: 'stock', balance: 10000, riskMode: 'pct', risk: 1, entry: 50, stop: 48 });
  assert.equal(r.errors.length, 0);
  assert.equal(r.long, true);
  assert.equal(r.qty, 50);              // $100 / $2
  near(r.riskAtStop, 100);
  near(r.notional, 2500);
  near(r.ladder[1].price, 54);
});

test('rounds down so risk never exceeds budget', () => {
  const r = compute({ asset: 'stock', balance: 10000, riskMode: 'usd', risk: 100, entry: 50, stop: 47 });
  assert.equal(r.qty, 33);
  assert.ok(r.riskAtStop <= 100);
});

test('short detected and target R:R', () => {
  const r = compute({ asset: 'stock', balance: 10000, riskMode: 'usd', risk: 100, entry: 100, stop: 105, target: 90 });
  assert.equal(r.long, false);
  assert.equal(r.qty, 20);
  near(r.rr, 2);
  near(r.winRateNeeded, 100 / 3);
});

test('crypto fractional with fees included in risk', () => {
  const r = compute({ asset: 'crypto', balance: 1000, riskMode: 'usd', risk: 10, entry: 100, stop: 99, fee: 0.1, step: 0.001 });
  // loss per coin = 1 + (100+99)*0.001 = 1.199
  near(r.qty, 8.34, 1e-9);
  assert.ok(r.riskAtStop <= 10);
  near(r.breakeven, 100 * 1.001 / 0.999);
});

test('futures uses point value and $ per contract fee', () => {
  const r = compute({ asset: 'futures', balance: 50000, riskMode: 'usd', risk: 500, entry: 5000, stop: 4990, pointValue: 5, fee: 2 });
  // loss per contract = 10*5 + 2 = 52
  assert.equal(r.qty, 9);
  near(r.riskAtStop, 468);
  near(r.breakeven, 5000.4);
});

test('forex rounds to micro lots', () => {
  assert.equal(roundQty(12345.6, 'forex'), 12000);
});

test('validation errors', () => {
  assert.ok(compute({ asset: 'stock', balance: 0, risk: 1, entry: 1, stop: 1 }).errors.length > 0);
  assert.deepEqual(compute({ asset: 'stock', balance: 100, riskMode: 'pct', risk: 1, entry: 5, stop: 5 }).errors, ['Stop must differ from entry.']);
});

test('warns when budget too small for one unit', () => {
  const r = compute({ asset: 'stock', balance: 100, riskMode: 'pct', risk: 1, entry: 500, stop: 490 });
  assert.equal(r.qty, 0);
  assert.ok(r.warnings.some(w => w.includes('too small')));
});
