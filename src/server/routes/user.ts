import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { SubscriptionStore } from '../store';
import { getPlanLimit } from '../plans';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const router = Router();

const supabase = config.supabase.url
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey)
  : null;

router.get('/status', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const sub = await SubscriptionStore.get(userId);
    const planId = sub?.planId || 'free';
    const limit = getPlanLimit(planId);

    let postsUsed = 0;
    if (supabase) {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstOfMonth);

      postsUsed = count || 0;
    }

    res.json({
      uid: userId,
      email: req.user!.email,
      planId,
      subscriptionId: sub?.subscriptionId || null,
      status: sub?.status || 'active',
      postsUsed,
      postsLimit: limit,
      canPost: limit === -1 || postsUsed < limit,
    });
  } catch (err: any) {
    console.error('User status error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const { displayName, bio } = req.body;

    if (supabase) {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          display_name: displayName || '',
          bio: bio || '',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    }

    res.json({ saved: true });
  } catch (err: any) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;

    if (!supabase) {
      res.json({ displayName: req.user!.name || '', bio: '' });
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    res.json({
      displayName: data?.display_name || req.user!.name || '',
      bio: data?.bio || '',
    });
  } catch (err: any) {
    console.error('Profile get error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
