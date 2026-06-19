import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let __dirname: string;
try { __dirname = dirname(fileURLToPath((import.meta as any).url)); } catch { __dirname = process.cwd(); }

interface SubscriptionData {
  subscriptionId: string;
  planId: string;
  status: string;
  updatedAt: string;
}

const STORE_PATH = join(__dirname, 'data', 'subscriptions.json');

let cache: Record<string, SubscriptionData> | null = null;

async function load(): Promise<Record<string, SubscriptionData>> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    cache = JSON.parse(raw);
  } catch {
    cache = {};
  }
  return cache!;
}

async function save(): Promise<void> {
  if (!cache) return;
  await fs.writeFile(STORE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

export const SubscriptionStore = {
  async get(userId: string): Promise<SubscriptionData | null> {
    const data = await load();
    return data[userId] || null;
  },

  async set(userId: string, sub: SubscriptionData): Promise<void> {
    const data = await load();
    data[userId] = sub;
    cache = data;
    await save();
  },

  async getAll(): Promise<Record<string, SubscriptionData>> {
    return load();
  },
};
