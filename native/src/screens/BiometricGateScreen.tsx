import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { isBiometricAvailable, authenticate } from '../services/biometrics';
import { isBiometricEnabled } from '../services/secureStorage';

type Props = {
  navigation: StackNavigationProp<Record<string, undefined>>;
};

export default function BiometricGateScreen({ navigation }: Props) {
  const [failures, setFailures] = useState(0);

  useEffect(() => {
    const tryAuth = async () => {
      const enabled = await isBiometricEnabled();
      const available = await isBiometricAvailable();

      if (!enabled || !available) {
        navigation.replace('PinFallback');
        return;
      }

      const success = await authenticate('Unlock Medicine Companion');
      if (success) {
        navigation.replace('WebViewHost');
      } else {
        setFailures((f) => f + 1);
      }
    };
    tryAuth();
  }, [failures, navigation]);

  useEffect(() => {
    if (failures >= 3) {
      navigation.replace('PinFallback');
    }
  }, [failures, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Unlock</Text>
      <Text style={styles.subtitle}>Use your fingerprint to continue</Text>
      <ActivityIndicator size="large" color="#2563eb" style={styles.spinner} />
      {failures > 0 && failures < 3 && (
        <Text style={styles.fail}>
          Authentication failed ({failures}/3). Trying again...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  spinner: { marginTop: 8 },
  fail: { fontSize: 13, color: '#dc2626', marginTop: 16, textAlign: 'center' },
});
