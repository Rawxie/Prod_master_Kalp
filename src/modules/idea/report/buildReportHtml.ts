/* eslint-disable */
// @ts-nocheck
// Port of the Productica / Syncoro "Idea Validation Report" template.
// Pure string rendering: parsed report data in -> standalone HTML document out.
// The document is shown in an isolated iframe (see ReportFrame) so the template
// looks identical regardless of the site's Tailwind/global styles.
import reportCss from './report.css?raw';

const E = s => (s == null || s === '' ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
const esc = o => (typeof o == 'string' ? E(o) : Array.isArray(o) ? o.map(esc) : o && typeof o == 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, esc(v)])) : o);

const HELP = {
  iq: 'Our overall score for the idea, out of 10. We rate five areas and weight them into one number. Below 6.5 means: test more before you build.',
  verdict: 'The short version: the strongest reasons this could succeed, and the biggest reasons it could fail.',
  clarity: 'We took your original idea and narrowed it to the version most likely to work: one clear customer, one clear problem.',
  lens: 'Maps how the idea creates value and where it meets a real buyer: the venture signature, the buyer path, fit signals, the claim that matters most and the next test.',
  segments: 'Not everyone is your first customer. This ranks groups by how much the problem hurts them, whether they will pay, and how easy they are to reach.',
  market: 'TAM is everyone who could ever use it. SAM is the part you can realistically serve. SOM is the slice you can actually win first.',
  competition: 'Who already solves this problem, what they do well, and where they leave a gap you can fill.',
  'lean-canvas': 'Your whole business on one page: the problem, your solution, who buys, how you reach them, and how money comes in and goes out.',
  risks: 'The beliefs that must be true for this to work, ranked by danger, plus short stories of how it could fail so you can prevent them.',
  readiness: 'Three checkpoints: ready to sell, ready to grow, ready to raise money. Each is scored out of 5.',
  score: 'The final summary: overall ratings, our honest verdict and what to do next.',
  help: 'How Productica and Syncoro can support you, from first idea through to scale.',
};

const gauge = (s, u) => {
  const P = (v, r) => { const g = Math.PI * (1 + v / 10); return [(320 + r * Math.cos(g)).toFixed(1), (270 + r * Math.sin(g)).toFixed(1)]; };
  const [x1, y1] = P(6.5, 184), [x2, y2] = P(6.5, 216), arc = 'M 120 270 A 200 200 0 0 1 520 270';
  return `<div class="iq-cockpit"><svg viewBox="60 14 520 286" aria-label="Syncoro IQ ${s.toFixed(1)} of 10">
<path d="${arc}" class="iq-track"/><path d="${arc}" class="iq-fill" pathLength="100" style="stroke-dasharray:${s * 10} 100"/>
${[0, 2, 4, 6, 8, 10].map(v => { const [x, y] = P(v, 242); return `<text x="${x}" y="${y}" class="iq-tick" text-anchor="middle" dominant-baseline="middle">${v}</text>`; }).join('')}
<g class="iq-build-mark"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/></g></svg>
<div class="iq-score-overlay"><strong>${s.toFixed(1)}</strong><span>SYNCORO IQ / 10</span></div></div>`;
};

