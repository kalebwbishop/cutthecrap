const { withInfoPlist } = require("expo/config-plugins");

/**
 * Expo config plugin that cleans up Info.plist for production builds:
 * - Removes LSMinimumSystemVersion (macOS key, not iOS)
 * - Strips exp+ URL schemes (Expo dev artifact) in production builds
 * - Sets NSAllowsLocalNetworking to false
 */
const withCleanInfoPlist = (config) => {
  return withInfoPlist(config, (config) => {
    const plist = config.modResults;

    // Remove LSMinimumSystemVersion (macOS key, not iOS)
    delete plist.LSMinimumSystemVersion;

    // Strip exp+ URL schemes in production builds
    const isProduction = process.env.EAS_BUILD_PROFILE === "production";
    if (isProduction && plist.CFBundleURLTypes) {
      plist.CFBundleURLTypes = plist.CFBundleURLTypes
        .map((urlType) => {
          if (urlType.CFBundleURLSchemes) {
            urlType.CFBundleURLSchemes = urlType.CFBundleURLSchemes.filter(
              (scheme) => !scheme.startsWith("exp+")
            );
          }
          return urlType;
        })
        .filter(
          (urlType) =>
            urlType.CFBundleURLSchemes && urlType.CFBundleURLSchemes.length > 0
        );
    }

    // Set NSAllowsLocalNetworking to false without clobbering other ATS settings
    if (plist.NSAppTransportSecurity) {
      plist.NSAppTransportSecurity.NSAllowsLocalNetworking = false;
    }

    return config;
  });
};

module.exports = withCleanInfoPlist;
