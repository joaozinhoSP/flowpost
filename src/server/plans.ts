export const PLANS = {
  free: { id: 'free', name: 'Free', price: 0, postsPerMonth: 5, checkoutUrl: '' },
  pro: { id: 'pro_monthly', name: 'Pro', price: 2900, postsPerMonth: 50, displayPrice: 'R$ 29', checkoutUrl: '' },
  business: { id: 'business_monthly', name: 'Business', price: 6900, postsPerMonth: -1, displayPrice: 'R$ 69', checkoutUrl: '' },
} as const;

export function getPlanLimit(planId: string): number {
  switch (planId) {
    case 'free': return 5;
    case 'pro_monthly': return 50;
    case 'business_monthly': return -1;
    default: return 0;
  }
}
