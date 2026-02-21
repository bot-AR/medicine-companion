import { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import {
  setupNotificationHandler,
  requestNotificationPermissions,
} from './src/services/notifications';
import SplashScreen from './src/screens/SplashScreen';
import BiometricGateScreen from './src/screens/BiometricGateScreen';
import PinFallbackScreen from './src/screens/PinFallbackScreen';
import WebViewHostScreen from './src/screens/WebViewHostScreen';

setupNotificationHandler();

const Stack = createStackNavigator();

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { scheduleId?: string }
          | undefined;

        if (navigationRef.current) {
          const scheduleId = data?.scheduleId;
          navigationRef.current.navigate('WebViewHost', {
            initialRoute: scheduleId
              ? `/dashboard?highlight=${scheduleId}`
              : '/dashboard',
          });
        }
      },
    );
    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="BiometricGate" component={BiometricGateScreen} />
        <Stack.Screen name="PinFallback" component={PinFallbackScreen} />
        <Stack.Screen name="WebViewHost" component={WebViewHostScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
