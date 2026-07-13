const { withEntitlementsPlist } = require('expo/config-plugins');

// expo-widgets currently adds this entitlement even when widget push updates
// are disabled. Strip it so EAS does not provision or request an APNs key.
module.exports = function withNoPushNotifications(config) {
  return withEntitlementsPlist(config, (entitlementsConfig) => {
    delete entitlementsConfig.modResults['aps-environment'];
    return entitlementsConfig;
  });
};
