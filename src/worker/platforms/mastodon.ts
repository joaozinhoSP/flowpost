import { Post, PublishResult } from "./platform";

const MASTODON_INSTANCE = process.env.MASTODON_INSTANCE || 'kolektiva.social';

async function downloadImage(url: string): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    return { buffer, mimeType };
  } catch {
    return null;
  }
}

async function uploadMedia(accessToken: string, imageUrl: string): Promise<string | null> {
  const imageData = await downloadImage(imageUrl);
  if (!imageData) return null;

  const formData = new FormData();
  const blob = new Blob([imageData.buffer], { type: imageData.mimeType });
  formData.append('file', blob, 'upload.' + (imageData.mimeType.split('/')[1] || 'jpg'));

  try {
    const res = await fetch(`https://${MASTODON_INSTANCE}/api/v2/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    if (!res.ok) {
      console.error('Mastodon media upload error:', await res.text());
      return null;
    }

    const data = await res.json();
    return data.id;
  } catch (err) {
    console.error('Mastodon media upload exception:', err);
    return null;
  }
}

export async function publishToMastodon(
  post: Post,
  accessToken: string
): Promise<PublishResult> {
  const mediaIds: string[] = [];

  if (post.media_urls && post.media_urls.length > 0) {
    for (const url of post.media_urls) {
      const mediaId = await uploadMedia(accessToken, url);
      if (mediaId) mediaIds.push(mediaId);
    }
  }

  const body: Record<string, any> = {
    status: post.content || '',
  };

  if (mediaIds.length > 0) {
    body.media_ids = mediaIds;
  }

  const res = await fetch(`https://${MASTODON_INSTANCE}/api/v1/statuses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `flowpost-${post.id}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mastodon publish error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return { url: data.url || `https://${MASTODON_INSTANCE}/@${data.account?.username}/${data.id}` };
}

export async function publishMastodonPost(post: Post, supabase: any): Promise<PublishResult> {
  const { data: account } = await supabase
    .from('social_accounts')
    .select('access_token')
    .eq('user_id', post.user_id)
    .eq('platform', 'mastodon')
    .maybeSingle();

  if (!account?.access_token) {
    throw new Error('Mastodon account not connected');
  }

  return publishToMastodon(post, account.access_token);
}
