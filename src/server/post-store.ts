import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let __dirname: string;
try { __dirname = dirname(fileURLToPath((import.meta as any).url)); } catch { __dirname = process.cwd(); }

interface Post {
  id: number;
  user_id: string;
  content: string;
  networks: string[];
  scheduled_date: string | null;
  status: string;
  media_url: string | null;
  media_urls: string[];
  engagement: number;
  hashtags: string[];
  created_at: string;
  updated_at: string;
  post_url?: string;
  error_message?: string;
  published_at?: string;
}

const STORE_PATH = join(__dirname, 'data', 'posts.json');

let cache: Post[] | null = null;
let nextId = 1;

async function load(): Promise<Post[]> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    cache = parsed.posts || [];
    nextId = parsed.nextId || cache.length + 1;
  } catch {
    cache = [];
    nextId = 1;
  }
  return cache!;
}

async function save(): Promise<void> {
  await fs.writeFile(STORE_PATH, JSON.stringify({ posts: cache, nextId }, null, 2), 'utf-8');
}

export const PostStore = {
  async list(userId: string, filter?: { status?: string; search?: string }): Promise<{ posts: Post[]; total: number }> {
    const all = await load();
    let filtered = all.filter(p => p.user_id === userId);

    if (filter?.status && filter.status !== 'all') {
      filtered = filtered.filter(p => p.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter(p => p.content.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return { posts: filtered, total: filtered.length };
  },

  async create(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post> {
    const all = await load();
    const now = new Date().toISOString();
    const entry: Post = { ...post, id: nextId++, created_at: now, updated_at: now };
    all.push(entry);
    cache = all;
    await save();
    return entry;
  },

  async update(id: number, userId: string, updates: Partial<Post>): Promise<Post | null> {
    const all = await load();
    const idx = all.findIndex(p => p.id === id && p.user_id === userId);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, id, user_id: userId, updated_at: new Date().toISOString() };
    cache = all;
    await save();
    return all[idx];
  },

  async remove(id: number, userId: string): Promise<boolean> {
    const all = await load();
    const idx = all.findIndex(p => p.id === id && p.user_id === userId);
    if (idx === -1) return false;
    all.splice(idx, 1);
    cache = all;
    await save();
    return true;
  },

  async stats(userId: string): Promise<{ published: number; scheduled: number; drafts: number; total: number; engagementThisMonth: number; weekCounts: Record<string, number> }> {
    const all = await load();
    const userPosts = all.filter(p => p.user_id === userId);
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const weekData: string[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay() + i);
      return d.toISOString().slice(0, 10);
    });

    const weekCounts: Record<string, number> = {};
    const weekStart = weekData[0];

    userPosts.forEach(p => {
      const day = new Date(p.created_at).toISOString().slice(0, 10);
      if (day >= weekStart) weekCounts[day] = (weekCounts[day] || 0) + 1;
    });

    return {
      published: userPosts.filter(p => p.status === 'published').length,
      scheduled: userPosts.filter(p => p.status === 'scheduled').length,
      drafts: userPosts.filter(p => p.status === 'draft').length,
      total: userPosts.length,
      engagementThisMonth: userPosts.filter(p => p.created_at >= firstOfMonth).reduce((s, p) => s + (p.engagement || 0), 0),
      weekCounts,
    };
  },

  async calendar(userId: string, month: number, year: number): Promise<Record<string, Post[]>> {
    const all = await load();
    const userPosts = all.filter(p => p.user_id === userId);
    const firstDay = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);

    const grouped: Record<string, Post[]> = {};
    userPosts.forEach(p => {
      const date = (p.scheduled_date || p.created_at).slice(0, 10);
      if (date >= firstDay && date <= lastDay) {
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(p);
      }
    });
    return grouped;
  },

  async recent(userId: string, limit = 5): Promise<Post[]> {
    const all = await load();
    return all.filter(p => p.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
  },

  async getNextScheduled(): Promise<Post | null> {
    const all = await load();
    const now = new Date().toISOString();
    const scheduled = all
      .filter(p => p.status === 'scheduled' && p.scheduled_date && p.scheduled_date <= now)
      .sort((a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime());
    return scheduled[0] || null;
  },
};
