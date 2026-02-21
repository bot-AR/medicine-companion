'use client';

import { useEffect } from 'react';
import { initBridge, onNativeMessage, sendRequest } from '@/lib/bridge';
import type { BridgeMessage, BridgeEventType } from '@medicine/shared';

export function useBridgeInit() {
  useEffect(() => {
    initBridge();
  }, []);
}

export function useBridgeListener(handler: (msg: BridgeMessage) => void) {
  useEffect(() => {
    return onNativeMessage(handler);
  }, [handler]);
}

export function useBridgeRequest() {
  return {
    send: <T>(event: BridgeEventType, payload: T, timeout?: number) =>
      sendRequest(event, payload, timeout),
  };
}
