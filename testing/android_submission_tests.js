/**
 * Android / Google Play Submission Checklist — Automated Test Suite
 *
 * Verifies every programmatically-checkable item for Google Play submission.
 * Adapted from ios_submission_tests.js with Android-specific checks.
 *
 * Usage:  node testing/android_submission_tests.js
 * Output: colored console results + testing/android_submission_test_results.md on failure
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const BACKEND = path.join(ROOT, 'backend');

// ── helpers ─────────────────────────────────────────────────────────

function readFile(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readJson(relPath) {
  const raw = readFile(relPath);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/** Recursively collect file paths matching a filter under a directory. */
function walkFiles(dir, filter = () => true) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.expo') continue;
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, filter));
    } else if (filter(full)) {
      results.push(full);
    }
  }
  return results;
}

/** Search files for a regex, returning [{file, line, match}]. */
function grepFiles(dir, regex, globFilter) {
  const hits = [];
  const files = walkFiles(dir, globFilter);
  for (const filePath of files) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    lines.forEach((text, idx) => {
      if (regex.test(text)) {
        hits.push({
          file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
          line: idx + 1,
          match: text.trim(),
        });
      }
    });
  }
  return hits;
}

const tsFilter = (f) => /\.(ts|tsx|js|jsx)$/.test(f);

// ── test runner ─────────────────────────────────────────────────────

const results = [];
let passCount = 0;
let failCount = 0;
let warnCount = 0;
let manualCount = 0;

function pass(category, name, detail) {
  passCount++;
  results.push({ status: 'PASS', category, name, detail });
}
function fail(category, name, detail) {
  failCount++;
  results.push({ status: 'FAIL', category, name, detail });
}
function warn(category, name, detail) {
  warnCount++;
  results.push({ status: 'WARN', category, name, detail });
}
function manual(category, name, detail) {
  manualCount++;
  results.push({ status: 'MANUAL', category, name, detail });
}

// =====================================================================
// 1. APP BUILD (Android-specific)
// =====================================================================
const CAT_BUILD = 'App Build';

(() => {
  const appJson = readJson('frontend/app.json');
  if (!appJson) { fail(CAT_BUILD, 'app.json exists', 'frontend/app.json not found'); return; }
  const expo = appJson.expo || {};

  // Android package name
  if (expo.android?.package && /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(expo.android.package)) {
    pass(CAT_BUILD, 'Android package name is set', `android.package = "${expo.android.package}"`);
  } else {
    fail(CAT_BUILD, 'Android package name is set', `Invalid or missing android.package: "${expo.android?.package}"`);
  }

  // Version number
  if (expo.version && /^\d+\.\d+\.\d+$/.test(expo.version)) {
    pass(CAT_BUILD, 'Version number is set', `version = "${expo.version}"`);
  } else {
    fail(CAT_BUILD, 'Version number is set', `Invalid or missing version: "${expo.version}"`);
  }

  // Version code (Android equivalent of iOS buildNumber)
  if (expo.android?.versionCode && Number.isInteger(expo.android.versionCode)) {
    pass(CAT_BUILD, 'Version code is set', `android.versionCode = ${expo.android.versionCode}`);
  } else {
    fail(CAT_BUILD, 'Version code is set', 'android.versionCode is missing from app.json — required by Google Play');
  }

  // EAS project ID
  const easId = expo.extra?.eas?.projectId;
  if (easId && easId.trim() !== '') {
    pass(CAT_BUILD, 'EAS project ID is set', `eas.projectId = "${easId}"`);
  } else {
    fail(CAT_BUILD, 'EAS project ID is set', 'eas.projectId is empty in app.json — required for EAS Build/Submit');
  }

  // eas.json
  if (fileExists('frontend/eas.json')) {
    pass(CAT_BUILD, 'eas.json exists', 'frontend/eas.json found');
  } else {
    fail(CAT_BUILD, 'eas.json exists', 'frontend/eas.json not found — required for EAS Build');
  }

  // Adaptive icon (Android-specific)
  if (fileExists('frontend/assets/adaptive-icon.png')) {
    pass(CAT_BUILD, 'Adaptive icon exists', 'frontend/assets/adaptive-icon.png found');
  } else {
    fail(CAT_BUILD, 'Adaptive icon exists', 'frontend/assets/adaptive-icon.png not found — required for Android');
  }

  // Standard icon
  if (fileExists('frontend/assets/icon.png')) {
    pass(CAT_BUILD, 'App icon exists', 'frontend/assets/icon.png found');
  } else {
    fail(CAT_BUILD, 'App icon exists', 'frontend/assets/icon.png not found');
  }

  // Splash screen
  if (fileExists('frontend/assets/splash.png')) {
    pass(CAT_BUILD, 'Splash screen exists', 'frontend/assets/splash.png found');
  } else {
    fail(CAT_BUILD, 'Splash screen exists', 'frontend/assets/splash.png not found');
  }

  // Deep link scheme
  if (expo.scheme === 'cutthecrap') {
    pass(CAT_BUILD, 'Deep link scheme configured', `scheme = "${expo.scheme}"`);
  } else {
    fail(CAT_BUILD, 'Deep link scheme configured', `Expected "cutthecrap", got "${expo.scheme}"`);
  }

  // Adaptive icon background color
  if (expo.android?.adaptiveIcon?.backgroundColor) {
    pass(CAT_BUILD, 'Adaptive icon background color set', `backgroundColor = "${expo.android.adaptiveIcon.backgroundColor}"`);
  } else {
    warn(CAT_BUILD, 'Adaptive icon background color set', 'android.adaptiveIcon.backgroundColor is not set');
  }
})();

