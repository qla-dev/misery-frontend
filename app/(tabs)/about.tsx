import { ScrollView, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useGame } from '@/context/GameContext';

const MASCOT_LOTTIE = require('../../assets/animations/mascot_lottie.json');

export default function AboutScreen() {
  const { language } = useGame();
  const isBs = language === 'bs';

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 100, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center" style={{ gap: 10 }}>
        <View className="items-center">
          <View className="flex-row items-center justify-center">
            <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-amber-400">
              M
            </Text>
            <LottieView
              autoPlay
              loop
              source={MASCOT_LOTTIE}
              style={{
                height: 95,
                marginBottom: -4,
                marginHorizontal: -4,
                marginTop: -52,
                transform: [{ translateY: -5 }, { translateX: 5 }],
                width: 44,
              }}
            />
            <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-amber-400">
              SERY
            </Text>
          </View>
          <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-white" style={{ marginTop: -16 }}>
            METER
          </Text>
        </View>
        <Text className="text-2xl text-neutral-400 text-center leading-7 font-handwritten tracking-[1px] uppercase px-2">
          {isBs
            ? 'Svako od nas ima lose dane. Dokazi ko prezivljava najgoru patnju.'
            : 'We all have bad days. Prove who survives the worst misery.'}
        </Text>
      </View>

      <View className="mt-8 space-y-4 w-full">
        <View className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-900">
          <Text className="text-sm text-neutral-300 leading-6">
            {isBs
              ? 'Zabavna igra u kojoj procjenjujete blesave, neprijatne ili potpuno bizarne zivotne situacije na skali od 0 (nebitno) do 100 (maksimalna nesreca).'
              : 'A card game where you rank real-life, painful, funny, or extremely awkward situations on a scale of 0 (meh) to 100 (miserable).'}
          </Text>
        </View>
        <View className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-900">
          <Text className="text-sm text-neutral-300 leading-6">
            {isBs
              ? 'Vas cilj je da tacno plasirate novu kartu unutar vaseg postojeceg niza od laksih prema tezim zivotnim situacijama.'
              : 'Your goal is to accurately place a newly drawn card into your existing sequence of cards sorted from least miserable to most miserable.'}
          </Text>
        </View>
      </View>

      <View className="mt-10 items-center">
        <Text className="text-[10px] text-neutral-600 font-mono">© 2026 Misery Meter</Text>
        <Text className="text-[10px] text-neutral-600 font-mono opacity-80">
          {isBs ? 'Simulirani mrezni kod • Potpuno klijentska simulacija' : 'Simulated netplay • Zero servers required'}
        </Text>
      </View>
    </ScrollView>
  );
}
