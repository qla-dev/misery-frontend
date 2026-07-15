import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

export type PremiumPlan = 'monthly' | 'yearly';

export interface PremiumStatus {
  active: boolean;
  plan: PremiumPlan | null;
  expirationDate: string | null;
  productIdentifier: string | null;
  managementURL: string | null;
}

export interface PremiumPackages {
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
}

export const REVENUECAT_OFFERING_IDENTIFIER = 'misery-pro';
export const REVENUECAT_OFFERING_REST_ID = 'ofrng75a5f44275';
export const REVENUECAT_PRODUCT_IDENTIFIERS: Record<PremiumPlan, string> = {
  monthly: 'misery_monthly',
  yearly: 'misery_yearly',
};

let configured = false;
let configuredUserId: string | null = null;

const appUserIdForBackendUser = (userId: number | null) => userId ? `misery-user-${userId}` : null;

const getApiKey = () => {
  const config = Constants.expoConfig?.extra?.revenueCat ?? {};
  if (Constants.appOwnership === 'expo') return config.testStoreApiKey || '';
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || config.iosApiKey || '';
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || config.androidApiKey || '';
  return '';
};

const getEntitlementIdentifier = () => {
  const config = Constants.expoConfig?.extra?.revenueCat ?? {};
  return process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || config.entitlementIdentifier || 'misery-pro';
};

const emptyStatus = (): PremiumStatus => ({
  active: false,
  expirationDate: null,
  managementURL: null,
  plan: null,
  productIdentifier: null,
});

const planForProduct = (identifier?: string | null): PremiumPlan | null => {
  if (!identifier) return null;
  if (identifier === REVENUECAT_PRODUCT_IDENTIFIERS.yearly) return 'yearly';
  if (identifier === REVENUECAT_PRODUCT_IDENTIFIERS.monthly) return 'monthly';
  const normalized = identifier.toLowerCase();
  if (normalized.includes('year') || normalized.includes('annual')) return 'yearly';
  if (normalized.includes('month')) return 'monthly';
  return null;
};

export const premiumStatusFromCustomerInfo = (
  customerInfo?: CustomerInfo | null,
  fallbackPlan: PremiumPlan | null = null,
): PremiumStatus => {
  const activeEntitlements = customerInfo?.entitlements?.active ?? {};
  const configuredEntitlement = activeEntitlements[getEntitlementIdentifier()];
  const supportedEntitlements = Object.values(customerInfo?.entitlements?.active ?? {})
    .filter((entitlement) => planForProduct(entitlement?.productIdentifier) !== null)
    .sort((left, right) => {
      const leftExpiry = new Date(left?.expirationDate ?? 0).getTime();
      const rightExpiry = new Date(right?.expirationDate ?? 0).getTime();
      return rightExpiry - leftExpiry;
    });
  const entitlement = configuredEntitlement ?? supportedEntitlements[0];
  if (!entitlement) return emptyStatus();

  const plan = planForProduct(entitlement.productIdentifier) ?? fallbackPlan;

  return {
    active: true,
    expirationDate: entitlement.expirationDate ?? null,
    managementURL: customerInfo?.managementURL ?? null,
    plan,
    productIdentifier: entitlement.productIdentifier,
  };
};

const errorDetails = (error: any, stage: string, extra: Record<string, unknown> = {}) => {
  const details = {
    stage,
    platform: Platform.OS,
    apiKeyPresent: Boolean(getApiKey()),
    code: error?.code,
    message: error?.message,
    readableErrorCode: error?.userInfo?.readableErrorCode,
    underlyingErrorMessage:
      error?.userInfo?.underlyingErrorMessage ??
      error?.userInfo?.NSUnderlyingError?.localizedDescription ??
      error?.userInfo?.NSDebugDescription,
    userCancelled: error?.userCancelled,
    ...extra,
  };
  const nextError = new Error(JSON.stringify(details, null, 2));
  (nextError as any).code = error?.code;
  (nextError as any).userCancelled = error?.userCancelled;
  return nextError;
};

export const hasRevenueCatConfig = () => Boolean(getApiKey());

export const configureRevenueCat = async (backendUserId?: number | null) => {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  const requestedUserId = backendUserId === undefined ? undefined : appUserIdForBackendUser(backendUserId);
  if (!configured) {
    if (__DEV__) Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey, appUserID: requestedUserId ?? null });
    configured = true;
    configuredUserId = requestedUserId ?? null;
  } else if (requestedUserId !== undefined && requestedUserId !== configuredUserId) {
    if (requestedUserId) await Purchases.logIn(requestedUserId);
    else if (configuredUserId) await Purchases.logOut();
    configuredUserId = requestedUserId;
  }
  return true;
};

