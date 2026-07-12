import { ImageSourcePropType, Text } from 'react-native';
import { router, Stack, usePathname } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import ChevronLeftIcon from '@expo/material-symbols/chevron_left.xml';
import HelpIcon from '@expo/material-symbols/help.xml';
import { SFSymbol } from 'sf-symbols-typescript';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { InfoModal } from '@/components/InfoModal';

function toolbarIcon(ios: SFSymbol, android: ImageSourcePropType) {
  return process.env.EXPO_OS === 'ios' ? ios : android;
}

export default function TabLayout() {
  const { language, lobbyView, toggleLanguage, setInfoModalOpen, setLobbyView, setLobbyTransitionTarget, setRoomExitWarningOpen } = useGame();
  const isBs = language === 'bs';
  const pathname = usePathname();
  const isPlayScreen = pathname === '/';
  const headerTitle =
    lobbyView === 'WELCOME'
      ? null
      : lobbyView === 'SETUP'
        ? isBs
          ? 'POSTAVKE IGRE'
          : 'GAME SETTINGS'
        : 'LOBBY';

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerBackground: () => null,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitle: headerTitle
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
      {(lobbyView !== 'WELCOME' || !isPlayScreen) && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel={lobbyView === 'SETUP' ? 'Back to welcome' : 'Back to settings'}
            icon={toolbarIcon('chevron.left', ChevronLeftIcon)}
            onPress={() => {
              playSound('click');
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
            playSound('click');
            setInfoModalOpen(true);
          }}
          tintColor="#ffffff"
        />
        <Stack.Toolbar.Button
          accessibilityLabel={language === 'en' ? 'Switch to Bosnian' : 'Switch to English'}
          onPress={() => {
            playSound('click');
            toggleLanguage();
          }}
          tintColor="#fbbf24"
        >
          {language === 'en' ? '🇬🇧' : '🇧🇦'}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <NativeTabs
        disableTransparentOnScrollEdge
        screenListeners={{
          tabPress: () => playSound('click'),
        }}
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
    </>
  );
}
