/* eslint-disable */
// POST /api/idea/share   { id }   Authorization required. Returns an unguessable token.
// GET  /api/idea/share?token=     Public. Returns a finished report and the answers that produced it.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireUser } from '../_lib/auth.js';
import { ConfigError, getAdmin } from '../_lib/supabaseAdmin.js';

const safeJson = (s: string) => { try { return JSON.parse(s); } catch { return null; } };

function secret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new ConfigError('Share links are not configured.');
  return key;
}

function sign(id: string) {
  return `${id}.${createHmac('sha256', secret()).update(id).digest('base64url')}`;
}

function verify(token: string) {
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !sig) return null;
  const expected = createHmac('sha256', secret()).update(id).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const fromUrl = (() => {
        const raw = String(req.url || '');
        const q = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
        return new URLSearchParams(q).get('token') || '';
      })();
      const token = String(req.query?.token || fromUrl || '').trim();
      const id = verify(token);
      if (!id) return res.status(404).json({ error: 'This report link is not valid.' });
      const admin = getAdmin();
      const { data, error } = await admin.from('idea_reports').select('*').eq('id', id).maybeSingle();
      if (error || !data || data.status !== 'done' || !data.markdown) {
        return res.status(404).json({ error: 'This report is not available.' });
      }
      return res.status(200).json({
        markdown: data.markdown,
        title: data.title || null,
        startupName: data.startup_name || '',
        idea: data.idea || '',
        audience: data.audience || '',
        different: data.different || '',
        stage: data.stage || '',
        revenue: data.revenue || null,
        deckName: data.deck_name || null,
        createdAt: data.created_at,
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const user = await requireUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });
    const body = typeof req.body === 'string' ? safeJson(req.body) || {} : req.body || {};
    const id = String(body.id || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'That report could not be shared.' });

    const admin = getAdmin();
    const { data, error } = await admin.from('idea_reports').select('id,status,markdown').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Report not found.' });
    if (data.status !== 'done' || !data.markdown) return res.status(409).json({ error: 'Finish the report before sharing it.' });
    return res.status(200).json({ token: sign(id) });
  } catch (e: any) {
    if (e instanceof ConfigError) return res.status(500).json({ error: 'Share links are not configured yet.' });
    console.error('[idea/share] failed', e);
    return res.status(500).json({ error: 'Could not open this report link.' });
  }
}
