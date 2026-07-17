import { ImageSourcePropType, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import ChevronLeftIcon from '@expo/material-symbols/chevron_left.xml';
import HelpIcon from '@expo/material-symbols/help.xml';
import VolumeOffIcon from '@expo/material-symbols/volume_off.xml';
import VolumeUpIcon from '@expo/material-symbols/volume_up.xml';
import { SFSymbol } from 'sf-symbols-typescript';
import { memo, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { playHaptic, setGameMusicMuted, setLobbyMusicActive } from '@/lib/sound';
import { InfoModal } from '@/components/InfoModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LaneModal } from '@/components/LaneModal';
import { ButtonTab } from '@/components/ButtonTab';
import { DrawnCardFace } from '@/components/DrawnCardFace';
import { WebAppCard } from '@/components/WebAppCard';
import { Card } from '@/types';
import { X } from 'lucide-react-native';
import { API_BASE_URL, ApiCard } from '@/lib/api';

type DebugOverlay = 'right' | 'wrong' | 'right-no-player' | 'wrong-no-player' | 'yellow' | 'white' | 'steal' | 'other-right' | 'other-wrong' | 'other-steal';
const DEBUG_PLAYER_NAME = 'NEDIM KULASIN';
const SHOW_DEBUG_LOGS_BUTTON = false;

const DEBUG_CARD: Card = {
  id: 'debug-card',
  titleEn: 'A Flat Tire in the Middle of a Thunderstorm',
  titleBs: 'Probušena guma usred olujnog nevremena',
  descriptionEn: 'You hear the hiss, pull over, and get drenched while trying to find the jack.',
  descriptionBs: 'Čuješ šištanje, staješ sa strane i skroz pokisneš dok tražiš dizalicu.',
  illustrationType: 'tire',
  index: 60,
};

function toolbarIcon(ios: SFSymbol, android: ImageSourcePropType) {
  return process.env.EXPO_OS === 'ios' ? ios : android;
}

const MAIN_TAB_SCREEN_LISTENERS = { tabPress: () => playHaptic() };
const MAIN_TAB_ICON_COLOR = { default: '#737373', selected: '#fbbf24' };
const MAIN_TAB_LABEL_STYLE = {
  default: { color: '#737373', fontSize: 10, fontWeight: '900' as const },
  selected: { color: '#fbbf24', fontSize: 10, fontWeight: '900' as const },
};

const MainNativeTabs = memo(function MainNativeTabs({ isBs }: { isBs: boolean }) {
  return (
    <NativeTabs
      disableTransparentOnScrollEdge
      screenListeners={MAIN_TAB_SCREEN_LISTENERS}
      iconColor={MAIN_TAB_ICON_COLOR}
      labelStyle={MAIN_TAB_LABEL_STYLE}
      labelVisibilityMode="labeled"
      tintColor="#fbbf24"
    >
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: '#0a0a0a' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'bolt', selected: 'bolt.fill' } as any} md="bolt" />
        <NativeTabs.Trigger.Label>{isBs ? 'Igra' : 'Play'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rules" contentStyle={{ backgroundColor: '#0a0a0a' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' } as any} md="menu_book" />
        <NativeTabs.Trigger.Label>{isBs ? 'Pravila' : 'Rules'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="about" contentStyle={{ backgroundColor: '#0a0a0a' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'info', selected: 'info.fill' } as any} md="info" />
        <NativeTabs.Trigger.Label>{isBs ? 'O igri' : 'About'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pro" contentStyle={{ backgroundColor: '#0a0a0a' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon sf={{ default: 'crown', selected: 'crown.fill' } as any} md="workspace_premium" />
        <NativeTabs.Trigger.Label>Pro</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
});

export default function TabLayout() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    language,
    lobbyView,
    musicMuted,
    settingsRestored,
    setInfoModalOpen,
    setLobbyTransitionTarget,
    setLobbyView,
    setMusicMuted,
    setRoomExitWarningOpen,
    toggleLanguage,
  } = useGame();
  const isBs = language === 'bs';
  const pathname = usePathname();
  const isPlayScreen = pathname === '/';
  const shouldPlayLobbyMusic = !pathname.startsWith('/game');
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const [debugOverlay, setDebugOverlay] = useState<DebugOverlay | null>(null);
  const [debugCard, setDebugCard] = useState<Card | null>(null);
  const [debugWebCardVisible, setDebugWebCardVisible] = useState(false);
  const debugCardWidth = Math.min(width - 32, 420);
  const debugCardHeight = Math.min(height - insets.top - insets.bottom - 72, debugCardWidth * 1.48, 680);
  const showDebugOverlay = (overlay: DebugOverlay) => {
    setDebugMenuOpen(false);
    requestAnimationFrame(() => setDebugOverlay(overlay));
  };
  const showDebugCard = (card: Card) => {
    setDebugMenuOpen(false);
    requestAnimationFrame(() => setDebugCard(card));
  };
  const showRandomConnectedCard = async () => {
    setDebugMenuOpen(false);
    try {
      const response = await fetch(`${API_BASE_URL}/cards`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Cards request failed (${response.status})`);
      const payload = await response.json();
      const cards = (payload?.data ?? payload) as ApiCard[];
      const connected = cards.filter((card) => card.image && card.image !== '0');
      if (connected.length === 0) return showDebugCard(DEBUG_CARD);
      const selected = connected[Math.floor(Math.random() * connected.length)];
      const image = selected.image!;
      const imageUrl = image.startsWith('http://') || image.startsWith('https://')
        ? image
        : image.startsWith('/')
          ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${image}`
          : `${API_BASE_URL.replace(/\/api\/?$/, '')}/storage/${image.replace(/^\/?(?:storage\/)?/, '')}`;
      showDebugCard({
        id: String(selected.id),
        titleEn: selected.title,
        titleBs: selected.title_bs || selected.title,
        descriptionEn: selected.subtitle ?? undefined,
        descriptionBs: selected.subtitle_bs || selected.subtitle || undefined,
        illustrationType: 'general_misery',
        image: imageUrl,
        index: Number(selected.score),
      });
    } catch (error) {
      console.error('[Debug] Failed to load connected card artwork', error);
      showDebugCard(DEBUG_CARD);
    }
  };
  const headerTitle =
    lobbyView === 'WELCOME'
      ? null
      : lobbyView === 'SETUP'
        ? isBs
          ? 'POSTAVKE IGRE'
          : 'GAME SETTINGS'
        : lobbyView === 'PUBLIC_GAMES'
          ? isBs
            ? 'JAVNE IGRE'
            : 'PUBLIC GAMES'
          : 'LOBBY';

  useEffect(() => {
    if (!settingsRestored) return undefined;
    setGameMusicMuted(musicMuted);
    setLobbyMusicActive(shouldPlayLobbyMusic);
    return () => setLobbyMusicActive(false);
  }, [musicMuted, settingsRestored, shouldPlayLobbyMusic]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerBackground: () => null,
          headerBackVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitle: isPlayScreen && headerTitle
            ? () => (
                <Text
                  style={{
                    color: '#ffffff',
                    fontFamily: 'BebasNeue_400Regular',
                    fontSize: 20,
                    letterSpacing: 2,
                    textAlign: 'left',
                    width: 144,
                  }}
                >
                  {headerTitle}
                </Text>
              )
            : '',
          headerTitleAlign: 'center',
          headerTintColor: '#ffffff',
        }}
      />
      {isPlayScreen && lobbyView === 'WELCOME' && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel={isBs ? 'Promijeni jezik na engleski' : 'Switch language to Bosnian'}
            onPress={() => {
              playHaptic();
              toggleLanguage();
            }}
            separateBackground
            tintColor="#fbbf24"
          >
            {isBs ? '🇧🇦' : '🇬🇧'}
          </Stack.Toolbar.Button>
          {SHOW_DEBUG_LOGS_BUTTON ? (
            <Stack.Toolbar.Button
              accessibilityLabel="Open overlay debug menu"
              onPress={() => {
                playHaptic();
                setDebugMenuOpen(true);
              }}
              separateBackground
              tintColor="#fbbf24"
            >
              LOGS
            </Stack.Toolbar.Button>
          ) : null}
        </Stack.Toolbar>
      )}
      {isPlayScreen && lobbyView !== 'WELCOME' && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel={lobbyView === 'SETUP' ? 'Back to welcome' : 'Back to settings'}
            icon={toolbarIcon('chevron.left', ChevronLeftIcon)}
            onPress={() => {
              playHaptic();
              if (lobbyView === 'ROOM_CREATED' || lobbyView === 'ROOM_JOINED') {
                setRoomExitWarningOpen(true);
                return;
              }
              if (lobbyView === 'SETUP') {
                if (!isPlayScreen) {
                  setLobbyTransitionTarget(null);
                  setLobbyView('WELCOME');
                  router.navigate('/');
                  return;
                }
                setLobbyTransitionTarget('WELCOME');
                return;
              }
              if (lobbyView === 'PUBLIC_GAMES') {
                setLobbyTransitionTarget('SETUP');
                return;
              }
              if (!isPlayScreen) {
                router.navigate('/');
                return;
              }
              setLobbyView('SETUP');
            }}
            tintColor="#ffffff"
          />
        </Stack.Toolbar>
      )}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Instructions"
          icon={toolbarIcon('questionmark.circle.fill', HelpIcon)}
          onPress={() => {
            playHaptic();
            setInfoModalOpen(true);
          }}
          separateBackground={isPlayScreen}
          tintColor="#ffffff"
        />
        {isPlayScreen && (
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
        )}
      </Stack.Toolbar>

      <MainNativeTabs isBs={isBs} />
      <InfoModal />
      <ConfirmModal
        confirmLabel="CLOSE"
        onConfirm={() => setDebugMenuOpen(false)}
        onRequestClose={() => setDebugMenuOpen(false)}
        visible={debugMenuOpen}
      >
        <ScrollView
          contentContainerStyle={{ gap: 10 }}
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: Math.max(280, height - insets.top - insets.bottom - 230) }}
        >
          <Text className="mb-1 text-center text-lg font-black uppercase tracking-wider text-amber-400">
            OVERLAY DEBUG
          </Text>
          <ButtonTab category="button" onPress={() => showDebugOverlay('right')} size="100" type="success">RIGHT — PLAYER ROW</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('wrong')} size="100" type="danger">WRONG — PLAYER ROW</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('right-no-player')} size="100" type="success">RIGHT — NO PLAYER ROW</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('wrong-no-player')} size="100" type="danger">WRONG — NO PLAYER ROW</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('yellow')} size="100" type="primary">YELLOW</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('white')} size="100" type="third">WHITE</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('steal')} size="100" type="primary">CARD STOLEN + SCORE</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('other-right')} size="100" type="success">NEDIM KULASIN — CORRECT</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('other-wrong')} size="100" type="danger">NEDIM KULASIN — WRONG</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('other-steal')} size="100" type="primary">NEDIM KULASIN — STEAL</ButtonTab>
          <ButtonTab category="button" onPress={() => void showRandomConnectedCard()} size="100" type="secondary">CARD — IMAGE</ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugCard(DEBUG_CARD)} size="100" type="secondary">CARD — DEFAULT IMAGE</ButtonTab>
          <ButtonTab
            category="button"
            onPress={() => {
              setDebugMenuOpen(false);
              requestAnimationFrame(() => setDebugWebCardVisible(true));
            }}
            size="100"
            type="secondary"
          >
            WEB APP CARD
          </ButtonTab>
        </ScrollView>
      </ConfirmModal>
      <LaneModal
        failureMessage={`${DEBUG_PLAYER_NAME}'S GUESS WAS TOO HIGH OR TOO LOW`}
        failureTitle="INCORRECT"
        holding={debugOverlay === 'yellow'}
        neutral={debugOverlay === 'white'}
        onComplete={() => setDebugOverlay(null)}
        persistent
        laneProgress={debugOverlay === 'right' || debugOverlay === 'steal'
          ? { label: isBs ? 'STAZA OD' : 'LANE OF', playerName: DEBUG_PLAYER_NAME, count: 3, target: 7, addsCard: true }
          : debugOverlay === 'wrong'
            ? { label: isBs ? 'STAZA OD' : 'LANE OF', playerName: DEBUG_PLAYER_NAME, count: 3, target: 7, addsCard: false }
            : debugOverlay === 'right-no-player'
              ? { label: isBs ? 'STAZA OD' : 'LANE OF', count: 3, target: 7, addsCard: true }
              : debugOverlay === 'wrong-no-player'
                ? { label: isBs ? 'STAZA OD' : 'LANE OF', count: 3, target: 7, addsCard: false }
            : debugOverlay === 'other-right' || debugOverlay === 'other-steal'
              ? { label: isBs ? 'STAZA OD' : 'LANE OF', playerName: DEBUG_PLAYER_NAME, count: 3, target: 7, addsCard: true }
              : debugOverlay === 'other-wrong'
                ? { label: isBs ? 'STAZA OD' : 'LANE OF', playerName: DEBUG_PLAYER_NAME, count: 3, target: 7, addsCard: false }
                : undefined}
        score={debugOverlay === 'right' || debugOverlay === 'wrong' || debugOverlay === 'right-no-player' || debugOverlay === 'wrong-no-player' || debugOverlay === 'steal' || debugOverlay === 'other-right' || debugOverlay === 'other-wrong' || debugOverlay === 'other-steal'
          ? DEBUG_CARD.index
          : undefined}
        success={debugOverlay !== 'wrong' && debugOverlay !== 'wrong-no-player' && debugOverlay !== 'other-wrong'}
        successMessage={debugOverlay === 'yellow'
          ? `${DEBUG_PLAYER_NAME}'S CARD IS OFFERED TO THE NEXT PLAYER — WAIT FOR THEIR DECISION`
          : debugOverlay === 'white'
            ? `${DEBUG_PLAYER_NAME}'S TURN — TAP THE CARD TO PLAY`
            : debugOverlay === 'steal'
              ? `${DEBUG_PLAYER_NAME} SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO THEIR LANE`
              : debugOverlay === 'other-steal'
                ? `${DEBUG_PLAYER_NAME} SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO THEIR LANE`
                : debugOverlay === 'other-right'
                  ? `EVENT ADDED TO ${DEBUG_PLAYER_NAME}'S LANE`
                  : `EVENT ADDED TO ${DEBUG_PLAYER_NAME}'S LANE`}
        successTitle={debugOverlay === 'yellow'
          ? "YOU'RE ON HOLD"
          : debugOverlay === 'white'
            ? 'YOUR TURN STARTED'
            : debugOverlay === 'steal' || debugOverlay === 'other-steal'
              ? 'CARD STOLEN'
              : 'CORRECT'}
        visible={debugOverlay !== null}
        warning={debugOverlay === 'yellow' || debugOverlay === 'steal' || debugOverlay === 'other-steal'}
      />
      <Modal
        animationType="slide"
        onRequestClose={() => setDebugCard(null)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={debugCard !== null}
      >
        <View className="flex-1 items-center justify-center bg-neutral-950" style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 16 }}>
          <View style={{ width: debugCardWidth }}>
            <DrawnCardFace card={debugCard ?? DEBUG_CARD} height={debugCardHeight} language={language} scoreRevealed />
          </View>
          <Pressable
            accessibilityLabel="Close card preview"
            accessibilityRole="button"
            onPress={() => setDebugCard(null)}
            style={{ alignItems: 'center', backgroundColor: 'rgba(64,64,64,0.9)', borderRadius: 22, height: 44, justifyContent: 'center', position: 'absolute', right: 18, top: insets.top + 12, width: 44 }}
          >
            <X color="#ffffff" size={22} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        onRequestClose={() => setDebugWebCardVisible(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={debugWebCardVisible}
      >
        <View className="flex-1 items-center justify-center bg-neutral-950" style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 16 }}>
          <WebAppCard card={DEBUG_CARD} height={debugCardHeight} language={language} width={debugCardWidth} />
          <Pressable
            accessibilityLabel="Close web app card preview"
            accessibilityRole="button"
            onPress={() => setDebugWebCardVisible(false)}
            style={{ alignItems: 'center', backgroundColor: 'rgba(64,64,64,0.9)', borderRadius: 22, height: 44, justifyContent: 'center', position: 'absolute', right: 18, top: insets.top + 12, width: 44 }}
          >
            <X color="#ffffff" size={22} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
