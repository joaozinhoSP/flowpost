import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawBody = req.body;
    if (!rawBody?.file) {
      res.status(400).json({ error: 'Arquivo não enviado' });
      return;
    }

    const uploadDir = join(__dirname, '..', '..', '..', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const ext = '.bin';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, rawBody.file);

    res.json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
