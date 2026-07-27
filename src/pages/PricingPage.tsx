/* eslint-disable */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus, Plus, Check, ArrowRight, Zap, Users, TrendingUp,
  BarChart2, Lightbulb, Target, DollarSign, Rocket, Activity, BrainCircuit,
  Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { generateRecommendedJourney } from '../data/moduleDependencies';
import { JOURNEYS, type Journey } from '../data/journeys';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

export const CREDIT_PACKAGES = [
  { credits: 25, price: null },
  { credits: 50, price: null },
  { credits: 100, price: null },
];

export const DASHBOARD_MODULES = [
  { id: 'idea-validation',       name: 'Idea Validation',        icon: Lightbulb  },
  { id: 'market-research',       name: 'Market Research',         icon: BarChart2  },
  { id: 'competitor-analysis',   name: 'Competitor Analysis',     icon: TrendingUp },
  { id: 'icp',                   name: 'Ideal Customer Persona',  icon: Target     },
  { id: 'business-model-canvas', name: 'Business Model Canvas',   icon: Activity   },
  { id: 'go-to-market',          name: 'Go-to-Market Strategy',   icon: Rocket     },
  { id: 'finance-estimation',    name: 'Finance Estimation',      icon: DollarSign },
  { id: 'pitch-investor-hub',    name: 'Pitch & Investor Hub',    icon: Users      },
  { id: 'startup-health',        name: 'Startup Health',          icon: Zap        },
];

const MODULE_NAME_MAP = Object.fromEntries(DASHBOARD_MODULES.map(m => [m.id, m.name]));
const MODULE_ICON_MAP = Object.fromEntries(DASHBOARD_MODULES.map(m => [m.id, m.icon]));

const AGENT_LIST = [
  { id: 'co-founder', name: 'Co-Founder', icon: BrainCircuit },
  { id: 'marketing',  name: 'Marketing',  icon: TrendingUp   },
  { id: 'ultraplan',  name: 'UltraPlan',  icon: Rocket       },
];

