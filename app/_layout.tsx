import '../global.css';

import {
  BebasNeue_400Regular,
} from '@expo-google-fonts/bebas-neue';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameProvider } from '@/context/GameContext';

SplashScreen.preventAutoHideAsync();

const miseryTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0a0a',
    card: '#0a0a0a',
    border: '#171717',
    text: '#ffffff',
    primary: '#fbbf24',
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    BebasNeue_400Regular,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={miseryTheme}>
        <GameProvider>
          <View className="flex-1 bg-neutral-950">
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerTransparent: true,
                headerShadowVisible: false,
                headerStyle: { backgroundColor: 'transparent' },
                contentStyle: { backgroundColor: '#0a0a0a' },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: true }} />
              <Stack.Screen name="game" options={{ headerShown: true }} />
            </Stack>
          </View>
        </GameProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
