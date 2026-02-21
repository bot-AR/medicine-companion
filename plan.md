# Medicine Companion for Elderly — Implementation Plan v2

> **Stack**: Expo (React Native, Android-first) + Next.js (in WebView) + Anthropic Claude AI  
> **Audience**: Developer new to app development  
> **Goal**: Working demo — onboarding, medicine management, dose scheduling, missed-dose AI advice, biometric lock, push notifications, offline-first

---

## Table of Contents

1. [Scope: MVP vs Nice-to-Have](#1-scope)
2. [User Flows](#2-user-flows)
3. [Screens List & Navigation](#3-screens-list--navigation)
4. [Data Model](#4-data-model)
5. [Folder & File Structure](#5-folder--file-structure)
6. [WebView ↔ Native Bridge Contracts](#6-bridge-contracts)
7. [Implementation Milestones](#7-implementation-milestones)
8. [Exact Commands](#8-exact-commands)
9. [Android Studio Setup](#9-android-studio-setup)
10. [Testing Plan](#10-testing-plan)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Definition of Done](#12-definition-of-done)

---

## 1. Scope

### MVP (Demo-Required)

- [ ] Onboarding wizard: name, DOB, emergency contact, caregiver setup, biometric/PIN enrollment
- [ ] Add Medicine: name, dosage, frequency, scheduled times, start/end date
- [ ] Today's Dashboard: list of due/taken/missed doses with adherence %
- [ ] Dose Logging: mark taken / missed / skipped
- [ ] Missed Dose AI Flow: AI returns `reasoning + suggestion + confidence + disclaimer` → user must "Approve" before action is saved
- [ ] Caregiver Summary AI Flow: AI drafts message → shown with reasoning → user approves before sharing
- [ ] Biometric Lock (fingerprint on Android) with PIN fallback
- [ ] Local scheduled notifications (dose reminders, works in Expo Go)
- [ ] Offline-first: all data readable without internet
- [ ] Light / Dark theme (persisted)

### Nice-to-Have (Post-Demo)

- [ ] Refill tracking (pill count + low-stock alert)
- [ ] Drug interaction warnings (external API)
- [ ] Weekly schedule calendar view
- [ ] Multi-caregiver portal
- [ ] PDF export of dose history
- [ ] Remote push notifications (requires EAS build + FCM setup)

---

## 2. User Flows

### Flow 1 — Onboarding (First Launch)

```
App Launch (Native)
  └─ SplashScreen (2s)
       └─ Profile complete?
            ├─ NO → WebView loads /onboarding
            │         Step 1: Personal info (name, DOB)
            │         Step 2: Emergency contact
            │         Step 3: Caregiver — enable biometric? set PIN?
            │              └─ postMessage AUTH_SETUP → Native saves pinHash in SecureStore
            │         Step 4: Theme preference
            │         → postMessage PROFILE_SAVE → Native stores profile
            │         → Redirect to /dashboard
            └─ YES → BiometricGateScreen (Native)
                      ├─ SUCCESS → WebView loads /dashboard
                      └─ FAIL   → PinFallbackScreen → /dashboard
```

### Flow 2 — Add Medicine

```
Dashboard "+" button
  └─ Web: /medicines/add (MedicineForm)
       Fields: name, strength, unit, form, frequency, times[], start date, end date, notes
       Tap "Save"
         └─ postMessage SCHEDULE_SAVE → Native stores in AsyncStorage
              └─ postMessage NOTIFICATION_SCHEDULE → Native schedules local notifications
                   └─ Toast success → /medicines list
```

### Flow 3 — Today's Schedule & Dose Logging

```
/dashboard (Web)
  └─ On load: postMessage SCHEDULE_LOAD → Native returns medicines + schedules + today's logs
       DoseCard: [Time] [Medicine] [Status: Pending | Taken | Missed]
         ├─ Tap "Take" → confirm → save DoseLog(status=taken) → update UI
         └─ Tap "Missed" → Flow 4
```

### Flow 4 — Missed Dose + AI Approval

```
User taps "Missed" on a DoseCard
  └─ Web calls POST /api/ai (server-side, task=missed_dose_advice)
       ├─ Loading spinner shown
       ├─ SUCCESS → AIReasoningCard:
       │     ┌──────────────────────────────────────────────────┐
       │     │ 🤖 AI Suggestion          [Confidence: Medium]   │
       │     │ ─────────────────────────────────────────────── │
       │     │ 📋 Why:                                          │
       │     │ Metformin was due 3 hrs ago. Next dose is in     │
       │     │ 5 hrs. Taking now risks GI upset at next dose.   │
       │     │ ─────────────────────────────────────────────── │
       │     │ 💡 Suggestion: Skip this dose.                   │
       │     │ ─────────────────────────────────────────────── │
       │     │ ⚠️  Always consult your doctor.                  │
       │     │                                                  │
       │     │  [✓ Approve & Skip]      [✗ Dismiss]             │
       │     └──────────────────────────────────────────────────┘
       │       Approve → save DoseLog(status=skipped, aiSuggested=true, aiReasoning=...)
       │       Dismiss → save DoseLog(status=missed)
       └─ OFFLINE / ERROR → Static card:
             "AI unavailable. Please consult your doctor or caregiver."
             [Mark Missed]  [Take Now]
```

### Flow 5 — Caregiver Summary AI + Share

```
Dashboard → "Share Summary" button
  └─ POST /api/ai (task=draft_caregiver_message)
       → AIReasoningCard shows reasoning + message preview
            ├─ Approve → postMessage SEND_MESSAGE → Native opens share sheet
            └─ Edit → inline text edit → Approve
```

### Flow 6 — Biometric Lock

```
App backgrounded → User returns
  └─ Native BiometricGateScreen
       ├─ Biometric available & enrolled?
       │    ├─ YES → LocalAuthentication.authenticateAsync()
       │    │         ├─ Success → navigate to WebViewHost
       │    │         └─ Fail (3x) → PinFallbackScreen
       │    └─ NO  → PinFallbackScreen
       PinFallbackScreen:
         → SHA-256(enteredPIN) == stored pinHash? → navigate to WebViewHost
```

---

## 3. Screens List & Navigation

### Native Screens (React Native)

| Screen | File | Purpose |
|---|---|---|
| `SplashScreen` | `screens/SplashScreen.tsx` | Logo, initial routing |
| `BiometricGateScreen` | `screens/BiometricGateScreen.tsx` | Fingerprint / Face prompt |
| `PinFallbackScreen` | `screens/PinFallbackScreen.tsx` | 4-digit PIN entry |
| `WebViewHostScreen` | `screens/WebViewHostScreen.tsx` | Renders all web pages |

**Native Navigation Stack**: `Splash → BiometricGate → WebViewHost` (PIN replaces BiometricGate on fallback)

### Web Pages (Next.js in WebView)

| Route | Page | Notes |
|---|---|---|
| `/onboarding` | Onboarding Wizard | First-run only |
| `/dashboard` | Today's Schedule | Primary screen |
| `/medicines` | Medicine List | Search + filter |
| `/medicines/add` | Add Medicine Form | react-hook-form |
| `/medicines/[id]` | Medicine Detail + Edit | |
| `/medicines/[id]/log` | Dose History | |
| `/missed` | Missed Dose + AI | AI card + approval |
| `/ai-summary` | Caregiver AI Summary | AI card + share |
| `/settings` | Profile, Theme, Notifications | |
| `/emergency` | Emergency Info | No auth required |

**Web Navigation**: Bottom tab bar (Dashboard, Medicines, Settings) built in Next.js layout.

---

## 4. Data Model

All types live in `shared/types/index.ts` — imported by both web and native.

```typescript
// shared/types/index.ts

export type MedicineForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'patch' | 'other';
export type FrequencyUnit = 'daily' | 'weekly' | 'as_needed';
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped' | 'snoozed';
export type Theme = 'light' | 'dark' | 'system';
export type BridgeEventType =
  | 'READY'
  | 'AUTH_REQUEST' | 'AUTH_RESULT'
  | 'AUTH_SETUP'
  | 'PROFILE_SAVE' | 'PROFILE_LOAD_RESULT'
  | 'SCHEDULE_SAVE' | 'SCHEDULE_LOAD' | 'SCHEDULE_LOAD_RESULT'
  | 'NOTIFICATION_SCHEDULE' | 'NOTIFICATION_CANCEL' | 'NOTIFICATION_RESULT'
  | 'OFFLINE_SYNC' | 'OFFLINE_SYNC_RESULT'
  | 'THEME_SET'
  | 'SEND_MESSAGE' | 'SEND_MESSAGE_RESULT';

export interface BridgeMessage<T = unknown> {
  event: BridgeEventType;
  requestId: string;           // uuid — used to match responses
  payload: T;
  timestamp: string;           // ISO 8601
}

export interface UserProfile {
  id: string;
  name: string;
  dateOfBirth: string;         // ISO date "YYYY-MM-DD"
  photoUri?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  caregiverName?: string;
  caregiverPhone?: string;
  biometricEnabled: boolean;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  brandName?: string;
  strength: number;
  unit: string;                // "mg", "ml", etc.
  form: MedicineForm;
  color?: string;
  instructions?: string;       // "Take with food"
  prescribedBy?: string;
  totalPills?: number;
  remainingPills?: number;
  refillThreshold?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoseSchedule {
  id: string;
  medicineId: string;
  userId: string;
  frequency: FrequencyUnit;
  timesPerDay: number;
  scheduledTimes: string[];    // ["08:00", "20:00"]
  daysOfWeek?: number[];       // 0=Sun…6=Sat
  startDate: string;
  endDate?: string;
  notificationIds: string[];   // Expo notification IDs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoseLog {
  id: string;
  scheduleId: string;
  medicineId: string;
  userId: string;
  scheduledAt: string;         // ISO datetime (planned)
  loggedAt?: string;           // ISO datetime (when acted)
  status: DoseStatus;
  aiSuggested: boolean;
  aiReasoning?: string;        // stored for audit trail
  notes?: string;
  createdAt: string;
}

export interface CaregiverSettings {
  id: string;
  userId: string;
  caregiverName: string;
  caregiverPhone: string;
  caregiverEmail?: string;
  notifyOnMissed: boolean;
  notifyOnRefillNeeded: boolean;
  summaryFrequency: 'daily' | 'weekly' | 'never';
}

// AI response schema — must match what /api/ai returns
export interface AIResponse {
  reasoning: string;           // "why" — shown to user before approval
  suggestion: string;          // the actual recommendation
  confidence: 'low' | 'medium' | 'high';
  disclaimer: string;          // always shown, e.g. "Consult your doctor"
}
```

---

## 5. Folder & File Structure

```
medicine-companion/                   ← monorepo root
├── package.json                      ← workspaces: ["native","web","shared"]
├── .gitignore
├── shared/
│   ├── package.json                  ← { "name": "@medicine/shared" }
│   └── types/
│       └── index.ts                  ← All interfaces above
│
├── native/                           ← Expo project
│   ├── app.json
│   ├── eas.json                      ← EAS build profiles
│   ├── package.json
│   ├── tsconfig.json
│   ├── App.tsx
│   └── src/
│       ├── screens/
│       │   ├── SplashScreen.tsx
│       │   ├── BiometricGateScreen.tsx
│       │   ├── PinFallbackScreen.tsx
│       │   └── WebViewHostScreen.tsx
│       ├── bridge/
│       │   ├── BridgeHandler.ts      ← Routes inbound postMessages
│       │   ├── sendToWeb.ts          ← injectJavaScript helper
│       │   ├── messageQueue.ts       ← Queue until READY
│       │   └── handlers/
│       │       ├── authHandler.ts
│       │       ├── scheduleHandler.ts
│       │       ├── notificationHandler.ts
│       │       ├── profileHandler.ts
│       │       └── themeHandler.ts
│       ├── services/
│       │   ├── biometrics.ts         ← expo-local-authentication
│       │   ├── notifications.ts      ← expo-notifications
│       │   ├── storage.ts            ← AsyncStorage helpers
│       │   ├── secureStorage.ts      ← SecureStore + expo-crypto PIN hash
│       │   └── offlineSync.ts
│       ├── hooks/
│       │   ├── useBiometric.ts
│       │   └── useTheme.ts
│       └── constants/
│           └── bridge.ts
│
└── web/                              ← Next.js project
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── .env.local                    ← ANTHROPIC_API_KEY (never committed)
    ├── .env.example                  ← ANTHROPIC_API_KEY=your_key_here
    └── src/
        ├── app/
        │   ├── layout.tsx            ← ThemeProvider, BridgeProvider
        │   ├── page.tsx              ← Redirect to /dashboard
        │   ├── api/
        │   │   └── ai/
        │   │       └── route.ts      ← App Router POST handler (NOT pages/api)
        │   ├── onboarding/
        │   │   └── page.tsx
        │   ├── dashboard/
        │   │   └── page.tsx
        │   ├── medicines/
        │   │   ├── page.tsx
        │   │   ├── add/
        │   │   │   └── page.tsx
        │   │   └── [id]/
        │   │       ├── page.tsx
        │   │       └── log/
        │   │           └── page.tsx
        │   ├── missed/
        │   │   └── page.tsx
        │   ├── ai-summary/
        │   │   └── page.tsx
        │   ├── settings/
        │   │   └── page.tsx
        │   └── emergency/
        │       └── page.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── BottomTabBar.tsx
        │   │   └── PageHeader.tsx
        │   ├── dashboard/
        │   │   ├── TodayScheduleList.tsx
        │   │   ├── DoseCard.tsx
        │   │   └── AdherenceBar.tsx
        │   ├── medicines/
        │   │   ├── MedicineForm.tsx
        │   │   └── MedicineCard.tsx
        │   ├── ai/
        │   │   ├── AIReasoningCard.tsx   ← reasoning + approve/dismiss
        │   │   └── AIOfflineFallback.tsx
        │   └── shared/
        │       ├── Button.tsx
        │       ├── Modal.tsx
        │       └── Toast.tsx
        ├── hooks/
        │   ├── useBridge.ts          ← send + listen to native
        │   ├── useMedicines.ts
        │   ├── useSchedule.ts
        │   └── useAI.ts             ← calls /api/ai
        ├── lib/
        │   ├── bridge.ts            ← sendToNative, onNativeMessage, initBridge
        │   ├── storage.ts           ← IndexedDB (idb) helpers
        │   ├── dateUtils.ts
        │   └── scheduleUtils.ts
        └── store/
            └── appStore.ts          ← Zustand
```

---

## 6. Bridge Contracts

### How the Bridge Works

```
Web (Next.js in WebView)
  sendToNative()  →  window.ReactNativeWebView.postMessage(JSON)
  ←  window.dispatchEvent(MessageEvent)  ←  webViewRef.injectJavaScript()
```

**Web sends to Native**: `window.ReactNativeWebView?.postMessage(JSON.stringify(msg))`  
**Native sends to Web**: `webViewRef.current?.injectJavaScript("window.dispatchEvent(new MessageEvent('message',{data:...}));true;")`

---

### READY Handshake + Message Queue

```typescript
// native/src/bridge/messageQueue.ts
import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type { BridgeMessage } from '@medicine/shared';

let webReady = false;
const queue: BridgeMessage[] = [];
let _webViewRef: RefObject<WebView> | null = null;

export function initQueue(ref: RefObject<WebView>) { _webViewRef = ref; }

export function markWebReady() {
  webReady = true;
  flushQueue();
}

export function enqueueOrSend(msg: BridgeMessage) {
  if (webReady && _webViewRef) { sendToWebDirect(msg); }
  else { queue.push(msg); }
}

function flushQueue() {
  queue.forEach(msg => sendToWebDirect(msg));
  queue.length = 0;
}

function sendToWebDirect(msg: BridgeMessage) {
  const js = `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(msg))}}));true;`;
  _webViewRef?.current?.injectJavaScript(js);
}
```

```typescript
// web/src/lib/bridge.ts — fire READY when listener attaches
export function initBridge() {
  window.addEventListener('message', handleIncoming);
  // Signal to native that web is ready to receive messages
  sendToNative({ event: 'READY', requestId: crypto.randomUUID(), payload: {}, timestamp: new Date().toISOString() });
}
```

---

### Request / Response with Timeout

```typescript
// web/src/hooks/useBridge.ts
const pending = new Map<string, { resolve: (r: BridgeMessage) => void; timer: ReturnType<typeof setTimeout> }>();

export function sendRequest<T>(event: BridgeEventType, payload: T, timeoutMs = 5000): Promise<BridgeMessage> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Bridge timeout: ${event} (${timeoutMs}ms)`));
    }, timeoutMs);
    pending.set(requestId, { resolve, timer });
    sendToNative({ event, requestId, payload, timestamp: new Date().toISOString() });
  });
}

