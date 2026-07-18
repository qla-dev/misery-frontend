import { InfoModal } from '@/components/InfoModal';
import { Toast } from '@/components/Toast';
import { ConfirmModal } from '@/components/ConfirmModal';
import { GameActionQueue } from '@/components/GameActionQueue';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { router, Stack, usePathname } from 'expo-router';
import { useGame } from '@/context/GameContext';
import { playHaptic, setGameMusicActive, setGameMusicMuted, setLobbyMusicActive } from '@/lib/sound';
import { ImageSourcePropType, Pressable, Text, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import HelpIcon from '@expo/material-symbols/help.xml';
import VolumeOffIcon from '@expo/material-symbols/volume_off.xml';
import VolumeUpIcon from '@expo/material-symbols/volume_up.xml';
import { SFSymbol } from 'sf-symbols-typescript';
import { ChevronLeft, WifiOff } from 'lucide-react-native';

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
  const pathname = usePathname();
  const {
    gameRuntime,
    isGameCountingDown,
    language,
    laneResult,
    laneResultPlayerName,
    musicMuted,
    settingsRestored,
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
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  // Once GameBoard has published its runtime, the countdown is no longer on
  // screen. Keep native chrome visible even if a stale global flag arrives from
  // the still-mounted lobby/realtime lifecycle.
  const isCountdownVisible = isGameCountingDown && !gameRuntime;
  const returningToGameSettingsRef = useRef(false);
  const isBs = language === 'bs';
  const isChatOpen = pathname.endsWith('/chat');
  const handleUnreadMessages = useCallback((count: number) => {
    setUnreadChatCount((current) => current + count);
  }, []);
  const turnNotice = turnNotices[0];
  const activePlayerName = gameRuntime?.currentActingPlayer?.name ?? session?.players[0]?.name;
  const activePlayerColor = playerColor(gameRuntime?.currentActingPlayer?.color ?? session?.players[0]?.color);
  const laneCardsAdded = Math.max(0, (gameRuntime?.localPlayer?.lane?.length ?? 3) - 3);
  const laneCardsNeeded = session?.targetScore ?? 0;

  useEffect(() => {
    setUnreadChatCount(0);
  }, [isChatOpen, session?.gameId]);
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
  const laneResultAddsCard = laneResult === 'success' || laneResult === 'steal';
  const resultCardAlreadyInLane = Boolean(
    laneResultAddsCard &&
    gameRuntime?.drawnCard?.id &&
    laneResultPlayer?.lane?.some((card: any) => String(card.id) === String(gameRuntime.drawnCard.id))
  );
  const laneResultCardsAdded = Math.max(
    0,
    (laneResultPlayer?.lane?.length ?? 3) - 3 - (resultCardAlreadyInLane ? 1 : 0)
  );
  const laneResultProgress = laneResultPlayerName
    ? {
        label: isBs ? 'STAZA OD' : 'LANE OF',
        playerName: laneResultPlayerName,
        count: laneResultCardsAdded,
        target: laneCardsNeeded,
        addsCard: laneResultAddsCard,
      }
    : undefined;
  const laneSuccessMessage = isLocalLaneResult
    ? isBs ? 'DOGAĐAJ JE DODAN U TVOJU STAZU PATNJE' : 'EVENT ADDED TO YOUR LANE'
    : laneResultPlayerName
      ? isBs
        ? `DOGAĐAJ JE DODAN U STAZU IGRAČA ${laneResultPlayerName}`
        : `EVENT ADDED TO ${laneResultPlayerName.toUpperCase()}'S LANE`
      : isBs ? 'DOGAĐAJ JE DODAN U STAZU IGRAČA' : "EVENT ADDED TO THE PLAYER'S LANE";
  const laneStealMessage = isLocalLaneResult
    ? isBs
      ? 'USPJEŠNO SI UKRAO KARTU I DODANA JE U TVOJU STAZU PATNJE'
      : 'YOU SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO YOUR LANE'
    : laneResultPlayerName
      ? gameRuntime?.lastStealWasFromLocalPlayer
        ? isBs
          ? `${laneResultPlayerName.toUpperCase()} JE USPJEŠNO UKRAO TVOJU KARTU I DODANA JE U NJEGOVU STAZU`
          : `${laneResultPlayerName.toUpperCase()} SUCCESSFULLY STOLE YOUR CARD AND IT WAS ADDED TO THEIR LANE`
        : isBs
          ? `${laneResultPlayerName.toUpperCase()} JE USPJEŠNO UKRAO KARTU I DODANA JE U NJEGOVU STAZU`
          : `${laneResultPlayerName.toUpperCase()} SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO THEIR LANE`
      : isBs
        ? 'KARTA JE USPJEŠNO UKRADENA I DODANA U STAZU IGRAČA'
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
      ? `${activePlayerName} IGRA`
      : `${activePlayerName}'S TURN`
    : isBs
      ? 'IGRAČ IGRA'
      : 'PLAYER TURN';

  useEffect(() => {
    if (!settingsRestored) return undefined;
    setGameMusicMuted(musicMuted);
    setGameMusicActive(true);
    return () => setGameMusicActive(false);
  }, [musicMuted, settingsRestored]);

  useEffect(() => {
    if (!isGameFinished) return;
    setLobbyMusicActive(true);
    setGameMusicActive(false);
  }, [isGameFinished]);

  useEffect(() => {
    if (
      turnNotice?.type !== 'start' ||
      laneResult !== null ||
      gameRuntime?.hasPendingLaneAnimation
    ) return;
    router.navigate('/game');
  }, [gameRuntime?.hasPendingLaneAnimation, laneResult, turnNotice?.id, turnNotice?.type]);

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

  const returnToGameSettings = () => {
    if (returningToGameSettingsRef.current) return;
    returningToGameSettingsRef.current = true;
    setIsExitConfirmOpen(false);
    setInfoModalOpen(false);
    setGameRuntime(null);
    setIsGameCountingDown(false);
    setLaneResult(null);
    setLaneResultPlayerName(null);
    setTurnNotices([]);
    setSession(null);
    setLobbyView('SETUP');
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
          headerShown: !isCountdownVisible,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerLeft: () => isChatOpen ? (
            <Pressable
              accessibilityLabel={isBs ? 'Nazad u igru' : 'Back to game'}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                playHaptic();
                router.replace('/game');
              }}
              style={{ alignItems: 'center', height: 36, justifyContent: 'center', width: 36 }}
            >
              <ChevronLeft color="#ffffff" size={29} strokeWidth={2.4} />
            </Pressable>
          ) : isGameFinished ? (
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
          headerTitle: () => isChatOpen ? (
            <Text
              style={{
                color: '#ffffff',
                fontFamily: 'BebasNeue_400Regular',
                fontSize: 22,
                letterSpacing: 1.5,
              }}
            >
              Chat
            </Text>
          ) : (
            <Text
              numberOfLines={1}
              style={{
                color: '#ffffff',
                fontFamily: 'BebasNeue_400Regular',
                fontSize: 20,
                letterSpacing: 2,
                textAlign: 'left',
                width: 190,
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
      {!isCountdownVisible && !isChatOpen && (
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
        badgeBackgroundColor="#ef4444"
        badgeTextColor="#ffffff"
        disableTransparentOnScrollEdge
        hidden={isCountdownVisible || isGameFinished || isChatOpen}
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
            {isBs ? `Staza patnje ${laneCardsAdded}/${laneCardsNeeded}` : `Misery Lane ${laneCardsAdded}/${laneCardsNeeded}`}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history" contentStyle={{ backgroundColor: '#0a0a0a' }}>
          <NativeTabs.Trigger.Icon sf={{ default: 'clock.arrow.circlepath', selected: 'clock.arrow.circlepath' } as any} md="history" />
          <NativeTabs.Trigger.Label>{isBs ? 'Historija' : 'History'}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="chat" contentStyle={{ backgroundColor: '#0a0a0a' }}>
          <NativeTabs.Trigger.Icon sf={{ default: 'message', selected: 'message.fill' } as any} md="chat" />
          <NativeTabs.Trigger.Label>{isBs ? 'Razgovor' : 'Chat'}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Badge hidden={unreadChatCount === 0}>
            {unreadChatCount > 99 ? '99+' : String(unreadChatCount)}
          </NativeTabs.Trigger.Badge>
        </NativeTabs.Trigger>
      </NativeTabs>
      <InfoModal onLeaveGame={() => setIsExitConfirmOpen(true)} />
      <Toast
        autoClose={false}
        icon={<WifiOff color="#fbbf24" size={21} strokeWidth={2.4} />}
        subtitle={isBs ? 'Pokušavamo ponovo…' : 'Trying to reconnect…'}
        title={isBs ? 'Slaba veza' : 'Weak connection'}
        visible={Boolean(gameRuntime?.connectionWarningVisible && !isCountdownVisible)}
      />
      <GameActionQueue
        activeStealerName={gameRuntime?.activeStealer?.name}
        chatMessages={gameRuntime?.chatMessages ?? []}
        chatMessagesHydrated={Boolean(gameRuntime?.chatMessagesHydrated)}
        chatNotificationsEnabled={!isChatOpen}
        currentUserId={session?.userId}
        gameId={session?.gameId}
        hasPendingLaneAnimation={Boolean(gameRuntime?.hasPendingLaneAnimation)}
        inactivitySecondsRemaining={gameRuntime?.inactivitySecondsRemaining}
        inactivityWarningCount={gameRuntime?.inactivityWarningCount}
        inactivityWarningVisible={Boolean(gameRuntime?.inactivityWarningVisible)}
        isDrawnCardFlipped={Boolean(gameRuntime?.isDrawnCardFlipped)}
        isBs={isBs}
        laneFailureMessage={laneFailureMessage}
        laneResult={laneResult}
        laneResultProgress={laneResultProgress}
        laneStealMessage={laneStealMessage}
        laneSuccessMessage={laneSuccessMessage}
        lastResultCardScore={gameRuntime?.lastResultCardScore}
        suppressLaneResultHaptic={isLocalLaneResult}
        onInactivityComplete={() => {
          gameRuntime?.dismissInactivityWarning?.();
          router.replace(gameRuntime?.isDrawnCardFlipped ? '/game/lane' : '/game');
        }}
        onChatNotificationPress={() => router.push('/game/chat')}
        onUnreadMessages={handleUnreadMessages}
        onLaneResultComplete={() => {
          setLaneResult(null);
          setLaneResultPlayerName(null);
        }}
        onRoomExitComplete={returnToGameSettings}
        onStealChoice={(accept) => gameRuntime?.handleStealChoice?.(accept)}
        onTurnNoticeComplete={() => setTurnNotices((current) => current.slice(1))}
        stealDecisionVisible={Boolean(gameRuntime?.stealDecisionVisible)}
        turnNotice={turnNotice}
        roomExitReason={gameRuntime?.roomExitReason}
        toastBlocked={Boolean(gameRuntime?.connectionWarningVisible)}
      />
      <ConfirmModal
        cancelLabel={isBs ? 'NAPUSTI IGRU' : 'LEAVE GAME'}
        confirmLabel={isBs ? 'NASTAVI IGRU' : 'KEEP PLAYING'}
        onCancel={() => {
          setIsExitConfirmOpen(false);
          const leaveRequest = gameRuntime?.leaveActiveGame?.();
          returnToGameSettings();
          void Promise.resolve(leaveRequest)
            .catch((error) => console.warn('[LeaveGame] Server leave failed after local exit', error));
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
