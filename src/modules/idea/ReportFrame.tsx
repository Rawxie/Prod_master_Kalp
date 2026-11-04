import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Link2 } from 'lucide-react';
import { markWorkspaceOpen } from '../venture/landingGate';
import { ideaApi } from './ideaApi';
import { parseIdeaReport } from './report/parseReport';
import { buildReportDocument } from './report/buildReportHtml';
import type { IdeaAnswers } from './types';

export interface ReportAnswers extends IdeaAnswers {
  deckName?: string | null;
}

interface Props {
  markdown: string;
  answers?: ReportAnswers;
  reportId?: string;
  grantsHref?: string;
  onBack?: () => void;
  canShare?: boolean;
}

export default function ReportFrame({ markdown, answers, reportId, grantsHref, onBack, canShare = false }: Props) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [answersOpen, setAnswersOpen] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [shareError, setShareError] = useState('');
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { doc, warnings } = useMemo(() => {
    const { data, warnings } = parseIdeaReport(markdown);
    return { doc: buildReportDocument(data, { grantsHref }), warnings };
  }, [markdown, grantsHref]);

  useEffect(() => {
    if (warnings.length) console.warn('[idea-report] parse warnings:', warnings);
  }, [warnings]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const share = async () => {
    if (!reportId) return;
    setShareBusy(true);
    setShareError('');
    try {
      const { url } = shareUrl ? { url: shareUrl } : await ideaApi.share(reportId);
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    } catch (e) {
      setShareError((e as Error).message);
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white">
      <div className="h-14 flex-none flex items-center justify-between gap-3 px-4 md:px-6 border-b border-white/10">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Validate
          </button>
        ) : (
          <a href="/" className="text-xs font-mono uppercase tracking-widest text-white/50 hover:text-white">Productica</a>
        )}
        <div className="flex items-center gap-2">
          {answers && (
            <button
              type="button"
              onClick={() => setAnswersOpen(v => !v)}
              aria-pressed={answersOpen}
              className={`text-xs font-semibold rounded-full border px-4 py-1.5 transition-colors ${answersOpen ? 'border-white bg-white text-black' : 'border-white/15 text-white/70 hover:text-white'}`}
            >
              Your answers
            </button>
          )}
          {grantsHref && (
            <a href={grantsHref} onClick={markWorkspaceOpen} className="hidden sm:flex items-center gap-2 text-xs font-semibold rounded-full bg-white text-black px-4 py-1.5 hover:bg-white/90 transition-colors">
              Grants <ArrowRight size={14} />
            </a>
          )}
          {canShare && reportId && (
            <button
              type="button"
              onClick={() => void share()}
              disabled={shareBusy}
              className="flex items-center gap-2 text-xs font-semibold rounded-full border border-white/15 px-4 py-1.5 text-white/80 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
            >
              {copied ? <Check size={14} /> : <Link2 size={14} />}
              {shareBusy ? 'Creating link…' : copied ? 'Link copied' : 'Share link'}
            </button>
          )}
        </div>
      </div>
      {shareUrl && (
        <div className="flex-none border-b border-white/10 px-4 md:px-6 py-3 bg-white/[0.03]">
          <p className="text-xs text-white/45">Anyone with this link can read the report. Send it the same way you would share a chat.</p>
          <div className="mt-2 flex gap-2">
            <input readOnly value={shareUrl} className="min-w-0 flex-1 bg-transparent border border-white/15 rounded-full px-4 py-2 text-sm text-white/80 outline-none" onFocus={e => e.currentTarget.select()} />
            <button type="button" onClick={() => void share()} className="rounded-full bg-white text-black text-xs font-semibold px-4">{copied ? 'Copied' : 'Copy'}</button>
          </div>
        </div>
      )}
      {shareError && <p role="alert" className="flex-none px-6 py-2 text-sm text-red-400">{shareError}</p>}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {answers && answersOpen && <AnswersPanel answers={answers} />}
        <iframe ref={ref} title="Idea validation report" srcDoc={doc} className="flex-1 w-full min-h-0 border-0 bg-white" />
      </div>
    </div>
  );
}

function AnswersPanel({ answers }: { answers: ReportAnswers }) {
  const rows = [
    ['Startup', answers.startupName],
    ['Idea', answers.idea],
    ['Audience', answers.audience],
    ['What is different', answers.different],
    ['Stage', answers.stage],
    ...(answers.stage === 'Generating revenue' || answers.revenue ? [['Revenue', answers.revenue || 'Not added'] as [string, string]] : []),
    ['Pitch deck', answers.deckName || 'None attached'],
  ];
  return (
    <aside className="md:w-[320px] md:flex-none max-h-[38vh] md:max-h-none overflow-y-auto border-b md:border-b-0 md:border-r border-white/10 bg-black px-5 py-5">
      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Submitted inputs</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">What you asked us to judge</h2>
      <p className="mt-1 text-xs text-white/40 leading-relaxed">Keep this open while you read the report, so the score stays next to the words you wrote.</p>
      <dl className="mt-5 grid gap-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">{label}</dt>
            <dd className="mt-1 text-sm text-white/80 whitespace-pre-wrap break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
