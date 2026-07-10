import GameBoard from '@/components/GameBoard';
import { GameCountdown } from '@/components/GameCountdown';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { Redirect, router, Stack } from 'expo-router';
import { Text } from 'react-native';
import { useState } from 'react';

export default function GameScreen() {
  const { session, language, toggleLanguage, muted, setMuted, setShowRules } = useGame();
  const [isCountingDown, setIsCountingDown] = useState(true);

  if (!session) {
    return <Redirect href="/" />;
  }

  const handleBack = () => {
    playSound('click');
    router.back();
  };

  if (isCountingDown) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <GameCountdown
          bottomLabel={language === 'bs' ? 'SPREMI SE ZA NESREĆU' : 'GET READY FOR MISERY'}
          finalLabel={language === 'bs' ? 'KRENI' : 'GO'}
          onComplete={() => setIsCountingDown(false)}
        />
      </>
    );
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
        <Stack.Toolbar.Button onPress={handleBack} tintColor="#ffffff">
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
