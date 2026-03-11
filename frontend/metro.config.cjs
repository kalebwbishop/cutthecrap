// metro.config.cjs
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Force the "react-native" export condition so libraries like Zustand resolve to
// their CJS build instead of the ESM build that uses `import.meta.env`
// (which is invalid in a non-module <script> tag on web).
config.resolver.unstable_conditionNames = [
  "react-native",
  "require",
  "default",
];

module.exports = config;
