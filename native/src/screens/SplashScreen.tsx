import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: StackNavigationProp<Record<string, undefined>>;
};

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const check = async () => {
      await new Promise((r) => setTimeout(r, 2000));
      const profile = await AsyncStorage.getItem('@mc/profile_v1');
      if (profile) {
        navigation.replace('BiometricGate');
      } else {
        navigation.replace('WebViewHost', { initialRoute: '/onboarding' } as never);
      }
    };
    check();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💊</Text>
      <Text style={styles.title}>Medicine Companion</Text>
      <Text style={styles.subtitle}>Your personal medication assistant</Text>
      <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  spinner: { marginTop: 16 },
});
