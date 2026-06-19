import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const router = Router();

const MASTODON_INSTANCE = process.env.MASTODON_INSTANCE || 'kolektiva.social';
const MASTODON_CLIENT_ID = process.env.MASTODON_CLIENT_ID || 'a4T1RiBI4n3QdRBLBqYSZzMksC8PenYfkaQVk-EIgG8';
const MASTODON_CLIENT_SECRET = process.env.MASTODON_CLIENT_SECRET || '3gouZDHygaIcPvN2psmcsPSMuGZ6pSn1w2en9xPYDB4';

const REDIRECT_URI = `${config.appUrl.replace(/\/+$/, '')}/api/auth/mastodon/callback`;

function getSupabase() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) return null;
  return createClient(config.supabase.url, config.supabase.serviceRoleKey);
}

router.get('/auth/mastodon', (req, res: Response) => {
  const state = (req.query.state as string) || '';
  const params = new URLSearchParams({
    client_id: MASTODON_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'read write:statuses write:media',
    force_login: 'true',
  });

  if (state) {
    params.set('state', state);
  }

  res.redirect(`https://${MASTODON_INSTANCE}/oauth/authorize?${params.toString()}`);
});

router.get('/auth/mastodon/callback', async (req, res: Response) => {
  const { code, error: oauthError } = req.query as Record<string, string>;

  if (oauthError) {
    return res.redirect(`${config.appUrl}/dashboard/social?mastodon=error&message=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return res.redirect(`${config.appUrl}/dashboard/social?mastodon=error&message=Código+de+autorização+ausente`);
  }

  try {
    const tokenRes = await fetch(`https://${MASTODON_INSTANCE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: MASTODON_CLIENT_ID,
        client_secret: MASTODON_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Mastodon token exchange error:', errText);
      return res.redirect(`${config.appUrl}/dashboard/social?mastodon=error&message=Erro+ao+obter+token`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    const verifyRes = await fetch(`https://${MASTODON_INSTANCE}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!verifyRes.ok) {
      return res.redirect(`${config.appUrl}/dashboard/social?mastodon=error&message=Erro+ao+verificar+credenciais`);
    }

    const account = await verifyRes.json();

    const state = req.query.state as string | undefined;
    let firebaseUid: string | null = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
        firebaseUid = decoded.uid || null;
      } catch {
        try {
          const decoded = JSON.parse(atob(state));
          firebaseUid = decoded.uid || null;
        } catch {}
      }
    }

    const supabase = getSupabase();

    if (supabase && firebaseUid) {
      const { error: upsertError } = await supabase.from('social_accounts').upsert({
        user_id: firebaseUid,
        platform: 'mastodon',
        access_token: accessToken,
        refresh_token: tokenData.refresh_token || null,
        expires_at: tokenData.expires_at ? new Date(Date.now() + tokenData.expires_at * 1000).toISOString() : null,
        platform_username: account.username,
        platform_account_id: account.id,
        avatar_url: account.avatar || null,
      }, { onConflict: 'user_id, platform' });

      if (upsertError) {
        console.error('Mastodon save error:', upsertError);
      }
    } else if (supabase && !firebaseUid) {
      console.warn('Mastodon callback: no state/uid, saving without user_id');
    }

    const redirectUrl = firebaseUid
      ? `${config.appUrl}/dashboard/social?mastodon=connected`
      : `${config.appUrl}/dashboard/social?mastodon=error&message=Usuário+não+identificado.+Tente+novamente.`;

    res.redirect(redirectUrl);
  } catch (err: any) {
    console.error('Mastodon callback error:', err);
    res.redirect(`${config.appUrl}/dashboard/social?mastodon=error&message=Erro+interno`);
  }
});

router.get('/mastodon/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.json({ connected: false });
    }

    const { data } = await supabase
      .from('social_accounts')
      .select('platform_username, avatar_url, created_at')
      .eq('user_id', req.user!.uid)
      .eq('platform', 'mastodon')
      .maybeSingle();

    res.json({
      connected: !!data,
      username: data?.platform_username || null,
      avatar: data?.avatar_url || null,
      connectedAt: data?.created_at || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/mastodon/disconnect', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from('social_accounts')
        .delete()
        .eq('user_id', req.user!.uid)
        .eq('platform', 'mastodon');
    }
    res.json({ disconnected: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
