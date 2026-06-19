import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import paymentsRouter from './routes/payments';
import userRouter from './routes/user';
import postsRouter from './routes/posts';
import analyticsRouter from './routes/analytics';
import socialRouter from './routes/social';
import mastodonRouter from './routes/mastodon';
import instagramRouter from './routes/instagram';
import { config } from './config';

const app = express();

const allowedOrigins = [
  config.appUrl,
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.NETLIFY_URL ? [process.env.NETLIFY_URL, `https://${process.env.NETLIFY_SITE_NAME}.netlify.app`] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

app.use('/api/payments', paymentsRouter);
app.use('/api/user', userRouter);
app.use('/api/posts', postsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/social', socialRouter);
app.use('/api', mastodonRouter);
app.use('/api', instagramRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
