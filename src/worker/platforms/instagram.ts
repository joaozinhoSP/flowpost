import { Post, PublishResult } from "./platform";

const FACEBOOK_API_VERSION = 'v22.0';

async function publishToInstagram(
  post: Post,
  pageAccessToken: string,
  igUserId: string
): Promise<PublishResult> {
  const imageUrl = post.media_urls?.[0];
  if (!imageUrl) {
    throw new Error('Instagram requires at least one image');
  }

  const containerBody: Record<string, any> = {
    image_url: imageUrl,
    caption: post.content || '',
    access_token: pageAccessToken,
  };

  const containerRes = await fetch(
    `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    }
  );

  if (!containerRes.ok) {
    const errText = await containerRes.text();
    throw new Error(`Instagram media container error: ${containerRes.status} ${errText}`);
  }

  const containerData = await containerRes.json();
  const creationId = containerData.id;

  const publishRes = await fetch(
    `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: pageAccessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    throw new Error(`Instagram publish error: ${publishRes.status} ${errText}`);
  }

  const publishData = await publishRes.json();
  return { url: `https://www.instagram.com/p/${publishData.id}/` };
}

export async function publishInstagramPost(post: Post, supabase: any): Promise<PublishResult> {
  const { data: account } = await supabase
    .from('social_accounts')
    .select('access_token, platform_account_id')
    .eq('user_id', post.user_id)
    .eq('platform', 'instagram')
    .maybeSingle();

  if (!account?.access_token || !account?.platform_account_id) {
    throw new Error('Instagram account not connected');
  }

  return publishToInstagram(post, account.access_token, account.platform_account_id);
}
