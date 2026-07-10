import { useGame } from '@/context/GameContext';
import { ScrollView, Text, View } from 'react-native';

export default function HistoryScreen() {
  const { gameRuntime, language } = useGame();
  const isBs = language === 'bs';
  const history = gameRuntime?.guessHistory ?? [];

  return (
    <ScrollView
      className="flex-1 bg-neutral-950 px-5"
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 104 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-base font-black uppercase tracking-widest text-amber-400">
        {isBs ? 'HISTORIJA' : 'HISTORY'}
      </Text>
      {history.length === 0 ? (
        <Text className="mt-3 text-sm text-neutral-500">{isBs ? 'Još nema odigranih poteza.' : 'No moves played yet.'}</Text>
      ) : (
        <View className="mt-5" style={{ gap: 12 }}>
          {history.map((entry: any, index: number) => (
            <View key={`${entry.playerName}-${index}`} className="flex-row gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
              <View className={`mt-1 h-3 w-3 rounded-full ${entry.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <Text className="flex-1 text-sm leading-6 text-neutral-300">
                <Text className="font-black text-white">{entry.playerName}</Text>{' '}
                {isBs ? 'je odigrao/la' : 'played'}{' '}
                <Text className="font-bold text-amber-400">{entry.cardTitle}</Text> —{' '}
                <Text className={entry.success ? 'font-black text-emerald-400' : 'font-black text-red-400'}>
                  {entry.success ? (isBs ? 'TAČNO' : 'CORRECT') : isBs ? 'NETAČNO' : 'WRONG'}
                </Text>
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