const sec = (id, h, lead, b) => {
  const x = HELP[id];
  return `<section id="${id}"><div class="wrap"><div class="sh"><h2>${h}${x ? `<button class="qm" type="button" aria-expanded="false" aria-controls="qx-${id}" aria-label="What does this section mean?">?</button>` : ''}</h2>${x ? `<div class="qx" id="qx-${id}"><div><p>${x}</p></div></div>` : ''}</div>${lead ? `<p class="lead">${lead}</p>` : ''}${b}</div></section>`;
};
const gx = (a, c = '') => `<div class="gx ${c}">${a.join('')}</div>`;
const card = (b, c = '') => `<div class="card ${c}">${b}</div>`;
const bar = (l, p, n, c = 'c1', i = 0) => `<div class="bar"><span>${l}</span><div class="t"><i class="${c}" style="--p:${p}%;--d:${i * 0.12}s"></i></div><b class="n cn">${n}</b></div>`;
const ring = (p, n, l) => `<div class="card rg"><svg viewBox="0 0 36 36"><circle class="bk" cx="18" cy="18" r="15.9" pathLength="100"/><circle class="f" cx="18" cy="18" r="15.9" pathLength="100" style="--p:${p}"/></svg><div><b class="big${String(n).includes('/') ? '' : ' cn'}">${n}</b><div class="lab">${l}</div></div></div>`;
const dots = (v, m = 5) => `<span class="dots">${Array.from({ length: m }, (_, i) => `<i${i < v ? ' class="f"' : ''} style="--d:${i * 0.08}s"></i>`).join('')}</span>`;
const tbl = (h, r, cls = '') => `<div class="ts"><table class="${cls}"><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${r.map(x => `<tr>${x.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
const list = a => `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>`;

const SIG = {
  aligned: ['good', 't-yes', 'tag-good', '✓', 'Aligned'],
  mixed: ['up', 't-mid', 'tag-watch', '◐', 'Mixed'],
  friction: ['bad', 't-no', 'tag-focus', '!', 'Friction'],
  unknown: ['mu', 't-unk', 'tag-unk', '?', 'Unknown'],
};
const SIG_ALIAS = { neutral: 'mixed' };
const cap = w => String(w || '').charAt(0).toUpperCase() + String(w || '').slice(1);
// styling comes from the signal family, the label is always the agent's own word
const sigOf = s => { const k = String(s || '').toLowerCase().trim(); const base = SIG[SIG_ALIAS[k] || k] || SIG.unknown; return [base[0], base[1], base[2], base[3], cap(k) || base[4]]; };

export function buildReportBody(R, opts = {}) {
  const D = esc(R || {});
  const q = D.q || [];
  const r1 = x => Math.round((x + 1e-9) * 10) / 10;
  const av = l => { l = l.filter(x => x != null && !isNaN(x)); return l.length ? l.reduce((s, x) => s + x, 0) / l.length : 0; };
  q.forEach(r => {
    if ((r[2] == null || isNaN(r[2])) && Array.isArray(r[4]) && r[4].length) r[2] = r1(av(r[4].map(x => +x[1])));
    if ((r[3] == null || isNaN(r[3])) && Array.isArray(r[4]) && r[4].length) r[3] = r1(av(r[4].map(x => +x[2])));
  });
  const f = i => r1(q.reduce((s, r) => s + r[1] * r[i], 0));
  const finite = n => n != null && n !== '' && !isNaN(+n);
  const a = finite(D.iq && D.iq.today) ? +D.iq.today : (q.length ? f(2) : 0);
  const b = finite(D.iq && D.iq.upside) ? +D.iq.upside : (q.length ? f(3) : a);
  const mn = q.length ? Math.min(...q.map(r => r[2])) : 0;
  const pf = +D.proof || 0;
  const Vcalc = a < 3.5 ? 'Park' : (a < 5 || mn < 4) ? 'Pivot' : (a >= 6.5 && pf >= 3) ? 'Build' : 'Test first';
  const norm = { build: 'Build', 'test first': 'Test first', pivot: 'Pivot', park: 'Park' };
  const vRaw = String(D.verdict || '').toLowerCase().trim();
  const V = norm[vRaw] || (vRaw ? cap(vRaw) : Vcalc); // the agent's verdict wins; computed only when absent
  const vc = /^build/.test(V.toLowerCase()) ? 'good' : /^test/.test(V.toLowerCase()) ? 'up' : 'bad';
  const vchip = vc == 'good' ? 'g' : vc == 'up' ? 'u' : 'b';
  const SC = (D.score && D.score.length) ? D.score : [];
  const dateStr = D.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const hero = `<header class="hero"><div class="wrap"><div><span class="pill ${vc}">Verdict: ${V}</span><h1>${D.name}</h1><p class="th">${D.sub || ''}</p></div>
<div class="card hero-gauge"><div class="hg-head"><span class="eyebrow">Syncoro IQ · Venture Diagnostic</span><span class="chip ${vchip}">${V}</span></div>${gauge(a, b)}</div>
</div></header>`;


  const S = [];

  // 1. SYNCORO IQ TEST
  if (q.length) S.push(() => {
    const rows = r => `<div class="iq-quotient"><div class="iq-qhead"><h3>${r[0]} Quotient</h3><div class="iq-qscore">${(+r[2]).toFixed(1)}<small> / 10</small></div></div>${(r[4] || []).map(x => `<div class="iq-row"><span>${x[0]}</span><span class="iq-dots">${Array.from({ length: 10 }, (_, k) => `<i class="${k < +x[1] ? 'on' : ''}"></i>`).join('')}</span><span class="iq-evidence">${x[3] || ''}</span></div>`).join('')}</div>`;
    return sec('iq', 'Syncoro IQ Test', 'Five quotients, weighted into one score. The meter at the top of the report shows the result.',
      `<div class="iq-shell"><div class="iq-hero"><div class="iq-topline"><div><span class="eyebrow">Syncoro IQ · Venture Diagnostic</span><p class="sm" style="margin-top:6px;max-width:56ch">The score separates what is attractive on paper from what has enough empirical evidence to deserve founder capital.${D.proofLabel ? ` Current proof level: <b>${D.proofLabel}</b>.` : ''}</p></div><div class="verdict-orb"><span>VERDICT</span><strong>${V}</strong><small>${dateStr}</small></div></div></div>${q.map(rows).join('')}</div>`);
  });

  // 2. SHOULD YOU BUILD THIS?
  if ((D.why && D.why.length) || (D.risk && D.risk.length)) S.push(() => sec('verdict', 'Should you build this?', '', gx([
    card(`<h3>Why it could work</h3>${list(D.why || [])}`, 'pc y'),
    card(`<h3>Why it could fail</h3>${list(D.risk || [])}`, 'pc n'),
  ], 'w')));

  // 3. THE IDEA, SHARPENED
  if (D.clar && D.clar.length) S.push(() => sec('clarity', 'The idea, sharpened', 'The version worth testing serves one buyer with an acute pain.',
    tbl(['', 'As submitted', 'Worth testing'], D.clar.map(r => [`<b>${r[0]}</b>`, r[1], r[2]]), 'tbl-compare') +
    (D.pos ? `<div class="pos-callout"><div class="pos-badge">CORE STRATEGIC POSITIONING</div><div class="pos-statement">“${D.pos}”</div>${D.wedge ? `<p class="pos-note"><strong>Wedge principle:</strong> ${D.wedge}</p>` : ''}</div>` : '')));

  // 4. THE PRODUCTICA LENS: venture archetype + venture fit
  const A = D.arch || {};
  const fitRows = D.fit || [];
  if (A.n || fitRows.length || (D.lens && D.lens.raw)) S.push(() => {
    const st = v => v >= 7 ? ['tag-good', 'Strong', 'Evidence supports this dimension.'] : v >= 5 ? ['tag-watch', 'Watch', 'Worth validating with focused buyer evidence.'] : ['tag-focus', 'Focus area', 'This is currently constraining the thesis.'];
    const short = n => { const l = String(n).toLowerCase(); return l.startsWith('tailwind') ? 'Tailwind' : l.startsWith('price') ? 'Budget' : l.startsWith('reach') ? 'Reach' : l.startsWith('stick') ? 'Stickiness' : l.startsWith('trust') ? 'Trust' : n; };
    const archetypes = [['M', 'Mandate Rider', 'Sells into a requirement the buyer must meet'], ['B', 'Mission Led Brand', 'Chosen for what it stands for'], ['X', 'Marketplace Maker', 'Connects buyers and sellers'], ['H', 'Habit Product', 'Used daily or weekly'], ['D', 'Deep Tech Builder', 'Built on a technical advance'], ['E', 'Efficiency Engine', 'Saves a business time or money'], ['S', 'Service to Platform', 'Starts as a service, becomes a product'], ['C', 'Community Builder', 'Value comes from its members'], ['V', 'Experience Creator', 'Sells memorable moments']];
    const norm = x => String(x || '').toLowerCase().replace(/^the\s+/, '').trim();
    const primary = norm(A.n), secondary = norm((D.arch2 || {}).n);
    const mark = r => { const n = r[1].toLowerCase(); return n === primary ? 'PRIMARY' : (secondary && n === secondary) ? 'SECONDARY' : ''; };
    const arch = A.n ? `<div class="lens-top"><div class="hero-arch-card"><div class="h-arch-kicker"><span class="eyebrow" style="color:var(--up)">Your primary archetype</span></div><h3>${A.n}</h3><p class="h-arch-desc">${A.d || ''}</p><div class="h-arch-grid">${A.win ? `<div><small>What drives success</small><b>${A.win}</b></div>` : ''}${A.watch ? `<div><small>What to watch</small><b>${A.watch}</b></div>` : ''}${A.kpi ? `<div><small>Key metric</small><b>${A.kpi}</b></div>` : ''}${(D.arch2 || {}).n ? `<div><small>Secondary archetype</small><b>${D.arch2.n}</b></div>` : ''}</div></div>
<div class="arch-list">${archetypes.map(r => { const m = mark(r); return `<div class="arch-item ${m ? 'active' : ''}"><span class="letter">${r[0]}</span><div><h4>${r[1]}</h4><p>${r[2]}</p></div><span class="mark">${m || '○'}</span></div>`; }).join('')}</div></div>` : '';
    const fitHtml = fitRows.length ? `<div class="fit-panel"><div class="fit-head"><div><span class="eyebrow">Venture Fit</span><h3>How well does the idea fit its buyers?</h3><p class="sm">Five tests scored 0 to 10. The point is not the average, it is knowing what to test next.</p></div></div>${fitRows.map(r => { const v = Math.max(0, Math.min(10, +r[1] || 0)); const [tag, label, note] = st(v); return `<div class="vf-row"><b>${short(r[0])}</b><div class="vf-bar"><i style="--fit:${v * 10}%"></i></div><span class="vf-score">${v}/10</span><span class="${tag}">${label}</span><span class="vf-note">${r[2] || note}${r[3] ? `<em>${r[3]}</em>` : ''}${r[4] ? `<em><b>Next:</b> ${r[4]}</em>` : ''}</span></div>`; }).join('')}</div>` : '';
    const raw = !arch && !fitHtml && D.lens && D.lens.raw ? `<div class="card"><p class="raw-lens">${D.lens.raw}</p></div>` : '';
    return sec('lens', 'The Productica Lens', 'Two views that sit beside the score and work for any idea, in any market. <b>Venture Archetype</b> shows which pattern your venture follows and what that pattern needs to succeed. <b>Venture Fit</b> shows how well the idea matches the way its buyers decide.', `<div class="lens-shell">${arch}${fitHtml}${raw}</div>`);
  });

  // 5. WHO BUYS FIRST
  if (D.segTable && D.segTable.length) S.push(() => {
    const rc = { g: 'g', b: 'b', u: 'u' };
    return sec('segments', 'Who buys first', D.icp || '', `<div class="ts"><table class="tbl-compare seg-tbl"><thead><tr><th>Segment</th><th>Pain</th><th>Pay</th><th>Reach</th><th>Role</th></tr></thead><tbody>${D.segTable.map(s => `<tr><td><b>${s.name}</b><br><small>${s.desc}</small></td><td>${dots(s.pain)}</td><td>${dots(s.pay)}</td><td>${dots(s.reach)}</td><td><span class="chip ${rc[s.roleType] || ''}">${s.role}</span></td></tr>`).join('')}</tbody></table></div><p class="sm">Pain: how much the problem hurts today · Pay: willingness and ability to pay · Reach: how easily you can get in front of them. Each scored out of 5.</p>`);
  });

  // 6. MARKET
  if (D.mkt && D.mkt.length) S.push(() => {
    const M = D.mkt.slice(0, 4), n = M.length, st = n > 1 ? 106 / (n - 1) : 0, R = i => 146 - i * st, col = i => i == n - 1 ? 'var(--up)' : 'var(--tc)';
    const clip = (s, n) => { const t = String(s || '').trim(); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
    const long = s => String(s || '').trim().length > 56;
    const numeric = s => /^\d+(?:\.\d+)?$/.test(String(s || '').trim());
    const parts = m => {
      const label = String(m[0] || '').trim();
      const second = String(m[1] || '').trim();
      const third = String(m[2] || '').trim();
      const note = String(m[3] || '').trim();
      let metric = '';
      let title = '';
      const body = [];
      if (third && !long(third)) metric = third; else if (third) body.push(third);
      if (numeric(second) && !metric) metric = second;
      else if (second && !long(second)) title = second;
      else if (second) body.unshift(second);
      if (note) body.push(note);
      return { label, metric, title, body: body.join(' ') };
    };
    const svg = M.map((m, i) => { const bit = parts(m); const r = R(i), cy = 296 - r, inner = i == n - 1, top = 296 - 2 * r, y1 = inner ? cy - 3 : top + 26, y2 = inner ? cy + 14 : top + 44;
      return `<g class="nc ${inner ? 'mk-in' : ''}" style="--d:${i * 0.25}s"><circle cx="150" cy="${cy}" r="${r}" fill="${col(i)}" fill-opacity="${inner ? 1 : 0.1 + i * 0.1}" stroke="var(--tc)" stroke-opacity=".5"/><text x="150" y="${y1}" text-anchor="middle" class="mk-ab">${clip(bit.label, 18)}</text><text x="150" y="${y2}" text-anchor="middle" class="mk-v">${clip(bit.metric || bit.title, 18)}</text></g>`; }).join('');
    const rows = M.map((m, i) => { const bit = parts(m); return `<div class="mk-row"><div class="mk-top"><span class="mk-chip" style="--c:${col(i)}">${bit.label}</span>${bit.metric ? `<b class="mk-val cn">${bit.metric}</b>` : ''}</div><div class="mk-copy">${bit.title ? `<b>${bit.title}</b>` : ''}${bit.body ? `<p>${bit.body}</p>` : ''}</div></div>`; }).join('');
    return sec('market', 'Market size, without the hype', '', `<div class="card mk2"><svg class="mk-svg" viewBox="0 0 300 300" role="img" aria-label="Nested market sizes">${svg}</svg><div class="mk-list">${rows}<p class="sm" style="margin-top:6px">Circles are stepped for readability, not to scale.</p>${D.mktCalc ? `<div class="mk-note"><b>Calculation:</b> ${D.mktCalc}</div>` : ''}${D.mktNote ? `<div class="mk-note">${D.mktNote}</div>` : ''}</div></div>`);
  });

  // 7. COMPETITION
  if (D.comp && D.comp.rows && D.comp.rows.length) S.push(() => {
    const C = D.comp, T = ['<span class="tick t-no" title="No">✗</span>', '<span class="tick t-mid" title="Partly">◐</span>', '<span class="tick t-yes" title="Yes">✓</span>'];
    return sec('competition', "Who you're up against", D.compLead || '', `<div class="ts"><table class="tbl-compare comp-tbl"><thead><tr><th>Competitor</th>${C.cols.map(c => `<th style="text-align:center">${c}</th>`).join('')}</tr></thead><tbody>${C.rows.map(r => `<tr class="${r[3] ? 'us' : ''}"><td><b>${r[0]}</b><br><small style="color:var(--mu)">${r[1]}</small></td>${r[2].map(v => `<td style="text-align:center">${T[v] || ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="sm">✓ Does this well · ◐ Partly · ✗ Doesn't do it</p>` + gx([
      (D.cac && D.cac.length) ? card(`<h3>Cost to win one customer</h3>${D.cac.map((r, i) => `<div class="sbar"><div class="sbar-top"><span>${r[0]}</span><b>${r[1]}</b></div><div class="t"><i class="${r[3] ? 'c2' : 'c1'}" style="--p:${r[2]}%;--d:${i * 0.12}s"></i></div></div>`).join('')}`) : '',
      (D.moat && D.moat.length) ? card(`<h3>Your moat today</h3>${D.moat.map(r => { const [st, ...d] = String(r[2]).split(' — '); return `<div class="mrow"><b>${r[0]}</b>${dots(r[1])}<small><span class="chip ${r[1] >= 4 ? 'g' : r[1] <= 1 ? 'b' : 'u'}">${st}</span> ${d.join(' — ')}</small></div>`; }).join('')}`) : '',
    ], 'w') + (D.path ? `<div class="call"><b>The Only Defensible Path:</b> ${D.path}</div>` : ''));
  });

  // 8. LEAN CANVAS
  if (D.leanCanvas && Object.keys(D.leanCanvas).length) S.push(() => {
    const C = D.leanCanvas, v = x => (Array.isArray(x) ? list(x) : `<p>${x || ''}</p>`), cell = (k, l, c = '') => `<div class="lc-cell lc-${k} ${c}"><h4>${l}</h4>${v(C[k])}</div>`;
    return sec('lean-canvas', 'Lean Canvas, first version', 'The whole business model on one page, before any code is written.', `<div class="lc">${cell('problem', 'Problem')}${cell('solution', 'Solution')}${cell('metrics', 'Key metrics')}${cell('uvp', 'Unique value', 'lc-hi')}${cell('unfair', 'Unfair advantage')}${cell('channels', 'Channels')}${cell('segments', 'Customer')}${cell('cost', 'Costs')}${cell('revenue', 'Revenue')}</div>`);
  });

  // 9. RISKS & PRE-MORTEM
  if ((D.assume && D.assume.length) || (D.stories && D.stories.length)) S.push(() => {
    const sv = { critical: 'bad', high: 'up', medium: 'tc' };
    return sec('risks', 'Riskiest assumptions & premortem', D.riskLead || '', `<div class="as-list">${(D.assume || []).map((r, i) => `<div class="as-row" style="--sc:var(--${sv[String(r[2]).toLowerCase()] || 'mu'})"><span class="as-n">${i + 1}</span><div><b>${r[0]}</b><small>${r[1]}</small></div><span class="as-sev">${r[2]}</span><span class="as-ev">Evidence ${r[3]}</span></div>`).join('')}</div>
<h3 class="pm-h">Premortem</h3>
<div class="pm-explain"><span class="pm-q">?</span><p><b>What is a premortem?</b> A postmortem asks why something failed after the fact. A premortem asks the same question before you start: imagine it is 18 months from now and the venture has not worked out, then write down the most likely reasons. Psychologist Gary Klein designed it to surface risks that optimism hides, while there is still time to prevent them. Here are the three most likely stories for this idea, each with its prevention.</p></div>
<div class="pm-grid">${(D.stories || []).map((s, i) => `<div class="pm-card"><span class="pm-k">Story ${i + 1}</span><h4>${s[0]}</h4><p>${s[1]}</p><div class="pm-prev"><b>Prevent:</b> ${s[2]}</div></div>`).join('')}</div>`);
  });

  // 10. SYNCORO 3R READINESS: derived from the scores above, never judged separately
  if (q.length) S.push(() => {
    const fx = (qi, fi) => (q[qi] && q[qi][4] && q[qi][4][fi] ? +q[qi][4][fi][1] : null);
    const fit = D.fit || [];
    const fv = n => { const r = fit.find(r => String(r[0]).toLowerCase().startsWith(n)); return r ? +r[1] : null; };
    const beach = (D.segTable || []).find(x => x.roleType == 'g') || (D.segTable || [])[0] || {};
    const msV = Math.round(av([fx(2, 0), fx(4, 1), fv('tailwind')]) + 1e-9);
    const R3 = [
      ['Market Ready', [['Beachhead segment pain 4/5 or higher', (+beach.pain || 0) >= 4], ['Value Quotient 6.0 or higher', (q[1] ? +q[1][2] : 0) >= 6], ['Proof level E2 (customer interviews) or higher', pf >= 2], ['Trust Readiness 5 or higher', (fv('trust') || 0) >= 5]]],
      ['Growth Ready', [['Reach Efficiency 6 or higher', (fv('reach') || 0) >= 6], ['Stickiness 6 or higher', (fv('stick') || 0) >= 6], ['Profitability Quotient 6.0 or higher', (q[3] ? +q[3][2] : 0) >= 6], ['Market Strength 7 or higher', msV >= 7]]],
      ['Investment Ready', [['Syncoro IQ 6.5 or higher', a >= 6.5], ['Proof level E3 (paid pilots) or higher', pf >= 3], ['At least one moat rated 4/5 or higher', (D.moat || []).some(m => +m[1] >= 4)], ['24-month target of ₹8 crore ARR or more', (+D.arr24 || 0) >= 8e7]]],
    ];
    return sec('readiness', 'Syncoro 3R Readiness', 'Three qualification gates: Market Ready, Growth Ready, Investment Ready. Each criterion is checked against the scores above.',
      gx(R3.map(g => { const n = g[1].filter(c => c[1]).length; return ring(n / 4 * 100, `${n}/4`, g[0]); }), 's') +
      gx(R3.map(g => card(`<h3>${g[0]}</h3>` + g[1].map(c => `<div style="display:flex;gap:10px;align-items:flex-start;margin:8px 0;font-size:13.5px"><span class="tick ${c[1] ? 't-yes' : 't-no'}">${c[1] ? '✓' : '✗'}</span><span>${c[0]}</span></div>`).join(''))), 's'));
  });

  // 11. FINAL SCORECARD & SOUNDBOARD
  S.push(() => {
    const eligible = D.soundboard ? D.soundboard === 'eligible' : a >= 6.5 || pf >= 3;
    return sec('score', 'Final Scorecard & Strategic Next Steps', '',
      (SC.length ? card(SC.map((r, i) => bar(r[0], r[1] * 10, r[1] + ' / 10', r[2] ? 'c2' : 'c1', i)).join('')) : '') +
      card(`<h3>Operator Verdict</h3><p style="font-size:16px;color:var(--ink);line-height:1.5;font-weight:600"><b>${a.toFixed(1)} / 10 · ${V}.</b> ${D.final || ''}</p>`) +
      ((D.acts && D.acts.length) ? `<div class="acts">${D.acts.map(x => `<div style="background:color-mix(in srgb,var(--${x[2]}) 18%,transparent)"><b style="color:${x[2] == 'up' ? 'var(--ink)' : 'var(--' + x[2] + ')'}">${x[0]}</b>${x[1]}</div>`).join('')}</div>` : '') +
      `<div class="soundboard-card ${eligible ? 'eligible' : 'locked'}" style="margin-top:16px">
<div class="sb-header"><span class="chip ${eligible ? 'g' : 'u'}">${eligible ? '✓ Eligible for Soundboard' : '🔒 Qualification Benchmark'}</span><span style="font-size:12px;color:var(--mu);font-weight:600">Syncoro Ventures Partner Office</span></div>
<h3>Syncoro Soundboard Advisory Session</h3>
<p style="font-size:14px;color:var(--tx);line-height:1.5">${eligible
        ? 'Your venture meets the qualification standard (Syncoro IQ ≥ 6.5 or Proof Level ≥ E3). You are eligible to book a 60-minute venture stress-test session with Syncoro partners and advisors.'
        : `The Syncoro Soundboard is reserved for ventures at <strong>Proof Level E3 (Paid pilots)</strong> or <strong>Syncoro IQ 6.5+</strong>. Your current standing: <strong>${a.toFixed(1)} / 6.5 IQ</strong> and <strong>Proof Level E${pf}</strong>. Prove demand with paying customers to unlock partner advisory.`}</p>
${eligible ? '<a class="sb-btn" href="https://gtm.syncoro.com" target="_blank" rel="noopener">Apply for Syncoro Soundboard →</a>' : `<div class="sm" style="color:var(--mu);font-weight:600">Target to unlock: ${D.unlockTarget || 'reach Proof Level E3 with paying customers.'}</div>`}
</div>`);
  });

  // 12. HOW PRODUCTICA CAN HELP: journey strip + short cards
  S.push(() => {
    const items = [
      ['Fit', 'Product Market Fit', 'Find your audience, market gaps and value proposition.', 'span3'],
      ['Plan', 'Go to Market Strategy', 'Plan your positioning, audience and path to market.', 'span3'],
      ['Pitch', 'Pitch Deck Maker', "Build a pitch that shows your startup's potential.", 'span2'],
      ['Build', 'Startup Tools', 'Idea development, domain checks, research and more.', 'span2'],
      ['Grow', 'Founder Community & Events', 'Meet founders, join events, find collaborators.', 'span2'],
    ];
    const steps = [['Validate', 'You are here', 1], ...items.map(x => [x[0], x[1], 0])];
    return sec('help', 'How Productica can help', 'Validation is step one. Here is what comes next.',
      `<div class="jr">${steps.map((s, i) => `<div class="jr-step ${s[2] ? 'done' : ''}"><span class="jr-dot">${i + 1}</span><b>${s[0]}</b><small>${s[1]}</small></div>`).join('')}</div>
<div class="bento">${items.map((x, i) => `<div class="help-card ${x[3]}"><span class="help-step">Step ${i + 2} · ${x[0]}</span><h4>${x[1]}</h4><p>${x[2]}</p></div>`).join('')}</div>
<div class="help-close">From idea to execution, Productica is here to help.</div>`);
  });

  // 13. GRANTS & FUNDING
  if (opts.grantsHref) S.push(() => {
    const how = [['Match', 'Grants you may qualify for'], ['Autofill', 'Applications prefilled from this report'], ['Review', 'You check and submit']];
    return sec('grants', 'Grants & Funding', '', `<div class="gr"><div><span class="gr-tag">Productica Autofill</span><h3>Apply to grants in minutes.</h3><p class="gr-sub">We find grants you may qualify for and prefill the applications. You review and submit.</p><a class="gr-btn" href="${E(opts.grantsHref)}" target="_top">View grants →</a></div><ol class="gr-how">${how.map((h, i) => `<li><span class="gr-n">${i + 1}</span><div><b>${h[0]}</b><small>${h[1]}</small></div></li>`).join('')}</ol></div>`);
  });

  const body = S.map(fn => { try { return fn(); } catch (e) { console.error('[idea-report] section failed', e); return ''; } }).join('');
  // inline citations: every [n] marker becomes a click-to-expand source badge
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const cite = html => html.replace(/\[(\d{1,2})\](?!\()/g, (m, n) => {
    const src = D.sources && D.sources[+n - 1];
    if (!src) return m;
    const url = /^https?:\/\//i.test(String(src[3] || '').replace(/&amp;/g, '&')) ? src[3] : '';
    return `<span class="cite"><button class="cite-b" type="button" aria-expanded="false" aria-label="Show source ${n}">${n}</button><span class="cite-card"><b>${src[0] || ''}</b>: ${src[1] || ''}${src[2] ? ` (${src[2]})` : ''}. ${url ? `<a href="${url}" target="_blank" rel="noopener">${E(host(url.replace(/&amp;/g, '&')))} ↗</a>` : ''}</span></span>`;
  });
  return { name: D.name, hero: cite(hero), body: cite(body) };
}

// Runtime inside the iframe: scroll-in animations, count-up numbers, (?) toggles, progress bar, print support.
const RUNTIME = `
(function(){
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
function q(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
function cu(e){var s=e.dataset.t||(e.dataset.t=e.textContent),t0=performance.now();if(rm)return;
setTimeout(function(){e.textContent=s},1600);
(function f(){var p=Math.min((performance.now()-t0)/1400,1),k=1-Math.pow(1-p,3);
e.textContent=s.replace(/\\d[\\d,]*\\.?\\d*/g,function(m){var n=parseFloat(m.replace(/,/g,'')),d=(m.split('.')[1]||'').length,v=(n*k).toFixed(d);return m.indexOf(',')>-1?(+v).toLocaleString('en-US',{maximumFractionDigits:d}):v});
if(p<1)requestAnimationFrame(f)})(t0)}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');q('.cn',e.target).forEach(cu);io.unobserve(e.target)}})},{threshold:.1});
q('header,section').forEach(function(x){io.observe(x)});
addEventListener('scroll',function(){var h=document.documentElement,p=document.getElementById('pr');if(p)p.style.width=h.scrollTop/Math.max(1,h.scrollHeight-h.clientHeight)*100+'%'},{passive:true});
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.qm');if(!b)return;var o=b.getAttribute('aria-expanded')!='true';b.setAttribute('aria-expanded',o);document.getElementById(b.getAttribute('aria-controls')).classList.toggle('open',o)});
var cp=null,cb=null;
function cc(){if(cp){cp.remove();cp=null}if(cb){cb.setAttribute('aria-expanded','false');cb=null}}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.cite-b');
if(!b){if(!(e.target.closest&&e.target.closest('.cite-pop')))cc();return}
var was=b===cb;cc();if(was)return;
var d=document.createElement('div');d.className='cite-pop';d.innerHTML=b.nextElementSibling.innerHTML;document.body.appendChild(d);
var r=b.getBoundingClientRect(),l=Math.min(r.left,innerWidth-d.offsetWidth-12),t=r.bottom+6;
if(t+d.offsetHeight>innerHeight-12)t=r.top-d.offsetHeight-6;
d.style.left=Math.max(12,l)+'px';d.style.top=Math.max(12,t)+'px';b.setAttribute('aria-expanded','true');cp=d;cb=b});
addEventListener('scroll',cc,{passive:true});addEventListener('resize',cc);addEventListener('keydown',function(e){if(e.key=='Escape')cc()});
addEventListener('beforeprint',function(){cc();q('header,section').forEach(function(x){x.classList.add('on')});q('.qx').forEach(function(x){x.classList.add('open')});q('details').forEach(function(x){x.open=true})});
})();`;

export function buildReportDocument(R, { theme, grantsHref } = {}) {
  const { name, hero, body } = buildReportBody(R, { grantsHref });
  return `<!doctype html><html lang="en"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${name} · Idea Validation Report | Productica</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Instrument+Sans:wght@400;500;600;700&display=swap">
<style>${reportCss}</style></head><body>
<div class="top"><div><div class="brand-lockup"><b>Productica</b><span>Powered by Syncoro Ventures</span></div><span style="color:var(--mu);font-weight:600">${name} · Idea Validation Report</span></div><div id="pr"></div></div>
${hero}${body}
<footer><div class="wrap"><b>Productica</b> <span style="opacity:.8;font-size:13px">· Powered by Syncoro Ventures</span><p>Prepared with AI-assisted research from public information. A decision aid, not investment, legal or financial advice. Scores, ratings and readiness checks are Productica's estimates until tested. Syncoro IQ, Productica Lens, and Venture Archetypes are proprietary decision-support methodologies.</p></div></footer>
<script>${RUNTIME}</script></body></html>`;
}