function handleIncoming(e: MessageEvent) {
  try {
    const msg = JSON.parse(e.data) as BridgeMessage;
    const handler = pending.get(msg.requestId);
    if (handler) {
      clearTimeout(handler.timer);
      pending.delete(msg.requestId);
      handler.resolve(msg);
    }
  } catch { /* ignore non-bridge messages */ }
}
```

---

### Event Schemas

#### `READY` — Web signals it's listening

```json
// Web → Native (no response needed)
{ "event": "READY", "requestId": "req-001", "payload": {}, "timestamp": "..." }
```

#### `AUTH_SETUP` — Enroll biometric/PIN during onboarding

```json
// Web → Native
{
  "event": "AUTH_SETUP",
  "requestId": "req-002",
  "payload": {
    "enableBiometric": true,
    "pinHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
  },
  "timestamp": "..."
}
```

> **PIN hashing**:  
> — Web layer hashes before sending: `crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))` → hex  
> — Native `PinFallbackScreen` hashes entered PIN: `Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, entered)` → compare hex  
> — Store hex hash in SecureStore. Never store raw PIN. No bcrypt needed.

#### `AUTH_REQUEST` / `AUTH_RESULT`

```json
// Web → Native
{ "event": "AUTH_REQUEST", "requestId": "req-003", "payload": { "reason": "Unlock caregiver mode" }, "timestamp": "..." }

