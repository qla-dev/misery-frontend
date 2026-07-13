module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const reversedGoogleClientId = iosClientId
    ? `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`
    : null;
  const schemes = Array.isArray(config.scheme) ? config.scheme : [config.scheme];

  return {
    ...config,
    scheme: [...new Set([...schemes.filter(Boolean), reversedGoogleClientId].filter(Boolean))],
  };
};
