// ─────────────────────────────────────────────────────────────────────────────
// MODULE DEPENDENCY GRAPH
// ─────────────────────────────────────────────────────────────────────────────
//
// Each key maps to ALL prerequisite modules (transitive + direct) needed before
// running that module for best results. This is purely advisory — users can
// select any module independently.
//
// IDs must exactly match DASHBOARD_MODULES ids in PricingPage.tsx

export const MODULE_DEPENDENCIES: Record<string, string[]> = {
  'idea-validation': [],
  'market-research': ['idea-validation'],
  'competitor-analysis': ['idea-validation', 'market-research'],
  'icp': ['idea-validation', 'market-research', 'competitor-analysis'],
  'business-model-canvas': [
    'idea-validation',
    'market-research',
    'competitor-analysis',
    'icp',
  ],
  'go-to-market': [
    'idea-validation',
    'market-research',
    'competitor-analysis',
    'icp',
    'business-model-canvas',
  ],
  'finance-estimation': [
    'market-research',
    'business-model-canvas',
    'go-to-market',
  ],
  'pitch-investor-hub': [
    'idea-validation',
    'market-research',
    'competitor-analysis',
    'icp',
    'business-model-canvas',
    'go-to-market',
    'finance-estimation',
  ],
  'startup-health': [
    'idea-validation',
    'market-research',
    'competitor-analysis',
    'icp',
    'business-model-canvas',
    'go-to-market',
    'finance-estimation',
    'pitch-investor-hub',
  ],
};

// Canonical topological order — all journey outputs are sorted against this.
export const MODULE_CANONICAL_ORDER = [
  'idea-validation',
  'market-research',
  'competitor-analysis',
  'icp',
  'business-model-canvas',
  'go-to-market',
  'finance-estimation',
  'pitch-investor-hub',
  'startup-health',
];

/**
 * Given a set of selected module IDs, returns an ordered, deduplicated
 * recommended journey that includes both the selected modules and all their
 * recommended prerequisites.
 */
export function generateRecommendedJourney(selectedModuleIds: string[]): string[] {
  const merged = new Set<string>();

  for (const id of selectedModuleIds) {
    // Add all prerequisites (already flat / transitive in the graph)
    const deps = MODULE_DEPENDENCIES[id] ?? [];
    deps.forEach(d => merged.add(d));
    // Add the module itself
    merged.add(id);
  }

  // Sort by canonical topological order
  return MODULE_CANONICAL_ORDER.filter(id => merged.has(id));
}
