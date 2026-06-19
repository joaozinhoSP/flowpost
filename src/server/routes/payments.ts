import { Router, Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { PLANS, getPlanLimit } from '../plans';
import { SubscriptionStore } from '../store';

const router = Router();

router.post('/create-checkout', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.body;

    if (!planId || planId === 'free') {
      res.status(400).json({ error: 'Plano inválido' });
      return;
    }

    const plan = Object.values(PLANS).find((p) => p.id === planId);
    if (!plan || !plan.checkoutUrl) {
      res.status(400).json({ error: 'URL de checkout não configurada' });
      return;
    }

    res.json({ url: plan.checkoutUrl });
  } catch (err: any) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar checkout' });
  }
});

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const userId = body?.metadata?.user_id || body?.userId;
    const planId = body?.plan_id || body?.planId;
    const status = body?.status || body?.paymentStatus;
    const subscriptionId = body?.subscription_id || body?.subscriptionId;

    if (userId && planId && status) {
      const subStatus = status === 'completed' || status === 'active' || status === 'paid'
        ? 'active'
        : status === 'canceled' || status === 'cancelled'
        ? 'canceled'
        : 'pending';

      await SubscriptionStore.set(userId, {
        subscriptionId: subscriptionId || '',
        planId: subStatus === 'canceled' ? 'free' : planId,
        status: subStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/subscription/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const sub = await SubscriptionStore.get(userId);

    if (!sub) {
      res.json({ planId: 'free', status: 'active', postsLimit: 5 });
      return;
    }

    const limit = getPlanLimit(sub.planId);

    res.json({
      planId: sub.planId,
      status: sub.status,
      subscriptionId: sub.subscriptionId,
      postsLimit: limit,
      updatedAt: sub.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
