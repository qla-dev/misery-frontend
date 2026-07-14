import { InfoModal } from '@/components/InfoModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LaneModal } from '@/components/LaneModal';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { router, Stack } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { playHaptic, setGameMusicActive, setGameMusicMuted, setLobbyMusicActive } from '@/lib/sound';
import { ImageSourcePropType, Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import HelpIcon from '@expo/material-symbols/help.xml';
import VolumeOffIcon from '@expo/material-symbols/volume_off.xml';
import VolumeUpIcon from '@expo/material-symbols/volume_up.xml';
import { SFSymbol } from 'sf-symbols-typescript';
import { ChevronLeft, ShieldAlert, WifiOff } from 'lucide-react-native';

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
  const [turnNoticeReady, setTurnNoticeReady] = useState(true);
  const isBs = language === 'bs';
  const turnNotice = turnNotices[0];
  const activePlayerName = gameRuntime?.currentActingPlayer?.name ?? session?.players[0]?.name;
  const activePlayerColor = playerColor(gameRuntime?.currentActingPlayer?.color ?? session?.players[0]?.color);
  const laneCardsAdded = Math.max(0, (gameRuntime?.localPlayer?.lane?.length ?? 3) - 3);
  const laneCardsNeeded = session?.targetScore ?? 0;
  const isLocalLaneResult = Boolean(
    laneResultPlayerName && laneResultPlayerName === gameRuntime?.localPlayer?.name
  );
  // Lane progress shown on the bottom of the lane-result overlay. The new card is
  // only inserted into the lane after the overlay closes, so the current lane length
  // reflects the count *before* this move; the badge animates the "+1" and counts up.
  const laneResultPlayer =
    gameRuntime?.players?.find((p: any) => p?.name === laneResultPlayerName) ??
    (laneResultPlayerName && laneResultPlayerName === gameRuntime?.localPlayer?.name
      ? gameRuntime?.localPlayer
      : undefined);
  const laneResultCardsAdded = Math.max(0, (laneResultPlayer?.lane?.length ?? 3) - 3);
  const laneResultAddsCard = laneResult === 'success' || laneResult === 'steal';
  const laneResultProgress = laneResultPlayerName
    ? {
        label: isBs ? `TRAKA IGRAČA ${laneResultPlayerName}` : `LANE OF ${laneResultPlayerName}`,
        count: laneResultCardsAdded,
        target: laneCardsNeeded,
        addsCard: laneResultAddsCard,
      }
    : undefined;
  const laneSuccessMessage = isLocalLaneResult
    ? isBs ? 'DOGAĐAJ JE DODAN U TVOJU TRAKU' : 'EVENT ADDED TO YOUR LANE'
    : laneResultPlayerName
      ? isBs
        ? `DOGAĐAJ JE DODAN U TRAKU IGRAČA ${laneResultPlayerName}`
        : `EVENT ADDED TO ${laneResultPlayerName.toUpperCase()}'S LANE`
      : isBs ? 'DOGAĐAJ JE DODAN U TRAKU IGRAČA' : "EVENT ADDED TO THE PLAYER'S LANE";
  const laneStealMessage = isLocalLaneResult
    ? isBs
      ? 'USPJEŠNO SI UKRAO KARTU I DODANA JE U TVOJU TRAKU'
      : 'YOU SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO YOUR LANE'
    : laneResultPlayerName
      ? gameRuntime?.lastStealWasFromLocalPlayer
        ? isBs
          ? `${laneResultPlayerName.toUpperCase()} JE USPJEŠNO UKRAO TVOJU KARTU I DODANA JE U NJEGOVU TRAKU`
          : `${laneResultPlayerName.toUpperCase()} SUCCESSFULLY STOLE YOUR CARD AND IT WAS ADDED TO THEIR LANE`
        : isBs
          ? `${laneResultPlayerName.toUpperCase()} JE USPJEŠNO UKRAO KARTU I DODANA JE U NJEGOVU TRAKU`
          : `${laneResultPlayerName.toUpperCase()} SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO THEIR LANE`
      : isBs
        ? 'KARTA JE USPJEŠNO UKRADENA I DODANA U TRAKU IGRAČA'
        : "THE CARD WAS SUCCESSFULLY STOLEN AND ADDED TO THE PLAYER'S LANE";
  const laneFailureMessage = isLocalLaneResult || !laneResultPlayerName
    ? isBs
      ? 'TVOJA PROCJENA JE BILA PREVISOKA ILI PRENISKA'
      : 'YOUR GUESS WAS TOO HIGH OR TOO LOW'
    : isBs
      ? `PROCJENA IGRAČA ${laneResultPlayerName.toUpperCase()} BILA JE PREVISOKA ILI PRENISKA`
      : `${laneResultPlayerName.toUpperCase()}'S GUESS WAS TOO HIGH OR TOO LOW`;
  const isGameFinished = gameRuntime?.phase === 'VICTORY' || gameRuntime?.phase === 'GAME_OVER';
  const turnTitle = isGameFinished
    ? isBs ? 'KONAČNI POREDAK' : 'FINAL STANDINGS'
    : activePlayerName
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

  useEffect(() => {
    if (!isGameFinished) return;
    setLobbyMusicActive(true);
    setGameMusicActive(false);
  }, [isGameFinished]);

  useEffect(() => {
    if (turnNotice?.type !== 'start') return;
    router.navigate('/game');
  }, [turnNotice?.id, turnNotice?.type]);

  useEffect(() => {
    if (laneResult !== null) {
      setTurnNoticeReady(false);
      return;
    }
    if (!turnNotice) {
      setTurnNoticeReady(true);
      return;
    }
    setTurnNoticeReady(false);
    const timer = setTimeout(() => setTurnNoticeReady(true), turnNotice.type === 'end' ? 1000 : 500);
    return () => clearTimeout(timer);
  }, [laneResult, turnNotice?.id, turnNotice?.type]);

  const returnToWelcome = () => {
    playHaptic();
    if (gameRuntime?.leaveFinishedGame) {
      gameRuntime.leaveFinishedGame('WELCOME');
      return;
    }
    setGameRuntime(null);
    setIsGameCountingDown(false);
    setLaneResult(null);
    setLaneResultPlayerName(null);
    setTurnNotices([]);
    setSession(null);
    setLobbyView('WELCOME');
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
          headerShown: !isGameCountingDown,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerLeft: () => isGameFinished ? (
            <Pressable
              accessibilityLabel={isBs ? 'Nazad na početni ekran' : 'Back to welcome'}
              accessibilityRole="button"
              hitSlop={10}
              onPress={returnToWelcome}
              style={{
                alignItems: 'center',
                height: 32,
                justifyContent: 'center',
                width: 32,
              }}
            >
              <ChevronLeft color="#ffffff" size={27} strokeWidth={2.4} />
            </Pressable>
          ) : (
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
        hidden={isGameCountingDown || isGameFinished}
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
      {gameRuntime?.connectionWarningVisible && !isGameCountingDown && (
        <View
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={{
            alignItems: 'center',
            alignSelf: 'center',
            backgroundColor: 'rgba(23,23,23,0.96)',
            borderColor: 'rgba(251,191,36,0.35)',
            borderRadius: 18,
            borderWidth: 1,
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 9,
            position: 'absolute',
            top: 58,
            zIndex: 50,
          }}
        >
          <WifiOff color="#fbbf24" size={16} strokeWidth={2.4} />
          <Text style={{ color: '#d4d4d4', fontFamily: 'Outfit_700Bold', fontSize: 12 }}>
            {isBs ? 'Slaba veza — pokušavamo ponovo…' : 'Weak connection — retrying…'}
          </Text>
        </View>
      )}
      <ConfirmModal
        cancelLabel={isBs ? 'PRESKOČI' : 'PASS'}
        confirmLabel={isBs ? 'POKUŠAJ KRAĐU' : 'TRY TO STEAL'}
        onCancel={() => gameRuntime?.handleStealChoice?.(false)}
        onConfirm={() => gameRuntime?.handleStealChoice?.(true)}
        onRequestClose={() => gameRuntime?.handleStealChoice?.(false)}
        visible={Boolean(gameRuntime?.stealDecisionVisible)}
      >
        <View className="items-center" style={{ gap: 10 }}>
          <ShieldAlert size={38} color="#fbbf24" />
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'MOGUĆNOST KRAĐE' : 'STEAL OPPORTUNITY'}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {isBs
              ? `${gameRuntime?.activeStealer?.name}, želiš li pokušati pravilno smjestiti kartu i ukrasti je?`
              : `${gameRuntime?.activeStealer?.name}, do you want to place the card correctly and steal it?`}
          </Text>
        </View>
      </ConfirmModal>
      <LaneModal
        failureMessage={laneFailureMessage}
        failureTitle={isBs ? 'NETAČNO' : 'INCORRECT'}
        onComplete={() => {
          setLaneResult(null);
          setLaneResultPlayerName(null);
        }}
        laneProgress={laneResultProgress}
        success={laneResult !== 'failure'}
        successMessage={laneResult === 'steal' ? laneStealMessage : laneSuccessMessage}
        successTitle={laneResult === 'steal'
          ? isBs ? 'KARTA UKRADENA' : 'CARD STOLEN'
          : isBs ? 'TAČNO' : 'CORRECT'}
        score={laneResult === 'steal' && gameRuntime?.lastResultCardScore !== null
          ? gameRuntime?.lastResultCardScore
          : undefined}
        scoreLabel={isBs ? 'STOPA BIJEDE' : 'MISERY RATE'}
        visible={laneResult !== null}
        warning={laneResult === 'steal'}
      />
      <LaneModal
        key={turnNotice?.id ?? 'no-turn-notice'}
        ending={turnNotice?.type === 'end' || turnNotice?.type === 'finish'}
        failureMessage=""
        failureTitle=""
        holding={turnNotice?.type === 'hold'}
        neutral={turnNotice?.type !== 'hold'}
        onComplete={() => setTurnNotices((current) => current.slice(1))}
        success
        successMessage={turnNotice?.type === 'finish'
          ? isBs ? 'KONAČNI POREDAK JE SPREMAN' : 'YOUR FINAL STANDINGS ARE READY'
          : turnNotice?.type === 'hold'
            ? isBs
              ? `TVOJA KARTA JE PONUĐENA IGRAČU ${turnNotice.playerName ?? 'SLJEDEĆEM IGRAČU'} — SAČEKAJ ODLUKU`
              : `YOUR CARD IS OFFERED TO ${turnNotice.playerName ?? 'THE NEXT PLAYER'} — WAIT FOR THEIR DECISION`
          : turnNotice?.type === 'end'
          ? turnNotice.steal
            ? isBs
              ? `KARTA JE PONUĐENA IGRAČU ${turnNotice.playerName ?? ''} ZA KRAĐU`
              : `THE CARD IS NOW OFFERED TO ${turnNotice.playerName ?? 'THE NEXT PLAYER'} TO STEAL`
            : isBs ? 'ČEKAJ SLJEDEĆU PRILIKU' : 'WAITING FOR THE NEXT PLAYER'
          : turnNotice?.steal
            ? isBs ? 'DODIRNI KARTU I POKUŠAJ KRAĐU' : 'TAP THE CARD TO TRY TO STEAL'
            : isBs ? 'DODIRNI KARTU ZA IGRU' : 'TAP THE CARD TO PLAY'}
        successTitle={turnNotice?.type === 'finish'
          ? isBs ? 'IGRA JE ZAVRŠENA' : 'GAME FINISHED'
          : turnNotice?.type === 'hold'
            ? isBs ? 'NA ČEKANJU SI' : `YOU'RE ON HOLD`
          : turnNotice?.type === 'end'
          ? isBs ? 'TVOJ POTEZ JE ZAVRŠEN' : 'YOUR TURN ENDED'
          : turnNotice?.steal
            ? isBs ? 'POKUŠAJ KRAĐE' : 'YOUR STEAL ATTEMPT'
            : isBs ? 'TVOJ POTEZ JE POČEO' : 'YOUR TURN STARTED'}
        visible={laneResult === null && !gameRuntime?.inactivityWarningVisible && turnNoticeReady && !gameRuntime?.hasPendingLaneAnimation && Boolean(turnNotice)}
        warning={turnNotice?.type === 'hold'}
      />
      <LaneModal
        bell
        failureMessage=""
        failureTitle=""
        onComplete={() => gameRuntime?.dismissInactivityWarning?.()}
        success
        successMessage={isBs ? 'ODIGRAJ TRENUTNU KARTU DA SE IGRA NASTAVI' : 'PLAY THE CURRENT CARD TO KEEP THE GAME MOVING'}
        successTitle={isBs ? 'TVOJ POTEZ ČEKA' : 'YOUR TURN IS WAITING'}
        visible={laneResult === null && Boolean(gameRuntime?.inactivityWarningVisible)}
        warning
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