// =====================================================================
// 2. DEBUG CODE / PRODUCTION READINESS
// =====================================================================
const CAT_DEBUG = 'Debug Code';

(() => {
  const srcDir = path.join(FRONTEND, 'src');

  // console.log / console.error / console.warn in frontend source
  const consoleLogs = grepFiles(srcDir, /\bconsole\.(log|error|warn|debug|info)\s*\(/, tsFilter)
    .filter(h => !h.match.includes('__DEV__') && !h.file.includes('ErrorBoundary'));
  if (consoleLogs.length === 0) {
    pass(CAT_DEBUG, 'No console.log/error/warn in frontend src', 'Clean — no unguarded console statements found');
  } else {
    const detail = consoleLogs.map(h => `  ${h.file}:${h.line} → ${h.match}`).join('\n');
    fail(CAT_DEBUG, 'No console.log/error/warn in frontend src',
      `Found ${consoleLogs.length} console statement(s):\n${detail}`);
  }

  // localhost references in frontend source
  const localhostHits = grepFiles(srcDir, /localhost/i, tsFilter)
    .filter(h => !h.match.includes('__DEV__'));
  if (localhostHits.length === 0) {
    pass(CAT_DEBUG, 'No localhost references in frontend src', 'Clean');
  } else {
    const detail = localhostHits.map(h => `  ${h.file}:${h.line} → ${h.match}`).join('\n');
    fail(CAT_DEBUG, 'No localhost references in frontend src',
      `Found ${localhostHits.length} localhost reference(s):\n${detail}`);
  }

  // Test / sandbox API keys
  const testKeyHits = grepFiles(srcDir, /['"](?:test_|rcb_sb_|sk_test_|pk_test_)[A-Za-z0-9]+['"]/, tsFilter);
  if (testKeyHits.length === 0) {
    pass(CAT_DEBUG, 'No test/sandbox API keys in frontend src', 'Clean');
  } else {
    const detail = testKeyHits.map(h => `  ${h.file}:${h.line} → ${h.match}`).join('\n');
    fail(CAT_DEBUG, 'No test/sandbox API keys in frontend src',
      `Found ${testKeyHits.length} test/sandbox key(s):\n${detail}`);
  }

  // Placeholder / coming-soon content
  const placeholderHits = grepFiles(srcDir, /coming\s+soon|upcoming\s+feature|FIXME|HACK/i, tsFilter);
  if (placeholderHits.length === 0) {
    pass(CAT_DEBUG, 'No placeholder/coming-soon content', 'Clean');
  } else {
    const detail = placeholderHits.map(h => `  ${h.file}:${h.line} → ${h.match}`).join('\n');
    fail(CAT_DEBUG, 'No placeholder/coming-soon content',
      `Found ${placeholderHits.length} placeholder hit(s):\n${detail}`);
  }

  // TODO comments
  const todoHits = grepFiles(srcDir, /\/\/\s*TODO\b/i, tsFilter);
  if (todoHits.length === 0) {
    pass(CAT_DEBUG, 'No TODO comments in frontend src', 'Clean');
  } else {
    const detail = todoHits.map(h => `  ${h.file}:${h.line} → ${h.match}`).join('\n');
    warn(CAT_DEBUG, 'TODO comments in frontend src',
      `Found ${todoHits.length} TODO comment(s) — review before submission:\n${detail}`);
  }
})();

// =====================================================================
// 3. FUNCTIONAL COMPLETENESS
// =====================================================================
const CAT_FUNC = 'Functional Completeness';

(() => {
  const srcDir = path.join(FRONTEND, 'src');

  // Account deletion — frontend
  const deleteAccountFE = grepFiles(srcDir, /deleteAccount|delete.?account|DELETE.*\/auth\/account/i, tsFilter);
  if (deleteAccountFE.length > 0) {
    pass(CAT_FUNC, 'Account deletion (frontend)', `Found in ${deleteAccountFE.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Account deletion (frontend)', 'No deleteAccount implementation found in frontend');
  }

  // Account deletion — backend
  const backendDir = path.join(BACKEND, 'app');
  const deleteAccountBE = grepFiles(backendDir, /delete.*account|DELETE.*account|delete_user/i,
    (f) => /\.py$/.test(f));
  if (deleteAccountBE.length > 0) {
    pass(CAT_FUNC, 'Account deletion (backend)', `Found in ${deleteAccountBE.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Account deletion (backend)', 'No account deletion route found in backend');
  }

  // Logout — frontend
  const logoutFE = grepFiles(srcDir, /\blogout\b/i, tsFilter);
  if (logoutFE.length > 0) {
    pass(CAT_FUNC, 'Logout implemented (frontend)', `Found in ${logoutFE.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Logout implemented (frontend)', 'No logout implementation found');
  }

  // Logout — backend
  const logoutBE = grepFiles(backendDir, /logout/i, (f) => /\.py$/.test(f));
  if (logoutBE.length > 0) {
    pass(CAT_FUNC, 'Logout implemented (backend)', `Found in ${logoutBE.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Logout implemented (backend)', 'No logout route found in backend');
  }

  // Login / auth flow
  const loginFE = grepFiles(srcDir, /\blogin\b|handleAuthCode|WorkOS/i, tsFilter);
  if (loginFE.length > 0) {
    pass(CAT_FUNC, 'Login/auth flow (frontend)', `Found in ${loginFE.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Login/auth flow (frontend)', 'No login implementation found');
  }

  // Error handling
  const errorHandling = grepFiles(srcDir, /error.?code|error.?message|buildSummaryResponse|getStatusErrorMessage/i, tsFilter);
  if (errorHandling.length > 0) {
    pass(CAT_FUNC, 'Error states handled', `Error handling found in ${errorHandling.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Error states handled', 'No structured error handling found');
  }

  // Session expiry handling
  const sessionExpiry = grepFiles(srcDir, /sessionExpired|session.?expired|handleSessionExpired/i, tsFilter);
  if (sessionExpiry.length > 0) {
    pass(CAT_FUNC, 'Session expiry handling', `Found in ${sessionExpiry.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Session expiry handling', 'No session expiry handling found');
  }

  // Offline / network detection
  const offlineDetection = grepFiles(srcDir, /netinfo|isConnected|isOnline|connectivity|offline/i, tsFilter);
  if (offlineDetection.length > 0) {
    pass(CAT_FUNC, 'Offline/network detection', `Found in ${offlineDetection.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Offline/network detection',
      'No offline/network detection found — consider adding @react-native-community/netinfo. Google reviewers may test in airplane mode');
  }

  // Health check endpoint (frontend usage)
  const healthCheck = grepFiles(srcDir, /checkHealth|\/api\/health/i, tsFilter);
  if (healthCheck.length > 0) {
    pass(CAT_FUNC, 'Health check integration', `Found in ${healthCheck.length} file(s)`);
  } else {
    warn(CAT_FUNC, 'Health check integration', 'No health check usage found in frontend');
  }

  // Health endpoint (backend)
  const healthBE = grepFiles(backendDir, /health|SELECT\s+1/i, (f) => /\.py$/.test(f));
  if (healthBE.length > 0) {
    pass(CAT_FUNC, 'Health endpoint (backend)', `Found in ${healthBE.length} file(s)`);
  } else {
    fail(CAT_FUNC, 'Health endpoint (backend)', 'No health endpoint found in backend');
  }
})();

// =====================================================================
// 4. PRIVACY & PERMISSIONS (Android-specific)
// =====================================================================
const CAT_PRIVACY = 'Privacy & Permissions';

(() => {
  const appJson = readJson('frontend/app.json');
  const expo = appJson?.expo || {};

  // Check for unnecessary permission plugins/configs
  const permissionPlugins = (expo.plugins || []).filter(p => {
    const name = typeof p === 'string' ? p : p?.[0];
    return /camera|location|contacts|microphone|photo|media-library/i.test(name || '');
  });
  if (permissionPlugins.length === 0) {
    pass(CAT_PRIVACY, 'No unnecessary permission plugins', 'Only expo-font and expo-web-browser found — appropriate');
  } else {
    warn(CAT_PRIVACY, 'Unnecessary permission plugins found',
      `Plugins: ${permissionPlugins.map(p => typeof p === 'string' ? p : p[0]).join(', ')}`);
  }

  // Check for unnecessary Android permissions
  const androidPermissions = expo.android?.permissions || [];
  const unnecessaryPerms = androidPermissions.filter(p =>
    /CAMERA|ACCESS_FINE_LOCATION|RECORD_AUDIO|READ_CONTACTS|READ_EXTERNAL_STORAGE/i.test(p));
  if (unnecessaryPerms.length === 0) {
    pass(CAT_PRIVACY, 'No unnecessary Android permissions', 'No sensitive permissions declared');
  } else {
    warn(CAT_PRIVACY, 'Unnecessary Android permissions found',
      `Permissions: ${unnecessaryPerms.join(', ')} — verify these are needed`);
  }

  // Privacy screen exists
  if (fileExists('frontend/src/screens/PrivacyScreen.tsx')) {
    pass(CAT_PRIVACY, 'Privacy policy screen exists', 'frontend/src/screens/PrivacyScreen.tsx');
  } else {
    fail(CAT_PRIVACY, 'Privacy policy screen exists', 'PrivacyScreen.tsx not found');
  }

  // Terms screen exists
  if (fileExists('frontend/src/screens/TermsScreen.tsx')) {
    pass(CAT_PRIVACY, 'Terms of service screen exists', 'frontend/src/screens/TermsScreen.tsx');
  } else {
    fail(CAT_PRIVACY, 'Terms of service screen exists', 'TermsScreen.tsx not found');
  }

  // Data safety — no tracking SDKs
  const srcDir = path.join(FRONTEND, 'src');
  const trackingHits = grepFiles(srcDir, /IDFA|GAID|AdvertisingId|getAdvertisingId|firebase.analytics/i, tsFilter);
  if (trackingHits.length === 0) {
    pass(CAT_PRIVACY, 'No advertising/tracking SDKs', 'Clean — no advertising ID or tracking code found');
  } else {
    warn(CAT_PRIVACY, 'Tracking SDK usage detected',
      `Found ${trackingHits.length} hit(s) — ensure Data Safety declarations are correct`);
  }
})();

// =====================================================================
// 5. PAYMENTS & SUBSCRIPTIONS
// =====================================================================
const CAT_PAYMENTS = 'Payments & Subscriptions';

(() => {
  const srcDir = path.join(FRONTEND, 'src');

  // RevenueCat production keys
  const constantsFile = readFile('frontend/src/services/billing/constants.ts');
  if (constantsFile) {
    const hasTestKeys = /['"]test_[A-Za-z0-9]+['"]/.test(constantsFile);
    const hasSandboxKeys = /['"]rcb_sb_[A-Za-z0-9]+['"]/.test(constantsFile);

    if (hasTestKeys || hasSandboxKeys) {
      const issues = [];
      if (hasTestKeys) issues.push('test_ prefixed key(s)');
      if (hasSandboxKeys) issues.push('rcb_sb_ sandbox key(s)');
      fail(CAT_PAYMENTS, 'RevenueCat production API keys',
        `Still using ${issues.join(' and ')} in constants.ts — must swap to production keys before release`);
    } else {
      pass(CAT_PAYMENTS, 'RevenueCat production API keys', 'No test/sandbox keys detected');
    }
  } else {
    fail(CAT_PAYMENTS, 'RevenueCat billing constants exist', 'frontend/src/services/billing/constants.ts not found');
  }

  // Restore purchases
  const restoreHits = grepFiles(srcDir, /restorePurchases|restore.?purchases/i, tsFilter);
  if (restoreHits.length > 0) {
    pass(CAT_PAYMENTS, 'Restore Purchases implemented', `Found in ${restoreHits.length} file(s)`);
  } else {
    fail(CAT_PAYMENTS, 'Restore Purchases implemented', 'No restorePurchases implementation found');
  }

  // Paywall screen — native
  if (fileExists('frontend/src/screens/PaywallScreen.tsx')) {
    pass(CAT_PAYMENTS, 'Paywall screen exists (native)', 'PaywallScreen.tsx found');
  } else {
    fail(CAT_PAYMENTS, 'Paywall screen exists (native)', 'PaywallScreen.tsx not found');
  }

  // Paywall screen — web
  if (fileExists('frontend/src/screens/PaywallScreen.web.tsx')) {
    pass(CAT_PAYMENTS, 'Paywall screen exists (web)', 'PaywallScreen.web.tsx found');
  } else {
    warn(CAT_PAYMENTS, 'Paywall screen exists (web)', 'PaywallScreen.web.tsx not found — web paywall may be missing');
  }

  // Pro entitlement defined
  if (constantsFile && /PRO_ENTITLEMENT/.test(constantsFile)) {
    pass(CAT_PAYMENTS, 'Pro entitlement constant defined', 'PRO_ENTITLEMENT found in constants.ts');
  } else {
    fail(CAT_PAYMENTS, 'Pro entitlement constant defined', 'PRO_ENTITLEMENT not found');
  }

  // Product IDs defined
  if (constantsFile && /monthly|yearly|lifetime/i.test(constantsFile)) {
    pass(CAT_PAYMENTS, 'Product IDs defined', 'monthly/yearly/lifetime found in constants.ts');
  } else {
    fail(CAT_PAYMENTS, 'Product IDs defined', 'Product IDs not found in constants.ts');
  }

  // Google Play billing — no direct Stripe imports on native
  const stripeNativeHits = grepFiles(srcDir,
    /import.*stripe|from\s+['"].*stripe|require\s*\(\s*['"].*stripe/i,
    (f) => tsFilter(f) && !/\.web\.(ts|tsx)$/.test(f));
  if (stripeNativeHits.length === 0) {
    pass(CAT_PAYMENTS, 'No Stripe SDK imports on native', 'Stripe SDK only imported in .web.tsx files (correct)');
  } else {
    const detail = stripeNativeHits.map(h => `  ${h.file}:${h.line}`).join('\n');
    fail(CAT_PAYMENTS, 'No Stripe SDK imports on native',
      `Found Stripe SDK imports in non-web files — Google Play requires Google Play Billing:\n${detail}`);
  }

  // Customer center screen exists
  if (fileExists('frontend/src/screens/CustomerCenterScreen.tsx')) {
    pass(CAT_PAYMENTS, 'Customer center screen exists', 'CustomerCenterScreen.tsx found');
  } else {
    warn(CAT_PAYMENTS, 'Customer center screen exists', 'CustomerCenterScreen.tsx not found');
  }
})();

// =====================================================================
// 6. POLICY REVIEW (Google Play policies)
// =====================================================================
const CAT_POLICY = 'Policy Review';

(() => {
  const srcDir = path.join(FRONTEND, 'src');

  // Account deletion available (Google Play requirement since Dec 2023)
  const deleteUI = grepFiles(srcDir, /Delete\s+Account|deleteAccount/i, tsFilter);
  if (deleteUI.length > 0) {
    pass(CAT_POLICY, 'Account deletion available in-app', `Found in ${deleteUI.length} file(s)`);
  } else {
    fail(CAT_POLICY, 'Account deletion available in-app', 'No "Delete Account" UI found — required by Google Play');
  }

  // No misleading content
  const misleadingHits = grepFiles(srcDir, /coming\s*soon|beta|alpha|under\s*construction|work\s*in\s*progress/i, tsFilter);
  if (misleadingHits.length === 0) {
    pass(CAT_POLICY, 'No misleading/placeholder content', 'Clean');
  } else {
    const detail = misleadingHits.map(h => `  ${h.file}:${h.line} → ${h.match}`).join('\n');
    fail(CAT_POLICY, 'No misleading/placeholder content',
      `Found potentially misleading content:\n${detail}`);
  }

  // In-app purchases use RevenueCat/Google Play Billing
  const revenuecatHits = grepFiles(srcDir, /react-native-purchases|RevenueCat|Purchases\./i, tsFilter);
  if (revenuecatHits.length > 0) {
    pass(CAT_POLICY, 'IAP uses RevenueCat/Google Play Billing', `Found in ${revenuecatHits.length} file(s)`);
  } else {
    fail(CAT_POLICY, 'IAP uses RevenueCat/Google Play Billing', 'No RevenueCat integration found');
  }
})();

// =====================================================================
// 7. BACKEND PRODUCTION READINESS
// =====================================================================
const CAT_BACKEND = 'Backend Production Readiness';

(() => {
  const backendDir = path.join(BACKEND, 'app');
  if (!fs.existsSync(backendDir)) {
    fail(CAT_BACKEND, 'Backend app directory exists', 'backend/app/ not found');
    return;
  }

  // CORS config
  const wildcardInProd = grepFiles(backendDir,
    /origins.*append.*\*|allow_origins.*\*/i, (f) => /\.py$/.test(f));
  if (wildcardInProd.length > 0) {
    const devGuarded = grepFiles(backendDir,
      /development.*\*|environment.*development/i, (f) => /\.py$/.test(f));
    if (devGuarded.length > 0) {
      warn(CAT_BACKEND, 'CORS wildcard is dev-only',
        'Wildcard "*" appended only in development mode — ensure ENVIRONMENT!=development in production');
    } else {
      fail(CAT_BACKEND, 'CORS not using wildcard in production',
        'Wildcard "*" found in CORS origins without development guard');
    }
  } else {
    pass(CAT_BACKEND, 'CORS configuration', 'No wildcard CORS in production');
  }

  // No print() debug statements
  const printHits = grepFiles(backendDir, /\bprint\s*\(/, (f) => /\.py$/.test(f));
  if (printHits.length === 0) {
    pass(CAT_BACKEND, 'No print() debug statements', 'Clean — all logging uses logger');
  } else {
    const detail = printHits.map(h => `  ${h.file}:${h.line} → ${h.match}`).join('\n');
    fail(CAT_BACKEND, 'No print() debug statements',
      `Found ${printHits.length} print statement(s):\n${detail}`);
  }

  // Backend settings use env vars
  const settingsFile = readFile('backend/app/config/settings.py');
  if (settingsFile) {
    const hardcodedSecrets = settingsFile.match(/(?:api_key|secret|password)\s*[:=]\s*["'][^"']+["']/gi) || [];
    const actualSecrets = hardcodedSecrets.filter(s =>
      !/["'](\s*|postgresql:\/\/devuser:devpassword[^"']*)["']/.test(s) && !/[""]["']/.test(s));
    if (actualSecrets.length === 0) {
      pass(CAT_BACKEND, 'No hardcoded secrets in settings', 'Secrets use env vars with empty defaults');
    } else {
      fail(CAT_BACKEND, 'No hardcoded secrets in settings',
        `Possible hardcoded secrets: ${actualSecrets.join(', ')}`);
    }
  }

  // Auth routes complete
  const authRoutes = readFile('backend/app/routes/auth.py');
  if (authRoutes) {
    const required = ['login', 'callback', 'exchange', 'refresh', 'logout', 'delete'];
    const missing = required.filter(r => !new RegExp(r, 'i').test(authRoutes));
    if (missing.length === 0) {
      pass(CAT_BACKEND, 'All auth routes present', 'login, callback, exchange, refresh, logout, delete — all found');
    } else {
      fail(CAT_BACKEND, 'All auth routes present', `Missing routes: ${missing.join(', ')}`);
    }
  } else {
    fail(CAT_BACKEND, 'Auth routes file exists', 'backend/app/routes/auth.py not found');
  }
})();

// =====================================================================
// 8. GOOGLE PLAY STORE LISTING (Manual checks)
// =====================================================================
const CAT_META = 'Google Play Store Listing';

manual(CAT_META, 'Short description is finalized', 'Set in Google Play Console — max 80 characters');
manual(CAT_META, 'Full description is finalized', 'Set in Google Play Console — max 4000 characters');
manual(CAT_META, 'App category is selected', 'Set in Google Play Console (e.g., Food & Drink)');
manual(CAT_META, 'Content rating questionnaire completed', 'Complete the IARC content rating questionnaire in Google Play Console');
manual(CAT_META, 'Contact email is set', 'Required in Google Play Console store listing');
manual(CAT_META, 'Privacy policy URL is set', 'Required by Google Play for apps that collect data');
manual(CAT_META, 'Feature graphic uploaded', 'Required: 1024×500 PNG or JPEG for Google Play listing');
manual(CAT_META, 'Screenshots uploaded', 'Upload phone screenshots (min 2) and tablet if supported');
manual(CAT_META, 'Hi-res icon uploaded', 'Required: 512×512 PNG — auto-generated by EAS if icon.png is correct size');

// =====================================================================
// 9. ACCOUNTS & REVIEW ACCESS (Manual checks)
// =====================================================================
const CAT_REVIEW = 'Accounts & Review Access';

(() => {
  if (fileExists('testing/test_credentials.md')) {
    pass(CAT_REVIEW, 'Test credentials file exists', 'testing/test_credentials.md found');
  } else {
    fail(CAT_REVIEW, 'Test credentials file exists', 'testing/test_credentials.md not found — need demo account for Google Play Review');
  }

  manual(CAT_REVIEW, 'Demo account is valid', 'Verify test credentials work before submission');
  manual(CAT_REVIEW, 'Review notes explain gated features', 'Document Pro features and free tier limit for Google Play Review');
  manual(CAT_REVIEW, 'Special setup steps documented', 'Document any special steps for Google Play Review');
})();

// =====================================================================
// 10. GOOGLE PLAY CONSOLE / RELEASE (Manual checks)
// =====================================================================
const CAT_RELEASE = 'Release Readiness';

manual(CAT_RELEASE, 'Data Safety section completed', 'Must declare in Google Play Console: data collected, shared, security practices');
manual(CAT_RELEASE, 'Data collection disclosures match', 'Verify Data Safety declarations match actual app behavior');
manual(CAT_RELEASE, 'Third-party SDK data included', 'RevenueCat collects: App User ID, purchase history, Android Advertising ID');
manual(CAT_RELEASE, 'IAP products created in Google Play Console', 'Verify monthly/yearly/lifetime subscription products');
manual(CAT_RELEASE, 'App signing key configured', 'Enroll in Google Play App Signing (recommended) or manage your own keystore');
manual(CAT_RELEASE, 'AAB uploaded to Google Play Console', 'Upload via EAS Submit or manual upload (.aab format)');
manual(CAT_RELEASE, 'Release track selected', 'Choose internal/closed/open testing or production track');
manual(CAT_RELEASE, 'Release notes added', 'Add "What\'s new" text in Google Play Console');
manual(CAT_RELEASE, 'Merchant account linked', 'Required for paid apps/IAP — link Google payments merchant account');
manual(CAT_RELEASE, 'Target API level compliance', 'Google Play requires targetSdkVersion ≥ 34 for new apps (Android 14)');
manual(CAT_RELEASE, 'Subscription config correct', 'Verify subscription products in Google Play Console match code');

// =====================================================================
// 11. FINAL SMOKE TEST (Manual checks — Android-specific)
// =====================================================================
const CAT_SMOKE = 'Final Smoke Test';

manual(CAT_SMOKE, 'Fresh install works', 'Test on physical Android device — clean install');
manual(CAT_SMOKE, 'App launches cleanly', 'Test on supported Android devices');
manual(CAT_SMOKE, 'Main user flows work E2E', 'Paste URL → extract recipe → save recipe');
manual(CAT_SMOKE, 'No crashes in critical paths', 'Test all main flows on device');
manual(CAT_SMOKE, 'Sign in works on device', 'Test WorkOS OAuth flow on Android device');
manual(CAT_SMOKE, 'Sign out works on device', 'Test logout on Android device');
manual(CAT_SMOKE, 'Purchase flow works', 'Test with Google Play test account / license testers');
manual(CAT_SMOKE, 'Restore flow works', 'Test restore purchases on Android device');
manual(CAT_SMOKE, 'Background/foreground transitions', 'Test app switching, minimize, resume, back button');
manual(CAT_SMOKE, 'Back button behavior correct', 'Android hardware/gesture back should navigate properly — no unexpected exits');
manual(CAT_SMOKE, 'No UI bugs on supported sizes', 'Test on small phone, large phone, tablet if supported');
manual(CAT_SMOKE, 'Content matches screenshots', 'Compare live app with uploaded Google Play screenshots');
manual(CAT_SMOKE, 'Paywall renders correctly on Android', 'Verify RevenueCat paywall on Android device');
manual(CAT_SMOKE, 'Works on recent Android versions', 'Test on Android 12+ (API 31+)');
manual(CAT_SMOKE, 'Deep linking works', 'Test cutthecrap:// scheme opens correct screen');

// =====================================================================
// OUTPUT
// =====================================================================

const ICONS = { PASS: '✅', FAIL: '❌', WARN: '⚠️', MANUAL: '📋' };
const COLORS = {
  PASS: '\x1b[32m',
  FAIL: '\x1b[31m',
  WARN: '\x1b[33m',
  MANUAL: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
};

// Print console output
console.log(`\n${COLORS.BOLD}═══════════════════════════════════════════════════════════${COLORS.RESET}`);
console.log(`${COLORS.BOLD}  Android / Google Play Submission Checklist — Test Results${COLORS.RESET}`);
console.log(`${COLORS.BOLD}═══════════════════════════════════════════════════════════${COLORS.RESET}\n`);

let currentCategory = '';
for (const r of results) {
  if (r.category !== currentCategory) {
    currentCategory = r.category;
    console.log(`\n${COLORS.BOLD}── ${currentCategory} ──${COLORS.RESET}`);
  }
  const color = COLORS[r.status];
  const icon = ICONS[r.status];
  console.log(`  ${color}${icon} ${r.status}${COLORS.RESET}  ${r.name}`);
  if (r.status === 'FAIL' || r.status === 'WARN') {
    const detailLines = r.detail.split('\n');
    for (const line of detailLines) {
      console.log(`         ${COLORS.DIM}${line}${COLORS.RESET}`);
    }
  }
}

console.log(`\n${COLORS.BOLD}═══════════════════════════════════════════════════════════${COLORS.RESET}`);
console.log(`  ${COLORS.PASS}${passCount} passed${COLORS.RESET}  ${COLORS.FAIL}${failCount} failed${COLORS.RESET}  ${COLORS.WARN}${warnCount} warnings${COLORS.RESET}  ${COLORS.MANUAL}${manualCount} manual${COLORS.RESET}`);
console.log(`${COLORS.BOLD}═══════════════════════════════════════════════════════════${COLORS.RESET}\n`);

// Write results file
const outputPath = path.join(__dirname, 'android_submission_test_results.md');

let md = `# Android / Google Play Submission Checklist — Test Results\n\n`;
md += `**Run date:** ${new Date().toISOString()}\n`;
md += `**Summary:** ${passCount} passed, ${failCount} failed, ${warnCount} warnings, ${manualCount} manual\n\n`;

if (failCount > 0) {
  md += `## ❌ Failures\n\n`;
  md += `These must be fixed before submitting to Google Play.\n\n`;
  for (const r of results.filter(r => r.status === 'FAIL')) {
    md += `### ${r.category} — ${r.name}\n\n`;
    md += `${r.detail}\n\n`;
  }
}

if (warnCount > 0) {
  md += `## ⚠️ Warnings\n\n`;
  md += `These should be reviewed before submission.\n\n`;
  for (const r of results.filter(r => r.status === 'WARN')) {
    md += `### ${r.category} — ${r.name}\n\n`;
    md += `${r.detail}\n\n`;
  }
}

md += `## ✅ Passed\n\n`;
for (const r of results.filter(r => r.status === 'PASS')) {
  md += `- **${r.category}** — ${r.name}: ${r.detail}\n`;
}

md += `\n## 📋 Manual Checks Required\n\n`;
md += `These items cannot be verified automatically and must be checked manually.\n\n`;
for (const r of results.filter(r => r.status === 'MANUAL')) {
  md += `- [ ] **${r.category}** — ${r.name}: ${r.detail}\n`;
}

fs.writeFileSync(outputPath, md, 'utf-8');
console.log(`Results written to: testing/android_submission_test_results.md\n`);

// Exit with non-zero if failures
process.exit(failCount > 0 ? 1 : 0);
