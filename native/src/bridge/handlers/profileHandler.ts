import { getProfile, saveProfile } from '../../services/storage';

export async function handleProfile(payload: Record<string, unknown> | null) {
  if (payload) {
    await saveProfile(payload);
    return { success: true };
  }
  return await getProfile();
}
