import { useGame } from '@/context/GameContext';
import LottieView from 'lottie-react-native';
import { Modal, ScrollView, Text, View } from 'react-native';
import { playSound } from '@/lib/sound';
import { ButtonTab } from './ButtonTab';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

export function InfoModal() {
  const { language, infoModalOpen, setInfoModalOpen } = useGame();
  const isBs = language === 'bs';

  const handleAcknowledge = () => {
    playSound('click');
    setInfoModalOpen(false);
  };

  return (
    <Modal
      visible={infoModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setInfoModalOpen(false)}
    >
      <View className="flex-1 bg-black/85 items-center justify-center p-4">
        <View className="w-full max-w-sm">
          <View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
            <View className="items-center mb-5" style={{ gap: 10 }}>
              <View className="items-center">
                <View className="flex-row items-center justify-center">
                  <Text className="text-center text-[42px] font-black uppercase leading-[44px] tracking-tight text-amber-400">
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
                  <Text className="text-center text-[42px] font-black uppercase leading-[44px] tracking-tight text-amber-400">
                    SERY
                  </Text>
                </View>
                <Text
                  className="text-center text-[42px] font-black uppercase leading-[44px] tracking-tight text-white"
                  style={{ marginTop: -10 }}
                >
                  METER
                </Text>
              </View>
              <Text className="text-2xl text-neutral-400 text-center leading-7 font-handwritten tracking-[1px] uppercase px-2">
                {isBs
                  ? 'Svako od nas ima loše dane. Dokaži ko preživljava najgoru patnju.'
                  : 'We all have bad days. Prove who survives the worst misery.'}
              </Text>
            </View>

            <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                <Text className="text-sm text-neutral-300 leading-6 font-sans">
                  {isBs
                    ? 'Zabavna igra u kojoj procjenjujete blesave, neprijatne ili potpuno bizarne životne situacije na skali od 0 (nebitno) do 100 (maksimalna nesreća).'
                    : 'A card game where you rank real-life, painful, funny, or extremely awkward situations on a scale of 0 (meh) to 100 (miserable).'}
                </Text>
                <Text className="text-sm text-neutral-300 leading-6 font-sans">
                  {isBs
                    ? 'Vaš cilj je da tačno plasirate novu kartu unutar vašeg postojećeg niza od lakših prema težim životnim situacijama.'
                    : 'Your goal is to accurately place a newly drawn card into your existing sequence of cards sorted from least miserable to most miserable.'}
                </Text>
                <Text className="text-sm text-neutral-300 leading-6 font-sans">
                  {isBs
                    ? 'Prvi igrač koji sakupi traženi broj ispravno poredanih kartica u svojoj traci proglašava se pobjednikom!'
                    : 'The first player to successfully assemble the target number of correctly arranged cards in their lane wins the game!'}
                </Text>
              </View>
            </ScrollView>

            <View className="mt-4">
              <ButtonTab
                category="button"
                type="primary"
                size="100"
                onPress={handleAcknowledge}
              >
                {isBs ? 'RAZUMIJEM' : 'GOT IT'}
              </ButtonTab>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
