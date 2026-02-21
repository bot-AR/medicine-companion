import { storePinHash, setBiometricEnabled } from '../../services/secureStorage';

export async function handleAuth(payload: Record<string, unknown>) {
  if (payload.pinHash) {
    await storePinHash(payload.pinHash as string);
  }
  if (typeof payload.enableBiometric === 'boolean') {
    await setBiometricEnabled(payload.enableBiometric);
  }
}
