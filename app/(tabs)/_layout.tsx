import { ImageSourcePropType, Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import ChevronLeftIcon from '@expo/material-symbols/chevron_left.xml';
import HelpIcon from '@expo/material-symbols/help.xml';
import VolumeOffIcon from '@expo/material-symbols/volume_off.xml';
import VolumeUpIcon from '@expo/material-symbols/volume_up.xml';
import { SFSymbol } from 'sf-symbols-typescript';
import { useEffect, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { playHaptic, setGameMusicMuted, setLobbyMusicActive } from '@/lib/sound';
import { InfoModal } from '@/components/InfoModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LaneModal } from '@/components/LaneModal';
import { ButtonTab } from '@/components/ButtonTab';
import CardItem from '@/components/CardItem';
import { Card } from '@/types';
import { X } from 'lucide-react-native';

type DebugOverlay = 'right' | 'wrong' | 'yellow' | 'white';

const DEBUG_CARD: Card = {
  id: '1',
  titleEn: 'Miss the bus',
  titleBs: 'Miss the bus',
  descriptionEn: 'You watch it pull away just as you reach the stop.',
  descriptionBs: 'You watch it pull away just as you reach the stop.',
  illustrationType: 'general_misery',
  image: 'https://misery.qla.dev/card-images/cards/generated/card-1-20260713001450.png',
  index: 3.7,
};

function toolbarIcon(ios: SFSymbol, android: ImageSourcePropType) {
  return process.env.EXPO_OS === 'ios' ? ios : android;
}

export default function TabLayout() {
  const { height } = useWindowDimensions();
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
  const [debugCardOpen, setDebugCardOpen] = useState(false);
  const showDebugOverlay = (overlay: DebugOverlay) => {
    setDebugMenuOpen(false);
    requestAnimationFrame(() => setDebugOverlay(overlay));
  };
  const showDebugCard = () => {
    setDebugMenuOpen(false);
    requestAnimationFrame(() => setDebugCardOpen(true));
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
            DEBUG
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
      <ConfirmModal
        confirmLabel="CLOSE"
        onConfirm={() => setDebugMenuOpen(false)}
        onRequestClose={() => setDebugMenuOpen(false)}
        visible={debugMenuOpen}
      >
        <View style={{ gap: 10 }}>
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
          <ButtonTab category="button" onPress={showDebugCard} size="100" type="secondary">
            CARD
          </ButtonTab>
        </View>
      </ConfirmModal>
      <LaneModal
        failureMessage="TOO HIGH OR TOO LOW"
        failureTitle="INCORRECT"
        holding={debugOverlay === 'yellow'}
        neutral={debugOverlay === 'white'}
        onComplete={() => setDebugOverlay(null)}
        persistent
        success={debugOverlay !== 'wrong'}
        successMessage={debugOverlay === 'yellow'
          ? 'YOUR CARD IS OFFERED TO THE NEXT PLAYER — WAIT FOR THEIR DECISION'
          : debugOverlay === 'white'
            ? 'TAP THE CARD TO PLAY'
            : 'EVENT ADDED TO YOUR LANE'}
        successTitle={debugOverlay === 'yellow'
          ? "YOU'RE ON HOLD"
          : debugOverlay === 'white'
            ? 'YOUR TURN STARTED'
            : 'CORRECT'}
        visible={debugOverlay !== null}
        warning={debugOverlay === 'yellow'}
      />
      <Modal
        animationType="slide"
        onRequestClose={() => setDebugCardOpen(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={debugCardOpen}
      >
        <View className="flex-1 items-center justify-center bg-neutral-950 px-4 py-12">
          <View style={{ maxWidth: 460, width: '100%' }}>
            <CardItem
              card={DEBUG_CARD}
              fluidHeight={Math.min(Math.max(height - 112, 480), 720)}
              language={language}
              size="xl"
              state="face-up"
            />
          </View>
          <Pressable
            accessibilityLabel="Close card preview"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              playHaptic();
              setDebugCardOpen(false);
            }}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(64,64,64,0.9)',
              borderRadius: 22,
              height: 44,
              justifyContent: 'center',
              position: 'absolute',
              right: 18,
              top: 54,
              width: 44,
            }}
          >
            <X color="#ffffff" size={22} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
