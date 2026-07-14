import { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { View } from 'react-native';
import { useGame } from '@/context/GameContext';

export default function RoomDeepLinkScreen() {
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();
  const { setEnteredCode, setLobbyView, setPendingDeepLinkCode, setSetupTab } = useGame();

  useEffect(() => {
    const rawCode = Array.isArray(code) ? code[0] : code;
    const cleanCode = (rawCode ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (cleanCode) {
      setEnteredCode(cleanCode);
      setPendingDeepLinkCode(cleanCode);
      setSetupTab('JOIN');
      setLobbyView('SETUP');
    }
    router.replace('/');
  }, [code, setEnteredCode, setLobbyView, setPendingDeepLinkCode, setSetupTab]);

  return <View className="flex-1 bg-neutral-950" />;
}
