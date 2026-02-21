import * as SecureStore from 'expo-secure-store';

const SK = {
  pinHash: 'mc_pin_hash',
  biometricEnabled: 'mc_biometric_enabled',
};

export const storePinHash = (h: string) => SecureStore.setItemAsync(SK.pinHash, h);
export const getPinHash = () => SecureStore.getItemAsync(SK.pinHash);
export const setBiometricEnabled = (v: boolean) =>
  SecureStore.setItemAsync(SK.biometricEnabled, String(v));
export const isBiometricEnabled = async () =>
  (await SecureStore.getItemAsync(SK.biometricEnabled)) === 'true';
