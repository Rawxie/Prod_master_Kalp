/* eslint-disable */
const PICKAXE_URL = process.env.PICKAXE_API_URL || 'https://api.pickaxe.co/v1/completions';
const DEFAULT_TIMEOUT_MS = 280_000;

export class PickaxeError extends Error {}

const safeJson = (s: string) => { try { return JSON.parse(s); } catch { return null; } };

function pickText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (!value || typeof value !== 'object') return '';
  const o = value as Record<string, unknown>;
  for (const key of ['result', 'output', 'completion', 'markdown', 'report', 'text', 'message', 'content']) {
    const hit = pickText(o[key]);
    if (hit) return hit;
  }
  return '';
}

/** The deployment id is the bearer token. Never call this from the browser. */
async function askPickaxe(
  token: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; result: string; detail: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(PICKAXE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await r.text();
    const json = safeJson(text);
    const result = pickText(json) || (typeof text === 'string' && !text.trim().startsWith('{') ? text : '');
    const ok = r.ok && json?.success !== false && Boolean(result.trim());
    return { ok, status: r.status, result, detail: text.slice(0, 500) };
  } finally {
    clearTimeout(timer);
  }
}

export async function completePickaxe(
  token: string | undefined,
  message: string,
  userId: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  inputs?: Record<string, string>,
): Promise<string> {
  if (!token) throw new PickaxeError('The report engine is not configured.');

  try {
    const withInputs = inputs && Object.keys(inputs).length ? { message, userId, inputs } : { message, userId };
    const first = await askPickaxe(token, withInputs, timeoutMs);
    if (first.ok) return first.result;
    // Form deployments reject unknown input keys. Chat deployments only need the message,
    // which already contains the same answers and the pitch-deck text.
    if (inputs && first.status >= 400 && first.status < 500) {
      console.error('[pickaxe] inputs rejected, retrying with the message only', first.status);
      const second = await askPickaxe(token, { message, userId }, timeoutMs);
      if (second.ok) return second.result;
      console.error('[pickaxe] error', second.status, second.detail);
      throw new PickaxeError('The report engine could not complete this run. Please try again.');
    }
    console.error('[pickaxe] error', first.status, first.detail);
    throw new PickaxeError('The report engine could not complete this run. Please try again.');
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new PickaxeError('The report took too long. Please try again.');
    throw e;
  }
}
