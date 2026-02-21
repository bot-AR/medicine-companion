import AsyncStorage from '@react-native-async-storage/async-storage';

export function handleTheme(payload: Record<string, unknown>) {
  const theme = payload.theme as string;
  AsyncStorage.setItem('@mc/theme_v1', theme).catch(console.error);
}
