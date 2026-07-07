import { ImageSourcePropType } from 'react-native';
import { Stack } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import ChevronLeftIcon from '@expo/material-symbols/chevron_left.xml';
import HelpIcon from '@expo/material-symbols/help.xml';
import { SFSymbol } from 'sf-symbols-typescript';
import { useGame } from '@/context/GameContext';

function toolbarIcon(ios: SFSymbol, android: ImageSourcePropType) {
  return process.env.EXPO_OS === 'ios' ? ios : android;
}

export default function TabLayout() {
  const { language, lobbyView, toggleLanguage, setInfoModalOpen, setLobbyView } = useGame();
  const isBs = language === 'bs';

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerTitle: '',
          headerTintColor: '#ffffff',
        }}
      />
      {lobbyView !== 'WELCOME' && (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button
            accessibilityLabel="Back to welcome"
            icon={toolbarIcon('chevron.left', ChevronLeftIcon)}
            onPress={() => setLobbyView('WELCOME')}
            tintColor="#ffffff"
          />
        </Stack.Toolbar>
      )}
      <Stack.Toolbar placement="right">
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

      <NativeTabs
        disableTransparentOnScrollEdge
        iconColor={{ default: '#737373', selected: '#fbbf24' }}
        labelStyle={{
          default: { color: '#737373', fontSize: 10, fontWeight: '900' },
          selected: { color: '#fbbf24', fontSize: 10, fontWeight: '900' },
        }}
        labelVisibilityMode="labeled"
        tintColor="#fbbf24"
      >
        <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: '#0a0a0a' }} disableTransparentOnScrollEdge>
          <NativeTabs.Trigger.Icon sf={{ default: 'suit.spade', selected: 'suit.spade.fill' } as any} md="casino" />
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
      </NativeTabs>
    </>
  );
}
