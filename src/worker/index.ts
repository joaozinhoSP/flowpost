import { createClient } from "@supabase/supabase-js";
import { publishToMastodon } from "./platforms/mastodon";
import { publishInstagramPost } from "./platforms/instagram";
import { PublishResult } from "./platforms/platform";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PlatformPublishFn = (post: any, supabase: any) => Promise<PublishResult>;

const platformPublishers: Record<string, PlatformPublishFn> = {
  mastodon: async (post, _supabase) => {
    const { data: accounts } = await _supabase
      .from('social_accounts')
      .select('access_token')
      .eq('user_id', post.user_id)
      .eq('platform', 'mastodon');
    if (!accounts || accounts.length === 0) throw new Error('Conta Mastodon não conectada');
    return publishToMastodon(post, accounts[0].access_token);
  },
  instagram: (post, _supabase) => publishInstagramPost(post, _supabase),
};

async function processPosts() {
  console.log('[Worker] Checking for posts to publish...');

  const { data: posts, error } = await supabase.rpc('get_posts_to_publish');

  if (error) {
    console.error('[Worker] RPC error:', error);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('[Worker] No posts to publish');
    return;
  }

  console.log(`[Worker] Found ${posts.length} posts to publish`);

  for (const post of posts) {
    console.log(`[Worker] Processing post #${post.id} for user ${post.user_id}`);

    const networks: string[] = post.networks || [];
    if (networks.length === 0) {
      console.warn(`[Worker] Post #${post.id} has no target networks`);
      continue;
    }

    const mediaUrls = post.media_urls || [];
    const publishPost = {
      id: post.id,
      user_id: post.user_id,
      content: post.content || '',
      media_urls: mediaUrls.length > 0 ? mediaUrls : null as any,
    };

    let anySuccess = false;
    let lastError: string | null = null;

    for (const platform of networks) {
      const publisher = platformPublishers[platform];
      if (!publisher) {
        console.warn(`[Worker] Unknown platform: ${platform}`);
        continue;
      }

      try {
        console.log(`[Worker] Publishing post #${post.id} to ${platform}`);
        const result = await publisher({ ...publishPost, platform }, supabase);
        console.log(`[Worker] Post #${post.id} published to ${platform}: ${result.url}`);
        anySuccess = true;
      } catch (err: any) {
        console.error(`[Worker] Error publishing post #${post.id} to ${platform}:`, err.message);
        lastError = err.message;
      }
    }

    if (anySuccess) {
      await supabase.rpc('update_post_status', {
        p_post_id: post.id,
        p_status: 'published',
      });
    } else {
      await supabase.rpc('update_post_status', {
        p_post_id: post.id,
        p_status: 'failed',
        p_error: lastError || 'Erro ao publicar',
      });
    }
  }

  console.log('[Worker] Done');
}

processPosts();
