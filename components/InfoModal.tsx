import { useGame } from '@/context/GameContext';
import { X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

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
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-800"
            >
              <X size={16} color="#a3a3a3" />
            </Pressable>

            <View className="flex-row items-center gap-2.5 mb-4">
              <View className="p-2 bg-amber-400/10 rounded-xl border border-amber-400/20">
                <Text className="text-amber-400 font-black text-lg">?</Text>
              </View>
              <Text className="font-sans font-black text-amber-400 uppercase text-sm tracking-wide">
                {isBs ? 'ŠTA JE MJERAČ BIJEDE?' : 'WHAT IS MISERY METER?'}
              </Text>
            </View>

            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              <View className="space-y-3.5">
                <Text className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {isBs
                    ? 'Zabavna igra u kojoj procjenjujete blesave, neprijatne ili potpuno bizarne životne situacije na skali od 0 (nebitno) do 100 (maksimalna nesreća).'
                    : 'A card game where you rank real-life, painful, funny, or extremely awkward situations on a scale of 0 (meh) to 100 (miserable).'}
                </Text>
                <Text className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {isBs
                    ? 'Vaš cilj je da tačno plasirate novu kartu unutar vašeg postojećeg niza od lakših prema težim životnim situacijama (indeks bijede).'
                    : 'Your goal is to accurately place a newly drawn card into your existing sequence of cards sorted from least miserable to most miserable.'}
                </Text>
                <Text className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {isBs
                    ? 'Prvi igrač koji sakupi traženi broj ispravno poređanih kartica u svojoj traci proglašava se pobjednikom!'
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
