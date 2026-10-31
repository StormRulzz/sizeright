(function () {
  const { compute, ASSETS, FUTURES } = window.SizeRight;
  const $ = (id) => document.getElementById(id);
  const FIELDS = ['balance', 'risk', 'entry', 'stop', 'target', 'fee', 'pointValue', 'step', 'contract'];
  const KEY = 'sizeright.v1';

  // Per-asset inputs are kept separately so switching tabs doesn't wipe prices.
  const defaults = () => ({
    asset: 'stock', riskMode: 'pct', shared: { balance: '', risk: '1' },
    perAsset: {
      stock: { fee: '' }, crypto: { fee: '0.1', step: '0.001' }, forex: { fee: '' },
      futures: { fee: '', contract: 'ES', pointValue: '50' },
    },
  });

  let state = load();

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.perAsset) return Object.assign(defaults(), s);
    } catch (e) {}
    return defaults();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  // Futures contract dropdown
  $('contract').innerHTML = FUTURES.map(f => `<option value="${f.sym}">${f.sym} — ${f.name}</option>`).join('')
    + '<option value="custom">Custom…</option>';

  const num = (v) => {
    const n = parseFloat(String(v).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : NaN;
  };

  function money(n) {
    const abs = Math.abs(n);
    const d = abs >= 1000 ? 0 : 2;
    return (n < 0 ? '-$' : '$') + abs.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function price(n) {
    const abs = Math.abs(n);
    const d = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
    return (+n.toFixed(d)).toLocaleString(undefined, { maximumFractionDigits: d });
  }
  function qtyText(q, asset) {
    if (asset === 'crypto') return (+q.toFixed(8)).toLocaleString(undefined, { maximumFractionDigits: 8 });
    return q.toLocaleString();
  }

  function fieldValue(id) {
    if (id === 'balance' || id === 'risk') return state.shared[id] ?? '';
    return state.perAsset[state.asset][id] ?? '';
  }

  function render() {
    const asset = state.asset;
    document.querySelectorAll('#assetTabs button').forEach(b =>
      b.setAttribute('aria-selected', String(b.dataset.asset === asset)));
    document.querySelectorAll('#riskMode button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.mode === state.riskMode)));
    $('risk').placeholder = state.riskMode === 'pct' ? '1' : '100';

    $('futuresBox').hidden = asset !== 'futures';
    $('cryptoBox').hidden = asset !== 'crypto';
    $('forexNote').hidden = asset !== 'forex';
    $('feeLabel').textContent = ASSETS[asset].feeKind === 'usd' ? 'Round-trip fee per contract ($)' : 'Fee per side (%)';
    $('fee').placeholder = asset === 'futures' ? '2.50' : asset === 'crypto' ? '0.1' : '0';
    const ph = { stock: ['50.00', '48.00', '56.00'], crypto: ['60000', '58800', '63600'],
      forex: ['1.0850', '1.0820', '1.0940'], futures: ['5000', '4990', '5030'] }[asset];
    ['entry', 'stop', 'target'].forEach((id, k) => $(id).placeholder = ph[k]);

    FIELDS.forEach(id => {
      const el = $(id);
      if (document.activeElement !== el) el.value = fieldValue(id);
    });
    $('pointValue').readOnly = asset === 'futures' && state.perAsset.futures.contract !== 'custom';

    update();
  }

  function update() {
    const p = state.perAsset[state.asset];
    const r = compute({
      asset: state.asset, riskMode: state.riskMode,
      balance: num(state.shared.balance), risk: num(state.shared.risk),
      entry: num(p.entry), stop: num(p.stop), target: num(p.target), fee: num(p.fee),
      pointValue: num(p.pointValue), step: num(p.step),
    });

    const msgs = [];
    if (r.errors.length) {
      $('qty').textContent = '—';
      $('unit').textContent = '';
      $('side').textContent = '';
      $('side').className = 'side';
      $('stats').innerHTML = '';
      $('copy').hidden = true;
      msgs.push(`<li class="err">${r.errors[0]}</li>`);
      $('msgs').innerHTML = msgs.join('');
      lastSummary = '';
      return;
    }

    $('qty').textContent = qtyText(r.qty, state.asset);
    $('unit').textContent = state.asset === 'forex' && r.qty ? `units · ${(r.qty / 100000).toFixed(2)} lots` : r.unit;
    $('side').textContent = r.long ? 'LONG' : 'SHORT';
    $('side').className = 'side ' + (r.long ? 'long' : 'short');

    const stats = [
      ['Loss at stop', `${money(r.riskAtStop)} <small>(${r.riskPctOfAccount.toFixed(2)}%)</small>`],
      ['Position value', money(r.notional)],
      ['Stop distance', `${r.stopPct.toFixed(2)}%`],
      ['Breakeven', price(r.breakeven)],
    ];
    if (r.rr !== undefined) {
      stats.push(['Reward : risk', `${r.rr.toFixed(2)} R`]);
      stats.push(['Profit at target', money(r.reward)]);
      stats.push(['Win rate to break even', `${r.winRateNeeded.toFixed(1)}%`]);
      stats.push(['Leverage', `${r.leverage.toFixed(2)}×`]);
    } else {
      stats.push(['Leverage', `${r.leverage.toFixed(2)}×`]);
      stats.push(['Fees at stop', money(r.feesAtStop)]);
    }
    let html = stats.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
    html += `<div class="stat wide"><span>Take-profit ladder</span><div class="ladder">${
      r.ladder.map(l => `<span class="r">${l.r}R</span><span>${price(l.price)}</span><span class="pnl">+${money(l.pnl).replace('-', '')}</span>`).join('')
    }</div></div>`;
    $('stats').innerHTML = html;

    r.warnings.forEach(w => msgs.push(`<li class="warn">${w}</li>`));
    $('msgs').innerHTML = msgs.join('');
    $('copy').hidden = false;

    lastSummary = [
      `${r.long ? 'LONG' : 'SHORT'} ${qtyText(r.qty, state.asset)} ${r.unit}`,
      `Entry ${p.entry} · Stop ${p.stop}${p.target ? ' · Target ' + p.target : ''}`,
      `Risk ${money(r.riskAtStop)} (${r.riskPctOfAccount.toFixed(2)}%)${r.rr !== undefined ? ` · ${r.rr.toFixed(2)}R` : ''}`,
    ].join('\n');
  }
  let lastSummary = '';

  // --- events
  $('form').addEventListener('input', (e) => {
    const id = e.target.id;
    if (!FIELDS.includes(id)) return;
    const v = e.target.value;
    if (id === 'balance' || id === 'risk') state.shared[id] = v;
    else state.perAsset[state.asset][id] = v;

    if (id === 'contract') {
      const f = FUTURES.find(x => x.sym === v);
      if (f) state.perAsset.futures.pointValue = String(f.pv);
      render();
    } else if (id === 'pointValue') {
      state.perAsset.futures.contract = 'custom';
      $('contract').value = 'custom';
      update();
    } else {
      update();
    }
    save();
  });

  $('assetTabs').addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.asset;
    if (!a) return;
    state.asset = a;
    save(); render();
  });

  $('riskMode').addEventListener('click', (e) => {
    const m = e.target.closest('button')?.dataset.mode;
    if (!m || m === state.riskMode) return;
    state.riskMode = m;
    state.shared.risk = '';
    save(); render();
    $('risk').focus();
  });

  $('reset').addEventListener('click', () => {
    const keepBalance = state.shared.balance;
    const p = state.perAsset[state.asset];
    p.entry = p.stop = p.target = '';
    state.shared.balance = keepBalance;
    save(); render();
    $('entry').focus();
  });

  $('copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(lastSummary);
      $('copy').textContent = 'Copied ✓';
    } catch (e) {
      $('copy').textContent = 'Copy failed';
    }
    setTimeout(() => $('copy').textContent = 'Copy summary', 1500);
  });

  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
