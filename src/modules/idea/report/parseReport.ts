/* eslint-disable */
// Parses the Pickaxe "Productica Idea Validation Report" markdown into the
// data model consumed by buildReportHtml. Every section is parsed in isolation
// so a malformed section degrades to a missing block instead of a blank report.

export interface ParsedIdeaReport {
  data: Record<string, any>;
  warnings: string[];
}

type Table = { head: string[]; rows: string[][] };

const strip = (s: string) =>
  String(s ?? '')
    .replace(/\*\*/g, '')
    .replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,;:]|$)/g, '$1$2')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const num = (s: string, d = 0) => {
  const m = String(s ?? '').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : d;
};

const SECTION_TITLES: [string, RegExp][] = [
  ['0', /headline|snapshot|overview/i],
  ['1', /syncoro\s*iq|iq test/i],
  ['2', /should you build/i],
  ['3', /sharpened/i],
  ['4', /productica lens|(?:^|\b)the lens\b/i],
  ['5', /who buys|ideal customer|segments/i],
  ['6', /market size|without the hype/i],
  ['7', /competition|who you.?re up against/i],
  ['8', /lean canvas/i],
  ['9', /pre-?mortem|riskiest|risks?\s*&/i],
  ['10', /readiness|3r/i],
  ['11', /scorecard|final score|operator verdict/i],
  ['sources', /^sources?\b|references/i],
];

function unwrapMarkdown(md: string) {
  let text = String(md || '').replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  const fenced = text.match(/^```(?:markdown|md|text)?\s*\n([\s\S]*?)\n```$/i);
  if (fenced) text = fenced[1].trim();
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const json = JSON.parse(text);
      if (typeof json === 'string') return json.replace(/\r/g, '');
      const nested = json?.markdown || json?.result || json?.report || json?.text;
      if (typeof nested === 'string' && nested.trim()) return nested.replace(/\r/g, '');
    } catch { /* still markdown */ }
  }
  return text;
}

