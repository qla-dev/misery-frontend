import { LoadingState } from '@/components/LoadingState';
import { Card } from '@/components/Card';
import { useGame } from '@/context/GameContext';
import { ScrollView, Text, View } from 'react-native';
import { TabFadeView } from '@/components/TabFadeView';

export default function HistoryScreen() {
  const { gameRuntime, language } = useGame();
  const isBs = language === 'bs';
  const history = gameRuntime?.guessHistory ?? [];

  if (history.length === 0) {
    return (
      <TabFadeView><View className="flex-1 bg-neutral-950 px-5 pb-24 pt-[104px]">
        <LoadingState message={isBs ? 'JOŠ NEMA ODIGRANIH POTEZA' : 'NO MOVES PLAYED YET'} />
      </View></TabFadeView>
    );
  }

  return (
    <TabFadeView><ScrollView
      className="flex-1 bg-neutral-950 px-5"
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 104 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 12 }}>
        {history.map((entry: any, index: number) => (
          <Card key={`${entry.playerName}-${index}`}>
            <View className="flex-row gap-3">
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
          </Card>
        ))}
      </View>
    </ScrollView></TabFadeView>
  );
}
