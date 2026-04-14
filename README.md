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

## Legal & Compliance

Cut The Crap operates in a defensible legal position. A full analysis is available in [`LEGAL_FINDINGS.md`](./LEGAL_FINDINGS.md). Key points:

- **Recipe facts are not copyrightable.** Ingredient lists and basic cooking instructions are factual/functional data excluded from copyright protection under U.S. law (17 U.S.C. § 102(b)).
- **AI rewriting creates transformative output.** The system prompt instructs OpenAI to rephrase all text — no verbatim copying from source pages.
- **robots.txt compliance.** The scraper checks and respects `robots.txt` disallow directives before fetching any page, with a 1-hour cache per domain.
- **Honest User-Agent.** Requests identify as `CutTheCrap/1.0 (Recipe Extraction)` — no browser spoofing.
- **Source attribution.** Every saved recipe stores and displays the original `source_url` as a tappable link.
- **OpenAI API compliance.** Sending publicly available, primarily uncopyrightable recipe content for transformation aligns with OpenAI's current Terms of Use and Usage Policies. See [`LEGAL_FINDINGS.md` § 4](./LEGAL_FINDINGS.md#4-terms-of-service-violations) for the full analysis.
- **DMCA process.** Content owners can request recipe removal via the contact information in the app's Terms of Service.

This is not legal advice. Consult a qualified attorney for formal guidance.
