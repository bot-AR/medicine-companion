import type { BridgeMessage, BridgeEventType } from '@medicine/shared';
import { generateId } from './uuid';

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

const IS_WEBVIEW = typeof window !== 'undefined' && !!window.ReactNativeWebView;

type BridgeListener = (msg: BridgeMessage) => void;
const listeners = new Set<BridgeListener>();

const pending = new Map<
  string,
  { resolve: (msg: BridgeMessage) => void; timer: ReturnType<typeof setTimeout> }
>();

export function sendToNative<T>(msg: BridgeMessage<T>) {
  if (IS_WEBVIEW) {
    window.ReactNativeWebView!.postMessage(JSON.stringify(msg));
  } else {
    console.log('[BRIDGE MOCK ->]', msg);
  }
}

export function sendRequest<T>(
  event: BridgeEventType,
  payload: T,
  timeoutMs = 5000,
): Promise<BridgeMessage> {
  return new Promise((resolve, reject) => {
    const requestId = generateId();
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Bridge timeout: ${event} (${timeoutMs}ms)`));
    }, timeoutMs);
    pending.set(requestId, { resolve, timer });
    sendToNative({ event, requestId, payload, timestamp: new Date().toISOString() });
  });
}

export function onNativeMessage(listener: BridgeListener) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function handleIncoming(e: MessageEvent) {
  try {
    const raw = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
    const msg = JSON.parse(raw) as BridgeMessage;
    if (!msg.event) return;

    const handler = pending.get(msg.requestId);
    if (handler) {
      clearTimeout(handler.timer);
      pending.delete(msg.requestId);
      handler.resolve(msg);
    }

    listeners.forEach((fn) => fn(msg));
  } catch {
    /* ignore non-bridge messages */
  }
}

let initialized = false;
export function initBridge() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  window.addEventListener('message', handleIncoming);
  sendToNative({
    event: 'READY',
    requestId: generateId(),
    payload: {},
    timestamp: new Date().toISOString(),
  });
}
