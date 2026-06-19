import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const router = Router();

const FACEBOOK_API_VERSION = 'v22.0';
const FACEBOOK_APP_ID = config.facebook.appId;
const FACEBOOK_APP_SECRET = config.facebook.appSecret;

const REDIRECT_URI = `${config.appUrl.replace(/\/+$/, '')}/api/auth/instagram/callback`;

function getSupabase() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) return null;
  return createClient(config.supabase.url, config.supabase.serviceRoleKey);
}

router.get('/auth/instagram', (req, res: Response) => {
  if (!FACEBOOK_APP_ID) {
    return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Facebook+App+não+configurado`);
  }

  const state = (req.query.state as string) || '';
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list',
  });

  if (state) {
    params.set('state', state);
  }

  res.redirect(`https://www.facebook.com/${FACEBOOK_API_VERSION}/dialog/oauth?${params.toString()}`);
});

router.get('/auth/instagram/callback', async (req, res: Response) => {
  const { code, error: oauthError, state } = req.query as Record<string, string>;

  if (oauthError) {
    return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Código+de+autorização+ausente`);
  }

  try {
    const tokenRes = await fetch(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Facebook token exchange error:', errText);
      return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Erro+ao+obter+token`);
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;

    const longTokenRes = await fetch(`https://graph.facebook.com/${FACEBOOK_API_VERSION}/oauth/access_token`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      }),
    });

    if (!longTokenRes.ok) {
      const errText = await longTokenRes.text();
      console.error('Facebook long-lived token exchange error:', errText);
      return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Erro+ao+obter+token+prolongado`);
    }

    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token;
    const expiresIn = longTokenData.expires_in;

    const pagesRes = await fetch(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/accounts?access_token=${accessToken}`
    );

    if (!pagesRes.ok) {
      const errText = await pagesRes.text();
      console.error('Facebook pages error:', errText);
      return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Erro+ao+obter+páginas`);
    }

    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];

    if (!page) {
      return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Nenhuma+página+encontrada`);
    }

    const pageAccessToken = page.access_token;

    const igRes = await fetch(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    if (!igRes.ok) {
      const errText = await igRes.text();
      console.error('Instagram business account error:', errText);
      return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Conta+Instagram+não+encontrada+nesta+página`);
    }

    const igData = await igRes.json();

    if (!igData.instagram_business_account) {
      return res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Esta+página+não+tem+conta+Instagram+Business`);
    }

    const igUserId = igData.instagram_business_account.id;

    const igProfileRes = await fetch(
      `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${igUserId}?fields=username,profile_picture_url&access_token=${pageAccessToken}`
    );

    let igUsername = '';
    let igAvatar = '';
    if (igProfileRes.ok) {
      const igProfile = await igProfileRes.json();
      igUsername = igProfile.username || '';
      igAvatar = igProfile.profile_picture_url || '';
    }

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
        platform: 'instagram',
        access_token: pageAccessToken,
        refresh_token: accessToken,
        expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
        platform_username: igUsername,
        platform_account_id: igUserId,
        avatar_url: igAvatar || null,
      }, { onConflict: 'user_id, platform' });

      if (upsertError) {
        console.error('Instagram save error:', upsertError);
      }
    }

    const redirectUrl = firebaseUid
      ? `${config.appUrl}/dashboard/social?instagram=connected`
      : `${config.appUrl}/dashboard/social?instagram=error&message=Usuário+não+identificado`;

    res.redirect(redirectUrl);
  } catch (err: any) {
    console.error('Instagram callback error:', err);
    res.redirect(`${config.appUrl}/dashboard/social?instagram=error&message=Erro+interno`);
  }
});

router.get('/instagram/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.json({ connected: false });
    }

    const { data } = await supabase
      .from('social_accounts')
      .select('platform_username, avatar_url, created_at')
      .eq('user_id', req.user!.uid)
      .eq('platform', 'instagram')
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

router.delete('/instagram/disconnect', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from('social_accounts')
        .delete()
        .eq('user_id', req.user!.uid)
        .eq('platform', 'instagram');
    }
    res.json({ disconnected: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
