import { useGame } from '@/context/GameContext';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

export function InfoModal() {
  const { language, infoModalOpen, setInfoModalOpen } = useGame();
  const isBs = language === 'bs';

  return (
    <Modal
      visible={infoModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setInfoModalOpen(false)}
    >
      <Pressable
        onPress={() => setInfoModalOpen(false)}
        className="flex-1 bg-black/85 items-center justify-center p-4"
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm">
          <View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <Pressable
              onPress={() => setInfoModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-neutral-800"
            >
              <X size={16} color="#a3a3a3" />
            </Pressable>

            <View className="items-center mb-5 pr-5" style={{ gap: 10 }}>
              <View className="flex-row items-center justify-center">
                <Text className="text-center text-[42px] font-black uppercase leading-[44px] tracking-tight text-white">
                  M
                </Text>
                <LottieView
                  autoPlay
                  loop
                  source={MASCOT_LOTTIE}
                  style={{
                    height: 62,
                    marginBottom: -2,
                    marginHorizontal: -4,
                    marginTop: -34,
                    transform: [{ translateY: -2 }, { translateX: 3 }],
                    width: 30,
                  }}
                />
                <Text className="text-center text-[42px] font-black uppercase leading-[44px] tracking-tight text-white">
                  SERY
                  <Text className="text-amber-400"> METER</Text>
                </Text>
              </View>
              <Text className="text-2xl text-neutral-400 text-center leading-7 font-handwritten tracking-[1px] uppercase px-2">
                {isBs
                  ? 'Svako od nas ima lose dane. Dokazi ko prezivljava najgoru patnju.'
                  : 'We all have bad days. Prove who survives the worst misery.'}
              </Text>
            </View>

            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              <View className="space-y-3.5">
                <Text className="text-sm text-neutral-300 leading-6 font-sans">
                  {isBs
                    ? 'Zabavna igra u kojoj procjenjujete blesave, neprijatne ili potpuno bizarne zivotne situacije na skali od 0 (nebitno) do 100 (maksimalna nesreca).'
                    : 'A card game where you rank real-life, painful, funny, or extremely awkward situations on a scale of 0 (meh) to 100 (miserable).'}
                </Text>
                <Text className="text-sm text-neutral-300 leading-6 font-sans">
                  {isBs
                    ? 'Vas cilj je da tacno plasirate novu kartu unutar vaseg postojeceg niza od laksih prema tezim zivotnim situacijama.'
                    : 'Your goal is to accurately place a newly drawn card into your existing sequence of cards sorted from least miserable to most miserable.'}
                </Text>
                <Text className="text-sm text-neutral-300 leading-6 font-sans">
                  {isBs
                    ? 'Prvi igrac koji sakupi trazeni broj ispravno poredanih kartica u svojoj traci proglasava se pobjednikom!'
                    : 'The first player to successfully assemble the target number of correctly arranged cards in their lane wins the game!'}
                </Text>
              </View>
            </ScrollView>

            <Pressable
              onPress={() => setInfoModalOpen(false)}
              className="mt-4 rounded-xl overflow-hidden"
            >
              <LinearGradient colors={['#fbbf24', '#facc15']} className="py-3 items-center">
                <Text className="text-black font-black uppercase text-xs tracking-wider">
                  {isBs ? 'RAZUMIJEM' : 'GOT IT'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
