import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type { BridgeMessage } from '../../../shared/types';

let webReady = false;
const queue: BridgeMessage[] = [];
let _webViewRef: RefObject<WebView | null> | null = null;

export function initQueue(ref: RefObject<WebView | null>) {
  _webViewRef = ref;
}

export function markWebReady() {
  webReady = true;
  flushQueue();
}

export function enqueueOrSend(msg: BridgeMessage) {
  if (webReady && _webViewRef?.current) {
    sendToWebDirect(msg);
  } else {
    queue.push(msg);
  }
}

function flushQueue() {
  queue.forEach((msg) => sendToWebDirect(msg));
  queue.length = 0;
}

function sendToWebDirect(msg: BridgeMessage) {
  const js = `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(msg))}}));true;`;
  _webViewRef?.current?.injectJavaScript(js);
}
