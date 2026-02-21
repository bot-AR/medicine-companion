import { Share } from 'react-native';

export async function handleSendMessage(payload: Record<string, unknown>) {
  try {
    const body = payload.body as string;
    const title = (payload.title as string) ?? 'Medicine Companion';
    await Share.share({ message: body, title });
    return { success: true };
  } catch {
    return { success: false };
  }
}
