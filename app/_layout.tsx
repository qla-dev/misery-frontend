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
import { DarkTheme, router, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameProvider, useGame } from '@/context/GameContext';
import { CHAT_LAYOUT_DEBUG } from '@/lib/chatDebug';

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
    AmaticSC_Bold: require('../assets/fonts/AmaticSC-Bold.ttf'),
    FacebookSansBold: require('../assets/fonts/FacebookSansBold.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={miseryTheme}>
        <GameProvider>
          <RootStack />
        </GameProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { isGameCountingDown } = useGame();
  const pathname = usePathname();

  useEffect(() => {
    if (!CHAT_LAYOUT_DEBUG || pathname === '/game/chat') return;
    requestAnimationFrame(() => router.replace('/game/chat'));
  }, [pathname]);

  return (
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
        <Stack.Screen
          name="(tabs)"
          options={{
            gestureEnabled: false,
            headerBackVisible: false,
            headerShown: true,
            title: '',
          }}
        />
        <Stack.Screen name="code/[code]" options={{ headerShown: false }} />
        <Stack.Screen
          name="game"
          options={{
            gestureEnabled: false,
            headerShown: !isGameCountingDown,
          }}
        />
      </Stack>
    </View>
  );
}
