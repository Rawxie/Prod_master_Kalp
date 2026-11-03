import type { ReactNode, SVGProps } from 'react';
import { ArrowRight } from 'lucide-react';
import ProducticaFooter from './ProducticaFooter';

type Icon = (props: SVGProps<SVGSVGElement>) => ReactNode;

interface Card {
  title: string;
  body: string;
  icon: Icon;
}

interface Step {
  n: string;
  title: string;
  body: string;
}

interface Story {
  kicker: string;
  introTitle: string;
  introBody: string;
  facts: { label: string; value: string }[];
  audienceTitle: string;
  audiences: Card[];
  helpTitle: string;
  benefits: Card[];
  stepsTitle: string;
  steps: Step[];
  closeTitle: string;
  closeBody: string;
  cta: string;
  visual: ReactNode;
}

function glyph(props: SVGProps<SVGSVGElement>, paths: ReactNode) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className="h-[22px] w-[22px]" {...props}>
      {paths}
    </svg>
  );
}

const stroke = { stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const IconNotebook = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <rect x="7" y="5" width="16" height="22" rx="2" {...stroke} />
  <path d="M11 5v22M15 11h5M15 16h5M15 21h3" {...stroke} />
</>);

const IconFork = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <circle cx="9" cy="8" r="2.5" {...stroke} />
  <circle cx="23" cy="8" r="2.5" {...stroke} />
  <circle cx="16" cy="24" r="2.5" {...stroke} />
  <path d="M9 10.5V14c0 2 3.1 4 7 4M23 10.5V14c0 2-3.1 4-7 4M16 18v3.5" {...stroke} />
</>);

const IconLayers = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <path d="M5 13l11-6 11 6-11 6L5 13Z" {...stroke} />
  <path d="M5 18l11 6 11-6" {...stroke} />
</>);

const IconMarket = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <path d="M6 24V12M13 24V8M20 24v-9M27 24V10" {...stroke} />
  <path d="M6 16c3.2-4 7-1.5 10.5-5.5 3.8 1.8 6.5 5 10.5-1" {...stroke} />
</>);

const IconOverlap = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <rect x="5" y="8" width="14" height="16" rx="2" {...stroke} />
  <rect x="13" y="8" width="14" height="16" rx="2" {...stroke} />
</>);

const IconScore = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <circle cx="16" cy="16" r="10" {...stroke} />
  <path d="M16 16L16 8" {...stroke} />
  <path d="M16 16l6 4" {...stroke} />
</>);

const IconNext = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <rect x="6" y="7" width="14" height="18" rx="2" {...stroke} />
  <path d="M10 12h6M10 16h6M10 20h4M22 14l4 4-4 4" {...stroke} />
</>);

const IconId = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <rect x="5" y="9" width="22" height="14" rx="2" {...stroke} />
  <circle cx="12" cy="16" r="2.2" {...stroke} />
  <path d="M16.5 14.5h7M16.5 18h5" {...stroke} />
</>);

const IconProto = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <rect x="8" y="6" width="16" height="20" rx="2.5" {...stroke} />
  <path d="M12 11h8M12 15h8M12 19h5" {...stroke} />
  <circle cx="16" cy="23.5" r="0.8" fill="currentColor" />
</>);

const IconCircuit = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <rect x="6" y="6" width="20" height="20" rx="3" {...stroke} />
  <circle cx="12" cy="12" r="1.6" {...stroke} />
  <circle cx="20" cy="12" r="1.6" {...stroke} />
  <circle cx="16" cy="20" r="1.6" {...stroke} />
  <path d="M13.6 12h4.8M12 13.6V16c0 2 1.8 4 4 4" {...stroke} />
</>);

const IconStore = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <path d="M6 13l1.5-6h17L26 13" {...stroke} />
  <path d="M7 13v11h18V13" {...stroke} />
  <path d="M6 13c1.4 2 3.4 3 5.5 3S16 15 17.5 13 21 10 23.5 13 26 16 26 13" {...stroke} />
  <path d="M14 24v-6h4v6" {...stroke} />
</>);

const IconFilter = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <path d="M7 8h18l-6.5 8v7l-5 2v-9L7 8Z" {...stroke} />
</>);

const IconBadge = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <circle cx="16" cy="14" r="7" {...stroke} />
  <path d="M13 14.2l2 2 4-4M11 22l5-2 5 2" {...stroke} />
</>);

const IconColumns = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <rect x="5" y="7" width="9" height="18" rx="1.5" {...stroke} />
  <rect x="18" y="7" width="9" height="18" rx="1.5" {...stroke} />
  <path d="M8 12h3M8 16h3M21 12h3M21 16h3" {...stroke} />
</>);

const IconOfficial = (p: SVGProps<SVGSVGElement>) => glyph(p, <>
  <path d="M7 26V12l9-5 9 5v14" {...stroke} />
  <path d="M12 26v-8h8v8" {...stroke} />
  <path d="M12 16h8" {...stroke} />
</>);

