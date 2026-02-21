import type { RefObject } from 'react';
import type WebView from 'react-native-webview';
import type { BridgeMessage } from '../../../shared/types';
import { sendToWeb } from './sendToWeb';
import { handleAuth } from './handlers/authHandler';
import { handleProfile } from './handlers/profileHandler';
import { handleSchedule, handleDoseLog } from './handlers/scheduleHandler';
import { handleNotification } from './handlers/notificationHandler';
import { handleTheme } from './handlers/themeHandler';
import { handleSendMessage } from './handlers/messageHandler';

export async function handleBridgeMessage(
  msg: BridgeMessage,
  webViewRef: RefObject<WebView | null>,
) {
  const reply = (event: string, payload: unknown) => {
    sendToWeb(webViewRef, {
      event: event as BridgeMessage['event'],
      requestId: msg.requestId,
      payload,
      timestamp: new Date().toISOString(),
    });
  };

  try {
    switch (msg.event) {
      case 'AUTH_SETUP':
        await handleAuth(msg.payload as Record<string, unknown>);
        reply('AUTH_RESULT', { success: true });
        break;

      case 'AUTH_REQUEST':
        reply('AUTH_RESULT', { success: true, method: 'bridge' });
        break;

      case 'PROFILE_SAVE':
        await handleProfile(msg.payload as Record<string, unknown>);
        reply('PROFILE_LOAD_RESULT', { success: true });
        break;

      case 'PROFILE_LOAD':
        const profile = await handleProfile(null);
        reply('PROFILE_LOAD_RESULT', profile);
        break;

      case 'SCHEDULE_SAVE':
        await handleSchedule('save', msg.payload as Record<string, unknown>);
        reply('NOTIFICATION_RESULT', { success: true });
        break;

      case 'SCHEDULE_LOAD':
        const data = await handleSchedule('load', msg.payload as Record<string, unknown>);
        reply('SCHEDULE_LOAD_RESULT', data);
        break;

      case 'DOSE_LOG_SAVE':
        await handleDoseLog(msg.payload as Record<string, unknown>);
        reply('DOSE_LOG_SAVE_RESULT', { success: true });
        break;

      case 'NOTIFICATION_SCHEDULE':
        const notifResult = await handleNotification('schedule', msg.payload as Record<string, unknown>);
        reply('NOTIFICATION_RESULT', notifResult);
        break;

      case 'NOTIFICATION_CANCEL':
        await handleNotification('cancel', msg.payload as Record<string, unknown>);
        reply('NOTIFICATION_RESULT', { success: true });
        break;

      case 'THEME_SET':
        handleTheme(msg.payload as Record<string, unknown>);
        break;

      case 'SEND_MESSAGE':
        const msgResult = await handleSendMessage(msg.payload as Record<string, unknown>);
        reply('SEND_MESSAGE_RESULT', msgResult);
        break;

      default:
        console.warn('[BridgeHandler] Unknown event:', msg.event);
    }
  } catch (err) {
    console.error('[BridgeHandler] Error:', msg.event, err);
  }
}
