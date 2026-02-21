import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import * as Crypto from 'expo-crypto';
import { getPinHash } from '../services/secureStorage';

type Props = {
  navigation: StackNavigationProp<Record<string, undefined>>;
};

export default function PinFallbackScreen({ navigation }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    if (pin.length !== 4) {
      setError('Enter 4 digits');
      return;
    }
    setChecking(true);
    setError('');

    const stored = await getPinHash();
    if (!stored) {
      navigation.replace('WebViewHost');
      return;
    }

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin,
    );

    if (hash === stored) {
      navigation.replace('WebViewHost');
    } else {
      setError('Incorrect PIN. Try again.');
      setPin('');
    }
    setChecking(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔐</Text>
      <Text style={styles.title}>Enter PIN</Text>
      <Text style={styles.subtitle}>Enter your 4-digit PIN to unlock</Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
        placeholder="••••"
        placeholderTextColor="#999"
        textAlign="center"
        autoFocus
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={verify} disabled={checking}>
        {checking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Unlock</Text>
        )}
      </TouchableOpacity>
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
  input: {
    width: 160,
    height: 56,
    fontSize: 28,
    letterSpacing: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  error: { fontSize: 13, color: '#dc2626', marginBottom: 12 },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
