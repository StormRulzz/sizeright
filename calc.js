// Pure position-sizing math. Works in the browser (window.SizeRight) and in Node (module.exports) for tests.
(function (root) {
  const ASSETS = {
    stock:   { label: 'Stocks',  unit: 'shares',    feeKind: 'pct' },
    crypto:  { label: 'Crypto',  unit: 'coins',     feeKind: 'pct' },
    forex:   { label: 'Forex',   unit: 'units',     feeKind: 'pct' },
    futures: { label: 'Futures', unit: 'contracts', feeKind: 'usd' },
  };

  const FUTURES = [
    { sym: 'ES',  name: 'E-mini S&P 500',  pv: 50 },
    { sym: 'MES', name: 'Micro S&P 500',   pv: 5 },
    { sym: 'NQ',  name: 'E-mini Nasdaq',   pv: 20 },
    { sym: 'MNQ', name: 'Micro Nasdaq',    pv: 2 },
    { sym: 'YM',  name: 'E-mini Dow',      pv: 5 },
    { sym: 'RTY', name: 'E-mini Russell',  pv: 50 },
    { sym: 'CL',  name: 'Crude Oil',       pv: 1000 },
    { sym: 'MCL', name: 'Micro Crude',     pv: 100 },
    { sym: 'GC',  name: 'Gold',            pv: 100 },
    { sym: 'MGC', name: 'Micro Gold',      pv: 10 },
  ];

  // Round quantity DOWN to what the asset allows, so real risk never exceeds the budget.
  function roundQty(raw, asset, step) {
    if (asset === 'stock' || asset === 'futures') return Math.floor(raw);
    if (asset === 'forex') return Math.floor(raw / 1000) * 1000; // micro lots
    const s = step > 0 ? step : 1e-8;
    return Math.floor(raw / s + 1e-9) * s;
  }

  function compute(i) {
    const out = { errors: [], warnings: [] };
    const asset = ASSETS[i.asset] ? i.asset : 'stock';
    const mult = asset === 'futures' ? +i.pointValue : 1;
    const { balance, risk, entry, stop } = i;
    const target = i.target > 0 ? i.target : null;
    const fee = i.fee > 0 ? i.fee : 0;

    if (!(balance > 0)) out.errors.push('Enter your account balance.');
    if (!(risk > 0)) out.errors.push('Enter how much you want to risk.');
    if (!(entry > 0)) out.errors.push('Enter an entry price.');
    if (!(stop > 0)) out.errors.push('Enter a stop-loss price.');
    if (asset === 'futures' && !(mult > 0)) out.errors.push('Enter the contract point value.');
    if (out.errors.length) return out;
    if (stop === entry) { out.errors.push('Stop must differ from entry.'); return out; }

    const long = stop < entry;
    const dist = Math.abs(entry - stop);
    const riskBudget = i.riskMode === 'usd' ? risk : balance * risk / 100;
    if (riskBudget > balance) out.warnings.push('You are risking more than your whole account.');
    else if (riskBudget / balance > 0.05) out.warnings.push('Risking over 5% of the account on one trade.');

    // Round-trip fees per unit: percent of notional on each side, or a flat $ per contract.
    const feeKind = ASSETS[asset].feeKind;
    const feesPerUnit = (exitPx) => feeKind === 'usd' ? fee : (entry + exitPx) * mult * fee / 100;

    const lossPerUnit = dist * mult + feesPerUnit(stop);
    const rawQty = riskBudget / lossPerUnit;
    const qty = roundQty(rawQty, asset, i.step);

    out.long = long;
    out.riskBudget = riskBudget;
    out.rawQty = rawQty;
    out.qty = qty;
    out.unit = ASSETS[asset].unit;
    out.notional = qty * entry * mult;
    out.riskAtStop = qty * lossPerUnit;
    out.feesAtStop = qty * feesPerUnit(stop);
    out.riskPctOfAccount = out.riskAtStop / balance * 100;
    out.leverage = out.notional / balance;
    out.stopPct = dist / entry * 100;

    if (qty <= 0) out.warnings.push(`Risk budget is too small for 1 ${out.unit.replace(/s$/, '')} at this stop.`);
    if (out.leverage > 1) out.warnings.push(`Position is ${out.leverage.toFixed(1)}× your balance — needs margin/leverage.`);

    // Breakeven exit price after round-trip fees.
    if (feeKind === 'usd') {
      out.breakeven = long ? entry + fee / mult : entry - fee / mult;
    } else {
      const f = fee / 100;
      out.breakeven = long ? entry * (1 + f) / (1 - f) : entry * (1 - f) / (1 + f);
    }

    out.ladder = [1, 2, 3].map(k => {
      const px = long ? entry + k * dist : entry - k * dist;
      return { r: k, price: px, pnl: qty * (dist * k * mult - feesPerUnit(px)) };
    });

    if (target !== null) {
      if (long ? target <= entry : target >= entry) {
        out.warnings.push(`Target should be ${long ? 'above' : 'below'} entry for a ${long ? 'long' : 'short'}.`);
      } else {
        out.reward = qty * (Math.abs(target - entry) * mult - feesPerUnit(target));
        out.rr = out.riskAtStop > 0 ? out.reward / out.riskAtStop : 0;
        out.winRateNeeded = out.rr > 0 ? 100 / (1 + out.rr) : null;
      }
    }
    return out;
  }

  const api = { compute, roundQty, ASSETS, FUTURES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SizeRight = api;
})(typeof window !== 'undefined' ? window : globalThis);
