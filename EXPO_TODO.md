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

---

## 🟡 Recommended

### 2. Consider `expo-image` for future image support — ✅ Web

No user-facing images are rendered currently, but if recipe images are ever added, `expo-image` offers disk/memory caching, BlurHash placeholders, smooth transitions, and is significantly more performant than RN's built-in `<Image>`. Full web support included.

---

## 🟢 Nice-to-Have / Future

### 3. Configure `expo-updates` for OTA updates — ❌ Web

Not currently configured. Would allow pushing JS-only fixes to native users instantly without going through app store review. Does not apply to web — web deployments are updated by redeploying the static bundle.

---

## ✅ Already Using Well

- **`expo-router`** — clean file-based routing with proper thin route wrappers
- **`expo-linking`** — deep linking with `cutthecrap://` scheme
- **`expo-web-browser`** — OAuth flow via `openAuthSessionAsync()`
- **`expo-status-bar`** — status bar styling
- **`expo-constants`** — dev server URL detection
- **Theme system** — `useColorScheme()` + `userInterfaceStyle: "automatic"`
- **`react-native-safe-area-context`** — proper safe area handling
