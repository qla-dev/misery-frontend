import { LoadingState } from '@/components/LoadingState';
import { Card } from '@/components/Card';
import { useGame } from '@/context/GameContext';
import { ScrollView, Text, View } from 'react-native';
import { TabFadeView } from '@/components/TabFadeView';

const PLAYER_COLORS: Record<string, string> = {
  yellow: '#facc15', blue: '#60a5fa', emerald: '#10b981', purple: '#c084fc',
  rose: '#ef4444', red: '#ef4444', orange: '#f97316', brown: '#8B5A2B',
  silver: '#d4d4d4', neutral: '#d4d4d4',
};

function playerColor(value?: string) {
  if (!value) return '#facc15';
  const key = Object.keys(PLAYER_COLORS).find((candidate) => value.toLowerCase().includes(candidate.toLowerCase()));
  return key ? PLAYER_COLORS[key] : value.startsWith('#') ? value : '#facc15';
}

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
        {history.map((entry: any, index: number) => {
          const player = gameRuntime?.players?.find((candidate: any) => candidate.name === entry.playerName);
          return (
          <Card key={`${entry.playerName}-${index}`}>
            <View className="flex-row items-center gap-3">
              <View
                className="h-3 w-3 rounded-full border border-white/20"
                style={{ backgroundColor: playerColor(player?.color) }}
              />
              <Text className="flex-1 text-sm leading-6 text-neutral-300">
                <Text className="font-black text-white">{entry.playerName}</Text>{' '}
                {isBs ? 'je odigrao/la' : 'played'}{' '}
                <Text className="font-bold text-amber-400">{entry.cardTitle}</Text> —{' '}
                <Text className={entry.success ? 'font-black text-emerald-400' : 'font-black text-red-400'}>
                  {entry.success ? (isBs ? 'TAČNO' : 'CORRECT') : isBs ? 'NETAČNO' : 'WRONG'}
                </Text>
              </Text>
              {typeof entry.cardScore === 'number' && (
                <View className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5">
                  <Text className="font-mono text-xs font-black text-amber-400">{entry.cardScore.toFixed(2)}</Text>
                </View>
              )}
            </View>
          </Card>
          );
        })}
      </View>
    </ScrollView></TabFadeView>
  );
}
