import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type { BridgeMessage } from '../../../shared/types';

export function sendToWeb(
  webViewRef: RefObject<WebView | null>,
  msg: BridgeMessage,
) {
  const js = `window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(msg))}}));true;`;
  webViewRef.current?.injectJavaScript(js);
}