// Native → Web
{ "event": "AUTH_RESULT", "requestId": "req-003", "payload": { "success": true, "method": "biometric" }, "timestamp": "..." }
```

#### `PROFILE_SAVE`

```json
{ "event": "PROFILE_SAVE", "requestId": "req-004", "payload": { /* UserProfile */ }, "timestamp": "..." }
```

#### `SCHEDULE_SAVE`

```json
{
  "event": "SCHEDULE_SAVE",
  "requestId": "req-005",
  "payload": { "medicine": { /* Medicine */ }, "schedule": { /* DoseSchedule */ } },
  "timestamp": "..."
}
```

#### `SCHEDULE_LOAD` / `SCHEDULE_LOAD_RESULT`

```json
// Web → Native
{ "event": "SCHEDULE_LOAD", "requestId": "req-006", "payload": { "date": "2025-01-15" }, "timestamp": "..." }

// Native → Web
{
  "event": "SCHEDULE_LOAD_RESULT",
  "requestId": "req-006",
  "payload": {
    "medicines": [ /* Medicine[] */ ],
    "schedules": [ /* DoseSchedule[] */ ],
    "doseLogs": [ /* DoseLog[] for today */ ]
  },
  "timestamp": "..."
}
```

#### `NOTIFICATION_SCHEDULE` / `NOTIFICATION_RESULT`

```json
// Web → Native
{
  "event": "NOTIFICATION_SCHEDULE",
  "requestId": "req-007",
  "payload": {
    "scheduleId": "sched-abc",
    "medicineName": "Metformin 500mg",
    "scheduledTimes": ["08:00", "20:00"],
    "startDate": "2025-01-15",
    "repeatDaily": true
  },
  "timestamp": "..."
}

