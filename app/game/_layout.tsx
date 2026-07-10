import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useGame } from '@/context/GameContext';

export default function GameTabsLayout() {
  const { language } = useGame();
  const isBs = language === 'bs';

  return (
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
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: '#0a0a0a' }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'bolt', selected: 'bolt.fill' } as any} md="bolt" />
        <NativeTabs.Trigger.Label>{isBs ? 'Igra' : 'Game'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lane" contentStyle={{ backgroundColor: '#0a0a0a' }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' } as any} md="view_agenda" />
        <NativeTabs.Trigger.Label>{isBs ? 'Traka bijede' : 'Misery Lane'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history" contentStyle={{ backgroundColor: '#0a0a0a' }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'clock.arrow.circlepath', selected: 'clock.arrow.circlepath' } as any} md="history" />
        <NativeTabs.Trigger.Label>{isBs ? 'Historija' : 'History'}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
