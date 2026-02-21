import { useRef, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, BackHandler, Platform } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { WEB_URL } from '../constants/bridge';
import { initQueue, markWebReady } from '../bridge/messageQueue';
import { handleBridgeMessage } from '../bridge/BridgeHandler';

type Props = {
  route?: { params?: { initialRoute?: string } };
};

export default function WebViewHostScreen({ route }: Props) {
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const initialRoute = route?.params?.initialRoute ?? '/dashboard';
  const uri = `${WEB_URL}${initialRoute}`;

  useEffect(() => {
    initQueue(webViewRef);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, []);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.event === 'READY') {
        markWebReady();
        return;
      }
      handleBridgeMessage(msg, webViewRef);
    } catch (e) {
      console.warn('[WebViewHost] Failed to parse message:', e);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri }}
        style={styles.webview}
        onMessage={onMessage}
        onNavigationStateChange={(navState) => {
          canGoBackRef.current = navState.canGoBack;
        }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        allowsBackForwardNavigationGestures
        startInLoadingState
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  webview: { flex: 1 },
});
