# Expo Feature Improvement TODOs

Cross-referenced against Expo SDK docs (v54/v55) on 2026-03-25.

### Web Compatibility Key

| Symbol | Meaning |
|--------|---------|
| ✅ Web | Full web support |
| ⚠️ Web | Partial web support (degrades gracefully) |
| ❌ Web | No web support — needs platform-specific fallback |
| N/A | Not applicable to web |

---

## 🔴 Critical

### 1. Add `expo-secure-store` for token persistence — ❌ Web

Auth tokens live in Zustand memory only. Sessions don't survive app restarts — `restoreSession()` will always find `refreshToken: null`. Expo SecureStore provides encrypted, persistent key-value storage on iOS Keychain and Android Keystore.

**⚠️ Web note:** `expo-secure-store` supports Android/iOS only. On web, use `localStorage` or `sessionStorage` as a fallback. Wrap access behind a platform check:

```ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function saveToken(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getToken(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}
```

**Action:**
- `npx expo install expo-secure-store`
- Create a `tokenStorage.ts` utility with platform-aware get/set/delete
- Store `accessToken` and `refreshToken` in `authStore.ts`
- Read them back in `restoreSession()` on app launch
- Clear them on logout/session expiry

### 2. Add `react-native-purchases` plugin to `app.json` — N/A

The RevenueCat SDK requires its config plugin for native builds. Without it in the `plugins` array, EAS builds will likely fail for in-app purchases. Web billing is already handled separately via `billingService.web.ts`.

**Action:**
- Add `"react-native-purchases"` to the `plugins` array in `app.json`

---

## 🟡 Recommended

### 3. ~~Add `expo-splash-screen` programmatic control — ❌ Web~~ ✅ Done

The splash screen now stays visible until `restoreSession()` completes. Uses `preventAutoHideAsync()` at module load and `hideAsync()` via `onLayout` callback. No effect on web (as expected).

### 4. Consider `expo-image` for future image support — ✅ Web

No user-facing images are rendered currently, but if recipe images are ever added, `expo-image` offers disk/memory caching, BlurHash placeholders, smooth transitions, and is significantly more performant than RN's built-in `<Image>`. Full web support included.

### 5. ~~Add `expo-haptics` for tactile feedback — ⚠️ Web~~ ✅ Done

Haptic feedback added to URL submit, recipe save, and save-limit error via `src/utils/haptics.ts`. Native-only via lazy `require()` — web bundle never imports the native module. Degrades silently.

### 6. ~~Add `expo-clipboard` for copying recipes — ✅ Web~~ ✅ Done

Copy button added to the result screen header. Copies the full recipe as formatted plain text via `src/utils/clipboard.ts`. Uses `expo-clipboard` (AsyncClipboard API on web).

### 7. ~~Remove dead dependencies — ✅ Web~~ ✅ Done

- `expo-linear-gradient` — uninstalled
- `expo-font` plugin — removed from `plugins` in `app.json`

---

## 🟢 Nice-to-Have / Future

### 8. Configure `expo-updates` for OTA updates — ❌ Web

Not currently configured. Would allow pushing JS-only fixes to native users instantly without going through app store review. Does not apply to web — web deployments are updated by redeploying the static bundle.

### 9. ~~Add a global error boundary — ✅ Web~~ ✅ Done

`ErrorBoundary` class component wraps the root layout in `_layout.tsx`. Catches unhandled JS errors and shows recovery UI with "Try Again" button. Shows error details in dev mode.

### 10. ~~Move hardcoded RevenueCat keys to env vars — ✅ Web~~ ✅ Done

Keys moved from `constants.ts` to `EXPO_PUBLIC_RC_APPLE_KEY`, `EXPO_PUBLIC_RC_GOOGLE_KEY`, `EXPO_PUBLIC_RC_WEB_KEY` env vars. `.env.example` updated.

### 11. ~~Clean up unused env vars — ✅ Web~~ ✅ Done

`EXPO_PUBLIC_CHATGPT_API_BASE` and `EXPO_PUBLIC_CHATGPT_API_KEY` removed from `.env` and `.env.example`. Added missing `EXPO_PUBLIC_API_BASE` to `.env.example`.

---

## ✅ Already Using Well

- **`expo-router`** — clean file-based routing with proper thin route wrappers
- **`expo-linking`** — deep linking with `cutthecrap://` scheme
- **`expo-web-browser`** — OAuth flow via `openAuthSessionAsync()`
- **`expo-status-bar`** — status bar styling
- **`expo-constants`** — dev server URL detection
- **Theme system** — `useColorScheme()` + `userInterfaceStyle: "automatic"`
- **`react-native-safe-area-context`** — proper safe area handling