// Native → Web
{ "event": "NOTIFICATION_RESULT", "requestId": "req-007", "payload": { "success": true, "notificationIds": ["expo-id-1", "expo-id-2"] }, "timestamp": "..." }
```

#### `NOTIFICATION_CANCEL`

```json
{ "event": "NOTIFICATION_CANCEL", "requestId": "req-008", "payload": { "notificationIds": ["expo-id-1"] }, "timestamp": "..." }
```

#### `THEME_SET` (one-way, no response)

```json
{ "event": "THEME_SET", "requestId": "req-009", "payload": { "theme": "dark" }, "timestamp": "..." }
```

#### `SEND_MESSAGE` / `SEND_MESSAGE_RESULT`

```json
// Web → Native
{ "event": "SEND_MESSAGE", "requestId": "req-010", "payload": { "body": "Hi [Caregiver], today..." }, "timestamp": "..." }

// Native → Web
{ "event": "SEND_MESSAGE_RESULT", "requestId": "req-010", "payload": { "success": true }, "timestamp": "..." }
```

#### `OFFLINE_SYNC` / `OFFLINE_SYNC_RESULT`

```json
// Web → Native
{
  "event": "OFFLINE_SYNC",
  "requestId": "req-011",
  "payload": { "localVersion": "2025-01-15T07:00:00Z", "pendingLogs": [ /* DoseLog[] */ ] },
  "timestamp": "..."
}

// Native → Web
{
  "event": "OFFLINE_SYNC_RESULT",
  "requestId": "req-011",
  "payload": { "mergedLogs": [ /* DoseLog[] */ ], "conflicts": [], "syncedAt": "..." },
  "timestamp": "..."
}
```

---

## 7. Implementation Milestones

### Milestone 0 — Repo Setup & Tooling

- [ ] Create monorepo root:
  ```bash
  mkdir medicine-companion && cd medicine-companion
  git init
  cat > .gitignore << 'EOF'
  node_modules
  .expo
  .next
  dist
  .env*
  !.env.example
  EOF
  ```
- [ ] Create root `package.json`:
  ```json
  {
    "name": "medicine-companion-root",
    "private": true,
    "workspaces": ["native", "web", "shared"]
  }
  ```
- [ ] Create `shared/package.json`:
  ```json
  {
    "name": "@medicine/shared",
    "version": "1.0.0",
    "main": "types/index.ts",
    "types": "types/index.ts"
  }
  ```
- [ ] Create `shared/types/index.ts` — paste all interfaces from Section 4
- [ ] Verify structure: `ls` → should show `native/`, `web/`, `shared/`, `package.json`

---

### Milestone 1 — Web UI Skeleton

- [ ] Scaffold Next.js (with App Router and src directory):
  ```bash
  cd medicine-companion
  npx create-next-app@latest web \
    --typescript \
    --tailwind \
    --app \
    --src-dir \
    --import-alias "@/*" \
    --no-git
  ```
- [ ] Install web dependencies:
  ```bash
  cd web
  npm install zustand uuid idb react-hook-form @anthropic-ai/sdk
  npm install -D @types/uuid
  ```
- [ ] Add shared types path alias to `web/tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"],
        "@medicine/shared": ["../shared/types/index.ts"]
      }
    }
  }
  ```
- [ ] Create env files:
  ```bash
  echo "ANTHROPIC_API_KEY=your_key_here" > .env.example
  cp .env.example .env.local
  # → Edit .env.local and add your real key
  ```
- [ ] Build `src/lib/bridge.ts` — `sendToNative()`, `initBridge()` (fires READY), `onNativeMessage()`, browser mock mode:
  ```typescript
  const IS_WEBVIEW = typeof window !== 'undefined' && !!window.ReactNativeWebView;
  export function sendToNative(msg: BridgeMessage) {
    if (IS_WEBVIEW) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(msg));
    } else {
      console.log('[BRIDGE MOCK →]', msg);
    }
  }
  ```
- [ ] Build `src/lib/storage.ts` — IndexedDB wrapper using `idb` for medicines, schedules, doseLogs
- [ ] Build `src/store/appStore.ts` — Zustand with slices: profile, medicines, schedules, doseLogs, theme
- [ ] Build `src/app/layout.tsx` — ThemeProvider, BridgeProvider (calls `initBridge` on mount)
- [ ] Build `BottomTabBar` (Dashboard | Medicines | Settings)
- [ ] Build Onboarding Wizard at `/onboarding` — 4 steps with react-hook-form
- [ ] Build Dashboard at `/dashboard` — TodayScheduleList, DoseCard (Pending/Taken/Missed), AdherenceBar
- [ ] Build Add Medicine at `/medicines/add` — all fields, time picker, frequency
- [ ] Build Medicine List at `/medicines` — search + filter cards
- [ ] Build Settings at `/settings` — theme toggle (localStorage + `THEME_SET` bridge), profile edit
- [ ] Stub AI pages at `/missed` and `/ai-summary` (wired in Milestone 7)
- [ ] Verify in browser:
  ```bash
  cd web && npm run dev  # http://localhost:3000
  ```

---

### Milestone 2 — Next.js AI Route (App Router)

> **Critical**: Use App Router file at `src/app/api/ai/route.ts` — NOT `pages/api/ai.ts`

- [ ] Create `web/src/app/api/ai/route.ts`:
  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import Anthropic from '@anthropic-ai/sdk';

  // Reads ANTHROPIC_API_KEY from .env.local automatically
  const client = new Anthropic();

  const SYSTEM_PROMPT = `You are a careful medication companion AI for elderly patients.
  Never give definitive medical advice. Always recommend consulting a doctor.
  Respond ONLY with valid JSON matching exactly:
  { "reasoning": string, "suggestion": string, "confidence": "low"|"medium"|"high", "disclaimer": string }
  No text outside the JSON object.`;

  function buildPrompt(task: string, context: Record<string, unknown>): string {
    switch (task) {
      case 'missed_dose_advice':
        return `Medicine: ${context.medicineName} ${context.strength}${context.unit}
  Scheduled: ${context.scheduledTime} | Now: ${context.currentTime} | Next dose: ${context.nextDoseTime}
  Hours since missed: ${context.hoursSinceMissed} | Instructions: ${context.instructions ?? 'none'}
  Should the patient take the missed dose now, or skip it?`;

      case 'draft_caregiver_message':
        return `Patient: ${context.patientName}. Adherence today: ${context.adherencePercent}%.
  Missed doses: ${JSON.stringify(context.missedDoses)}.
  Draft a concise, reassuring caregiver update message.`;

      default:
        return 'Summarize medication status as JSON.';
    }
  }

  export async function POST(req: NextRequest) {
    try {
      const { task, context } = await req.json();
      if (!task || !context) {
        return NextResponse.json({ error: 'Missing task or context' }, { status: 400 });
      }
      const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(task, context) }],
      });
      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      const clean = raw.replace(/```json\n?|```/g, '').trim();
      return NextResponse.json(JSON.parse(clean));
    } catch (err) {
      console.error('[AI Route]', err);
      return NextResponse.json({ error: 'AI unavailable' }, { status: 503 });
    }
  }
  ```
