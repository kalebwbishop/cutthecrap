export interface BillingCustomerInfo {
  isPro: boolean;
  managementURL: string | null;
}

export interface BillingPackage {
  identifier: string;
  productId: string;
  priceString: string;
  packageType: string;
}

export interface BillingOffering {
  identifier: string;
  packages: BillingPackage[];
}

export interface BillingService {
  configure(appUserId?: string): Promise<void>;
  isConfigured(): boolean;
  logIn(appUserId: string): Promise<BillingCustomerInfo>;
  logOut(): Promise<void>;
  getCustomerInfo(): Promise<BillingCustomerInfo>;
  getOfferings(): Promise<BillingOffering | null>;
  restorePurchases(): Promise<BillingCustomerInfo>;
  getManagementURL(): Promise<string | null>;
}
