import GameBoard from '@/components/GameBoard';
import { useGame } from '@/context/GameContext';
import { Redirect, router, Stack } from 'expo-router';
import { Text } from 'react-native';

export default function GameScreen() {
  const { session, language, toggleLanguage, muted, setMuted, setShowRules } = useGame();

  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#ffffff',
          headerTitle: () => (
            <Text style={{ fontFamily: 'BebasNeue_400Regular', color: '#ffffff', fontSize: 20, letterSpacing: 2 }}>
              MISERY METER
            </Text>
          ),
        }}
      />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()} tintColor="#ffffff">
          ←
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={() => setMuted(!muted)} tintColor={muted ? '#737373' : '#fbbf24'}>
          {muted ? '🔇' : '🔊'}
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button onPress={() => setShowRules(true)} tintColor="#ffffff">
          📖
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button onPress={toggleLanguage} tintColor="#fbbf24">
          {language === 'en' ? 'EN 🇺🇸' : 'BS 🇧🇦'}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <GameBoard
        mode={session.mode}
        initialPlayers={session.players}
        targetScore={session.targetScore}
        deckType={session.deckType}
      />
    </>
  );
}
