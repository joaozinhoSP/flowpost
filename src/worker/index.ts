import { createClient } from "@supabase/supabase-js";
import { publishToMastodon } from "./platforms/mastodon";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    try {
      const { data: accounts, error: accountError } = await supabase
        .from('social_accounts')
        .select('access_token, platform_username')
        .eq('user_id', post.user_id)
        .eq('platform', 'mastodon');

      if (accountError) {
        throw new Error(`Error fetching accounts: ${accountError.message}`);
      }

      if (!accounts || accounts.length === 0) {
        console.log(`[Worker] No Mastodon account for user ${post.user_id}, marking as failed`);
        await supabase.rpc('update_post_status', {
          p_post_id: post.id,
          p_status: 'failed',
          p_error: 'Conta Mastodon não conectada',
        });
        continue;
      }

      const account = accounts[0];
      const mediaUrls = post.media_urls || [];

      const publishPost = {
        id: post.id,
        user_id: post.user_id,
        platform: 'mastodon' as const,
        content: post.content || '',
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
      };

      const result = await publishToMastodon(publishPost, account.access_token);

      await supabase.rpc('update_post_status', {
        p_post_id: post.id,
        p_status: 'published',
        p_url: result.url,
      });

      console.log(`[Worker] Post #${post.id} published successfully: ${result.url}`);
    } catch (err: any) {
      console.error(`[Worker] Error publishing post #${post.id}:`, err.message);
      await supabase.rpc('update_post_status', {
        p_post_id: post.id,
        p_status: 'failed',
        p_error: err.message,
      });
    }
  }

  console.log('[Worker] Done');
}

processPosts();