const AGENT_IMAGES: Record<string, string> = {
  'co-founder': '/Cofounder.gif',
  'marketing':  '/marketing.gif',
  'ultraplan':  '/Ultraplan.gif',
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function CreditBadge() {
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/8 border border-white/15 text-white/50 tracking-wide">
      1 Credit
    </span>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDED JOURNEY — Horizontal Roadmap with Effortless Scrolling & Zero Overlap
// ─────────────────────────────────────────────────────────────────────────────

// Canvas geometry constants for horizontal roadmap
const NODE_W    = 170;  // card width (px)
const NODE_STEP = 210;  // horizontal interval between step centers (px)
const ROW_Y_TOP = 20;   // y-top for upper cards
const ROW_Y_BOT = 224;  // y-top for lower cards
const CANVAS_H  = 340;  // total canvas height (px)

function RecommendedJourney({ selectedModuleIds }: { selectedModuleIds: Set<string> }) {
  const journey = useMemo(
    () => generateRecommendedJourney(Array.from(selectedModuleIds)),
    [selectedModuleIds]
  );

  const [svgPath, setSvgPath] = useState('');
  const [canScrollLeft, setCanScrollLeft]   = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build smooth cubic-Bézier S-curve connecting ONLY the circular milestone dots on the track
  const buildPath = useCallback(() => {
    if (journey.length === 0) return;
    const pts = journey.map((_, idx) => {
      const isTop = idx % 2 === 0;
      return {
        x: 130 + idx * NODE_STEP,
        y: isTop ? 155 : 185, // milestone dot centers
      };
    });

    if (pts.length === 1) {
      setSvgPath(`M 40 170 L ${pts[0].x} 170 L ${pts[0].x + 80} 170`);
      return;
    }

    let d = `M 40 170`;
    for (let i = 0; i < pts.length; i++) {
      const p = i === 0 ? { x: 40, y: 170 } : pts[i - 1];
      const c = pts[i];
      const midX = (p.x + c.x) / 2;
      d += ` C ${midX} ${p.y}, ${midX} ${c.y}, ${c.x} ${c.y}`;
    }
    const last = pts[pts.length - 1];
    const endX = last.x + 80;
    const midX = (last.x + endX) / 2;
    d += ` C ${midX} ${last.y}, ${midX} 170, ${endX} 170`;

    setSvgPath(d);
  }, [journey]);

  // Update left/right navigation button states
  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(
      el.scrollWidth > el.clientWidth &&
        el.scrollLeft + el.clientWidth < el.scrollWidth - 20
    );
  }, []);

  const scrollCanvas = useCallback((direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -420 : 420;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      buildPath();
      updateScrollButtons();
    }, 50);
    window.addEventListener('resize', buildPath);
    return () => { clearTimeout(t); window.removeEventListener('resize', buildPath); };
  }, [buildPath, updateScrollButtons]);

  // Support native vertical mouse wheel to scroll horizontally
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.5;
        updateScrollButtons();
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('scroll', updateScrollButtons);
    };
  }, [updateScrollButtons, journey.length]);

  if (selectedModuleIds.size === 0) return null;

  // Generous right padding (200px after last step) so the final card & COMPLETE marker are never clipped
  const totalW = Math.max(760, 130 + (journey.length - 1) * NODE_STEP + 200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 w-full rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.05] to-white/[0.02] backdrop-blur-2xl overflow-hidden shadow-2xl"
    >
      {/* ── Header with Interactive Scroll Controls ── */}
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              Recommended Flow
              <span className="text-white/40 font-normal ml-1">(Optional)</span>
            </span>
            {journey.length > 3 && (
              <span className="text-[11px] text-white/50 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 hidden sm:inline-block">
                ← Scroll or drag to explore all {journey.length} steps →
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight">
            Your Optimal Startup Roadmap
          </h3>
          <p className="text-sm text-white/50 mt-1 max-w-2xl leading-relaxed">
            We recommend completing these modules in order. Each step builds upon insights from the previous one.
          </p>
        </div>

        {/* Scroll navigation arrows + total step counter */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {journey.length > 3 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollCanvas('left')}
                disabled={!canScrollLeft}
                className={`p-2 rounded-xl border transition-all ${
                  canScrollLeft
                    ? 'bg-white/15 border-white/25 text-white hover:bg-white/25 cursor-pointer shadow-md'
                    : 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
                }`}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCanvas('right')}
                disabled={!canScrollRight}
                className={`p-2 rounded-xl border transition-all ${
                  canScrollRight
                    ? 'bg-white/15 border-white/25 text-white hover:bg-white/25 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                    : 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <span className="text-xs text-white/60 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 font-mono">
            {journey.length} {journey.length === 1 ? 'Step' : 'Steps'} Total
          </span>
        </div>
      </div>

      {/* ── Horizontal Scrollable Roadmap Canvas ── */}
      <div className="relative">
        {/* Floating Left Navigation Button & Fade Overlay */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a0e] via-[#0a0a0e]/70 to-transparent z-20 pointer-events-none flex items-center pl-4"
            >
              <button
                onClick={() => scrollCanvas('left')}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-xl pointer-events-auto transition-all hover:scale-110 active:scale-95"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Right Navigation Button & Fade Overlay */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-[#0a0a0e] via-[#0a0a0e]/70 to-transparent z-20 pointer-events-none flex items-center justify-end pr-4"
            >
              <button
                onClick={() => scrollCanvas('right')}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-xl pointer-events-auto transition-all hover:scale-110 active:scale-95 animate-pulse"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden px-6 md:px-10 py-6"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'auto' }}
        >
          <div
            ref={wrapRef}
            className="relative select-none"
            style={{ width: totalW, height: CANVAS_H }}
          >
            {/* ── SVG Bézier Track Layer ── */}
            <svg
              className="absolute inset-0 pointer-events-none overflow-visible"
              style={{ width: totalW, height: CANVAS_H, zIndex: 0 }}
            >
              <defs>
                <filter id="rj-glow-clean" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Ghost track rail */}
              {svgPath && (
                <path
                  d={svgPath}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Animated dashed white stroke with glow */}
              {svgPath && (
                <motion.path
                  d={svgPath}
                  fill="none"
                  stroke="rgba(255,255,255,0.65)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.15 }}
                  style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
                />
              )}
            </svg>

            {/* ── START ORB (Left Edge) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: 40, top: 170 }}
            >
              <div className="w-10 h-10 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_#fff]"
                />
              </div>
              <span className="absolute top-12 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 whitespace-nowrap font-medium">
                START
              </span>
            </motion.div>

            {/* ── Step Nodes & Cards ── */}
            {journey.map((moduleId, idx) => {
              const isSelected = selectedModuleIds.has(moduleId);
              const isLast     = idx === journey.length - 1;
              const isTop      = idx % 2 === 0;
              const cardY      = isTop ? ROW_Y_TOP : ROW_Y_BOT;
              const dotY       = isTop ? 155 : 185;
              const leftPx     = 130 + idx * NODE_STEP;
              const cardDelay  = 0.08 + idx * 0.07;
              const Icon       = MODULE_ICON_MAP[moduleId] || Sparkles;

              return (
                <div key={moduleId}>
                  {/* Milestone Dot on Track */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: cardDelay + 0.1 }}
                    className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                    style={{ left: leftPx, top: dotY }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected && isLast
                          ? 'border-white bg-black shadow-[0_0_15px_rgba(255,255,255,0.8)]'
                          : isSelected
                          ? 'border-white/80 bg-black'
                          : 'border-white/25 bg-black'
                      }`}
                    >
                      <div
                        className={`rounded-full transition-all ${
                          isSelected && isLast
                            ? 'w-2.5 h-2.5 bg-white shadow-[0_0_8px_#fff]'
                            : isSelected
                            ? 'w-2 h-2 bg-white'
                            : 'w-1 h-1 bg-white/40'
                        }`}
                      />
                    </div>
                    {isSelected && isLast && (
                      <motion.div
                        animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2.2 }}
                        className="absolute inset-0 rounded-full bg-white/40 pointer-events-none"
                      />
                    )}
                  </motion.div>

                  {/* Vertical Connector Stem from Card to Milestone Dot */}
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.35, delay: cardDelay }}
                    className="absolute -translate-x-1/2 origin-top pointer-events-none"
                    style={{
                      left: leftPx,
                      top: isTop ? ROW_Y_TOP + 96 : dotY + 10,
                      width: 1,
                      height: isTop
                        ? dotY - 10 - (ROW_Y_TOP + 96)
                        : ROW_Y_BOT - (dotY + 10),
                      background: isSelected
                        ? 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.15))'
                        : 'linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0.05))',
                    }}
                  />

                  {/* Step Card — Zero Overlap with Curve */}
                  <motion.div
                    initial={{ opacity: 0, y: isTop ? -14 : 14, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.42, delay: cardDelay, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute -translate-x-1/2"
                    style={{ left: leftPx, top: cardY, width: NODE_W }}
                  >
                    <div
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-300 ${
                        isSelected && isLast
                          ? 'bg-gradient-to-b from-white/[0.16] to-white/[0.05] border-white/55 text-white shadow-[0_0_35px_rgba(255,255,255,0.18)] ring-1 ring-white/25'
                          : isSelected
                          ? 'bg-gradient-to-b from-white/[0.11] to-white/[0.03] border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]'
                          : 'bg-[#111115]/90 border-white/10 text-white/50 hover:border-white/20'
                      }`}
                      style={{ height: 96 }}
                    >
                      {/* Top Row: Icon + Step Badge */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-white/15 border-white/25 text-white shadow-sm'
                              : 'bg-white/5 border-white/10 text-white/40'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[10px] font-mono tracking-wider px-2.5 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white text-black font-bold'
                              : 'bg-white/10 text-white/40 font-medium'
                          }`}
                        >
                          STEP {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Bottom Row: Title + Status */}
                      <div>
                        <h4
                          className={`text-xs font-semibold leading-snug truncate ${
                            isSelected ? 'text-white' : 'text-white/60'
                          }`}
                        >
                          {MODULE_NAME_MAP[moduleId]}
                        </h4>
                        <div className="flex items-center gap-1 mt-1">
                          {isSelected && isLast ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold tracking-wide">
                              ★ Destination
                            </span>
                          ) : isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-white/80 font-medium tracking-wide">
                              ✓ Selected
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/35">
                              Recommended
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}

            {/* ── COMPLETE MARKER (Right Edge) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: 130 + (journey.length - 1) * NODE_STEP + 80, top: 170 }}
            >
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white/50" />
              </div>
              <span className="absolute top-11 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35 whitespace-nowrap font-medium">
                COMPLETE
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Footer / Helper Note ── */}
      <div className="px-6 md:px-10 py-4 border-t border-white/10 bg-white/[0.02] text-center">
        <p className="text-xs text-white/40 leading-relaxed">
          This journey is a recommendation based on startup best practices.{' '}
          <span className="text-white/70">You're free to start with any module at any time.</span>
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PLATFORM
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPlatform() {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [promptCredits, setPromptCredits]     = useState(1);
  const [activeJourney, setActiveJourney]     = useState<string | null>(null);

  const totalCredits = selectedModules.size + promptCredits;

  const toggleModule = useCallback((id: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setActiveJourney(null);
  }, []);

  const applyJourney = useCallback((journey: Journey) => {
    setSelectedModules(new Set(journey.moduleIds));
    setActiveJourney(journey.id);
    setTimeout(() => {
      document.getElementById('credit-calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  const changePrompt = (delta: number) =>
    setPromptCredits(p => Math.max(0, p + delta));

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-28"
    >
      {/* ── Header ── */}
      <div className="text-center max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-5 leading-[1.05]"
        >
          Unlock only<br />
          <span className="font-semibold">what you need.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/50 text-lg leading-relaxed"
        >
          Purchase credits and spend them only on the modules you want.<br />
          Every module costs <span className="text-white/80 font-medium">1 credit</span>.
        </motion.p>
      </div>

      {/* ── Credit Calculator ── */}
      <section id="credit-calculator" aria-label="Credit calculator" className="scroll-mt-28">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-3">
            Estimate Your <span className="font-semibold">Credits</span>
          </h2>
          <p className="text-white/50 text-base">
            Select the modules you need and we'll calculate your total credits.
          </p>
          <p className="text-white/30 text-sm mt-2">
            Every module costs{' '}
            <span className="text-white/60 font-medium px-1.5 py-0.5 rounded-md bg-white/8 border border-white/10">1 credit</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Left — selectable module cards + recommendation */}
          <div className="flex flex-col gap-4">
            {/* Selectable grid */}
            <div
              role="group"
              aria-label="Select dashboard modules"
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {DASHBOARD_MODULES.map((mod) => {
                const Icon = mod.icon;
                const isSelected = selectedModules.has(mod.id);
                return (
                  <motion.button
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    aria-pressed={isSelected}
                    aria-label={`${mod.name}, 1 credit`}
                    className={`relative flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                      isSelected
                        ? 'border-white/40 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/6 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-white/20' : 'bg-white/8'}`}>
                        <Icon className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-white' : 'text-white/50'}`} />
                      </div>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 text-black" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className={`text-xs font-medium leading-snug transition-colors ${isSelected ? 'text-white' : 'text-white/60'}`}>
                      {mod.name}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* Prompt Credits row */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.03]">
              <div>
                <p className="text-sm font-medium text-white/80 mb-0.5">Prompt Credits</p>
                <p className="text-xs text-white/40 max-w-[220px] leading-relaxed">
                  Continue chatting with AI after unlocking reports. Each prompt costs 1 credit.
                </p>
              </div>
              <div className="flex items-center gap-3" role="group" aria-label="Prompt credits selector">
                <button
                  onClick={() => changePrompt(-1)}
                  aria-label="Decrease prompt credits"
                  disabled={promptCredits <= 0}
                  className="w-8 h-8 rounded-lg border border-white/15 bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-white font-semibold w-6 text-center tabular-nums text-sm" aria-live="polite" aria-atomic="true">
                  {promptCredits}
                </span>
                <button
                  onClick={() => changePrompt(1)}
                  aria-label="Increase prompt credits"
                  className="w-8 h-8 rounded-lg border border-white/15 bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-all focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right — summary card (sticky) */}
          <div className="sticky top-28">
            <motion.div layout className="p-6 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-white/30 mb-6 font-medium">Summary</p>

              <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">Modules Selected</span>
                  <span className="text-white font-medium" aria-live="polite">
                    <AnimatedNumber value={selectedModules.size} />
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">Prompt Credits</span>
                  <span className="text-white font-medium" aria-live="polite">
                    <AnimatedNumber value={promptCredits} />
                  </span>
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-white/70 font-medium">Total Credits</span>
                  <span className="text-2xl font-semibold text-white" aria-live="polite" aria-atomic="true">
                    <AnimatedNumber value={totalCredits} />
                  </span>
                </div>
              </div>

              <motion.div
                key={totalCredits}
                initial={{ opacity: 0.6, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-xl bg-white/[0.06] border border-white/10 text-center mb-4"
              >
                <p className="text-xs text-white/40 leading-relaxed">
                  Turn your startup idea into a complete business blueprint in only{' '}
                  <span className="text-white font-semibold">
                    <AnimatedNumber value={totalCredits} />&nbsp;{totalCredits === 1 ? 'Credit' : 'Credits'}
                  </span>.
                </p>
              </motion.div>

              <a
                href="/#contact"
                className="flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/60 outline-none"
              >
                Buy Credits <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://dashboard.productica.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/15 text-white/60 text-sm font-medium hover:text-white hover:border-white/30 active:scale-[0.98] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/40 outline-none"
              >
                Explore Dashboard
              </a>
            </motion.div>
          </div>
        </div>

        {/* ── Recommended Journey — Full Horizontal Frame Below Calculator ── */}
        <AnimatePresence>
          {selectedModules.size > 0 && (
            <RecommendedJourney selectedModuleIds={selectedModules} />
          )}
        </AnimatePresence>
      </section>

      {/* ── Popular Founder Journeys ── */}
      <section aria-label="Popular Founder Journeys">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-3">
            Popular <span className="font-semibold">Founder Journeys</span>
          </h2>
          <p className="text-white/50 text-base">
            One-click module bundles designed around common founder goals.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {JOURNEYS.map((journey, i) => {
            const modules  = DASHBOARD_MODULES.filter(m => journey.moduleIds.includes(m.id));
            const isActive = activeJourney === journey.id;

            return (
              <motion.div
                key={journey.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`flex flex-col p-6 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? 'border-white/40 bg-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.10)]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-white/8 border border-white/10 text-white/40 font-mono">
                    {journey.moduleIds.length} modules
                  </span>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs px-2 py-0.5 rounded-md bg-white/15 border border-white/25 text-white/70 font-medium"
                    >
                      ✓ Active
                    </motion.span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-white mb-1.5 leading-snug">
                  {journey.title}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed mb-5">{journey.description}</p>

                {/* Flow list */}
                <div className="flex flex-col gap-0 mb-5 flex-grow">
                  {modules.map((mod, idx) => (
                    <div key={mod.id} className="flex flex-col items-start">
                      <span className="text-xs text-white/60 bg-white/6 border border-white/10 px-2.5 py-1 rounded-lg">
                        {mod.name}
                      </span>
                      {idx < modules.length - 1 && (
                        <div className="w-px h-3 bg-white/15 ml-3 my-0.5" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs mb-4 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8">
                  <span className="text-white/40">Total Credits</span>
                  <span className="text-white font-bold text-sm">{journey.moduleIds.length}</span>
                </div>

                <motion.button
                  onClick={() => applyJourney(journey)}
                  whileTap={{ scale: 0.97 }}
                  aria-label={`Use journey: ${journey.title}`}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white border border-white/10'
                  }`}
                >
                  {isActive ? '✓ Journey Applied' : 'Use This Journey'}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <DashboardCTA totalCredits={totalCredits} />
    </motion.div>
  );
}

function DashboardCTA({ totalCredits }: { totalCredits: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      aria-label="Call to action"
      className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-10 md:p-14 text-center"
    >
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-white blur-[120px]" />
      </div>
      <div className="relative z-10">
        <p className="text-2xl md:text-3xl font-light text-white/80 tracking-tight mb-3">
          Turn your startup idea into a complete business blueprint in only{' '}
          <span className="font-semibold text-white inline-flex overflow-hidden">
            <AnimatedNumber value={totalCredits} />
            &nbsp;{totalCredits === 1 ? 'Credit' : 'Credits'}.
          </span>
        </p>
        <p className="text-white/40 text-base mb-8 max-w-lg mx-auto">
          No subscriptions. No lock-in. Buy exactly the credits you need and spend them when you're ready.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/#contact"
            className="group flex items-center gap-2 px-8 py-3.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 active:scale-[0.97] transition-all duration-200 shadow-lg shadow-white/10"
          >
            Buy Credits
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="https://dashboard.productica.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 text-sm font-medium text-white/50 hover:text-white transition-colors duration-200 tracking-wide"
          >
            Explore Dashboard →
          </a>
        </div>
      </div>
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENTS PLATFORM
// ─────────────────────────────────────────────────────────────────────────────

function AgentsPlatform() {
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const totalCredits = selectedAgents.size;

  const toggleAgent = useCallback((id: string) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  return (
    <motion.div
      key="agents"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-24"
    >
      {/* ── Header ── */}
      <div className="text-center max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-6xl font-light tracking-tighter text-white mb-5 leading-[1.05]"
        >
          Work with your<br />
          <span className="font-semibold">AI Startup Team.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/50 text-lg leading-relaxed"
        >
          Every AI Agent costs <span className="text-white/80 font-medium">1 credit</span> per interaction.
        </motion.p>
      </div>

      {/* ── Agent Display Cards ── */}
      <section aria-label="Available AI agents">
        <p className="text-xs uppercase tracking-[0.2em] text-white/30 font-medium mb-8 text-center">
          Available Agents
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {AGENT_LIST.map((agent, i) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="flex flex-col gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center group-hover:bg-white/12 transition-colors overflow-hidden">
                  <img
                    src={AGENT_IMAGES[agent.id]}
                    alt={agent.name}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      (e.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden');
                    }}
                  />
                  <Icon className="w-5 h-5 text-white/60 hidden" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white/90 mb-2">{agent.name}</p>
                  <CreditBadge />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Agent Calculator ── */}
      <section aria-label="Agent credit calculator">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-3">
            Build Your <span className="font-semibold">Team</span>
          </h2>
          <p className="text-white/50 text-base">Select the agents you want to work with.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start max-w-4xl mx-auto w-full">
          <div role="group" aria-label="Select AI agents" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {AGENT_LIST.map(agent => {
              const Icon = agent.icon;
              const isSelected = selectedAgents.has(agent.id);
              return (
                <motion.button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  aria-pressed={isSelected}
                  aria-label={`${agent.name} agent, 1 credit`}
                  className={`relative flex flex-col gap-4 p-5 rounded-2xl border text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                    isSelected
                      ? 'border-white/40 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/6 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors overflow-hidden ${isSelected ? 'bg-white/20' : 'bg-white/8'}`}>
                      <img
                        src={AGENT_IMAGES[agent.id]}
                        alt={agent.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                          (e.currentTarget.nextSibling as HTMLElement)?.classList.remove('hidden');
                        }}
                      />
                      <Icon className={`w-4 h-4 hidden ${isSelected ? 'text-white' : 'text-white/50'}`} />
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                        >
                          <Check className="w-2.5 h-2.5 text-black" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold mb-2 transition-colors ${isSelected ? 'text-white' : 'text-white/70'}`}>
                      {agent.name}
                    </p>
                    <CreditBadge />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Total card */}
          <div className="sticky top-28">
            <motion.div layout className="p-6 rounded-2xl border border-white/15 bg-white/[0.05] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-white/30 mb-6 font-medium">Summary</p>
              <div className="flex flex-col gap-3 mb-6">
                {AGENT_LIST.map(agent => (
                  <div key={agent.id} className="flex justify-between items-center text-sm">
                    <span className={`transition-colors ${selectedAgents.has(agent.id) ? 'text-white/80' : 'text-white/30 line-through'}`}>
                      {agent.name}
                    </span>
                    <AnimatePresence>
                      {selectedAgents.has(agent.id) && (
                        <motion.span
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="text-white/50 text-xs"
                        >
                          1 credit
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                <div className="h-px bg-white/10 my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-white/70 font-medium">Total Credits</span>
                  <span className="text-2xl font-semibold text-white" aria-live="polite" aria-atomic="true">
                    <AnimatedNumber value={totalCredits} />
                  </span>
                </div>
              </div>
              <a
                href="/#contact"
                className="flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-[0.98] transition-all duration-200"
              >
                Buy Credits <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl p-10 md:p-14 text-center"
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-white blur-[120px]" />
        </div>
        <div className="relative z-10">
          <p className="text-2xl md:text-3xl font-light text-white/80 tracking-tight mb-3">
            Build your startup faster with your personal{' '}
            <span className="font-semibold text-white">AI startup team.</span>
          </p>
          <p className="text-white/40 text-base mb-8 max-w-lg mx-auto">
            Each agent interaction costs 1 credit. Scale as much as you need.
          </p>
          <a
            href="/#contact"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 active:scale-[0.97] transition-all"
          >
            Buy Credits
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </motion.section>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

type PlatformTab = 'dashboard' | 'agents';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<PlatformTab>('dashboard');

  const handleBackClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (window.history.length > 2) {
      window.history.back();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <Navbar showBackButton backHref="/" onBackClick={handleBackClick} />

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-6xl mx-auto">

        {/* ── Platform Toggle ── */}
        <div className="flex justify-center mb-20">
          <div
            role="tablist"
            aria-label="Platform selection"
            className="inline-flex items-center gap-1 p-1 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl"
          >
            {(['dashboard', 'agents'] as PlatformTab[]).map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                  activeTab === tab ? 'text-black' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-xl bg-white"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {tab === 'dashboard' ? 'Dashboard Platform' : 'Agents Platform'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <DashboardPlatform key="dashboard" />
          ) : (
            <AgentsPlatform key="agents" />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