const idea: Story = {
  kicker: 'Idea validation',
  introTitle: 'Every great startup begins with an idea. Start by validating yours.',
  introBody:
    "Productica's AI-powered Idea Validation Tool helps you evaluate your startup idea before investing significant time and resources. Explore your market, understand your competition, identify your target audience, and discover potential opportunities to make more informed decisions.",
  facts: [
    { label: 'You share', value: 'Name, idea, audience, what is different, and stage. A pitch deck is optional.' },
    { label: 'You get', value: 'A scored report with a verdict — build, test first, pivot, or park — and a Syncoro IQ.' },
    { label: 'Then', value: 'The same answers can go into Grants, so you do not describe the venture twice.' },
  ],
  audienceTitle: 'Built for people who dare to build.',
  audiences: [
    { icon: IconNotebook, title: 'Aspiring Entrepreneurs', body: "Have a business idea but don't know where to start? Explore its potential before taking the leap." },
    { icon: IconId, title: 'Student Innovators', body: 'Evaluate college startup ideas, innovation projects, and entrepreneurial concepts with greater clarity.' },
    { icon: IconFork, title: 'Early-Stage Founders', body: 'Understand your market, assess competitors, and refine your business direction.' },
    { icon: IconLayers, title: 'Product Builders', body: 'Explore customer problems, market opportunities, and differentiation before investing in development.' },
  ],
  helpTitle: 'Make your next move with more clarity.',
  benefits: [
    { icon: IconMarket, title: 'Understand Your Market', body: 'Explore your target audience, market opportunity, and the problem your idea aims to solve.' },
    { icon: IconOverlap, title: 'Analyse the Competition', body: 'Discover competing solutions and identify ways your idea could stand out.' },
    { icon: IconScore, title: 'Evaluate Your Idea', body: "Get structured AI-assisted insights to help assess your idea's strengths, gaps, and potential." },
    { icon: IconNext, title: 'Plan Your Next Steps', body: 'Use the insights to refine your concept and decide what to research, test, or build next.' },
  ],
  stepsTitle: 'From idea to informed action.',
  steps: [
    { n: '01', title: 'Share Your Idea', body: 'Describe your startup concept, the problem it solves, and your intended audience.' },
    { n: '02', title: 'Analyse the Opportunity', body: 'Productica writes a scored report from the answers you submit, including an optional pitch deck if you add one.' },
    { n: '03', title: 'Discover Your Next Step', body: 'Review your results and use them to refine your idea and plan further validation.' },
  ],
  closeTitle: 'Your idea has potential. Find out more.',
  closeBody: 'Take the first step towards building with clarity. Explore your idea, understand your market, and discover opportunities worth pursuing.',
  cta: 'Validate Your Idea',
  visual: <IdeaVisual />,
};

const grants: Story = {
  kicker: 'Grant matching',
  introTitle: 'The right funding opportunity can change everything.',
  introBody:
    "Finding startup funding can be overwhelming. Productica's Grant Matching Tool helps founders discover grants and government funding schemes that may align with their startup's industry, location, stage, and eligibility profile. Spend less time searching across multiple sources and more time exploring opportunities that could help your startup move forward.",
  facts: [
    { label: 'You share', value: 'Sector, where it is based, and who is applying. A saved validation can skip the venture questions.' },
    { label: 'You get', value: 'A shortlist of public schemes that may fit, with why they were suggested and the official page.' },
    { label: 'Then', value: 'You verify details on the scheme site. Matching is a starting point, not an approval.' },
  ],
  audienceTitle: 'Funding discovery for every stage of ambition.',
  audiences: [
    { icon: IconId, title: 'Student Entrepreneurs', body: 'Discover potentially relevant grants, student innovation schemes, and support for eligible entrepreneurial projects.' },
    { icon: IconProto, title: 'Early-Stage Startups', body: 'Explore funding schemes that may support product development, prototyping, and early business growth.' },
    { icon: IconCircuit, title: 'Deep-Tech Innovators', body: 'Find potentially relevant research, technology development, and innovation funding opportunities.' },
    { icon: IconStore, title: 'Growing Businesses', body: 'Explore schemes that may fit your business sector, location, registration status, and stage of growth.' },
  ],
  helpTitle: 'Find opportunities worth exploring.',
  benefits: [
    { icon: IconFilter, title: 'Discover Relevant Grants', body: "Explore funding opportunities based on your startup's profile and the information available." },
    { icon: IconBadge, title: 'Understand Eligibility', body: 'Review key requirements and identify which criteria your business may need to meet.' },
    { icon: IconColumns, title: 'Compare Opportunities', body: 'Examine available funding details, intended beneficiaries, and scheme requirements where information is available.' },
    { icon: IconOfficial, title: 'Take the Next Step', body: 'Access official scheme sources to verify details and continue with the application process.' },
  ],
  stepsTitle: 'From startup profile to funding opportunities.',
  steps: [
    { n: '01', title: 'Tell Us About Your Startup', body: 'Share your venture, then your sector, where it is based, and who is applying. A saved validation can skip the venture questions.' },
    { n: '02', title: 'Discover Your Matches', body: 'Explore funding schemes that may align with your profile and the available eligibility information.' },
    { n: '03', title: 'Review and Apply', body: 'Verify the scheme details through official sources and follow the relevant application process.' },
  ],
  closeTitle: 'Your next funding opportunity starts here.',
  closeBody: 'Discover relevant grants, explore available support, and take a more informed step towards growing your startup.',
  cta: 'Find My Grants',
  visual: <GrantVisual />,
};

