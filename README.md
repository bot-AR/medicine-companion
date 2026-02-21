# Medicine Companion for Elderly

A hybrid health safety app that helps elderly people remember medicines, avoid missing doses, get safe AI guidance, and keep caregivers informed.

## What It Does

- **Medicine Tracker** -- Add medicines with dosage, frequency, and scheduled times
- **Smart Dashboard** -- Today's doses with status (Pending / Taken / Missed / Skipped) and adherence percentage
- **AI Assistant** -- Controlled AI advice for missed doses (never acts automatically, requires user approval)
- **Caregiver Updates** -- AI-drafted summary messages shared via WhatsApp/SMS with user approval
- **Biometric Lock** -- Fingerprint/Face ID with PIN fallback to protect medical data
- **Push Notifications** -- Scheduled reminders at dose times
- **Offline-First** -- Dashboard, medicine list, and dose logging work without internet

## Architecture

```
medicine-companion/
├── web/          # Next.js app (UI + AI logic) -- deployed to Vercel
├── native/       # Expo React Native app (biometrics, notifications, storage)
└── shared/       # TypeScript types shared between web and native
```

**How it works:** The native Expo app wraps the Next.js web app in a WebView. A custom bridge (`postMessage` / `injectJavaScript`) connects them:

| Layer | Handles |
|-------|---------|
| **Web (Next.js)** | All screens, forms, AI API calls, IndexedDB storage |
| **Native (Expo)** | Biometric auth, PIN verification, push notifications, secure storage, native share |
| **Bridge** | Request/response messaging with handshake, queue, and timeout |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web Framework | Next.js 15 (App Router, Turbopack) |
| Native Shell | Expo 54 / React Native 0.81 |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Forms | react-hook-form |
| AI | Google Gemini 2.0 Flash |
| Web Storage | IndexedDB (via `idb`) |
| Native Storage | AsyncStorage + Expo SecureStore |
| Auth | expo-local-authentication (biometric) + expo-crypto (PIN hash) |
| Notifications | expo-notifications (local scheduled) |
| Navigation | React Navigation (Stack) |

## Screens

| Screen | Description |
|--------|-------------|
| **Onboarding** | 4-step wizard: profile, emergency contact, security (biometric + PIN), theme |
| **Dashboard** | Today's schedule with adherence bar, Take/Missed/Skip actions |
| **Add Medicine** | Form with name, dosage, frequency, times, dates |
| **Medicine List** | Searchable list of active medicines |
| **Medicine Detail** | View medicine info and dose history |
| **Missed Dose** | AI advice card with Approve/Dismiss + Take Now option |
| **AI Summary** | AI-drafted caregiver message with edit and share |
| **Settings** | Edit profile, toggle biometric, theme, emergency info, about |
| **Emergency** | Emergency contacts with tap-to-call |

## Setup

### Prerequisites

- Node.js >= 20 (use `nvm install 20`)
- Expo Go app on your Android phone

### Install Dependencies

```bash
# Root (installs all workspaces)
npm install

# Or individually
cd web && npm install
cd native && npm install
```

### Run Web (Development)

```bash
cd web
npm run dev
```

Opens at `http://localhost:3000`

### Run Native (Expo Go)

```bash
cd native
npx expo start --offline
```

Scan the QR code with Expo Go on your phone.

### Environment Variables

**Web** (`web/.env.local`):
```
GEMINI_API_KEY=your_google_gemini_api_key
```

**Native** (`native/.env` or via `eas.json`):
```
EXPO_PUBLIC_WEB_URL=https://your-app.vercel.app
```

## Deployment

### Web (Vercel)

1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `web`
4. Add env variable `GEMINI_API_KEY`
5. Deploy

### Native (APK via EAS Build)

1. Update `EXPO_PUBLIC_WEB_URL` in `native/eas.json` with your Vercel URL
2. Run:

```bash
cd native
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

This generates a downloadable `.apk` file.

## AI Safety Rules

The AI assistant follows strict safety guidelines:

1. **Never acts automatically** -- all AI suggestions require explicit user approval
2. **Shows reasoning** -- displays why it made a suggestion with confidence level
3. **Includes disclaimer** -- every response has a medical disclaimer
4. **Approval required** -- user must press "Approve" or "Dismiss" before any action is saved
5. **Not a substitute** -- always recommends consulting a healthcare provider

## Project Structure

```
web/src/
├── app/                    # Next.js pages (dashboard, medicines, settings, etc.)
│   └── api/ai/            # Gemini AI proxy endpoint
├── components/
│   ├── dashboard/          # DoseCard, AdherenceBar, TodayScheduleList
│   ├── medicines/          # MedicineCard, MedicineForm
│   ├── ai/                 # AIReasoningCard, AIOfflineFallback
│   ├── layout/             # BottomTabBar, PageHeader
│   └── shared/             # Button, Modal, Toast
├── hooks/                  # useSchedule, useMedicines, useAI, useBridge
├── lib/                    # bridge, storage (IndexedDB), dateUtils, uuid
└── store/                  # Zustand app store

native/src/
├── screens/                # Splash, BiometricGate, PinFallback, WebViewHost
├── bridge/
│   └── handlers/           # auth, profile, schedule, notification, theme, message
├── services/               # biometrics, notifications, storage, secureStorage
└── constants/              # WEB_URL config
```

## License

Private project -- not for redistribution.
