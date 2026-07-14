import { ImageSourcePropType, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import ChevronLeftIcon from '@expo/material-symbols/chevron_left.xml';
import HelpIcon from '@expo/material-symbols/help.xml';
import VolumeOffIcon from '@expo/material-symbols/volume_off.xml';
import VolumeUpIcon from '@expo/material-symbols/volume_up.xml';
import { SFSymbol } from 'sf-symbols-typescript';
import { useEffect, useState } from 'react';
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
import { CardLogo } from '@/components/GameBoard';
import { CardBackDecoration } from '@/components/CardBackDecoration';

type DebugOverlay = 'right' | 'wrong' | 'yellow' | 'white' | 'steal' | 'other-right' | 'other-wrong' | 'other-steal';

// Keep the debug tools available in source so they can be enabled again later.
const DEBUG_UI_ENABLED = true;

const DEBUG_CARD: Card = {
  id: '1',
  titleEn: 'A Flat Tire in the Middle of a Thunderstorm',
  titleBs: 'Probušena guma usred olujnog nevremena',
  descriptionEn: 'You hear the hiss, pull over, and get drenched while trying to find the jack.',
  descriptionBs: 'Čuješ šištanje, staješ sa strane i skroz pokisneš dok tražiš dizalicu.',
  illustrationType: 'tire',
  image: 'https://misery.qla.dev/card-images/cards/generated/card-1-20260713001450.png',
  index: 6.0,
};

const DEBUG_CARD_WITHOUT_IMAGE: Card = {
  ...DEBUG_CARD,
  id: 'debug-card-without-image',
  image: undefined,
  titleEn: 'A Card Without Connected Artwork',
  titleBs: 'Karta bez povezane ilustracije',
  descriptionEn: 'This card intentionally has no image so the real fallback can be verified.',
  descriptionBs: 'Ova karta namjerno nema sliku kako bi se provjerio pravi zamjenski prikaz.',
};

function toolbarIcon(ios: SFSymbol, android: ImageSourcePropType) {
  return process.env.EXPO_OS === 'ios' ? ios : android;
}

export default function TabLayout() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    language,
    lobbyView,
    musicMuted,
    setInfoModalOpen,
    setLobbyTransitionTarget,
    setLobbyView,
    setMusicMuted,
    setRoomExitWarningOpen,
  } = useGame();
  const isBs = language === 'bs';
  const pathname = usePathname();
  const isPlayScreen = pathname === '/';
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const [debugOverlay, setDebugOverlay] = useState<DebugOverlay | null>(null);
  const [debugCard, setDebugCard] = useState<Card | null>(null);
  const [debugWebCardVisible, setDebugWebCardVisible] = useState(false);
  const [debugCardBackVisible, setDebugCardBackVisible] = useState(false);
  const debugCardWidth = Math.min(width - 32, 420);
  const debugCardHeight = Math.min(
    height - insets.top - insets.bottom - 72,
    debugCardWidth * 1.48,
    680,
  );
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
      if (connected.length === 0) return showDebugCard(DEBUG_CARD_WITHOUT_IMAGE);
      const selected = connected[Math.floor(Math.random() * connected.length)];
      const image = selected.image!;
      const imageUrl = image.startsWith('http://') || image.startsWith('https://')
        ? image
        : image.startsWith('/')
          ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${image}`
          : `${API_BASE_URL.replace(/\/api\/?$/, '')}/storage/${image.replace(/^\/?(?:storage\/)?/, '')}`;
      showDebugCard({
        id: String(selected.id), titleEn: selected.title, titleBs: selected.title_bs || selected.title,
        descriptionEn: selected.subtitle ?? undefined,
        descriptionBs: selected.subtitle_bs || selected.subtitle || undefined,
        illustrationType: 'general_misery', image: imageUrl, index: Number(selected.score),
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
        : 'LOBBY';

  useEffect(() => {
    setLobbyMusicActive(isPlayScreen);
    return () => setLobbyMusicActive(false);
  }, [isPlayScreen]);

  useEffect(() => {
    setGameMusicMuted(musicMuted);
  }, [musicMuted]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerBackground: () => null,
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
        </Stack.Toolbar>
      )}
      {isPlayScreen && lobbyView !== 'WELCOME' && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel={lobbyView === 'SETUP' ? 'Back to welcome' : 'Back to settings'}
            icon={toolbarIcon('chevron.left', ChevronLeftIcon)}
            onPress={() => {
              playHaptic();
              if (lobbyView === 'ROOM_CREATED') {
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

      <NativeTabs
        disableTransparentOnScrollEdge
        screenListeners={{ tabPress: () => playHaptic() }}
        iconColor={{ default: '#737373', selected: '#fbbf24' }}
        labelStyle={{
          default: { color: '#737373', fontSize: 10, fontWeight: '900' },
          selected: { color: '#fbbf24', fontSize: 10, fontWeight: '900' },
        }}
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
      <InfoModal />
      {DEBUG_UI_ENABLED && <ConfirmModal
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
          <ButtonTab category="button" onPress={() => showDebugOverlay('right')} size="100" type="success">
            RIGHT
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('wrong')} size="100" type="danger">
            WRONG
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('yellow')} size="100" type="primary">
            YELLOW
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('white')} size="100" type="third">
            WHITE
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('steal')} size="100" type="primary">
            CARD STOLEN + SCORE
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('other-right')} size="100" type="success">
            OTHER PLAYER — CORRECT
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('other-wrong')} size="100" type="danger">
            OTHER PLAYER — WRONG
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugOverlay('other-steal')} size="100" type="primary">
            OTHER PLAYER — STEAL
          </ButtonTab>
          <ButtonTab category="button" onPress={() => void showRandomConnectedCard()} size="100" type="secondary">
            CARD — IMAGE
          </ButtonTab>
          <ButtonTab category="button" onPress={() => {
            setDebugMenuOpen(false);
            requestAnimationFrame(() => setDebugCardBackVisible(true));
          }} size="100" type="secondary">
            CARD — BACK
          </ButtonTab>
          <ButtonTab category="button" onPress={() => showDebugCard(DEBUG_CARD_WITHOUT_IMAGE)} size="100" type="secondary">
            CARD — DEFAULT IMAGE
          </ButtonTab>
          <ButtonTab category="button" onPress={() => {
            setDebugMenuOpen(false);
            requestAnimationFrame(() => setDebugWebCardVisible(true));
          }} size="100" type="secondary">
            WEB APP CARD
          </ButtonTab>
        </ScrollView>
      </ConfirmModal>}
      {DEBUG_UI_ENABLED && <LaneModal
        failureMessage={debugOverlay === 'other-wrong' ? "ALEX'S GUESS WAS TOO HIGH OR TOO LOW" : 'YOUR GUESS WAS TOO HIGH OR TOO LOW'}
        failureTitle="INCORRECT"
        holding={debugOverlay === 'yellow'}
        neutral={debugOverlay === 'white'}
        onComplete={() => setDebugOverlay(null)}
        laneProgress={debugOverlay === 'other-right' || debugOverlay === 'other-steal'
          ? { label: isBs ? 'TRAKA IGRAČA ALEX' : 'LANE OF ALEX', count: 3, target: 7, addsCard: true }
          : debugOverlay === 'other-wrong'
            ? { label: isBs ? 'TRAKA IGRAČA ALEX' : 'LANE OF ALEX', count: 3, target: 7, addsCard: false }
            : undefined}
        success={debugOverlay !== 'wrong' && debugOverlay !== 'other-wrong'}
        successMessage={debugOverlay === 'yellow'
          ? 'YOUR CARD IS OFFERED TO THE NEXT PLAYER — WAIT FOR THEIR DECISION'
          : debugOverlay === 'white'
            ? 'TAP THE CARD TO PLAY'
            : debugOverlay === 'steal'
              ? 'YOU SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO YOUR LANE'
            : debugOverlay === 'other-steal'
              ? 'ALEX SUCCESSFULLY STOLE THE CARD AND IT WAS ADDED TO THEIR LANE'
            : debugOverlay === 'other-right'
              ? "EVENT ADDED TO ALEX'S LANE"
            : 'EVENT ADDED TO YOUR LANE'}
        successTitle={debugOverlay === 'yellow'
          ? "YOU'RE ON HOLD"
          : debugOverlay === 'white'
            ? 'YOUR TURN STARTED'
            : debugOverlay === 'steal' || debugOverlay === 'other-steal'
              ? 'CARD STOLEN'
            : 'CORRECT'}
        score={debugOverlay === 'steal' || debugOverlay === 'other-steal' ? DEBUG_CARD.index : undefined}
        scoreLabel="MISERY RATE"
        visible={debugOverlay !== null}
        warning={debugOverlay === 'yellow' || debugOverlay === 'steal' || debugOverlay === 'other-steal'}
      />}
      {DEBUG_UI_ENABLED && <Modal
        animationType="slide"
        onRequestClose={() => setDebugCard(null)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={debugCard !== null}
      >
        <View
          className="flex-1 items-center justify-center bg-neutral-950"
          style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 16 }}
        >
          <View style={{ width: debugCardWidth }}>
            <DrawnCardFace
              artworkSize={Math.min(220, debugCardHeight * 0.39)}
              card={debugCard ?? DEBUG_CARD_WITHOUT_IMAGE}
              height={debugCardHeight}
              language={language}
              scoreRevealed
            />
          </View>
          <Pressable
            accessibilityLabel="Close card preview"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              playHaptic();
              setDebugCard(null);
            }}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(64,64,64,0.9)',
              borderRadius: 22,
              height: 44,
              justifyContent: 'center',
              position: 'absolute',
              right: 18,
              top: insets.top + 12,
              width: 44,
            }}
          >
            <X color="#ffffff" size={22} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Modal>}
      {DEBUG_UI_ENABLED && <Modal animationType="slide" onRequestClose={() => setDebugCardBackVisible(false)} presentationStyle="fullScreen" statusBarTranslucent visible={debugCardBackVisible}>
        <View className="flex-1 items-center justify-center bg-neutral-950" style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 16 }}>
          <View style={{ alignItems: 'center', backgroundColor: '#050505', borderColor: '#fbbf24', borderRadius: 16, borderWidth: 6, height: debugCardHeight, justifyContent: 'center', overflow: 'hidden', width: debugCardWidth }}>
            <CardBackDecoration />
            <View style={{ borderColor: 'rgba(251,191,36,0.55)', borderRadius: 10, borderWidth: 2, bottom: 12, left: 12, position: 'absolute', right: 12, top: 12 }} />
            <CardLogo />
            <Text className="absolute bottom-8 left-6 right-6 text-center font-mono text-[10px] font-black uppercase tracking-[3px] text-amber-400/70">TAP CARD TO REVEAL</Text>
          </View>
          <Pressable accessibilityLabel="Close card back preview" accessibilityRole="button" onPress={() => setDebugCardBackVisible(false)} style={{ alignItems: 'center', backgroundColor: 'rgba(64,64,64,0.9)', borderRadius: 22, height: 44, justifyContent: 'center', position: 'absolute', right: 18, top: insets.top + 12, width: 44 }}><X color="#ffffff" size={22} strokeWidth={2.6} /></Pressable>
        </View>
      </Modal>}
      {DEBUG_UI_ENABLED && <Modal
        animationType="slide"
        onRequestClose={() => setDebugWebCardVisible(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={debugWebCardVisible}
      >
        <View
          className="flex-1 items-center justify-center bg-neutral-950"
          style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 16 }}
        >
          <WebAppCard
            card={DEBUG_CARD}
            height={debugCardHeight}
            language={language}
            width={debugCardWidth}
          />
          <Pressable
            accessibilityLabel="Close web app card preview"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              playHaptic();
              setDebugWebCardVisible(false);
            }}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(64,64,64,0.9)',
              borderRadius: 22,
              height: 44,
              justifyContent: 'center',
              position: 'absolute',
              right: 18,
              top: insets.top + 12,
              width: 44,
            }}
          >
            <X color="#ffffff" size={22} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Modal>}
    </>
  );
}
