import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

let __dirname: string;
try { __dirname = dirname(fileURLToPath((import.meta as any).url)); } catch { __dirname = process.cwd(); }
const router = Router();

interface SocialAccount {
  id: string;
  userId: string;
  network: string;
  label: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  accountId?: string;
  accountName?: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

const STORE_PATH = join(__dirname, '..', 'data', 'social-accounts.json');

async function loadAccounts(): Promise<SocialAccount[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch { return []; }
}

async function saveAccounts(accounts: SocialAccount[]): Promise<void> {
  await fs.writeFile(STORE_PATH, JSON.stringify(accounts, null, 2), 'utf-8');
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accounts = (await loadAccounts()).filter(a => a.userId === req.user!.uid);
    res.json(accounts.map(({ accessToken, refreshToken, ...safe }) => safe));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { network, label, accessToken, refreshToken, expiresAt, accountId, accountName, avatar } = req.body;
    if (!network || !accessToken) {
      res.status(400).json({ error: 'Rede social e token são obrigatórios' });
      return;
    }

    const accounts = await loadAccounts();
    const account: SocialAccount = {
      id: makeId(),
      userId: req.user!.uid,
      network,
      label: label || network,
      accessToken,
      refreshToken,
      expiresAt,
      accountId,
      accountName: accountName || label || network,
      avatar,
      active: true,
      createdAt: new Date().toISOString(),
    };
    accounts.push(account);
    await saveAccounts(accounts);

    const { accessToken: _, refreshToken: __, ...safe } = account;
    res.status(201).json(safe);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accounts = await loadAccounts();
    const idx = accounts.findIndex(a => a.id === req.params.id && a.userId === req.user!.uid);
    if (idx === -1) { res.status(404).json({ error: 'Conta não encontrada' }); return; }
    accounts.splice(idx, 1);
    await saveAccounts(accounts);
    res.json({ deleted: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const accounts = await loadAccounts();
    const idx = accounts.findIndex(a => a.id === req.params.id && a.userId === req.user!.uid);
    if (idx === -1) { res.status(404).json({ error: 'Conta não encontrada' }); return; }
    Object.assign(accounts[idx], req.body);
    await saveAccounts(accounts);
    const { accessToken, refreshToken, ...safe } = accounts[idx];
    res.json(safe);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
