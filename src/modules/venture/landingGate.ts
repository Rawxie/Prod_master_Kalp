export type VentureTool = 'idea' | 'grants';

const key = (tool: VentureTool) => `productica.venturelab.entered.${tool}`;

/** True after the visitor has already continued past this tool's landing in this tab. */
export function landingSeen(tool: VentureTool) {
  try {
    return sessionStorage.getItem(key(tool)) === '1';
  } catch {
    return false;
  }
}

export function markLandingSeen(tool: VentureTool) {
  try {
    sessionStorage.setItem(key(tool), '1');
  } catch {
    /* private mode */
  }
}

/** Once a person is inside either tool, both tools open as the workspace, not the landing. */
export function markWorkspaceOpen() {
  markLandingSeen('idea');
  markLandingSeen('grants');
}

export function ideaHref() {
  return landingSeen('idea') ? '/idea#validate' : '/idea';
}

export function grantsHref() {
  return landingSeen('grants') ? '/grants#match' : '/grants';
}

/** Direct links into a saved report or a linked match skip the landing. */
export function shouldSkipLanding(tool: VentureTool) {
  const params = new URLSearchParams(window.location.search);
  if (tool === 'idea') return params.get('from') === 'grants' || Boolean(params.get('r')) || landingSeen('idea');
  return Boolean(params.get('idea')) || landingSeen('grants');
}
