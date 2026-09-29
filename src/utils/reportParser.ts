/* eslint-disable */
/**
 * Extract a major numbered/hashed section by title keyword.
 * Requires `N.` (or `# N.`) so inline labels like "Real failure pattern:"
 * or "What is your potential MOAT?" are NOT treated as section starts.
 */
function extractNamedSection(content: string, titlePattern: RegExp): string {
  // Next major section = numbered heading without an inline "label: value" colon
  // (so "1. Move fast: Lock gyms..." inside MOAT does not truncate the section).
  const re = new RegExp(
    `(?:^|\\n)(?:#{1,3}\\s*|\\*\\*\\s*)?(?:\\d+\\.\\s+)[^\\n]*?(?:${titlePattern.source})[^\\n]*?(?:\\*\\*)?\\s*\\n([\\s\\S]*?)(?=(?:\\n(?:#{1,3}\\s*)?(?:\\*\\*)?\\d+\\.\\s+[^:\\n]{3,90}\\n)|$)`,
    'i'
  );
  const m = content.match(re);
  return m?.[1]?.trim() || "";
}

/** Numbered fallback when title keywords miss (legacy reports). */
function extractSectionContent(content: string, startHeadingRegex: RegExp, nextHeadingRegex: RegExp): string {
  const match = content.match(new RegExp(`${startHeadingRegex.source}(?<content>[\\s\\S]*?)(?:(?=${nextHeadingRegex.source})|$)`, 'i'));
  return match?.groups?.content?.trim() || "";
}

/** Trim only — do NOT strip `*`/`**` or markdown bold/italic breaks. */
const cleanString = (str: string | undefined): string => {
  if (!str) return "";
  return str.trim();
};

