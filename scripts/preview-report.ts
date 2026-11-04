import { readFileSync, writeFileSync } from 'node:fs'
import { parseIdeaReport } from '../src/modules/idea/report/parseReport'
import { buildReportDocument } from '../src/modules/idea/report/buildReportHtml'

const src = process.argv[2] || 'docs/pickaxe/example_report_tutorflex.md'
const raw = readFileSync(src, 'utf8')
const md = raw.includes('\n---\n') ? raw.slice(raw.indexOf('\n---\n') + 5) : raw
const { data, warnings } = parseIdeaReport(md)
if (warnings.length) console.warn(warnings.join('\n'))
const mkt = (data.mkt || []).map((r: string[]) => `${r[0]}=${r[2]}`).join(', ')
if (/reachable|competitive intensity|sales cycle/i.test(mkt)) {
  throw new Error(`Market table is IQ factors, not TAM/SAM/SOM: ${mkt}`)
}
if (!/TAM/i.test((data.mkt || []).map((r: string[]) => r[0]).join(' '))) {
  throw new Error(`Market table missing TAM: ${JSON.stringify(data.mkt)}`)
}
const html = buildReportDocument(data, { grantsHref: '/grants' })
const cites = (html.match(/class="cite-b"/g) || []).length
if (!(data.sources && data.sources.length)) throw new Error('SOURCES did not parse')
if (cites < 3) throw new Error(`expected hover citation badges, got ${cites}`)
writeFileSync('public/report-preview.html', html)
console.log('wrote public/report-preview.html from', src, 'name=', data.name, 'verdict=', data.verdict, 'iq=', data.iq, 'mkt=', mkt, 'sources=', data.sources.length, 'cites=', cites)
