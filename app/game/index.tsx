import GameBoard from '@/components/GameBoard';
import { GameCountdown } from '@/components/GameCountdown';
import { InfoModal } from '@/components/InfoModal';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { Redirect, router, Stack } from 'expo-router';
import { ImageSourcePropType, Text } from 'react-native';
import { useState } from 'react';
import ChevronLeftIcon from '@expo/material-symbols/chevron_left.xml';
import HelpIcon from '@expo/material-symbols/help.xml';
import VolumeOffIcon from '@expo/material-symbols/volume_off.xml';
import VolumeUpIcon from '@expo/material-symbols/volume_up.xml';
import { SFSymbol } from 'sf-symbols-typescript';

function toolbarIcon(ios: SFSymbol, android: ImageSourcePropType) {
  return process.env.EXPO_OS === 'ios' ? ios : android;
}

export default function GameScreen() {
  const { session, language, toggleLanguage, muted, setMuted, setInfoModalOpen } = useGame();
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
        <Stack.Toolbar.Button
          accessibilityLabel="Back to lobby"
          icon={toolbarIcon('chevron.left', ChevronLeftIcon)}
          onPress={handleBack}
          tintColor="#ffffff"
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel={muted ? 'Unmute' : 'Mute'}
          icon={toolbarIcon(muted ? 'speaker.slash.fill' : 'speaker.wave.2.fill', muted ? VolumeOffIcon : VolumeUpIcon)}
          onPress={() => setMuted(!muted)}
          tintColor={muted ? '#737373' : '#fbbf24'}
        />
        <Stack.Toolbar.Button
          accessibilityLabel="Instructions"
          icon={toolbarIcon('questionmark.circle.fill', HelpIcon)}
          onPress={() => setInfoModalOpen(true)}
          tintColor="#ffffff"
        />
        <Stack.Toolbar.Button onPress={toggleLanguage} tintColor="#fbbf24">
          {language === 'en' ? 'EN' : 'BS'}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <GameBoard
        mode={session.mode}
        initialPlayers={session.players}
        targetScore={session.targetScore}
        deckType={session.deckType}
      />
      <InfoModal />
    </>
  );
}
