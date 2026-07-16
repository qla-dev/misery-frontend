module.exports = ({ config }) => {
  const googleAuth = config.extra?.googleAuth || {};
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleAuth.iosClientId || '';
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || googleAuth.webClientId || '';
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleAuth.androidClientId || '';
  const reversedGoogleClientId = iosClientId
    ? `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`
    : null;
  const schemes = Array.isArray(config.scheme) ? config.scheme : [config.scheme];
  const revenueCat = config.extra?.revenueCat || {};

  return {
    ...config,
    scheme: [...new Set([...schemes.filter(Boolean), reversedGoogleClientId].filter(Boolean))],
    extra: {
      ...config.extra,
      googleAuth: {
        ...googleAuth,
        androidClientId,
        iosClientId,
        webClientId,
      },
      revenueCat: {
        ...revenueCat,
        androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY || revenueCat.androidApiKey || '',
        entitlementIdentifier: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || revenueCat.entitlementIdentifier || 'misery-pro',
        iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY || revenueCat.iosApiKey || '',
        offeringIdentifier: 'misery-pro',
        offeringRestId: 'ofrng75a5f44275',
        testStoreApiKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY || revenueCat.testStoreApiKey || '',
      },
    },
  };
};
