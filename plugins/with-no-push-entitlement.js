/**
 * Tiaro only schedules local notifications (the daily reminder), which need no push entitlement. expo-notifications
 * adds `aps-environment` anyway; removing it keeps Apple push keys out of the build. It must come BEFORE
 * expo-notifications in app.json "plugins": mods run in reverse order, so this one then runs after it.
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withNoPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
