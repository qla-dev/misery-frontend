import { Linking, Pressable, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { Card } from '@/components/Card';

const MASCOT_LOTTIE = require('../../assets/animations/mascot_lottie.json');
const PRIVACY_URL = 'https://misery.qla.dev/privacy';
const TERMS_URL = 'https://misery.qla.dev/terms';
const COOKIES_URL = 'https://misery.qla.dev/cookies';
const PRODUCER_URL = 'https://qla.dev';

export default function AboutScreen() {
  const { language } = useGame();
  const isBs = language === 'bs';
  const cards = [
    {
      bs: 'Zabavna igra u kojoj procjenjujete blesave, neprijatne ili potpuno bizarne životne situacije na skali od 0 (nebitno) do 100 (maksimalna nesreća).',
      en: 'A card game where you rank real-life, painful, funny, or extremely awkward situations on a scale of 0 (meh) to 100 (miserable).',
    },
    {
      bs: 'Vaš cilj je da tačno plasirate novu kartu unutar vašeg postojećeg niza od lakših prema težim životnim situacijama.',
      en: 'Your goal is to accurately place a newly drawn card into your existing sequence of cards sorted from least miserable to most miserable.',
    },
  ];

  const handleOpenUrl = (url: string) => {
    playSound('click');
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View className="flex-1 justify-center bg-neutral-950 px-5">
      <View className="items-center">
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
        <Text className="text-2xl text-neutral-400 text-center leading-7 font-handwritten tracking-[1px] uppercase">
          {isBs
            ? 'Svako od nas ima loše dane. Dokaži ko preživljava najgoru patnju.'
            : 'We all have bad days. Prove who survives the worst misery.'}
        </Text>
      </View>

      <View className="w-full" style={{ gap: 16, marginTop: 10 }}>
        {cards.map((card) => (
          <Card key={card.en} body={isBs ? card.bs : card.en} />
        ))}
      </View>

      <View className="mt-10 w-full items-center" style={{ gap: 25 }}>
        <View className="items-center" style={{ gap: 4 }}>
          <Text className="text-[10px] text-neutral-600 font-mono">© 2026 Misery Meter</Text>
          <Text className="text-[10px] text-neutral-600 font-mono opacity-80">
            {isBs ? 'Serveri aktivni • Multiplayer mode' : 'Servers active • Multiplayer mode'}
          </Text>
        </View>

        <View
          className="flex-row flex-wrap items-center justify-center"
          style={{ columnGap: 8, rowGap: 4 }}
        >
          <Pressable
            accessibilityLabel={isBs ? 'Otvori politiku privatnosti' : 'Open privacy policy'}
            accessibilityRole="link"
            hitSlop={10}
            onPress={() => handleOpenUrl(PRIVACY_URL)}
          >
            <Text className="text-[10px] font-extrabold text-neutral-500">
              {isBs ? 'Politika privatnosti' : 'Privacy Policy'}
            </Text>
          </Pressable>
          <Text className="text-[10px] font-black text-neutral-700">•</Text>
          <Pressable
            accessibilityLabel={isBs ? 'Otvori uslove korištenja' : 'Open terms of use'}
            accessibilityRole="link"
            hitSlop={10}
            onPress={() => handleOpenUrl(TERMS_URL)}
          >
            <Text className="text-[10px] font-extrabold text-neutral-500">
              {isBs ? 'Uslovi korištenja' : 'Terms of Use'}
            </Text>
          </Pressable>
          <Text className="text-[10px] font-black text-neutral-700">•</Text>
          <Pressable
            accessibilityLabel={isBs ? 'Otvori politiku kolačića' : 'Open cookie policy'}
            accessibilityRole="link"
            hitSlop={10}
            onPress={() => handleOpenUrl(COOKIES_URL)}
          >
            <Text className="text-[10px] font-extrabold text-neutral-500">
              {isBs ? 'Kolačići' : 'Cookies'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityLabel="Open qla.dev"
          accessibilityRole="link"
          className="items-center"
          hitSlop={10}
          onPress={() => handleOpenUrl(PRODUCER_URL)}
        >
          <Text className="mb-0.5 text-[10px] font-semibold leading-3 text-neutral-500">from</Text>
          <Text style={{ fontFamily: 'FacebookSansBold', fontSize: 16, lineHeight: 18 }}>
            <Text className="text-white">qla</Text>
            <Text style={{ color: '#0195F5' }}>.dev</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
