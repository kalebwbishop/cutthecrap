# Cut The Crap

Paste a recipe URL, get just the recipe — no life stories, no ads, no pop-ups.

## Project Structure

```
backend/       – FastAPI server (Python) that scrapes & extracts recipes via GPT
app/           – React Native (Expo) mobile & web client
frontend/      – Legacy React web app (replaced by app/)
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs on `http://localhost:8000` by default.

## Mobile / Web App (Expo)

### Prerequisites

- Node.js ≥ 18
- Expo CLI (`npm install -g expo-cli` or use `npx expo`)

### Getting started

```bash
cd app
npm install
```

Create a `.env` file in `app/` (or edit the existing one) with your backend URL:

```
API_URL=http://localhost:8000
```

> **Tip:** On a physical device use your machine's LAN IP instead of `localhost`.

### Running

```bash
npx expo start          # starts the Expo dev server
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
npx expo start --web    # opens in browser
```

Scan the QR code with the **Expo Go** app on your phone to run it on a real device.