/** Normalize AI quirks into markdown ReactMarkdown can render. */
export function toDisplayMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, '\n')
    // Unicode / exotic bullets → markdown lists
    .replace(/^[ \t]*[•●◦‣▪◆◇]\s+/gm, '- ')
    // Lines like "* item" that are bullets (not **bold**)
    .replace(/^[ \t]*\*(?!\*)\s+/gm, '- ')
    // __text__ → **text**
    .replace(/__([^_\n]+?)__/g, '**$1**')
    // ++text++ → underline
    .replace(/\+\+([^+\n]+?)\+\+/g, '<u>$1</u>')
    // Drop lone thematic breaks that render as empty <hr>
    .replace(/^(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractLabeledField(section: string, label: RegExp, nextLabelStart: RegExp): string {
  const re = new RegExp(
    `(?:^|\\n)\\s*(?:[-*•]\\s*)?(?:\\*\\*)?${label.source}(?:\\*\\*)?\\s*:?\\s*\\n?([\\s\\S]*?)(?=${nextLabelStart.source}|$)`,
    'i'
  );
  return cleanString(section.match(re)?.[1]);
}

function splitTableCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map(c => c.trim());
}

function isSeparatorRow(line: string): boolean {
  return /^\|?[\s:|-]+ \|?$/.test(line.trim()) && line.includes('-');
}

/** Parse GFM tables even when the model dumps them onto fewer lines. */
export function parseMarkdownTable(text: string): { headers: string[]; rows: string[][] } | null {
  if (!text.includes('|')) return null;

  let lines = text.split('\n').map(l => l.trim()).filter(l => l.includes('|'));

  // Expand single-line / smashed tables around the separator segment
  if (lines.length < 3) {
    const blob = (lines.join(' ') || text).replace(/\|\s*\|/g, '|\n|');
    const sepRe = /\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?/;
    const sepMatch = sepRe.exec(blob);
    if (sepMatch && sepMatch.index != null) {
      const headerPart = blob.slice(0, sepMatch.index).trim();
      const bodyPart = blob.slice(sepMatch.index + sepMatch[0].length).trim();
      const headerCells = splitTableCells(headerPart).filter(Boolean);
      if (headerCells.length >= 2) {
        const width = headerCells.length;
        const rows: string[][] = [];
        const bodyLines = bodyPart.split('\n').map(l => l.trim()).filter(l => l.includes('|'));
        if (bodyLines.length > 0) {
          bodyLines.forEach(line => {
            const cells = splitTableCells(line);
            while (cells.length < width) cells.push('');
            const normalized = cells.slice(0, width);
            if (normalized.some(c => c.length > 0 && !/^:?-{3,}:?$/.test(c))) {
              rows.push(normalized);
            }
          });
        } else {
          const cellChunks = splitTableCells(bodyPart);
          for (let i = 0; i + width <= cellChunks.length; i += width) {
            const row = cellChunks.slice(i, i + width);
            if (row.some(c => c.length > 0 && !/^:?-{3,}:?$/.test(c))) rows.push(row);
          }
        }
        if (rows.length > 0) return { headers: headerCells, rows };
      }
    }
  }

  lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const tableLines = lines.filter(l => l.includes('|'));
  if (tableLines.length < 2) return null;

  let headerIdx = -1;
  let sepIdx = -1;
  for (let i = 0; i < tableLines.length; i++) {
    if (isSeparatorRow(tableLines[i])) {
      sepIdx = i;
      headerIdx = i - 1;
      break;
    }
  }
  if (headerIdx < 0 || sepIdx < 0) return null;

  const headers = splitTableCells(tableLines[headerIdx]).filter(Boolean);
  if (headers.length < 2) return null;

  const rows: string[][] = [];
  for (let i = sepIdx + 1; i < tableLines.length; i++) {
    if (isSeparatorRow(tableLines[i])) continue;
    const cells = splitTableCells(tableLines[i]);
    if (cells.every(c => !c)) continue;
    // Pad / trim to header width
    while (cells.length < headers.length) cells.push('');
    rows.push(cells.slice(0, headers.length).map(c => c.replace(/\*\*/g, '').trim()));
  }

  return rows.length > 0 ? { headers: headers.map(h => h.replace(/\*\*/g, '').trim()), rows } : null;
}

export interface CompetitorRow {
  name: string;
  whatTheyDo: string;
  whyHard: string;
  details: string;
}

export interface IcpData {
  summary: string;
  demographics: string;
  industry: string;
  painPoint: string;
  buyingTriggers: string;
  price: string;
  whoUsesVsPays: string;
  whyChoose: string;
  whereFind: string;
}

export interface MoatData {
  potential: string;
  hardToCopy: string;
  existingAdvantage: string;
  canBuild: string;
  missing: string;
  howToBuild: string;
}

export interface ParsedReport {
  decision: string;
  confidence: number;
  oneLine: string;

  // 1. CLARITY CHECK
  realProblem: string;
  whoCares: string;
  whatTheyUse: string;
  whyDifferent: string;

  // 2. MARKET TRUTH
  marketReality: string;
  tam: string;
  whoPays: string;
  hardTruth: string;

  // ICP
  icp: IcpData;

  // COMPETITION
  competitors: CompetitorRow[];
  competitorsTable: { headers: string[]; rows: string[][] } | null;
  whyYouLose: string;

  // WAY YOU WIN
  winAngle: string;
  winOptions: { title: string; details: string }[];
  ideaDead: string;

  // FAILURES
  failurePattern: string;
  trap: string;

  // MONEY REALITY
  moneyWhoPays: string;
  moneyHowMuch: string;
  moneyWhyNot: string;
  moneyRisk: string;

  // MOAT
  moat: MoatData;

  // FIRST 10 USERS
  exactPeople: string;
  whereFind: string;
  whySayYes: string;

  // 72 HOURS
  steps: { title: string; details: string }[];
  mustInclude: string;

  // SIGNALS
  continueSignals: string[];
  stopSignals: string[];

  // SMARTER VERSION
  smarterVersion: string;

  // FINAL SCORE & VERDICT
  survivalProb: string;
  marketScore: string;
  compScore: string;
  monetizationScore: string;

  finalVerdictText: string;
  whatShouldDo: string;
  whatHappens: string;
  brutalTruth: string;
}

function extractScoreFromText(text: string, keyword: RegExp): string {
  const lines = text.split('\n');
  const line = lines.find(l => keyword.test(l));
  if (!line) return "";
  const match = /(\d+(?:\.\d+)?(?:\/\d+)?|[\d%]+)/.exec(line);
  return match ? match[1] : "";
}

function emptyIcp(): IcpData {
  return {
    summary: '', demographics: '', industry: '', painPoint: '',
    buyingTriggers: '', price: '', whoUsesVsPays: '', whyChoose: '', whereFind: '',
  };
}

function emptyMoat(): MoatData {
  return {
    potential: '', hardToCopy: '', existingAdvantage: '',
    canBuild: '', missing: '', howToBuild: '',
  };
}

function hasIcpContent(icp: IcpData): boolean {
  return Object.values(icp).some(v => v && v.length > 0);
}

function hasMoatContent(moat: MoatData): boolean {
  return Object.values(moat).some(v => v && v.length > 0);
}

export function parseStackAiReport(raw: string): ParsedReport {
  let text = raw.replace(/\r\n/g, '\n');
  const data = {} as ParsedReport;
  data.icp = emptyIcp();
  data.moat = emptyMoat();
  data.competitorsTable = null;

  // Decision & Confidence
  data.decision = cleanString(/Decision\*?\*?:\*?\*?\s*(.*?)(?=\n|$)/i.exec(text)?.[1] || "NO");
  data.confidence = parseInt(/Confidence\*?\*?:\*?\*?\s*(\d+)/i.exec(text)?.[1] || "5", 10);
  data.oneLine = cleanString(/In one line\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\n|---|\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?1\.)/i.exec(text)?.[1]);

  // ─── Sections by title (number-agnostic) with numbered fallbacks ───
  const claritySection =
    extractNamedSection(text, /CLARITY\s*CHECK|CLARITY/) ||
    extractSectionContent(text, /(?:#\s*)?1\.[ \w()]+/, /(?:#\s*)?2\./);

  data.realProblem = cleanString(/Real Problem\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Who actually)/i.exec(claritySection)?.[1]);
  data.whoCares = cleanString(/Who actually cares\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?What they use)/i.exec(claritySection)?.[1]);
  data.whatTheyUse = cleanString(/What they use today\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Why your idea)/i.exec(claritySection)?.[1]);
  data.whyDifferent = cleanString(/Why your idea is different\*?\*?:\*?\*?\s*([\s\S]*?)$/i.exec(claritySection)?.[1]);

  const marketSection =
    extractNamedSection(text, /MARKET\s*(?:TRUTH|REALITY)/) ||
    extractSectionContent(text, /(?:#\s*)?2\.[ \w()]+/, /(?:#\s*)?3\./);

  data.marketReality = cleanString(/fantasy\*?\*?\?\*?\*?\s*(?:Real market, wrong approach\.)?\n*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?TAM)/i.exec(marketSection)?.[1]);
  if (!data.marketReality) {
      data.marketReality = cleanString(marketSection.split(/\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?TAM/)[0].replace(/.*fantasy\?\s*/i, ''));
  }
  data.tam = cleanString(/TAM\*?\*?(?:\s*\(rough.*?\))?\*?\*?:\*?\*?\s*\n?([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Who actually)/i.exec(marketSection)?.[1]);
  data.whoPays = cleanString(/Who actually pays\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Hard truth)/i.exec(marketSection)?.[1]);
  data.hardTruth = cleanString(/Hard truth\*?\*?:\*?\*?\s*([\s\S]*?)$/i.exec(marketSection)?.[1]);

  // ─── ICP ───
  const icpSection = extractNamedSection(text, /IDEAL\s*CUSTOMER\s*PROFILE|\(ICP\)|\bICP\b/);
  if (icpSection) {
    const next = (labels: string) =>
      new RegExp(`\\n\\s*(?:[-*]\\s*)?(?:\\*\\*)?(?:${labels})`, 'i');

    data.icp.summary = extractLabeledField(
      icpSection,
      /Who is your exact target customer\??/,
      next('Demographics|Industry')
    ) || cleanString(icpSection.split(/\n\s*(?:Demographics|Industry)/i)[0]);

    data.icp.demographics = extractLabeledField(
      icpSection,
      /Demographics\s*\/?\s*Firmographics/,
      next("Industry|Customer'?s?\\s+biggest|Buying")
    );
    data.icp.industry = extractLabeledField(
      icpSection,
      /Industry\s*\/?\s*Geography/,
      next("Customer'?s?\\s+biggest|Buying|Pain")
    );
    data.icp.painPoint = extractLabeledField(
      icpSection,
      /Customer'?s?\s+biggest\s+pain\s+point/,
      next('Buying\\s+triggers|Price|Who\\s+uses')
    );
    data.icp.buyingTriggers = extractLabeledField(
      icpSection,
      /Buying\s+triggers/,
      next('Price|Who\\s+uses|Why\\s+would')
    );
    // Price is often inline: "Price ≤ 80-100 per bottle" (no colon / separate body)
    data.icp.price = cleanString(
      /(?:^|\n)\s*(?:\*\*)?Price\s*:?\s*((?:≤|<=)?\s*[^\n]+)/i.exec(icpSection)?.[1]
    );
    data.icp.whoUsesVsPays = extractLabeledField(
      icpSection,
      /Who uses the product vs\.?\s*who pays\??/,
      next('Why\\s+would|Where\\s+can')
    );
    data.icp.whyChoose = extractLabeledField(
      icpSection,
      /Why would they choose this product\??/,
      next('Where\\s+can\\s+you\\s+find')
    );
    data.icp.whereFind = extractLabeledField(
      icpSection,
      /Where can you find these customers\??/,
      /\n#{1,3}\s*\d+\./
    );

    if (!hasIcpContent(data.icp)) {
      data.icp.summary = cleanString(icpSection);
    }
  }

  // ─── COMPETITION (never assume it's section 3 — ICP often is) ───
  const compSection =
    extractNamedSection(text, /COMPETITION|REAL\s+COMPETITORS/) ||
    // Legacy only if no ICP stole slot 3
    (!icpSection ? extractSectionContent(text, /(?:#\s*)?3\.[ \w()]+/, /(?:#\s*)?4\./) : "");

  data.competitors = [];
  const whyLoseSplit = compSection.split(/→\s*|Why you lose by default:/i);
  const competitorBody = whyLoseSplit[0] || "";

  const table = parseMarkdownTable(competitorBody);
  if (table) {
    data.competitorsTable = table;
    const [h0, h1, h2] = table.headers;
    table.rows.forEach(cols => {
      const name = (cols[0] || '').replace(/^[#\-\s\d.]*/, '').trim();
      const whatTheyDo = cols[1] || '';
      const whyHard = cols[2] || '';
      const detailsParts: string[] = [];
      if (whatTheyDo) detailsParts.push(`**${h1 || 'What they do'}:** ${whatTheyDo}`);
      if (whyHard) detailsParts.push(`**${h2 || "Why they're hard to beat"}:** ${whyHard}`);
      // Extra columns
      for (let i = 3; i < cols.length; i++) {
        if (cols[i]) detailsParts.push(`**${table.headers[i] || 'Info'}:** ${cols[i]}`);
      }
      if (name) {
        data.competitors.push({
          name,
          whatTheyDo,
          whyHard,
          details: detailsParts.join('\n\n'),
        });
      }
    });
  } else {
      const compList = competitorBody.replace(/Real competitors:?/i, '').trim().split(/\n\n+/);
      compList.forEach(block => {
          let name = "Competitor";
          let details = block.trim();
          if (!details || details.startsWith('|')) return;

          const boldMatch = block.match(/^[#\-\s\d.]*\*\*(.*?)\*\*/);
          if (boldMatch && boldMatch[1].trim().length > 0) {
              name = boldMatch[1].trim();
              details = block.replace(boldMatch[0], '').replace(/^[\s\-:]+/, '').trim() || details;
          } else {
              const lines = block.split('\n');
              if (lines.length > 1) {
                  name = lines[0].replace(/^[#\-\s\d.]+/, '').trim();
                  details = lines.slice(1).join('\n').trim();
              }
          }
          name = name.replace(/[\*#]/g, '').trim();
          if (details.replace(/[\*# \t-]/g, '').length === 0) return;
          if (details.length > 0 && name.length > 0) {
              data.competitors.push({ name, whatTheyDo: '', whyHard: '', details });
          }
      });
  }

  data.whyYouLose = whyLoseSplit.length > 1
    ? cleanString(whyLoseSplit.slice(1).join('\n').replace(/Why you lose by default\*?\*?:\*?\*?\s*/i, ''))
    : "";

  // ─── HOW TO WIN ───
  let winSection =
    extractNamedSection(text, /(?:HOW|WAY)\s*(?:TO|YOU)\s*WIN|WIN\s*ANGLE/) ||
    extractSectionContent(text, /(?:#\s*)?4\.[ \w()]+/, /(?:#\s*)?5\./);

  // Strip accidental competitor tables that landed in win (mis-numbered reports)
  if (/Real competitors/i.test(winSection) && /\|/.test(winSection) && data.competitors.length === 0) {
    const leaked = parseMarkdownTable(winSection);
    if (leaked) {
      data.competitorsTable = leaked;
      leaked.rows.forEach(cols => {
        const name = (cols[0] || '').trim();
        if (name) {
          data.competitors.push({
            name,
            whatTheyDo: cols[1] || '',
            whyHard: cols[2] || '',
            details: [cols[1], cols[2]].filter(Boolean).join('\n\n'),
          });
        }
      });
    }
  }

  data.ideaDead = cleanString(/If this is missing[^:]*\*?\*?:\*?\*?\s*\n?([\s\S]*?)$/i.exec(winSection)?.[1]);
  if (data.ideaDead) {
      winSection = winSection.substring(0, winSection.search(/If this is missing/i)).trim();
  }

  data.winOptions = [];
  let hasOpts = false;
  let m;

  const optRegex = /(?:\*\*Option\s+[A-Z\d]+:?\*\*?|Option\s+[A-Z\d]+:?)\s*\n?([^\n]*)\n([\s\S]*?)(?=\n(?:(?:\*\*?)?Option\s+[A-Z\d]+)|$)/gi;
  while ((m = optRegex.exec(winSection)) !== null) {
      let title = cleanString(m[1]).replace(/\*\*/g, '');
      let details = cleanString(m[2]);
      if (!title && details) title = "Strategy";
      if (title || details) {
         data.winOptions.push({ title: title || "Strategy", details });
         hasOpts = true;
      }
  }

  if (!hasOpts) {
      const listSplit = winSection.split(/^(?:\d+\.\s+|\*\*?\d+\.\*\*?\s+)/m);
      if (listSplit.length > 1) {
          data.winAngle = cleanString(listSplit[0].replace(/The ONE angle[^:]*\*?\*?:\*?\*?\s*/i, ''));
          for (let i = 1; i < listSplit.length; i++) {
              const itemText = listSplit[i].trim();
              if (itemText.length === 0) continue;
              const titleMatch = itemText.match(/^([^\n]+?)\n([\s\S]*)$/);
              let title = `Strategy ${i}`;
              let details = itemText;
              if (titleMatch) {
                  title = titleMatch[1].trim().replace(/\*\*/g, '');
                  details = titleMatch[2].trim();
              } else {
                  title = itemText.replace(/\*\*/g, '');
                  details = '';
              }
              if (title.length > 0 || details.length > 0) {
                 data.winOptions.push({ title, details });
                 hasOpts = true;
              }
          }
      }
  }

  if (!hasOpts) {
      const thenMatch = /\*?\*?Then\*?\*?:\*?\*?\s*\n([\s\S]*?)$/i.exec(winSection);
      if (thenMatch && thenMatch[1]) {
          const bullets = thenMatch[1].split(/\n+(?=- |\* |\d+\. )/);
          bullets.forEach(b => {
              const cleaned = cleanString(b.replace(/^[-*]\s*/, ''));
              if (cleaned.length > 5) {
                  data.winOptions.push({ title: "Strategy", details: cleaned });
                  hasOpts = true;
              }
          });
          data.winAngle = cleanString(winSection.substring(0, winSection.search(/\*?\*?Then:/i)).replace(/The ONE angle[^:]*\*?\*?:\*?\*?\s*/i, ''));
      } else {
          data.winAngle = cleanString(winSection.replace(/The ONE angle[^:]*\*?\*?:\*?\*?\s*/i, ''));
      }
  }

  if (hasOpts && !data.winAngle) {
       const angleMatch = winSection.split(/\n\*?\*?(?:Option|1\.|Then:)/i)[0];
       data.winAngle = cleanString(angleMatch.replace(/The ONE angle[^:]*\*?\*?:\*?\*?\s*/i, ''));
  }

  // Strip raw competitor table blobs from winAngle display
  if (data.winAngle && /Real competitors/i.test(data.winAngle) && data.winAngle.includes('|')) {
    data.winAngle = cleanString(
      data.winAngle
        .replace(/Real competitors:?[\s\S]*?(?=\n\n[A-Z]|\n\*\*|$)/i, '')
        .replace(/\|[^\n]+\|[\s\S]*?(?=\n\n|$)/g, '')
    );
  }

  // ─── FAILURES ───
  const failSection =
    extractNamedSection(text, /FAILURES?(?:\s+PATTERNS?)?|FAILURE\s+MODES?/) ||
    extractSectionContent(text, /(?:#\s*)?\d+\.\s+[^\n]*FAILURE[^\n]*/i, /(?:#\s*)?\d+\.\s+/);
  data.failurePattern = cleanString(
    /(?:Real\s+)?failure\s+pattern\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:[-*•]|\d+\.)?\s*(?:\*\*)?(?:The\s+trap|Trap\b)|$)/i.exec(failSection)?.[1]
  );
  data.trap = cleanString(
    /(?:The\s+)?trap(?:\s+you'?re\s+about\s+to\s+fall\s+into)?\*?\*?:\*?\*?\s*([\s\S]*?)$/i.exec(failSection)?.[1]
  );
  // If labels missed but section exists, keep raw body so the card isn't empty
  if (failSection && !data.failurePattern && !data.trap) {
    data.failurePattern = cleanString(failSection);
  }

  // ─── MONEY ───
  const moneySection =
    extractNamedSection(text, /MONEY\s*REALITY/) ||
    extractSectionContent(text, /(?:#\s*)?\d+\.\s+[^\n]*MONEY[^\n]*/i, /(?:#\s*)?\d+\.\s+/);
  data.moneyWhoPays = cleanString(/Who pays\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?How much)/i.exec(moneySection)?.[1]);
  data.moneyHowMuch = cleanString(/How much they pay\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Why they)/i.exec(moneySection)?.[1]);
  data.moneyWhyNot = cleanString(/Why they might NOT pay\*?\*?:\*?\*?\s*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?(?:Biggest risk|→\s*Biggest risk))/i.exec(moneySection)?.[1]);
  data.moneyRisk = cleanString(/(?:Biggest risk|→\s*Biggest risk)\*?\*?:\*?\*?\s*([\s\S]*?)$/i.exec(moneySection)?.[1]);

  // ─── MOAT ───
  const moatSection = extractNamedSection(text, /\bMOAT\b|WHY YOU CAN WIN/);
  if (moatSection) {
    const next = (labels: string) =>
      new RegExp(`\\n\\s*(?:[-*•]\\s*)?(?:\\*\\*)?(?:${labels})`, 'i');

    data.moat.potential = extractLabeledField(
      moatSection,
      /(?:What is your potential MOAT|Potential MOAT|Your potential MOAT)\??/,
      next('What makes your idea|Do you have any|Can you build|What is missing|How can you build')
    );
    data.moat.hardToCopy = extractLabeledField(
      moatSection,
      /What makes your idea difficult to copy\??/,
      next('Do you have any|Can you build|What is missing|How can you build')
    );
    data.moat.existingAdvantage = extractLabeledField(
      moatSection,
      /Do you have any existing competitive advantage\??/,
      next('Can you build|What is missing|How can you build')
    );
    data.moat.canBuild = extractLabeledField(
      moatSection,
      /Can you build a defensible advantage\??/,
      next('What is missing|How can you build')
    );
    data.moat.missing = extractLabeledField(
      moatSection,
      /What is missing in your current MOAT\??/,
      next('How can you build')
    );
    data.moat.howToBuild = cleanString(
      /How can you build a sustainable competitive advantage\??\s*:?\s*\n?([\s\S]*)$/i.exec(moatSection)?.[1]
    );

    // If structured parse failed entirely, show the raw section
    if (!hasMoatContent(data.moat)) {
      data.moat.potential = cleanString(moatSection);
    }
  }

  // ─── FIRST 10 USERS ───
  const usersSection =
    extractNamedSection(text, /FIRST\s*10\s*USERS|FIRST\s*TEN\s*USERS/) ||
    (!moatSection ? extractSectionContent(text, /(?:#\s*)?7\.[ \w()— \-]+/, /(?:#\s*)?8\./) : "");
  data.exactPeople = cleanString(/EXACT people\*?\*?:\*?\*?\s*\n?([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Where to find)/i.exec(usersSection)?.[1]);
  data.whereFind = cleanString(/Where to find them\*?\*?:\*?\*?\s*\n?([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Why they would)/i.exec(usersSection)?.[1]);
  data.whySayYes = cleanString(/Why they would say YES immediately\*?\*?:\*?\*?\s*\n?([\s\S]*?)$/i.exec(usersSection)?.[1]);

  // ─── 72 HOURS ───
  const hoursSection =
    extractNamedSection(text, /72\s*HOURS|NEXT\s*72/) ||
    extractSectionContent(text, /(?:#\s*)?8\.[ \w()]+/, /(?:#\s*)?9\./);
  data.steps = [];
  const stepRegex = /Step \d+\*?\*?:\*?\*?\s*\n*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?(?:Step \d+|Must include)|$)/gi;
  while ((m = stepRegex.exec(hoursSection)) !== null) {
      data.steps.push({ title: 'Step', details: cleanString(m[1]) });
  }
  if (data.steps.length === 0) {
      const splitSteps = hoursSection.split(/Step \d+:\s*/i).filter(Boolean);
      splitSteps.forEach(s => {
          if(!s.trim().toLowerCase().startsWith("must include") && cleanString(s).length > 5) {
              data.steps.push({ title: "Step", details: cleanString(s)});
          }
      });
  }
  data.mustInclude = cleanString(/Must include\*?\*?:\*?\*?\s*\n*(?:→\s*)?([\s\S]*?)$/i.exec(hoursSection)?.[1]);

  // ─── SIGNALS ───
  const continueSection =
    extractNamedSection(text, /CONTINUE\s*(?:IF|→)|GREEN/) ||
    extractSectionContent(text, /(?:#\s*)?9\.[ \w()→ ]+/, /(?:#\s*)?10\./);
  const stopSection =
    extractNamedSection(text, /STOP\s*(?:IF|→)|RED\s*FLAG/) ||
    extractSectionContent(text, /(?:#\s*)?10\.[ \w()→ ]+/, /(?:#\s*)?11\./);

  const extractSignals = (txt: string) => {
     const sigs: string[] = [];
     const sr = /Signal \d+\*?\*?:\*?\*?\s*\n*([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Signal|$)/gi;
     while((m = sr.exec(txt))!==null) sigs.push(cleanString(m[1]));
     return sigs;
  };
  data.continueSignals = extractSignals(continueSection);
  data.stopSignals = extractSignals(stopSection);

  // ─── SMARTER VERSION ───
  const smarterSection =
    extractNamedSection(text, /SMARTER\s*VERSION|PIVOT/) ||
    extractSectionContent(text, /(?:#\s*)?11\.[ \w()+ ]+/, /(?:#\s*)?12\./);
  data.smarterVersion = cleanString(smarterSection.replace(/Version that has higher chance of working:\n*/i, ''));

  // ─── FINAL ───
  const finalSection =
    extractNamedSection(text, /FINAL\s*SCORE|SCORECARD/) ||
    extractSectionContent(text, /(?:#\s*)?12\.[ \w()+ ]+/, /FINAL VERDICT:/i);
  const verdictIndex = text.search(/FINAL VERDICT:/i);
  const verdictSection = verdictIndex !== -1 ? text.substring(verdictIndex) : "";

  const scoreSearchArea = finalSection || text;
  data.survivalProb = extractScoreFromText(scoreSearchArea, /survival/i);
  data.marketScore = extractScoreFromText(scoreSearchArea, /market/i);
  data.compScore = extractScoreFromText(scoreSearchArea, /(?:comp|competition)/i);
  data.monetizationScore = extractScoreFromText(scoreSearchArea, /monetiz/i);

  let verdictText = "";
  if (verdictSection) {
      const verdictLines = verdictSection.split('\n').map(l => l.trim()).filter(Boolean);
      const mainVerdictLine = verdictLines.find(l => l.startsWith('→') || l.startsWith('"') || l.toLowerCase().includes('idea because') || l.toLowerCase().includes('verdict is'));

      if (mainVerdictLine) {
          verdictText = mainVerdictLine.replace(/^[→"'\s]+|["'\s]+$/g, '');
      } else {
          const filteredLines = verdictLines.filter(l =>
              !l.toLowerCase().includes('final verdict') &&
              !l.toLowerCase().includes('evaluation') &&
              !l.match(/^\*\*[^*]+\*\*$/)
          );
          if (filteredLines.length > 0) {
              verdictText = filteredLines[0].replace(/^[→"'\s]+|["'\s]+$/g, '');
          }
      }
  }

  data.finalVerdictText = cleanString(verdictText) || data.oneLine || "Analysis indicates significant pivots are required.";
  data.brutalTruth = cleanString(/The brutal truth\*?\*?:\*?\*?\s*\n?([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?What you should actually do|\nWhat you should do)/i.exec(verdictSection)?.[1]);
  data.whatShouldDo = cleanString(/What you should(?: actually)? do\*?\*?:\*?\*?\s*\n?([\s\S]*?)(?=\n\s*(?:\*|-|\d+\.)?\s*(?:\*\*)?Stop building|\nYou have 72 hours|$)/i.exec(verdictSection)?.[1]);

  return data as ParsedReport;
}

export { hasIcpContent, hasMoatContent };
