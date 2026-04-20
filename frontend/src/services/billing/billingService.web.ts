import apiClient from '@/api/client';
import type { BillingService, BillingCustomerInfo, BillingOffering } from './types';
import { PRO_ENTITLEMENT } from './constants';

let _configured = false;
let _userId: string | null = null;

/**
 * Web billing service — uses our backend to create Stripe Checkout sessions.
 *
 * Product/price info comes from env vars on the backend; checkout
 * sessions are created server-side and the user is redirected to
 * Stripe-hosted checkout.  Entitlement state is queried from the
 * backend entitlements API.
 */
export const billingService: BillingService = {
  async configure(appUserId?: string) {
    _userId = appUserId ?? null;
    _configured = true;
  },

  isConfigured() {
    return _configured;
  },

  async logIn(appUserId: string): Promise<BillingCustomerInfo> {
    _userId = appUserId;
    return this.getCustomerInfo();
  },

  async logOut(): Promise<void> {
    _userId = null;
  },

  async getCustomerInfo(): Promise<BillingCustomerInfo> {
    try {
      const token = (await import('@/store/authStore')).useAuthStore.getState().accessToken;
      if (!token) return { isPro: false, managementURL: null };

      const resp = await apiClient.get('/api/v1/me/entitlements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const entitlements = resp.data?.entitlements ?? {};
      const pro = entitlements[PRO_ENTITLEMENT];
      return {
        isPro: pro?.status === 'active',
        managementURL: null,
      };
    } catch {
      return { isPro: false, managementURL: null };
    }
  },

  async getOfferings(): Promise<BillingOffering | null> {
    // Web pricing is handled via Stripe price IDs configured on the backend.
    // We return static plan metadata here; actual prices come from Stripe Checkout.
    return {
      identifier: 'default',
      packages: [
        {
          identifier: 'monthly',
          productId: 'web.pro_monthly',
          priceString: '$2.99',
          packageType: 'monthly',
        },
        {
          identifier: 'yearly',
          productId: 'web.pro_yearly',
          priceString: '$29.99',
          packageType: 'annual',
        },
      ],
    };
  },

  async restorePurchases(): Promise<BillingCustomerInfo> {
    // Web purchases are tracked server-side; just re-fetch entitlements.
    return this.getCustomerInfo();
  },

  async getManagementURL(): Promise<string | null> {
    try {
      const token = (await import('@/store/authStore')).useAuthStore.getState().accessToken;
      if (!token) return null;

      const resp = await apiClient.post(
        '/api/v1/billing/web/create-portal-session',
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return resp.data?.url ?? null;
    } catch {
      return null;
    }
  },
};

/**
 * Create a Stripe Checkout session and redirect the user.
 */
export async function purchaseWebPackage(
  priceId: string,
  _options?: { customerEmail?: string },
): Promise<BillingCustomerInfo> {
  const token = (await import('@/store/authStore')).useAuthStore.getState().accessToken;
  if (!token) throw new Error('Authentication required');

  const resp = await apiClient.post(
    '/api/v1/billing/web/create-checkout-session',
    {
      priceId,
      successUrl: `${window.location.origin}/?checkout=success`,
      cancelUrl: `${window.location.origin}/upgrade`,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const { url } = resp.data;
  if (url) {
    window.location.href = url;
  }

  // The user is redirected to Stripe; this return won't be reached in practice.
  return { isPro: false, managementURL: null };
}

/** Stub — web paywall is now a custom React component, no SDK modal needed. */
export async function presentWebPaywall(_options: {
  htmlTarget?: HTMLElement;
  onBack?: (close: () => void) => void;
}): Promise<void> {
  // No-op: web paywall is rendered as a React component, not a modal SDK.
}

