import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isDevice = Constants.executionEnvironment === 'storeClient';

function getDevUrl(): string {
  if (Platform.OS === 'android') {
    return isDevice
      ? `http://${Constants.expoConfig?.hostUri?.split(':')[0] ?? '192.168.1.37'}:3000`
      : 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL || getDevUrl();
