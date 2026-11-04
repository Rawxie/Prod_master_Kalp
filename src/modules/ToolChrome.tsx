import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, History, LogOut, Moon, Plus, Sun } from 'lucide-react';
import { grantsHref, ideaHref, markWorkspaceOpen } from './venture/landingGate';
import { useVentureTheme } from './venture/theme';

export interface ChromeAction {
  href: string;
  label: string;
  tone?: 'primary' | 'quiet';
}

interface Props {
  active: 'idea' | 'grants';
  account?: string | null;
  onSignOut: () => void;
  actions?: ChromeAction[];
  children?: ReactNode;
}

const TOOLS = [
  { id: 'idea' as const, label: 'Validate', hint: 'Score an idea', href: ideaHref },
  { id: 'grants' as const, label: 'Grants', hint: 'Find funding', href: grantsHref },
];

export default function ToolChrome({ active, account, onSignOut, actions = [], children }: Props) {
  return (
    <header className="vl-bar">
      <div className="vl-bar-row">
        <a href="/" className="vl-brand">
          <span>Productica</span>
          <strong>VentureLab</strong>
        </a>

        <nav className="vl-switch" aria-label="VentureLab tools">
          {TOOLS.map(tool => {
            const on = active === tool.id;
            return (
              <a
                key={tool.id}
                href={tool.href()}
                onClick={markWorkspaceOpen}
                aria-current={on ? 'page' : undefined}
                className={on ? 'on' : undefined}
              >
                <span className="vl-switch-label">{tool.label}</span>
                <small>{tool.hint}</small>
              </a>
            );
          })}
        </nav>

        <div className="vl-bar-actions">
          {actions.map(action => (
            <a key={action.href + action.label} href={action.href} className={`vl-act ${action.tone === 'primary' ? 'primary' : 'quiet'}`}>
              {action.tone === 'primary' ? <Plus size={14} /> : <History size={14} />}
              <span>{action.label}</span>
            </a>
          ))}
          {children}
          <AccountMenu account={account} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}

function AccountMenu({ account, onSignOut }: { account?: string | null; onSignOut: () => void }) {
  const { theme, toggle } = useVentureTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = account?.trim() || 'Account';
  const initial = name.replace(/^@/, '').slice(0, 1).toUpperCase() || 'A';

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="vl-account" ref={ref}>
      <button
        type="button"
        className="vl-account-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(v => !v)}
      >
        <span className="vl-avatar" aria-hidden>{initial}</span>
        <span className="vl-account-name">{name}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="vl-menu" role="menu">
          <p className="vl-menu-label">Signed in as {name}</p>
          <button type="button" role="menuitem" onClick={() => { toggle(); setOpen(false); }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            {theme === 'light' && <Check size={14} className="vl-menu-check" />}
          </button>
          <button
            type="button"
            role="menuitem"
            className="danger"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
