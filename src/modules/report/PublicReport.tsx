import { useEffect, useState } from 'react';
import ReportFrame, { type ReportAnswers } from '../idea/ReportFrame';
import { loadSharedReport } from '../idea/ideaApi';

function tokenFromPath() {
  return decodeURIComponent(window.location.pathname.replace(/^\/report\/?/, '').replace(/\/$/, ''));
}

export default function PublicReport() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [answers, setAnswers] = useState<ReportAnswers | null>(null);

  useEffect(() => {
    const token = tokenFromPath();
    document.title = 'Shared report · Productica';
    if (!token) {
      setState('error');
      setMessage('This report link is missing.');
      return;
    }
    let alive = true;
    loadSharedReport(token)
      .then(report => {
        if (!alive) return;
        setMarkdown(report.markdown);
        setAnswers({
          startupName: report.startupName,
          idea: report.idea,
          audience: report.audience,
          different: report.different,
          stage: report.stage,
          revenue: report.revenue || '',
          deckName: report.deckName,
        });
        document.title = `${report.title || report.startupName || 'Report'} · Productica`;
        setState('ready');
      })
      .catch(e => {
        if (!alive) return;
        setMessage((e as Error).message);
        setState('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" aria-label="Loading report" />
      </div>
    );
  }

  if (state === 'error' || !answers) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="max-w-md">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Productica</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight">This link does not open a report</h1>
          <p className="mt-3 text-sm text-white/50">{message || 'Ask the person who sent it for a new link.'}</p>
        </div>
      </div>
    );
  }

  return <ReportFrame markdown={markdown} answers={answers} />;
}
