import type { VentureTool } from './landingGate';

export const landingCopy: Record<VentureTool, {
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  ctaLabel: string;
}> = {
  idea: {
    title: 'Validate',
    eyebrow: 'Idea validation',
    description: 'Big ideas deserve better than guesswork.',
    detail: 'Validate your startup idea with AI-powered market insights, competitor analysis, and product-market fit intelligence. Know your opportunity before you build.',
    ctaLabel: 'Start a validation',
  },
  grants: {
    title: 'Grants',
    eyebrow: 'Grant matching',
    description: 'Find the funding your startup deserves.',
    detail: 'Discover startup grants and government schemes tailored to your business, industry, and stage. Spend less time searching and more time building.',
    ctaLabel: 'Match grants',
  },
};
