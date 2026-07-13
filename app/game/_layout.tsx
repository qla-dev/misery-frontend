import { InfoModal } from '@/components/InfoModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LaneModal } from '@/components/LaneModal';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { router, Stack } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { playHaptic, setGameMusicActive, setGameMusicMuted } from '@/lib/sound';
import { ImageSourcePropType, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import HelpIcon from '@expo/material-symbols/help.xml';
import VolumeOffIcon from '@expo/material-symbols/volume_off.xml';
import VolumeUpIcon from '@expo/material-symbols/volume_up.xml';
import { SFSymbol } from 'sf-symbols-typescript';

function toolbarIcon(ios: SFSymbol, android: ImageSourcePropType) {
  return process.env.EXPO_OS === 'ios' ? ios : android;
}

const PLAYER_COLORS: Record<string, string> = {
  yellow: '#facc15', blue: '#60a5fa', emerald: '#10b981', purple: '#c084fc',
  red: '#ef4444', orange: '#f97316', neutral: '#d4d4d4', '#8B5A2B': '#8B5A2B',
};

function playerColor(value?: string) {
  if (!value) return '#facc15';
  const key = Object.keys(PLAYER_COLORS).find((candidate) => value.includes(candidate));
  return key ? PLAYER_COLORS[key] : '#facc15';
}

export default function GameTabsLayout() {
  const {
    gameRuntime,
    isGameCountingDown,
    language,
    laneResult,
    laneResultPlayerName,
    musicMuted,
    setGameRuntime,
    setInfoModalOpen,
    setIsGameCountingDown,
    setLaneResult,
    setLaneResultPlayerName,
    setLobbyView,
    setMusicMuted,
    setSession,
    session,
    setTurnNotices,
    turnNotices,
  } = useGame();
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const isBs = language === 'bs';
  const turnNotice = turnNotices[0];
  const activePlayerName = gameRuntime?.currentActingPlayer?.name ?? session?.players[0]?.name;
  const activePlayerColor = playerColor(gameRuntime?.currentActingPlayer?.color ?? session?.players[0]?.color);
  const laneCardsAdded = Math.max(0, (gameRuntime?.localPlayer?.lane?.length ?? 3) - 3);
  const laneCardsNeeded = session?.targetScore ?? 0;
  const turnTitle = activePlayerName
    ? isBs
      ? `${activePlayerName} JE NA POTEZU`
      : `${activePlayerName}'S TURN`
    : isBs
      ? 'IGRAČ JE NA POTEZU'
      : 'PLAYER TURN';

  useEffect(() => {
    setGameMusicActive(true);
    return () => setGameMusicActive(false);
  }, []);

  useEffect(() => {
    setGameMusicMuted(musicMuted);
  }, [musicMuted]);

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
          headerShown: !isGameCountingDown,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerLeft: () => (
            <View
              accessibilityLabel={activePlayerName ? `${activePlayerName} is playing` : 'Active player'}
              accessible
              style={{
                backgroundColor: activePlayerColor,
                borderColor: 'rgba(255,255,255,0.35)',
                borderRadius: 14,
                borderWidth: 2,
                height: 28,
                width: 28,
              }}
            />
          ),
          headerTitle: () => (
            <Text
              numberOfLines={1}
              style={{
                color: '#ffffff',
                fontFamily: 'BebasNeue_400Regular',
                fontSize: 20,
                letterSpacing: 2,
                textAlign: 'left',
                width: 144,
              }}
            >
              {turnTitle}
            </Text>
          ),
          headerTitleAlign: 'center',
          headerTintColor: '#ffffff',
          headerTransparent: true,
        }}
      />
      {!isGameCountingDown && (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Button
              accessibilityLabel={musicMuted ? 'Turn music on' : 'Turn music off'}
              icon={toolbarIcon(musicMuted ? 'speaker.slash.fill' : 'speaker.wave.2.fill', musicMuted ? VolumeOffIcon : VolumeUpIcon)}
              onPress={() => {
                playHaptic();
                setMusicMuted(!musicMuted);
              }}
              separateBackground
              tintColor={musicMuted ? '#737373' : '#fbbf24'}
            />
            <Stack.Toolbar.Button
              accessibilityLabel="Instructions"
              icon={toolbarIcon('questionmark.circle.fill', HelpIcon)}
              onPress={() => {
                playHaptic();
                setInfoModalOpen(true);
              }}
              separateBackground
              tintColor="#ffffff"
            />
          </Stack.Toolbar>
        </>
      )}
      <NativeTabs
        disableTransparentOnScrollEdge
        hidden={isGameCountingDown}
        screenListeners={{ tabPress: () => playHaptic() }}
        iconColor={{ default: '#737373', selected: '#fbbf24' }}
        labelStyle={{
          default: { color: '#737373', fontSize: 10, fontWeight: '900' },
          selected: { color: '#fbbf24', fontSize: 10, fontWeight: '900' },
        }}
        labelVisibilityMode="labeled"
        tintColor="#fbbf24"
      >
        <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: '#0a0a0a' }}>
          <NativeTabs.Trigger.Icon sf={{ default: 'rectangle.portrait', selected: 'rectangle.portrait.fill' } as any} md="playing_cards" />
          <NativeTabs.Trigger.Label>{isBs ? 'Karta' : 'Card'}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="lane" contentStyle={{ backgroundColor: '#0a0a0a' }}>
          <NativeTabs.Trigger.Icon sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' } as any} md="view_agenda" />
          <NativeTabs.Trigger.Label>
            {isBs ? `Traka bijede ${laneCardsAdded}/${laneCardsNeeded}` : `Misery Lane ${laneCardsAdded}/${laneCardsNeeded}`}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history" contentStyle={{ backgroundColor: '#0a0a0a' }}>
          <NativeTabs.Trigger.Icon sf={{ default: 'clock.arrow.circlepath', selected: 'clock.arrow.circlepath' } as any} md="history" />
          <NativeTabs.Trigger.Label>{isBs ? 'Historija' : 'History'}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <InfoModal onLeaveGame={() => setIsExitConfirmOpen(true)} />
      <LaneModal
        failureMessage={isBs ? 'PREVIŠE ILI PREMALO BIJEDE' : 'TOO HIGH OR TOO LOW'}
        failureTitle={isBs ? 'NETAČNO' : 'INCORRECT'}
        onComplete={() => {
          const shouldFinishTurn = Boolean(gameRuntime?.canFinishTurn);
          setLaneResult(null);
          setLaneResultPlayerName(null);
          if (shouldFinishTurn) void gameRuntime?.handleProceedNextRound?.();
        }}
        playerName={laneResultPlayerName ?? undefined}
        success={laneResult !== 'failure'}
        successMessage={laneResult === 'steal'
          ? isBs ? 'IGRAČ JE USPJEŠNO UKRAO KARTU' : 'PLAYER SUCCESSFULLY STOLE THE CARD'
          : isBs ? 'DOGAĐAJ JE USPJEŠNO DODAN' : 'EVENT ADDED TO YOUR LANE'}
        successTitle={laneResult === 'steal'
          ? isBs ? 'KARTA UKRADENA' : 'CARD STOLEN'
          : isBs ? 'TAČNO' : 'CORRECT'}
        visible={laneResult !== null}
        warning={laneResult === 'steal'}
      />
      <LaneModal
        key={turnNotice?.id ?? 'no-turn-notice'}
        ending={turnNotice?.type === 'end'}
        failureMessage=""
        failureTitle=""
        neutral
        onComplete={() => setTurnNotices((current) => current.slice(1))}
        success
        successMessage={turnNotice?.type === 'end'
          ? isBs ? 'ČEKAJ SLJEDEĆU PRILIKU' : 'WAITING FOR THE NEXT PLAYER'
          : turnNotice?.steal
            ? isBs ? 'DODIRNI KARTU I POKUŠAJ KRAĐU' : 'TAP THE CARD TO TRY TO STEAL'
            : isBs ? 'DODIRNI KARTU ZA IGRU' : 'TAP THE CARD TO PLAY'}
        successTitle={turnNotice?.type === 'end'
          ? isBs ? 'TVOJ POTEZ JE ZAVRŠEN' : 'YOUR TURN ENDED'
          : turnNotice?.steal
            ? isBs ? 'POKUŠAJ KRAĐE' : 'YOUR STEAL ATTEMPT'
            : isBs ? 'TVOJ POTEZ JE POČEO' : 'YOUR TURN STARTED'}
        visible={laneResult === null && Boolean(turnNotice)}
      />
      <ConfirmModal
        cancelLabel={isBs ? 'NAPUSTI IGRU' : 'LEAVE GAME'}
        confirmLabel={isBs ? 'NASTAVI IGRU' : 'KEEP PLAYING'}
        onCancel={() => {
          setIsExitConfirmOpen(false);
          setGameRuntime(null);
          setIsGameCountingDown(false);
          setLaneResult(null);
          setLaneResultPlayerName(null);
          setTurnNotices([]);
          setSession(null);
          setLobbyView('SETUP');
          requestAnimationFrame(() => router.replace('/'));
        }}
        onConfirm={() => setIsExitConfirmOpen(false)}
        onRequestClose={() => setIsExitConfirmOpen(false)}
        visible={isExitConfirmOpen}
      >
        <View className="items-center" style={{ gap: 10 }}>
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'NAPUSTITI IGRU?' : 'LEAVE THE GAME?'}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {isBs
              ? 'Jeste li sigurni? Trenutni napredak igre bit će izgubljen.'
              : 'Are you sure? Your current game progress will be lost.'}
          </Text>
        </View>
      </ConfirmModal>
    </>
  );
}
