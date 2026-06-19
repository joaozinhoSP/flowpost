import 'dotenv/config';
import { PLANS } from './plans';

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAPRFqVmrHSpvUtihKcLG8nSCIdkEImgoY',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  mastodon: {
    instance: process.env.MASTODON_INSTANCE || 'kolektiva.social',
    clientId: process.env.MASTODON_CLIENT_ID || 'a4T1RiBI4n3QdRBLBqYSZzMksC8PenYfkaQVk-EIgG8',
    clientSecret: process.env.MASTODON_CLIENT_SECRET || '3gouZDHygaIcPvN2psmcsPSMuGZ6pSn1w2en9xPYDB4',
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

(PLANS as any).pro.checkoutUrl = process.env.FORTPAY_CHECKOUT_URL_PRO || '';
(PLANS as any).business.checkoutUrl = process.env.FORTPAY_CHECKOUT_URL_BUSINESS || '';