function splitSections(md: string) {
  const out: Record<string, string> = {};
  const marks: { n: string; start: number; end: number }[] = [];
  const lines = md.split('\n');
  let offset = 0;
  for (const raw of lines) {
    const line = raw.trim();
    let n = '';
    const numbered = line.match(/^(?:#{1,4}\s+|\*\*)(\d+)\s*[.):\-]\s+(.+?)(?:\*\*)?\s*$/);
    if (numbered) n = String(Number(numbered[1]));
    else {
      const bare = line.match(/^(#{1,4})\s+(?:\*\*)?(.+?)(?:\*\*)?\s*$/);
      if (bare) {
        const title = strip(bare[2]).replace(/^\d+\s*[.):\-]\s*/, '');
        if (!/quotient/i.test(title)) {
          const hit = SECTION_TITLES.find(([, re]) => re.test(title));
          if (hit) n = hit[0];
        }
      }
    }
    if (n && !marks.some(m => m.n === n)) {
      marks.push({ n, start: offset + raw.length + 1, end: offset });
    }
    offset += raw.length + 1;
  }
  marks.forEach((k, i) => {
    out[k.n] = md.slice(k.start, i + 1 < marks.length ? marks[i + 1].end : md.length);
  });
  return out;
}

function parseTables(text: string): Table[] {
  const tables: Table[] = [];
  const lines = text.split('\n');
  let cur: string[][] = [];
  const flush = () => {
    if (cur.length >= 2) {
      const [head, , ...rows] = cur;
      tables.push({ head: head.map(strip), rows: rows.map(r => r.map(strip)) });
    }
    cur = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('|')) {
      const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      cur.push(cells);
    } else flush();
  }
  flush();
  return tables;
}

const after = (text: string, marker: string | RegExp) => {
  const i = typeof marker === 'string' ? text.indexOf(marker) : text.search(marker);
  return i < 0 ? '' : text.slice(i);
};

const between = (text: string, a: string | RegExp, b?: string | RegExp) => {
  const s = after(text, a);
  if (!s || !b) return s;
  const rest = s.slice(1);
  const j = typeof b === 'string' ? rest.indexOf(b) : rest.search(b);
  return j < 0 ? s : s.slice(0, j + 1);
};

const kv = (text: string, label: string) => {
  const bold = text.match(new RegExp(`\\*\\*${label}:?\\*\\*:?\\s*(.+)`, 'i'));
  if (bold && strip(bold[1])) return strip(bold[1]);
  const plain = text.match(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s+)?${label}:\\s*(.+)`, 'i'));
  if (plain && strip(plain[1])) return strip(plain[1]);
  const next = text.match(new RegExp(`(?:\\*\\*)?${label}:?(?:\\*\\*)?:?\\s*\\n\\s*(.+)`, 'i'));
  return next ? strip(next[1]) : '';
};

const firstNum = (...vals: Array<string | number | null | undefined>) => {
  for (const v of vals) {
    if (v == null || v === '') continue;
    const n = typeof v === 'number' ? v : num(v, NaN);
    if (!isNaN(n)) return n;
  }
  return NaN;
};

const bullets = (text: string) => {
  const out: [string, string][] = [];
  const re = /^\s*[-*]\s+\*\*(.+?):?\*\*:?\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push([strip(m[1]).replace(/:$/, ''), strip(m[2])]);
  return out;
};

const numbered = (text: string) =>
  [...text.matchAll(/^\s*\d+\.\s+(.+)$/gm)].map(m => strip(m[1]));

const tick = (s: string) => (s.includes('✓') ? 2 : s.includes('◐') ? 1 : 0);

type Part =
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'bullets'; items: [string, string][] }
  | { type: 'text'; text: string };
interface Block { heading: string; level: number; parts: Part[] }

function toParts(lines: string[]): Part[] {
  const parts: Part[] = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { i++; continue; }
    if (t.startsWith('|')) {
      const run: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) run.push(lines[i++]);
      const tb = parseTables(run.join('\n'))[0];
      if (tb) parts.push({ type: 'table', head: tb.head, rows: tb.rows });
    } else if (/^[-*]\s+/.test(t)) {
      const items: [string, string][] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const line = lines[i++].trim().replace(/^[-*]\s+/, '');
        const m = line.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/);
        items.push(m ? [strip(m[1]).replace(/:$/, ''), strip(m[2])] : ['', strip(line)]);
      }
      parts.push({ type: 'bullets', items });
    } else {
      // keep inline **bold** / *italic* so the renderer can format labels such as "**Dependency:** ..."
      parts.push({ type: 'text', text: t.replace(/\s+/g, ' ') });
      i++;
    }
  }
  return parts;
}

// Splits a section into its ordered blocks (### headings, bold-only heading lines, and the
// "**Breakpoint:** ..." / "**Condition to prove:** ..." label lines). Nothing is discarded.
function parseBlocks(section: string): Block[] {
  const blocks: Block[] = [];
  let cur: Block = { heading: '', level: 2, parts: [] };
  let buf: string[] = [];
  const close = () => {
    cur.parts.push(...toParts(buf));
    buf = [];
    if (cur.heading || cur.parts.length) blocks.push(cur);
  };
  for (const raw of section.split('\n')) {
    const line = raw.trim();
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^#{3,4}\s+(.+)$/))) {
      close();
      cur = { heading: strip(m[1]), level: 3, parts: [] };
    } else if ((m = line.match(/^\*\*(Breakpoint|Condition to prove|Venture Signature|Venture fit|Next test|Claims|Evidence register|Your primary archetype|Secondary archetype):\*\*\s*(.*)$/i))) {
      close();
      cur = { heading: m[1], level: 4, parts: [] };
      if (m[2]) buf.push(m[2]);
    } else if ((m = line.match(/^\*\*([^*]+?):?\*\*:?\s*$/))) {
      close();
      cur = { heading: strip(m[1]).replace(/:$/, ''), level: 4, parts: [] };
    } else buf.push(raw);
  }
  close();
  return blocks;
}

// Pickaxe may answer with the report data itself (JSON). Accept it as-is when it has the report shape.
export function readReportJson(md: string): Record<string, any> | null {
  let t = String(md || '').replace(/^﻿/, '').trim();
  const fenced = t.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i);
  if (fenced) t = fenced[1].trim();
  if (!t.startsWith('{')) return null;
  try {
    let j = JSON.parse(t);
    for (const k of ['report', 'data', 'result']) {
      if (j && typeof j[k] === 'object' && j[k] && !Array.isArray(j[k]) && (j[k].q || j[k].name)) { j = j[k]; break; }
    }
    if (j && typeof j === 'object' && !Array.isArray(j) && Array.isArray(j.q) && j.q.length) return j;
  } catch { /* markdown */ }
  return null;
}

const SIGNAL_SCORE: Record<string, number> = { aligned: 8, strong: 8, neutral: 5, mixed: 5, friction: 3, weak: 3, unknown: 4 };

export function parseIdeaReport(md: string): ParsedIdeaReport {
  const json = readReportJson(md);
  if (json) return { data: json, warnings: [] };
  const warnings: string[] = [];
  const D: Record<string, any> = {};
  const text = unwrapMarkdown(md);
  const S = splitSections(text);

  const safe = (label: string, fn: () => void) => {
    try {
      fn();
    } catch (e) {
      warnings.push(`${label}: ${(e as Error).message}`);
    }
  };

  D.name = strip((text.match(/^#\s+(.+)$/m) || [])[1] || 'Your idea');

  // 0. HEADLINE
  safe('headline', () => {
    const s = S['0'] || text.slice(0, 2500);
    const v = kv(s, 'Verdict') || kv(text, 'Verdict');
    D.verdict = v ? v.replace(/\s+/g, ' ') : '';
    D.sub = kv(s, 'Summary') || kv(text, 'Summary');
    const today = firstNum(
      kv(s, 'Syncoro IQ today'),
      kv(s, 'Syncoro IQ'),
      kv(s, 'IQ today'),
      kv(text, 'Syncoro IQ today'),
      (s.match(/Syncoro IQ today[^0-9\n]{0,24}([\d.]+)/i) || [])[1],
      (text.match(/Syncoro IQ today[^0-9\n]{0,24}([\d.]+)/i) || [])[1],
      (text.match(/\bIQ\s*(?:score)?\s*today[^0-9\n]{0,24}([\d.]+)/i) || [])[1],
      (text.match(/Syncoro IQ[:\s*]*([\d.]+)\s*\/\s*10/i) || [])[1],
    );
    const up = firstNum(
      kv(s, 'Syncoro IQ upside[^:]*'),
      kv(text, 'Syncoro IQ upside[^:]*'),
      (text.match(/Syncoro IQ upside[^0-9\n]{0,40}([\d.]+)/i) || [])[1],
    );
    D.iq = { today: isNaN(today) ? null : today, upside: isNaN(up) ? null : up };
    const proof = kv(s, 'Proof level') || kv(text, 'Proof level');
    D.proof = num((proof.match(/E(\d)/i) || [])[1], 0);
    D.proofLabel = proof;
  });

  // 1. SYNCORO IQ TEST
  safe('iq', () => {
    const parseQ = (s: string) => {
      const weights: Record<string, number> = {};
      for (const m of s.matchAll(/([\d.]+)\s*[×x*·]\s*[\d.]+\s+(Innovation|Value|Market|Profitability|X-Factor)/g))
        weights[m[2]] = parseFloat(m[1]);
      const upLine = s.match(/Upside scores?:?\*\*\s*(.+)/i)?.[1] || kv(s, 'Upside scores') || '';
      const ups: Record<string, number> = {};
      for (const m of upLine.matchAll(/(Innovation|Value|Market|Profitability|X-Factor)\s+([\d.]+)/g)) ups[m[1]] = parseFloat(m[2]);
      const defaults: Record<string, number> = { Innovation: 0.15, Value: 0.25, Market: 0.2, Profitability: 0.2, 'X-Factor': 0.2 };
      const q: any[] = [];
      const qRe = /(?:#{2,4}\s+|\*\*)(Innovation|Value|Market|Profitability|X-Factor)\s+Quotient\s*[—–\-:]+\s*([\d.]+)\s*\/\s*10(?:\*\*)?([\s\S]*?)(?=(?:#{2,4}\s+|\*\*)(?:Innovation|Value|Market|Profitability|X-Factor)\s+Quotient|\*\*Upside|$)/gi;
      for (const m of s.matchAll(qRe)) {
        const name = m[1];
        const t = parseTables(m[3])[0];
        const todayScore = parseFloat(m[2]);
        const up = ups[name] ?? todayScore;
        const factors = (t?.rows || []).map(r => [r[0], num(r[1]), up, r[2] || r[3] || ''] as any[]);
        q.push([name, weights[name] ?? defaults[name], todayScore, up, factors]);
      }
      return q;
    };
    const q = parseQ(S['1'] || '') ;
    D.q = q.length ? q : parseQ(text);
    if (!D.q.length) warnings.push('iq: no quotient blocks found');
  });

  // 2. SHOULD YOU BUILD THIS
  safe('verdict', () => {
    const s = S['2'] || '';
    const failIdx = s.search(/Why it could fail/i);
    D.why = numbered(failIdx < 0 ? s : s.slice(0, failIdx));
    D.risk = failIdx < 0 ? [] : numbered(s.slice(failIdx));
  });

  // 3. THE IDEA, SHARPENED
  safe('clarity', () => {
    const s = S['3'] || '';
    const t = parseTables(s)[0];
    D.clar = (t?.rows || []).map(r => [r[0], r[1], r[2]]);
    D.pos = kv(s, 'Core strategic positioning').replace(/^["“]|["”]$/g, '');
    D.wedge = kv(s, 'Wedge principle');
  });

  // 4. THE PRODUCTICA LENS
  // Structure varies by venture (two-sided ventures add extra buyer lanes, an activation map, ...), so the
  // section is parsed into its ordered blocks and nothing is dropped. Known blocks get a designed layout
  // in the renderer; unknown ones render generically.
  safe('lens', () => {
    const raw = (S['4'] || '').trim();
    const blocks = parseBlocks(raw);
    D.lens = { blocks, raw };
    const bl = (b: Block) => b.parts.flatMap(p => (p.type === 'bullets' ? p.items : []));
    const getv = (items: [string, string][], re: RegExp) => (items.find(x => re.test(x[0])) || [])[1] || '';
    const archB = blocks.find(b => /primary archetype|^archetype/i.test(b.heading) && !/secondary/i.test(b.heading))
      || blocks.find(b => /archetype/i.test(b.heading) && !/secondary/i.test(b.heading));
    const arch2B = blocks.find(b => /secondary/i.test(b.heading));
    const sigB = blocks.find(b => /venture signature/i.test(b.heading));
    const archItems = archB ? bl(archB) : [];
    const sigItems = sigB ? bl(sigB) : [];
    if (archItems.length) {
      const lead = archB!.parts.find(p => p.type === 'text');
      D.arch = {
        n: getv(archItems, /^(primary )?archetype|^name/i) || (lead && lead.type === 'text' ? lead.text : ''),
        d: getv(archItems, /descri|what it is|summary/i),
        win: getv(archItems, /drives success|win/i),
        watch: getv(archItems, /watch|risk/i),
        kpi: getv(archItems, /metric|kpi/i),
      };
      const second = getv(archItems, /secondary/i)
        || (arch2B && (bl(arch2B)[0]?.[1] || (arch2B.parts.find(p => p.type === 'text') as { text?: string } | undefined)?.text || arch2B.heading))
        || '';
      if (second) D.arch2 = { n: String(second).replace(/,?\s*use as a supporting.*/i, '').trim() };
    } else if (sigItems.length) {
      const n = getv(sigItems, /primary value/i);
      if (n) {
        D.arch = {
          n,
          d: getv(sigItems, /customer outcome/i),
          win: getv(sigItems, /success|moat|proof/i),
          watch: getv(sigItems, /watch|risk|breakpoint/i),
          kpi: getv(sigItems, /metric|kpi/i),
        };
      }
    }
    if (!D.arch2 && arch2B) {
      const lead2 = arch2B.parts.find(p => p.type === 'text');
      const raw2 = (lead2 && lead2.type === 'text' ? lead2.text : '') || getv(bl(arch2B), /./) || '';
      if (raw2) D.arch2 = { n: raw2.replace(/,?\s*use as a supporting.*/i, '').trim() };
    }
    const fitB = blocks.find(b => /venture fit/i.test(b.heading) && b.parts.some(p => p.type === 'table'));
    const ft = fitB && fitB.parts.find(p => p.type === 'table');
    if (ft && ft.type === 'table') {
      const ix = (re: RegExp) => ft.head.findIndex(h => re.test(h));
      const iD = ix(/dimension|test/i), iSc = ix(/score/i), iSi = ix(/signal|status/i), iF = ix(/finding|why|reason|note/i), iE = ix(/evidence/i), iA = ix(/action|next/i);
      if (iD > -1 && (iSc > -1 || iSi > -1)) {
        D.fit = ft.rows.map(r => {
          const score = iSc > -1 ? num(r[iSc], NaN) : NaN;
          const sig = iSi > -1 ? String(r[iSi] || '').toLowerCase().trim() : '';
          return [r[iD], !isNaN(score) ? score : (SIGNAL_SCORE[sig] ?? 4), iF > -1 ? r[iF] : '', iE > -1 ? r[iE] : '', iA > -1 ? r[iA] : ''];
        });
      }
    }
  });

  // 5. WHO BUYS FIRST
  safe('segments', () => {
    const s = S['5'] || '';
    D.icp = kv(s, 'Ideal customer').replace(/\s*NO money figures\.?/i, '');
    const t = parseTables(s)[0];
    const rt = (r: string) => (/beachhead/i.test(r) ? 'g' : /avoid/i.test(r) ? 'b' : /later/i.test(r) ? 'u' : '');
    D.segTable = (t?.rows || []).map(r => ({ name: r[0], desc: r[1], pain: num(r[2]), pay: num(r[3]), reach: num(r[4]), role: r[5], roleType: rt(r[5] || '') }));
  });

  // 6. MARKET — TAM / SAM / SOM only. Never the IQ "Market Quotient" factor table.
  safe('market', () => {
    const s = S['6'] || '';
    const isTam = (t: Table) => {
      const blob = [...t.head, ...t.rows.flat()].join(' ');
      const labels = t.rows.map(r => `${r[0]} ${r[1]}`);
      const named = labels.filter(x => /\bTAM\b|\bSAM\b|\bSOM\b|addressable|serviceable/i.test(x)).length;
      if (/reachable market|access\s*\/\s*sales|competitive intensity/i.test(blob)) return false;
      return named >= 2;
    };
    const t = [...parseTables(s), ...parseTables(text)].find(isTam);
    D.mkt = (t?.rows || []).map(r => [r[0], r[1], r[2], r[3]]);
    D.mktNote = kv(s, 'Reality check') || kv(s, 'Note') || kv(s, 'Market note');
    D.mktCalc = kv(s, 'Calculation');
  });

  // 7. COMPETITION
  safe('competition', () => {
    const s = S['7'] || '';
    const tables = parseTables(s);
    const comp = tables[0];
    D.compLead = strip(s.split('\n').find(l => l.trim() && !l.trim().startsWith('|') && !l.startsWith('**')) || '');
    if (comp) {
      D.comp = {
        cols: comp.head.slice(2),
        rows: comp.rows.map(r => [r[0], r[1], r.slice(2).map(tick), /proposed|wedge/i.test(r[1] || '') ? 1 : 0]),
      };
    }
    const cac = parseTables(after(s, 'Cost to win one customer'))[0];
    D.cac = (cac?.rows || []).map(r => [r[0], r[1], num(r[2]), /direct paid/i.test(r[0]) ? 1 : 0]);
    D.cacNote = strip((s.match(/Relative levels only[^\n*]*/i) || [])[0] || '');
    const moat = parseTables(after(s, 'Your moat today'))[0];
    D.moat = (moat?.rows || []).map(r => [r[0], num(r[1]), `${r[2]} — ${r[3] || ''}`]);
    D.path = kv(s, 'The only defensible path');
  });

  // 8. LEAN CANVAS
  safe('leanCanvas', () => {
    const s = S['8'] || '';
    const map: Record<string, string> = {
      problem: 'problem', solution: 'solution', 'key metrics': 'metrics', 'unique value': 'uvp',
      'unfair advantage': 'unfair', channels: 'channels', customer: 'segments', costs: 'cost', revenue: 'revenue',
    };
    const c: any = {};
    for (const [k, v] of bullets(s)) if (map[k.toLowerCase()]) c[map[k.toLowerCase()]] = v;
    D.leanCanvas = c;
  });

  // 9. RISKS & PRE-MORTEM
  safe('risks', () => {
    const s = S['9'] || '';
    D.riskLead = strip((s.match(/^\*\*(Two|Three|One|The)[^\n]*\*\*\s*$/m) || [])[0] || '');
    const t = parseTables(s)[0];
    D.assume = (t?.rows || []).map(r => [r[1], r[2], r[3], r[4]]);
    D.stories = [...s.matchAll(/\*\*Story\s+\d+\s*[—\-:]+\s*(.+?)\*\*\s*\n([\s\S]*?)\*\*Prevent:\*\*\s*([^\n]+)/g)].map(m => [strip(m[1]), strip(m[2]), strip(m[3])]);
  });

  // 10. READINESS
  safe('readiness', () => {
    const s = S['10'] || '';
    const t = parseTables(s)[0];
    D.readiness = {
      gates: (t?.rows || []).map(r => ({
        name: r[0], question: r[1], level: num(r[2]), band: strip(r[2].replace(/^\d+\s*\/\s*\d+/, '').replace(/[●○]/g, '')),
        raw: r[3], limited: r[4], unlock: r[5],
      })),
      calc: [...between(s, '**Calculation:**').matchAll(/^\s*-\s+(.+)$/gm)].map(m => strip(m[1])),
    };
  });

  // SOURCES: numbered list or table. Feeds the [n] hover cards beside each figure.
  safe('sources', () => {
    const fromHeading = text.split(/^#{1,4}\s+SOURCES\s*$/im)[1] || '';
    const s = [S['sources'], fromHeading, (!/how productica|grants/i.test(S['12'] || '') ? S['12'] : '')].find(x => (x || '').trim()) || '';
    if (!s.trim()) return;
    const out: string[][] = [];
    const t = parseTables(s)[0];
    if (t && t.rows.length) {
      for (const r of t.rows) {
        const url = r.find(c => /^https?:\/\//i.test(c)) || '';
        const rest = r.filter(c => c !== url);
        out.push([rest[0] || '', rest[1] || '', rest.find((_, i) => i > 1) || '', url]);
      }
    }
    if (!out.length) {
      const items: string[] = [];
      for (const raw of s.split('\n')) {
        const line = raw.trim();
        if (!line || /^#{1,4}\s/.test(line) || /^sources$/i.test(line) || /^\(used for/i.test(line)) continue;
        if (/^(?:\[?\d+[.\])]:?\s+|[-*]\s+)/.test(line)) items.push(line);
        else if (items.length && !/^\|/.test(line)) items[items.length - 1] += ' ' + line;
      }
      for (const raw of items) {
        const m = raw.match(/^(?:\[?\d+[.\])]:?\s+|[-*]\s+)(.+)$/);
        if (!m) continue;
        const line = strip(m[1]);
        const url = (line.match(/https?:\/\/[^\s)>\]]+/) || [''])[0];
        const date = (line.match(/\(([^)]*\d{4}[^)]*)\)/) || [])[1] || '';
        const rest = line.replace(url, '').replace(/\([^)]*\d{4}[^)]*\)/, '').replace(/[()\s.—–-]+$/g, '').trim();
        const named = rest.match(/^(.+?):\s+(.+)$/);
        out.push(named ? [named[1], named[2], date, url] : [rest, '', date, url]);
      }
    }
    if (out.length) D.sources = out;
  });

  // 11. FINAL SCORECARD
  safe('score', () => {
    const s = S['11'] || '';
    const t = parseTables(s)[0];
    D.score = (t?.rows || []).map(r => [r[0], num(r[1]), /competition/i.test(r[0]) ? 1 : 0]);
    const ov = (s.match(/\*\*Operator verdict:\*\*\s*(.+)/i) || [])[1] || '';
    D.final = strip(ov.replace(/^\*\*[^*]+\*\*\s*/, ''));
    D.acts = bullets(between(s, /^\s*-\s+\*\*Do:/m, '**Syncoro Soundboard'))
      .filter(([k]) => /^(do|don.t|consider)$/i.test(k))
      .map(([k, v]) => [k.replace('’', "'"), v, /^do$/i.test(k) ? 'good' : /^don/i.test(k) ? 'bad' : 'up']);
    const sb = kv(s, 'Syncoro Soundboard');
    D.soundboard = /^s*locked/i.test(sb) ? 'locked' : /^s*(eligible|unlocked|open)/i.test(sb) ? 'eligible' : '';
    D.unlockTarget = strip((sb.match(/Target to unlock:\s*(.+?)(?:\.?\s*Link:|$)/i) || [])[1] || '');
  });

  const missing = ['q', 'why', 'clar', 'segTable', 'mkt', 'comp', 'leanCanvas', 'assume', 'score'].filter(k => !D[k] || (Array.isArray(D[k]) && !D[k].length));
  if (!D.lens?.blocks?.length && !D.lens?.raw) missing.push('lens');
  if (D.iq?.today == null && !D.q?.length) missing.push('iq');
  if (missing.length) warnings.push(`missing: ${missing.join(', ')}`);
  return { data: D, warnings };
}