export const identifyRevenueCatUser = async (backendUserId: number | null) => {
  const ready = await configureRevenueCat(backendUserId);
  if (!ready) return emptyStatus();
  return premiumStatusFromCustomerInfo(await Purchases.getCustomerInfo());
};

const loadOfferings = async (): Promise<PurchasesOfferings> => {
  const ready = await configureRevenueCat();
  if (!ready) throw new Error('RevenueCat public SDK API key is not configured.');
  try {
    return await Purchases.getOfferings();
  } catch (error) {
    throw errorDetails(error, 'getOfferings', { offeringIdentifier: REVENUECAT_OFFERING_IDENTIFIER });
  }
};

const offeringPackages = (offerings: PurchasesOfferings) =>
  offerings.all?.[REVENUECAT_OFFERING_IDENTIFIER]?.availablePackages ??
  offerings.current?.availablePackages ??
  [];

export const getPremiumPackages = async (): Promise<PremiumPackages> => {
  const packages = offeringPackages(await loadOfferings());
  return {
    monthly:
      packages.find((item) => item.product.identifier === REVENUECAT_PRODUCT_IDENTIFIERS.monthly) ??
      packages.find((item) => item.packageType === Purchases.PACKAGE_TYPE.MONTHLY) ??
      null,
    yearly:
      packages.find((item) => item.product.identifier === REVENUECAT_PRODUCT_IDENTIFIERS.yearly) ??
      packages.find((item) => item.packageType === Purchases.PACKAGE_TYPE.ANNUAL) ??
      null,
  };
};

export const syncRevenueCatStatus = async (): Promise<PremiumStatus> => {
  const ready = await configureRevenueCat();
  if (!ready) return emptyStatus();
  return premiumStatusFromCustomerInfo(await Purchases.getCustomerInfo());
};

export const purchaseRevenueCatPlan = async (plan: PremiumPlan): Promise<PremiumStatus> => {
  const packages = await getPremiumPackages();
  const targetPackage = packages[plan];
  if (!targetPackage) {
    throw new Error(`RevenueCat package for ${REVENUECAT_PRODUCT_IDENTIFIERS[plan]} was not found in ${REVENUECAT_OFFERING_IDENTIFIER}.`);
  }
  try {
    const result = await Purchases.purchasePackage(targetPackage);
    let status = premiumStatusFromCustomerInfo(result.customerInfo, plan);
    if (!status.active) {
      await Purchases.invalidateCustomerInfoCache();
      status = premiumStatusFromCustomerInfo(await Purchases.getCustomerInfo(), plan);
    }
    if (!status.active) {
      throw new Error(
        `Purchase completed, but RevenueCat did not activate the ${getEntitlementIdentifier()} entitlement for ${targetPackage.product.identifier}. ` +
        'Attach this product to that entitlement in RevenueCat and try Restore Purchases.',
      );
    }
    return status;
  } catch (error) {
    if ((error as any)?.message?.includes('no active Misery PRO')) throw error;
    throw errorDetails(error, 'purchasePackage', {
      packageIdentifier: targetPackage.identifier,
      productIdentifier: targetPackage.product.identifier,
    });
  }
};

export const restoreRevenueCatPurchases = async (): Promise<PremiumStatus> => {
  const ready = await configureRevenueCat();
  if (!ready) throw new Error('RevenueCat public SDK API key is not configured.');
  try {
    return premiumStatusFromCustomerInfo(await Purchases.restorePurchases());
  } catch (error) {
    throw errorDetails(error, 'restorePurchases');
  }
};

export const addRevenueCatStatusListener = async (listener: (status: PremiumStatus) => void) => {
  const ready = await configureRevenueCat();
  if (!ready) return () => undefined;
  const handleUpdate = (customerInfo: CustomerInfo) => listener(premiumStatusFromCustomerInfo(customerInfo));
  Purchases.addCustomerInfoUpdateListener(handleUpdate);
  return () => Purchases.removeCustomerInfoUpdateListener(handleUpdate);
};

export const openRevenueCatCustomerCenter = async () => {
  const ready = await configureRevenueCat();
  if (!ready) throw new Error('RevenueCat public SDK API key is not configured.');
  await RevenueCatUI.presentCustomerCenter();
  return syncRevenueCatStatus();
};
