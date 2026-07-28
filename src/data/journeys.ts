// ─────────────────────────────────────────────────────────────────────────────
// FOUNDER JOURNEY PRESETS
// ─────────────────────────────────────────────────────────────────────────────
//
// Each journey is a curated template bundle of modules designed around a common
// founder goal. Clicking a template auto-fills the credit calculator.
//
// Module IDs must match DASHBOARD_MODULES ids in PricingPage.tsx.

export interface Journey {
  id: string;
  title: string;
  description: string;
  moduleIds: string[];
}

export const JOURNEYS: Journey[] = [
  {
    id: 'validate-idea',
    title: 'Validate My Startup Idea',
    description:
      "Validate your idea and understand whether it's worth building before investing time and money.",
    moduleIds: ['idea-validation'],
  },
  {
    id: 'product-market-fit',
    title: 'Find Product–Market Fit',
    description:
      'Understand your market, competitors and ideal customers before building.',
    moduleIds: [
      'idea-validation',
      'market-research',
      'competitor-analysis',
      'icp',
    ],
  },
  {
    id: 'launch-startup',
    title: 'Launch My Startup',
    description:
      'Build the complete business strategy required to confidently launch your startup.',
    moduleIds: [
      'idea-validation',
      'market-research',
      'competitor-analysis',
      'icp',
      'business-model-canvas',
      'go-to-market',
    ],
  },
  {
    id: 'investor-ready',
    title: 'Investor Ready Startup',
    description:
      'Create everything investors expect including financial projections and a compelling pitch.',
    moduleIds: [
      'idea-validation',
      'market-research',
      'competitor-analysis',
      'icp',
      'business-model-canvas',
      'go-to-market',
      'finance-estimation',
      'pitch-investor-hub',
    ],
  },
  {
    id: 'complete-blueprint',
    title: 'Complete Startup Blueprint',
    description:
      'Unlock every Productica module for the most comprehensive startup analysis and execution plan.',
    moduleIds: [
      'idea-validation',
      'market-research',
      'competitor-analysis',
      'icp',
      'business-model-canvas',
      'go-to-market',
      'finance-estimation',
      'pitch-investor-hub',
      'startup-health',
    ],
  },
];
