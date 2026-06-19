import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { PostStore } from '../post-store';

const router = Router();

const supabase = config.supabase.url
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey)
  : null;

const useSupabase = !!supabase;

async function withDb(userId: string) {
  return { userId, supabase, isSupabase: useSupabase };
}

function networksArray(networks: unknown): string[] {
  if (Array.isArray(networks)) return networks.filter(Boolean).map(String);
  if (typeof networks === 'string') return networks.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const { status: statusFilter, search } = req.query as Record<string, string>;

    const { posts, total } = await PostStore.list(userId, { status: statusFilter, search });
    res.json({ posts, total });
  } catch (err: any) {
    console.error('Posts list error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const { content, networks, scheduledDate, scheduledTime, mediaUrl, mediaUrls, hashtags, action } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ error: 'Conteúdo é obrigatório' });
      return;
    }

    const nets = networksArray(networks);
    if (!nets.length) {
      res.status(400).json({ error: 'Selecione ao menos uma rede social' });
      return;
    }

    const scheduledDateObj = scheduledDate && scheduledTime
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : null;

    let status = 'draft';
    if (action === 'publish') status = 'published';
    else if (scheduledDateObj) status = 'scheduled';

    const postData: Record<string, any> = {
      user_id: userId,
      content,
      networks: nets,
      scheduled_date: scheduledDateObj,
      status,
      media_url: mediaUrl || null,
      media_urls: Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : (mediaUrl ? [mediaUrl] : []),
      engagement: 0,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
    };

    if (useSupabase) {
      const { data, error } = await supabase!
        .from('posts')
        .insert(postData)
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(data);
    } else {
      const post = await PostStore.create(postData as any);
      res.status(201).json(post);
    }
  } catch (err: any) {
    console.error('Post create error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const id = parseInt(req.params.id);
    const { content, networks, scheduledDate, scheduledTime, mediaUrl, mediaUrls, hashtags, status: newStatus } = req.body;

    const updates: Record<string, any> = {};
    if (content !== undefined) updates.content = content;
    if (networks !== undefined) updates.networks = networksArray(networks);
    if (mediaUrl !== undefined) updates.media_url = mediaUrl;
    if (mediaUrls !== undefined) updates.media_urls = mediaUrls;
    if (hashtags !== undefined) updates.hashtags = hashtags;
    if (newStatus) updates.status = newStatus;
    if (scheduledDate && scheduledTime) {
      updates.scheduled_date = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    if (useSupabase) {
      const { data, error } = await supabase!
        .from('posts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      if (!data) { res.status(404).json({ error: 'Post não encontrado' }); return; }
      res.json(data);
    } else {
      const post = await PostStore.update(id, userId, updates);
      if (!post) { res.status(404).json({ error: 'Post não encontrado' }); return; }
      res.json(post);
    }
  } catch (err: any) {
    console.error('Post update error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const id = parseInt(req.params.id);

    if (useSupabase) {
      const { error } = await supabase!.from('posts').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    } else {
      await PostStore.remove(id, userId);
    }

    res.json({ deleted: true });
  } catch (err: any) {
    console.error('Post delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const now = new Date();
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    if (useSupabase) {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [publishedRes, scheduledRes, draftsRes, monthRes, totalRes] = await Promise.all([
        supabase!.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'published'),
        supabase!.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'scheduled'),
        supabase!.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'draft'),
        supabase!.from('posts').select('engagement').eq('user_id', userId).gte('created_at', firstOfMonth),
        supabase!.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      const monthEngagement = (monthRes.data || []).reduce((sum: number, p: any) => sum + (p.engagement || 0), 0);

      const weekData: string[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - d.getDay() + i);
        return d.toISOString().slice(0, 10);
      });

      const weekRes = await supabase!
        .from('posts').select('created_at').eq('user_id', userId)
        .gte('created_at', weekData[0])
        .lte('created_at', new Date(weekData[6] + 'T23:59:59').toISOString());

      const weekCounts: Record<string, number> = {};
      (weekRes.data || []).forEach((p: any) => {
        const day = new Date(p.created_at).toISOString().slice(0, 10);
        weekCounts[day] = (weekCounts[day] || 0) + 1;
      });

      const chart = weekData.map((date, i) => ({ name: dayNames[i], posts: weekCounts[date] || 0 }));

      res.json({
        published: publishedRes.count || 0, scheduled: scheduledRes.count || 0,
        drafts: draftsRes.count || 0, total: totalRes.count || 0,
        engagementThisMonth: monthEngagement, chart,
      });
    } else {
      const stats = await PostStore.stats(userId);
      const weekData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - d.getDay() + i);
        return d.toISOString().slice(0, 10);
      });
      const chart = weekData.map((date, i) => ({ name: dayNames[i], posts: stats.weekCounts[date] || 0 }));
      res.json({ ...stats, chart });
    }
  } catch (err: any) {
    console.error('Posts stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/calendar', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const { month, year } = req.query as Record<string, string>;
    const m = parseInt(month || String(new Date().getMonth() + 1));
    const y = parseInt(year || String(new Date().getFullYear()));

    if (useSupabase) {
      const firstDay = new Date(y, m - 1, 1).toISOString();
      const lastDay = new Date(y, m, 0, 23, 59, 59).toISOString();
      const { data, error } = await supabase!
        .from('posts').select('id, content, networks, scheduled_date, created_at, status')
        .eq('user_id', userId).gte('created_at', firstDay).lte('created_at', lastDay)
        .order('scheduled_date', { ascending: true });
      if (error) throw error;

      const grouped: Record<string, any[]> = {};
      for (const post of data || []) {
        const date = (post.scheduled_date || post.created_at).slice(0, 10);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(post);
      }
      res.json(grouped);
    } else {
      const grouped = await PostStore.calendar(userId, m, y);
      res.json(grouped);
    }
  } catch (err: any) {
    console.error('Calendar error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    if (useSupabase) {
      const { data, error } = await supabase!
        .from('posts').select('id, content, networks, status, created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
      if (error) throw error;
      res.json(data || []);
    } else {
      const posts = await PostStore.recent(userId);
      res.json(posts);
    }
  } catch (err: any) {
    console.error('Recent posts error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
