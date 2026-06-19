import { PostStore } from '../post-store';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let __dirname: string;
try { __dirname = dirname(fileURLToPath((import.meta as any).url)); } catch { __dirname = process.cwd(); }

interface SocialAccount {
  id: string;
  userId: string;
  network: string;
  label: string;
  accessToken: string;
  refreshToken?: string;
  accountId?: string;
  active: boolean;
}

interface Post {
  id: number;
  user_id: string;
  content: string;
  networks: string[];
  hashtags: string[];
  media_url: string | null;
  status: string;
  scheduled_date: string | null;
}

const ACCOUNTS_PATH = join(__dirname, '..', 'data', 'social-accounts.json');

async function loadAccounts(): Promise<SocialAccount[]> {
  try {
    return JSON.parse(await fs.readFile(ACCOUNTS_PATH, 'utf-8'));
  } catch { return []; }
}

function formatContent(content: string, hashtags: string[]): string {
  const tags = hashtags.length ? '\n\n' + hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ') : '';
  return content + tags;
}

async function publishToTwitter(content: string, mediaUrl: string | null, token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content }),
    });
    return res.ok;
  } catch (e) {
    console.error('Twitter publish error:', e);
    return false;
  }
}

async function publishToLinkedIn(content: string, token: string, accountId?: string): Promise<boolean> {
  if (!accountId) return false;
  try {
    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202504',
      },
      body: JSON.stringify({
        author: `urn:li:person:${accountId}`,
        lifecycleState: 'PUBLISHED',
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        commentary: content,
        distribution: { 'feedDistribution': 'MAIN_FEED', 'targetEntities': [], 'thirdPartyDistributionChannels': [] },
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('LinkedIn publish error:', e);
    return false;
  }
}

async function publishToFacebook(content: string, mediaUrl: string | null, token: string, accountId?: string): Promise<boolean> {
  if (!accountId) return false;
  try {
    const body: Record<string, string> = { message: content, access_token: token };
    if (mediaUrl) body.link = mediaUrl;
    const res = await fetch(`https://graph.facebook.com/v22.0/${accountId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (e) {
    console.error('Facebook publish error:', e);
    return false;
  }
}

async function publishToInstagram(content: string, mediaUrl: string | null, token: string, accountId?: string): Promise<boolean> {
  if (!accountId || !mediaUrl) return false;
  try {
    const createRes = await fetch(`https://graph.facebook.com/v22.0/${accountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: mediaUrl,
        caption: content,
        access_token: token,
      }),
    });
    if (!createRes.ok) return false;
    const { id: mediaId } = await createRes.json();

    const pubRes = await fetch(`https://graph.facebook.com/v22.0/${accountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: mediaId, access_token: token }),
    });
    return pubRes.ok;
  } catch (e) {
    console.error('Instagram publish error:', e);
    return false;
  }
}

async function publishToMastodonFn(content: string, mediaUrl: string | null, token: string, accountId?: string): Promise<boolean> {
  try {
    let mediaIds: string[] = [];
    if (mediaUrl) {
      const imgRes = await fetch(mediaUrl);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        const formData = new FormData();
        const blob = new Blob([buffer], { type: imgRes.headers.get('content-type') || 'image/jpeg' });
        formData.append('file', blob, 'upload.jpg');
        const uploadRes = await fetch(`https://${process.env.MASTODON_INSTANCE || 'kolektiva.social'}/api/v2/media`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const mediaData = await uploadRes.json();
          mediaIds.push(mediaData.id);
        }
      }
    }

    const body: Record<string, any> = { status: content };
    if (mediaIds.length > 0) body.media_ids = mediaIds;

    const res = await fetch(`https://${process.env.MASTODON_INSTANCE || 'kolektiva.social'}/api/v1/statuses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (e) {
    console.error('Mastodon publish error:', e);
    return false;
  }
}

const publishers: Record<string, (content: string, mediaUrl: string | null, token: string, accountId?: string) => Promise<boolean>> = {
  twitter: publishToTwitter,
  linkedin: publishToLinkedIn,
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  tiktok: async () => false,
  mastodon: publishToMastodonFn,
};

async function processPost(post: Post) {
  const accounts = await loadAccounts();
  const userAccounts = accounts.filter(a => a.userId === post.user_id && a.active);

  const formattedContent = formatContent(post.content, post.hashtags || []);
  let allPublished = true;

  for (const network of post.networks) {
    const netAccounts = userAccounts.filter(a => a.network.toLowerCase() === network.toLowerCase());
    if (netAccounts.length === 0) {
      console.log(`No account connected for ${network} (user ${post.user_id})`);
      allPublished = false;
      continue;
    }

    for (const acc of netAccounts) {
      const publisher = publishers[network.toLowerCase()];
      if (!publisher) {
        console.log(`No publisher for ${network}`);
        allPublished = false;
        continue;
      }

      const ok = await publisher(formattedContent, post.media_url, acc.accessToken, acc.accountId);
      if (!ok) {
        console.error(`Failed to publish to ${network} for user ${post.user_id}`);
        allPublished = false;
      }
    }
  }

  await PostStore.update(post.id, post.user_id, {
    status: allPublished ? 'published' : 'draft',
    engagement: allPublished ? 1 : 0,
  });

  console.log(`Post #${post.id} published: ${allPublished}`);
}

let running = false;
let interval: ReturnType<typeof setInterval> | null = null;

export function startPublisher() {
  if (running) return;
  running = true;
  console.log('Publisher worker started');

  async function tick() {
    try {
      const post = await PostStore.getNextScheduled();
      if (post) await processPost(post);
    } catch (e) {
      console.error('Publisher tick error:', e);
    }
  }

  tick();
  interval = setInterval(tick, 60_000);
}

export function stopPublisher() {
  running = false;
  if (interval) { clearInterval(interval); interval = null; }
  console.log('Publisher worker stopped');
}