export default function ToolStory({ kind, onCta }: { kind: 'idea' | 'grants'; onCta: () => void }) {
  const story = kind === 'idea' ? idea : grants;
  return (
    <div className="bg-black text-white">
      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/35">{story.kicker}</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-light tracking-tight leading-[1.1]">{story.introTitle}</h2>
            <p className="mt-5 text-sm md:text-base leading-relaxed text-white/60 max-w-2xl">{story.introBody}</p>
            <dl className="mt-8 grid gap-4">
              {story.facts.map(fact => (
                <div key={fact.label} className="grid gap-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40 pt-0.5">{fact.label}</dt>
                  <dd className="text-sm leading-relaxed text-white/70">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {story.visual}
        </div>
      </Section>

      <Section>
        <h2 className="text-3xl md:text-4xl font-light tracking-tight">{story.audienceTitle}</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {story.audiences.map(card => <InfoCard key={card.title} card={card} />)}
        </div>
      </Section>

      <Section>
        <h2 className="text-3xl md:text-4xl font-light tracking-tight">{story.helpTitle}</h2>
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          {story.benefits.map(card => <InfoCard key={card.title} card={card} />)}
        </div>
      </Section>

      <Section>
        <h2 className="text-3xl md:text-4xl font-light tracking-tight">{story.stepsTitle}</h2>
        <ol className="mt-8 grid gap-3 md:grid-cols-3">
          {story.steps.map(step => (
            <li key={step.n} className="rounded-2xl border border-white/10 px-5 py-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">{step.n}</p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 md:px-12 md:py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight">{story.closeTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm md:text-base leading-relaxed text-white/60">{story.closeBody}</p>
          <button
            type="button"
            onClick={onCta}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.97] transition-all"
          >
            {story.cta} <ArrowRight size={16} />
          </button>
        </div>
      </Section>

      <ProducticaFooter />
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-20">{children}</section>;
}

function InfoCard({ card }: { card: Card }) {
  const Icon = card.icon;
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/80">
        <Icon />
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{card.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{card.body}</p>
    </article>
  );
}

function IdeaVisual() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6" aria-hidden>
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Sample report shape</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-white/45">Startup name</p>
          <p className="mt-1 text-lg font-semibold tracking-tight">Working title</p>
        </div>
        <p className="text-right">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-white/35">Syncoro IQ</span>
          <span className="mt-1 block text-2xl font-light tracking-tight">—.—</span>
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {['Build', 'Test first', 'Pivot', 'Park'].map((label, i) => (
          <span key={label} className={`rounded-md border px-2 py-1.5 text-center text-[10px] font-mono uppercase tracking-widest ${i === 1 ? 'border-white/30 text-white' : 'border-white/10 text-white/40'}`}>
            {label}
          </span>
        ))}
      </div>
      <ul className="mt-5 grid gap-2 text-sm text-white/60">
        <li className="rounded-xl border border-white/10 px-3 py-2.5">Who it is for, and the problem it solves</li>
        <li className="rounded-xl border border-white/10 px-3 py-2.5">What makes it different</li>
        <li className="rounded-xl border border-white/10 px-3 py-2.5">What to research, test, or build next</li>
      </ul>
      <p className="mt-4 text-xs text-white/35">An illustration of the report, not a live result.</p>
    </div>
  );
}

function GrantVisual() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6" aria-hidden>
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Sample shortlist shape</p>
      <div className="mt-4 grid gap-3">
        {[
          { tag: 'Apply', name: 'Public scheme', why: 'May fit this sector, location, and applicant type.' },
          { tag: 'Later', name: 'Related scheme', why: 'Useful once the venture is further along.' },
        ].map(row => (
          <div key={row.name} className="rounded-2xl border border-white/10 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold tracking-tight">{row.name}</p>
              <span className="text-[10px] font-mono uppercase tracking-widest border border-white/20 rounded-md px-2 py-1 text-white/70">{row.tag}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/50">{row.why}</p>
            <p className="mt-3 text-xs text-white/40">Official page →</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-white/35">An illustration of a match, not a live shortlist.</p>
    </div>
  );
}