- [ ] Test route directly:
  ```bash
  curl -X POST http://localhost:3000/api/ai \
    -H "Content-Type: application/json" \
    -d '{"task":"missed_dose_advice","context":{"medicineName":"Metformin","strength":500,"unit":"mg","scheduledTime":"08:00","currentTime":"11:00","nextDoseTime":"20:00","hoursSinceMissed":3,"instructions":"Take with food"}}'
  # Expected: { reasoning: "...", suggestion: "...", confidence: "...", disclaimer: "..." }
  ```
- [ ] Confirm no `ANTHROPIC_API_KEY` in browser network response headers

---

### Milestone 3 — Expo Native Shell + WebView Bridge

- [ ] Create Expo project:
  ```bash
  cd medicine-companion
  npx create-expo-app native --template blank-typescript
  ```
- [ ] Install native packages:
  ```bash
  cd native
  npx expo install \
    expo-local-authentication \
    expo-notifications \
    expo-secure-store \
    expo-crypto \
    react-native-webview \
    @react-native-async-storage/async-storage \
    expo-sharing \
    expo-file-system \
    @react-navigation/native \
    @react-navigation/stack \
    react-native-screens \
    react-native-safe-area-context \
    react-native-gesture-handler
  ```
- [ ] Add shared types alias to `native/tsconfig.json`:
  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "paths": {
        "@medicine/shared": ["../shared/types/index.ts"]
      }
    }
  }
  ```
- [ ] Configure `app.json` (add plugins + Android permissions):
  ```json
  {
    "expo": {
      "name": "Medicine Companion",
      "slug": "medicine-companion",
      "version": "1.0.0",
      "plugins": [
        ["expo-local-authentication"],
        ["expo-notifications", { "icon": "./assets/icon.png", "color": "#ffffff" }]
      ],
      "android": {
        "permissions": [
          "USE_BIOMETRIC",
          "USE_FINGERPRINT",
          "RECEIVE_BOOT_COMPLETED",
          "SCHEDULE_EXACT_ALARM"
        ]
      }
    }
  }
  ```
- [ ] Build `App.tsx` — NavigationContainer + Stack Navigator (Splash → BiometricGate → WebViewHost)
- [ ] Build `SplashScreen.tsx` — logo, 2s delay, check profile → route accordingly
- [ ] Build `WebViewHostScreen.tsx`:
  ```typescript
  import { Platform } from 'react-native';

  // ⚠️ IMPORTANT: Android emulator cannot reach 'localhost' — use 10.0.2.2
  // Physical device on same LAN: use your machine's IP, e.g. 'http://192.168.1.42:3000'
  const DEV_URL = Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';

  // In render:
  <WebView
    ref={webViewRef}
    source={{ uri: DEV_URL }}
    onMessage={handleBridgeMessage}
    javaScriptEnabled
    domStorageEnabled
    originWhitelist={['*']}
    onLoadEnd={() => {
      initQueue(webViewRef);
      // Auto-fire SCHEDULE_LOAD after page ready
    }}
  />
  ```
- [ ] Build `bridge/messageQueue.ts` with `webReady` flag (code from Section 6)
- [ ] Build `bridge/BridgeHandler.ts` — switch on `msg.event`, route to handlers
- [ ] Build `bridge/sendToWeb.ts` — `injectJavaScript` helper
- [ ] Build all `bridge/handlers/` (auth, schedule, notification, profile, theme)
- [ ] Verify round-trip: web sends `THEME_SET` → native logs it; native sends mock `SCHEDULE_LOAD_RESULT` → web logs it

---

### Milestone 4 — Local Storage & Offline

- [ ] Implement `native/src/services/storage.ts`:
  ```typescript
  import AsyncStorage from '@react-native-async-storage/async-storage';

  const KEYS = {
    medicines: '@mc/medicines_v1',
    schedules: '@mc/schedules_v1',
    doseLogs: '@mc/dose_logs_v1',
    profile: '@mc/profile_v1',
    offlineQueue: '@mc/offline_queue_v1',
  };

  export async function getMedicines(): Promise<Medicine[]> {
    const raw = await AsyncStorage.getItem(KEYS.medicines);
    return raw ? JSON.parse(raw) : [];
  }
  export async function saveMedicine(med: Medicine): Promise<void> {
    const list = await getMedicines();
    const updated = [...list.filter(m => m.id !== med.id), med];
    await AsyncStorage.setItem(KEYS.medicines, JSON.stringify(updated));
  }
  // Repeat pattern for schedules, doseLogs, profile
  ```
- [ ] Implement `native/src/services/secureStorage.ts`:
  ```typescript
  import * as SecureStore from 'expo-secure-store';
  // No bcrypt — using SHA-256 via expo-crypto

  export const SK = { pinHash: 'mc_pin_hash', biometricEnabled: 'mc_biometric_enabled' };

  export const storePinHash = (h: string) => SecureStore.setItemAsync(SK.pinHash, h);
  export const getPinHash = () => SecureStore.getItemAsync(SK.pinHash);
  export const setBiometricEnabled = (v: boolean) => SecureStore.setItemAsync(SK.biometricEnabled, String(v));
  export const isBiometricEnabled = async () => (await SecureStore.getItemAsync(SK.biometricEnabled)) === 'true';
  ```
- [ ] Wire handlers: `SCHEDULE_SAVE`, `SCHEDULE_LOAD`, `AUTH_SETUP`, `PROFILE_SAVE`
- [ ] Implement `offlineSync.ts`: queue pending DoseLogs in AsyncStorage; drain on `OFFLINE_SYNC` using last-write-wins
- [ ] Test offline: airplane mode → dashboard still loads

---

### Milestone 5 — Biometrics + PIN

- [ ] Implement `native/src/services/biometrics.ts`:
  ```typescript
  import * as LocalAuthentication from 'expo-local-authentication';

  export async function isBiometricAvailable() {
    const hw = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hw && enrolled;
  }

  export async function authenticate(reason: string) {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,   // we control fallback ourselves
    });
    return result.success;
  }
  ```
- [ ] Build `BiometricGateScreen.tsx`:
  - On mount: check `isBiometricAvailable()`
  - If false → immediately go to PinFallback
  - If true → call `authenticate()`, track failures, after 3 → go to PinFallback
- [ ] Build `PinFallbackScreen.tsx`:
  ```typescript
  import * as Crypto from 'expo-crypto';
  import { getPinHash } from '../services/secureStorage';

  async function verifyPin(entered: string): Promise<boolean> {
    const stored = await getPinHash();
    if (!stored) return false;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      entered
    );
    return hash === stored;
  }
  // On correct PIN → navigate to WebViewHost
  ```
- [ ] Test on emulator with enrolled fingerprint (Section 9 steps)

---

### Milestone 6 — Push Notifications

- [ ] Implement `native/src/services/notifications.ts`:
  ```typescript
  import * as Notifications from 'expo-notifications';

  // Call once at app startup
  export function setupHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  export async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  export async function scheduleDoseNotifications(
    medicineName: string,
    times: string[],    // ["08:00", "20:00"]
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const time of times) {
      const [hour, minute] = time.split(':').map(Number);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 ${medicineName}`,
          body: 'Time to take your medication',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      ids.push(id);
    }
    return ids;
  }

  export async function cancelNotifications(ids: string[]) {
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  }
  ```

> **Note**: Local scheduled notifications work in **Expo Go**. Remote push (FCM/APNs) requires an EAS development build.

- [ ] Call `setupHandler()` and `requestPermissions()` in `App.tsx` on first render
- [ ] Wire `NOTIFICATION_SCHEDULE` bridge handler → `scheduleDoseNotifications()` → return IDs
- [ ] Wire `NOTIFICATION_CANCEL` bridge handler → `cancelNotifications()`
- [ ] Add notification tap handler in `App.tsx`:
  ```typescript
  Notifications.addNotificationResponseReceivedListener(() => {
    // Reload today's schedule in WebView
    enqueueOrSend({ event: 'SCHEDULE_LOAD', requestId: uuid(), payload: { date: today() }, timestamp: now() });
  });
  ```
- [ ] Test: add medicine 2 min from now → background app → confirm notification fires

---

### Milestone 7 — AI Workflow + Approval Gating

- [ ] Implement `web/src/hooks/useAI.ts`:
  ```typescript
  import type { AIResponse } from '@medicine/shared';

  export function useAI() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AIResponse | null>(null);
    const [offline, setOffline] = useState(false);

    async function run(task: string, context: Record<string, unknown>) {
      setLoading(true); setResult(null); setOffline(false);
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task, context }),
        });
        if (!res.ok) throw new Error('unavailable');
        setResult(await res.json());
      } catch {
        setOffline(true);
      } finally {
        setLoading(false);
      }
    }
    return { run, loading, result, offline, clear: () => setResult(null) };
  }
  ```
- [ ] Build `AIReasoningCard` component — shows reasoning, suggestion, confidence badge, disclaimer; exposes only `onApprove` / `onDismiss` callbacks:
  ```
  ┌──────────────────────────────────────────────┐
  │ 🤖 AI Suggestion         [Confidence: Medium] │
  │ ──────────────────────────────────────────── │
  │ 📋 Why:  [result.reasoning]                  │
  │ 💡 Suggestion: [result.suggestion]           │
  │ ⚠️  [result.disclaimer]                       │
  │                                              │
  │   [✓ Approve]          [✗ Dismiss]           │
  └──────────────────────────────────────────────┘
  ```
- [ ] Build `AIOfflineFallback` component — static message + manual action buttons
- [ ] Wire `/missed` page:
  - On mount → `run('missed_dose_advice', context)`
  - Render spinner → then `AIReasoningCard` OR `AIOfflineFallback`
  - `onApprove` → save `DoseLog(status=skipped, aiSuggested=true, aiReasoning=result.reasoning)` — **no save before this**
  - `onDismiss` → save `DoseLog(status=missed)`
- [ ] Wire `/ai-summary` page:
  - `run('draft_caregiver_message', context)` → show card
  - `onApprove` → `sendRequest('SEND_MESSAGE', { body: result.suggestion })` → native share sheet
- [ ] Confirm: API key never in browser network tab; all AI calls hit `/api/ai` server route
- [ ] Full test in browser mock mode + in emulator

---

### Milestone 8 — EAS Build & Demo Prep

- [ ] Create `native/eas.json`:
  ```json
  {
    "cli": { "version": ">= 10.0.0" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal" },
      "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
      "production": {}
    }
  }
  ```
- [ ] Build installable APK:
  ```bash
  npm install -g eas-cli
  cd native
  eas login
  eas build:configure          # run once
  eas build --profile preview -p android
  # Download APK from expo.dev → install on emulator: adb install app.apk
  ```
- [ ] Run all test cases from Section 10
- [ ] Fix any WebView styling issues in dark mode
- [ ] Verify AI disclaimer always visible on AI cards
- [ ] Demo script recorded (5 min):
  1. Cold open → fingerprint unlock (30s)
  2. Onboarding (1 min)
  3. Add medicine, confirm notification (1 min)
  4. Dashboard: mark taken (30s)
  5. Missed dose → AI card → Approve (1.5 min)
  6. Caregiver summary → AI draft → Approve → share sheet (1 min)

---

## 8. Exact Commands

### Full Setup Sequence

```bash
# ── Monorepo ──────────────────────────────────────────────
mkdir medicine-companion && cd medicine-companion
git init
cat > .gitignore << 'EOF'
node_modules
.expo
.next
dist
.env*
!.env.example
EOF

cat > package.json << 'EOF'
{ "name": "medicine-companion-root", "private": true, "workspaces": ["native","web","shared"] }
EOF

mkdir -p shared/types
cat > shared/package.json << 'EOF'
{ "name": "@medicine/shared", "version": "1.0.0", "main": "types/index.ts", "types": "types/index.ts" }
EOF
# → Paste shared/types/index.ts from Section 4

# ── Web ───────────────────────────────────────────────────
npx create-next-app@latest web --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
cd web
npm install zustand uuid idb react-hook-form @anthropic-ai/sdk
npm install -D @types/uuid
echo "ANTHROPIC_API_KEY=your_key_here" > .env.example
cp .env.example .env.local  # ← edit and add real key
cd ..

# ── Native ────────────────────────────────────────────────
npx create-expo-app native --template blank-typescript
cd native
npx expo install \
  expo-local-authentication expo-notifications \
  expo-secure-store expo-crypto \
  react-native-webview \
  @react-native-async-storage/async-storage \
  expo-sharing expo-file-system \
  @react-navigation/native @react-navigation/stack \
  react-native-screens react-native-safe-area-context \
  react-native-gesture-handler
cd ..
```

### Running in Development

```bash
# Terminal 1 — Next.js web server
cd medicine-companion/web && npm run dev
# Runs at http://localhost:3000

# Terminal 2 — Expo on Android emulator
cd medicine-companion/native && npx expo start --android
# Press 'a' if not auto-launching
# WebView will use http://10.0.2.2:3000 (maps to host machine port 3000)
```

### EAS Build (Installable APK)

```bash
npm install -g eas-cli
cd medicine-companion/native
eas login
eas build:configure                          # one-time setup, updates app.json
eas build --profile preview -p android       # builds APK on Expo servers (~10 min)
# Download APK from https://expo.dev/accounts/[you]/projects/[slug]/builds
adb install path/to/downloaded.apk           # install on emulator or device
```

### Debug Commands

```bash
adb devices                                    # list connected emulators/devices
adb logcat -s ReactNative ReactNativeJS        # filtered native logs
adb -e emu finger touch 1                      # send fingerprint to emulator
adb shell pm clear com.yourco.medicinecompanion # wipe app data (reset for testing)
```

---

## 9. Android Studio Setup

### Minimum Required Installation

1. Download from https://developer.android.com/studio and run the installer
2. On first launch, complete the Setup Wizard (downloads default SDK)
3. Open **SDK Manager** (Tools → SDK Manager):
   - [ ] **SDK Platforms** tab → install **API 34 (Android 14)**
   - [ ] **SDK Tools** tab → install:
     - [ ] Android SDK Build-Tools 34
     - [ ] Android Emulator
     - [ ] Android SDK Platform-Tools (provides `adb`)
     - [ ] Google APIs Intel x86_64 Atom System Image (API 34)

4. **Create AVD** (Tools → Device Manager → Create Device):
   - [ ] Hardware: **Pixel 7** → Next
   - [ ] System Image: **API 34 - Google APIs - x86_64** → Next → Finish
   - [ ] Click ▶ to launch; wait for home screen to appear

5. **Add `adb` to PATH**:
   ```bash
   # macOS (~/.zshrc or ~/.bashrc):
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
   source ~/.zshrc
   adb --version   # should print version

   # Windows PowerShell ($PROFILE):
   $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
   $env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
   ```

6. **Logcat** — View → Tool Windows → Logcat → filter: `tag:ReactNative`  
   Or in terminal: `adb logcat -s ReactNative ReactNativeJS`

### Enroll Fingerprint on Emulator

```
1. Boot the Pixel 7 API 34 AVD
2. In emulator: Settings → Security → Fingerprint → Add Fingerprint
3. When prompted to touch sensor:
     adb -e emu finger touch 1
   (repeat 5× until enrollment complete)
4. Set a PIN as backup when prompted (required for biometric enrollment)
5. Test enrollment:
     adb -e emu finger touch 1    ← matches (success)
     adb -e emu finger touch 2    ← no match (failure)
6. In the app's BiometricGate: use same commands to simulate touch
```

---

## 10. Testing Plan

### Manual Test Cases

#### Onboarding

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 1.1 | Fresh install, open app | Splash → Onboarding (not BiometricGate) | ☐ |
| 1.2 | Step 1 with empty name | Validation error shown | ☐ |
| 1.3 | Complete all 4 steps | Profile saved, redirect to /dashboard | ☐ |
| 1.4 | Enable biometric in Step 3, submit | `AUTH_SETUP` bridge fires; SecureStore updated | ☐ |
| 1.5 | Kill app, reopen | BiometricGate shown (not onboarding) | ☐ |

#### Add Medicine

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 2.1 | Open Add form, submit empty | Validation error on name field | ☐ |
| 2.2 | Fill all fields, save | Medicine in list; `SCHEDULE_SAVE` + `NOTIFICATION_SCHEDULE` fired | ☐ |
| 2.3 | View dashboard | Dose cards at correct times | ☐ |
| 2.4 | Add 3x daily medicine | 3 notification IDs returned and stored | ☐ |

#### Dose Logging

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 3.1 | Tap "Take" on pending dose | Confirm dialog shown | ☐ |
| 3.2 | Confirm | Status → Taken; adherence % updates | ☐ |
| 3.3 | Tap already-taken dose | No re-log; shows taken time | ☐ |

#### Missed Dose + AI

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 4.1 | Tap "Missed" | Spinner → then AI card | ☐ |
| 4.2 | AI card content | reasoning, suggestion, confidence, disclaimer all present | ☐ |
| 4.3 | Tap "Approve & Skip" | DoseLog(status=skipped, aiSuggested=true) saved | ☐ |
| 4.4 | Tap "Dismiss" | DoseLog(status=missed) saved | ☐ |
| 4.5 | Offline: tap "Missed" | `AIOfflineFallback` shown; no network call | ☐ |
| 4.6 | Offline: tap "Mark Missed" | DoseLog saved without AI fields | ☐ |

#### AI Caregiver Summary

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 5.1 | Tap "Share Summary" | AI loading → card with reasoning + message | ☐ |
| 5.2 | Tap "Approve" | `SEND_MESSAGE` bridge fires; native share sheet opens | ☐ |

#### Biometric + PIN

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 6.1 | Background + reopen | BiometricGate shown | ☐ |
| 6.2 | `adb -e emu finger touch 1` | Authenticated → Dashboard | ☐ |
| 6.3 | `adb -e emu finger touch 2` ×3 | Falls to PinFallback | ☐ |
| 6.4 | Enter correct 4-digit PIN | Opens Dashboard | ☐ |
| 6.5 | Enter wrong PIN | Error shown; retry allowed | ☐ |
| 6.6 | No fingerprint enrolled on device | Jumps straight to PinFallback | ☐ |

#### Notifications

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 7.1 | Add medicine 2 min from now | After 2 min (app backgrounded) notification appears | ☐ |
| 7.2 | Tap notification | App opens; today's schedule refreshed | ☐ |
| 7.3 | Delete medicine | Notifications for that medicine cancelled | ☐ |

#### Offline Mode

| # | Steps | Expected | ✓ |
|---|-------|----------|---|
| 8.1 | Load dashboard, enable airplane mode | Data still shows (from AsyncStorage) | ☐ |
| 8.2 | Log a dose while offline | Queued in offline queue | ☐ |
| 8.3 | Disable airplane mode | `OFFLINE_SYNC` fires; logs merged | ☐ |
| 8.4 | Attempt AI while offline | `AIOfflineFallback` shown; app does not crash | ☐ |

---

## 11. Risks & Mitigations

### 1. WebView Bridge Race Condition

**Risk**: Native sends messages before web JS listener is attached → messages lost.

**Mitigation**:
- Web fires `READY` event when `initBridge()` runs (on layout mount)
- Native queues all outbound messages until `READY` received; flushes on `markWebReady()`
- All request/response pairs use `requestId` + 5s timeout → surfaces failures clearly

### 2. Android Emulator `localhost` Confusion

**Risk**: `http://localhost:3000` in WebView on Android emulator connects to the *emulator's* localhost (nothing running there), not the host machine's Next.js server.

**Mitigation**:
- Use `http://10.0.2.2:3000` for Android emulator (special alias to host machine)
- Use `http://<LAN-IP>:3000` for physical device on same Wi-Fi
- Use `Platform.OS` check in `WebViewHostScreen.tsx` to select correct URL
- This is the #1 "why doesn't it work" issue — document prominently

### 3. Notification Delivery on Android

**Risk**: Android Doze mode, battery optimization, or API 12+ exact alarm restrictions drop notifications.

**Mitigation**:
- Add `SCHEDULE_EXACT_ALARM` to AndroidManifest permissions (via `app.json`)
- Guide user in Settings: "Allow exact alarms" + "Disable battery optimization" for this app
- Use `SchedulableTriggerInputTypes.DAILY` trigger (not interval-based polling)
- For demo: set notification time to 2 min from now and test immediately
- Clarify: local scheduled notifications work in Expo Go; FCM requires EAS dev build

### 4. AI Safety & Approval Enforcement

**Risk**: AI gives harmful advice; actions execute without user consent.

**Mitigation**:
- System prompt forbids definitive medical advice; mandates `disclaimer` field
- `disclaimer` field rendered on every AI card, non-optional
- **No DoseLog saved until user taps "Approve" or "Dismiss"** — enforced in component, not just asked
- `aiSuggested: true` + `aiReasoning` stored for audit
- API key in `web/.env.local` only; AI calls go through Next.js API route; key never in client JS or bridge
- Offline fallback always shown when AI is unavailable — app never hard-fails

### 5. PIN Hashing Without bcrypt

**Risk**: Weak hashing or implementation inconsistency between web and native.

**Mitigation**:
- Web: `crypto.subtle.digest('SHA-256', ...)` (built-in Web Crypto)
- Native: `expo-crypto`'s `digestStringAsync(SHA256, ...)` — same algorithm
- Both produce the same hex output for the same input
- Store hex string in `SecureStore` — never raw PIN
- No native bcrypt module needed → no build complications

### 6. Shared Type Drift

**Risk**: Web and native model diverge; bridge messages silently misparse.

**Mitigation**:
- Single source of truth: `shared/types/index.ts` via `@medicine/shared` alias
- TypeScript strict mode catches consumers that violate the contract at compile time
- Any model change → update shared first → TypeScript errors guide all changes

### 7. Offline Data Conflicts

**Risk**: Doses logged offline on two sessions diverge on sync.

**Mitigation**:
- Demo strategy: **last-write-wins** by `updatedAt` timestamp (simple, predictable)
- `offlineQueue` stored in AsyncStorage; drained on `OFFLINE_SYNC`
- UI shows "X pending logs synced" badge so user knows state
- Post-MVP: consider CRDTs or a backend sync server

---

## 12. Definition of Done

### Core Flows (All Required for Demo)

- [ ] Onboarding: 4-step wizard completes; profile + PIN hash + biometric flag stored
- [ ] Add Medicine: validates; medicine + schedule saved to AsyncStorage; notifications scheduled
- [ ] Today's Dashboard: correct dose cards shown at correct times
- [ ] Mark Taken: DoseLog saved; adherence % updates
- [ ] Missed Dose AI: AI card shows reasoning → Approve saves with `aiSuggested=true`
- [ ] Missed Dose Offline: fallback card shown; manual log still works
- [ ] Caregiver AI Summary: message drafted with reasoning → Approve → native share sheet opens
- [ ] Biometric Lock: app locks on background; `adb -e emu finger touch 1` unlocks
- [ ] PIN Fallback: correct PIN unlocks; wrong PIN shows error and allows retry
- [ ] Local Notifications: scheduled notification fires when app is backgrounded
- [ ] Notification Tap: opens app and refreshes today's schedule
- [ ] Offline Mode: dashboard readable with airplane mode; logs sync on reconnect
- [ ] Dark Mode: toggle works, persists via localStorage, consistent across all screens

### Quality Gates

- [ ] No unhandled JS/native exceptions during any normal flow
- [ ] All async operations show loading + error states
- [ ] AI reasoning always visible **before** any action is taken
- [ ] No AI action fires without explicit user "Approve" tap
- [ ] `disclaimer` shown on every AI result card
- [ ] `ANTHROPIC_API_KEY` never appears in browser network tab
- [ ] All test case groups in Section 10 pass
- [ ] App runs on Android Emulator API 34 without crashing

### Code Quality

- [ ] All bridge messages typed with `BridgeMessage<T>` from `@medicine/shared`
- [ ] No `any` in shared contract types
- [ ] PIN hash + biometric flag stored in `SecureStore` only (never `AsyncStorage`)
- [ ] `.env.local` in `.gitignore`; `.env.example` committed with placeholder
- [ ] `eas.json` committed with `preview` profile configured
- [ ] AI route at `web/src/app/api/ai/route.ts` (App Router) — not `pages/api/`
- [ ] Android emulator URL is `10.0.2.2:3000` — not `localhost:3000`

---

*Plan v2.0 — Work through milestones 0→8 in order. Each milestone is independently runnable and testable. Check the risk section before starting a milestone that touches that area.*
