# Cut The Crap

Paste a recipe URL, get just the recipe — no life stories, no ads, no pop-ups.

## Project Structure

```
frontend/      – React Native (Expo) client that fetches page HTML locally and sends cleaned text to chatgpt_api
```

## Mobile / Web App (Expo)

### Prerequisites

- Node.js ≥ 18
- A running `chatgpt_api` host, locally or deployed

### Getting started

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` (or edit the existing one) with your chatgpt_api settings:

```
EXPO_PUBLIC_CHATGPT_API_BASE=http://localhost:7071
EXPO_PUBLIC_CHATGPT_API_KEY=pk_your_public_key_here
```

If you are using the local Azure Function from the sibling workspace folder, run it from `deploy-box-apis-core/src` with `func host start`.

> **Tip:** On a physical device use your machine's LAN IP instead of `localhost`.
> **Note:** Frontend-only scraping works best on iOS/Android. Browser builds can only fetch recipe pages that allow cross-origin requests.

### Running

```bash
npx expo start          # starts the Expo dev server
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
npx expo start --web    # opens in browser
```

Scan the QR code with the **Expo Go** app on your phone to run it on a real device.
