import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/context/GameContext';
import ManSilhouette from '@/components/ManSilhouette';

export default function AboutScreen() {
  const { language } = useGame();
  const isBs = language === 'bs';

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 100, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#fcd34d', '#facc15', '#fbbf24']} className="w-24 h-24 rounded-2xl items-center justify-center border-2 border-white/20 mb-5">
        <ManSilhouette width={64} height={64} color="#0a0a0a" />
      </LinearGradient>
      <Text className="text-3xl font-black uppercase tracking-tight text-center">
        THE <Text className="text-amber-400">MISERY</Text> INDEX
      </Text>
      <Text className="text-[10px] text-neutral-500 uppercase tracking-widest mt-2.5 font-mono">
        {isBs ? 'KARTIČNA IGRA • ZERO TO MISERABLE' : 'CARD GAME • ZERO TO MISERABLE'}
      </Text>

      <View className="mt-8 space-y-4 w-full">
        <View className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-900">
          <Text className="text-xs text-neutral-300 leading-relaxed">
            {isBs
              ? 'Zabavna igra u kojoj procjenjujete blesave, neprijatne ili potpuno bizarne životne situacije na skali od 0 (nebitno) do 100 (maksimalna nesreća).'
              : 'A card game where you rank real-life, painful, funny, or extremely awkward situations on a scale of 0 (meh) to 100 (miserable).'}
          </Text>
        </View>
        <View className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-900">
          <Text className="text-xs text-neutral-300 leading-relaxed">
            {isBs
              ? 'Vaš cilj je da tačno plasirate novu kartu unutar vašeg postojećeg niza od lakših prema težim životnim situacijama (indeks bijede).'
              : 'Your goal is to accurately place a newly drawn card into your existing sequence of cards sorted from least miserable to most miserable.'}
          </Text>
        </View>
      </View>

      <View className="mt-10 items-center">
        <Text className="text-[10px] text-neutral-600 font-mono">© 2026 The Misery Index Clone</Text>
        <Text className="text-[10px] text-neutral-600 font-mono opacity-80">
          {isBs ? 'Simulirani mrežni kod • Potpuno klijentska simulacija' : 'Simulated netplay • Zero servers required'}
        </Text>
      </View>
    </ScrollView>
  );
}
