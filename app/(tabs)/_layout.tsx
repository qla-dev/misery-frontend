import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import { useGame } from '@/context/GameContext';

export default function TabLayout() {
  const { language, toggleLanguage, setInfoModalOpen, setLobbyView } = useGame();
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
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          onPress={() => setLobbyView('WELCOME')}
          tintColor="#ffffff"
        >
          ←
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          onPress={() => setInfoModalOpen(true)}
          tintColor="#ffffff"
        >
          ℹ️
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Button onPress={toggleLanguage} tintColor="#fbbf24">
          {language === 'en' ? 'EN 🇺🇸' : 'BS 🇧🇦'}
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
