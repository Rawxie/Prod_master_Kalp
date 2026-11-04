import { grantsHref, ideaHref, markWorkspaceOpen } from './landingGate';

const company = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/#contact' },
  { label: 'Privacy Policy', href: '/terms#privacy' },
  { label: 'Terms', href: '/terms' },
];

const socials = [
  { label: 'Twitter', href: 'https://x.com/Productica_in' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/productica-ai/' },
  { label: 'Instagram', href: 'https://www.instagram.com/productica.in/' },
];

export default function ProducticaFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <a href="/" className="inline-flex items-center gap-2">
              <img src="/8.png" alt="" className="w-6 h-6 rounded-md object-cover" />
              <span className="text-sm font-semibold tracking-tight">Productica</span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
              Tools and insights to help founders validate ideas, discover opportunities, and build smarter.
            </p>
          </div>

          <nav aria-label="Tools">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Tools</p>
            <ul className="mt-4 grid gap-2.5">
              <li>
                <a href={ideaHref()} onClick={markWorkspaceOpen} className="text-sm text-white/70 hover:text-white transition-colors">
                  Idea Validation
                </a>
              </li>
              <li>
                <a href={grantsHref()} onClick={markWorkspaceOpen} className="text-sm text-white/70 hover:text-white transition-colors">
                  Grant Matching
                </a>
              </li>
            </ul>
          </nav>
          <FooterColumn title="Company" links={company} />
          <FooterColumn title="Social" links={socials} external />
        </div>

        <p className="mt-12 pt-6 border-t border-white/10 text-xs font-mono text-white/35">
          © {new Date().getFullYear()} Productica
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links, external }: { title: string; links: { label: string; href: string }[]; external?: boolean }) {
  return (
    <nav aria-label={title}>
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">{title}</p>
      <ul className="mt-4 grid gap-2.5">
        {links.map(link => (
          <li key={link.label}>
            <a
              href={link.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
