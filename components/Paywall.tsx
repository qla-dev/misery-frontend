import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown, Flame, Sparkles, Trophy, Zap } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { Card } from './Card';

type Plan = 'monthly' | 'yearly';
const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

const FEATURES = [
  { icon: Flame, en: 'Unlock the Spicy deck', bs: 'Otključaj Ljuti špil', detailEn: 'Extreme and bizarre misery cards.', detailBs: 'Ekstremne i bizarne karte nesreće.' },
  { icon: Sparkles, en: 'Every premium pack', bs: 'Svi premium špilovi', detailEn: 'New themed packs as they arrive.', detailBs: 'Novi tematski špilovi čim stignu.' },
  { icon: Trophy, en: 'Exclusive game content', bs: 'Ekskluzivni sadržaj', detailEn: 'More ways to make game night miserable.', detailBs: 'Još više načina za nesretnu noć igre.' },
  { icon: Zap, en: 'Future Pro features', bs: 'Buduće Pro mogućnosti', detailEn: 'All upcoming Pro additions included.', detailBs: 'Sve buduće Pro funkcije su uključene.' },
];

export function Paywall() {
  const { activatePremium, isPremium, language } = useGame();
  const [activating, setActivating] = useState(false);
  const [plan, setPlan] = useState<Plan>('yearly');
  const isBs = language === 'bs';

  const choosePlan = (next: Plan) => {
    if (next !== plan) playSound('click');
    setPlan(next);
  };

  const activate = async () => {
    if (isPremium || activating) return;
    playSound('click');
    setActivating(true);
    try { await activatePremium(); } finally { setActivating(false); }
  };

  return (
    <View className="flex-1 bg-neutral-950">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130, paddingHorizontal: 20, paddingTop: 104 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <View className="items-center">
            <View className="flex-row items-center justify-center">
              <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-amber-400">M</Text>
              <LottieView
                autoPlay
                loop
                source={MASCOT_LOTTIE}
                style={{ height: 95, marginBottom: -4, marginHorizontal: -4, marginTop: -52, transform: [{ translateY: -5 }, { translateX: 5 }], width: 44 }}
              />
              <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-amber-400">SERY</Text>
            </View>
            <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-white" style={{ marginTop: -16 }}>PRO</Text>
          </View>
          <Text
            className="px-2 text-center text-2xl font-handwritten uppercase leading-7 tracking-[1px] text-neutral-400"
            style={{ paddingBottom: 24, paddingTop: 0 }}
          >
            {isBs ? 'Više karata. Više bijede. ' : 'More cards. More misery. '}
            <Text className="text-amber-400">{isBs ? 'Odaberi ponudu.' : 'Choose your offer.'}</Text>
          </Text>
          <LinearGradient
            colors={['rgba(251,191,36,0.28)', 'rgba(10,10,10,0.15)', 'rgba(251,191,36,0.08)']}
            style={{ display: 'none' }}
          />
          <View className="hidden">
            <View className="h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-400">
              <Crown color="#0a0a0a" size={32} strokeWidth={2.6} />
            </View>
            <View className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-2">
              <Text className="text-[10px] font-black uppercase tracking-[2px] text-amber-300">
                {isPremium ? 'PRO ACTIVE' : 'MISERY PRO'}
              </Text>
            </View>
          </View>
          <Text className="hidden">
            {isBs ? 'VIŠE KARATA.\nVIŠE BIJEDE.' : 'MORE CARDS.\nMORE MISERY.'}
          </Text>
          <Text className="hidden">
            {isBs
              ? 'Otključaj punu verziju igre, premium špilove i sav budući Pro sadržaj.'
              : 'Unlock the full game, premium card packs, and every future Pro addition.'}
          </Text>
        </View>

        <Text className="hidden">
          {isBs ? 'ODABERI PONUDU' : 'CHOOSE YOUR OFFER'}
        </Text>

        <View className="flex-row" style={{ gap: 10 }}>
          <Pressable
            className={`relative flex-1 overflow-hidden rounded-2xl border-2 ${plan === 'monthly' ? 'border-amber-400' : 'border-neutral-800'}`}
            onPress={() => choosePlan('monthly')}
          >
            <Card transparent>
            <View className={`mb-4 h-5 w-5 items-center justify-center rounded-full border-2 ${plan === 'monthly' ? 'border-amber-400' : 'border-neutral-600'}`}>
              {plan === 'monthly' && <View className="h-2 w-2 rounded-full bg-amber-400" />}
            </View>
            <Text className="text-xs font-black uppercase tracking-wider text-white">{isBs ? 'MJESEČNO' : 'MONTHLY'}</Text>
            <Text className="mt-3 text-2xl font-black text-amber-400">€3.99</Text>
            <Text className="mt-1 text-[10px] font-bold text-neutral-500">{isBs ? 'svaki mjesec' : 'per month'}</Text>
            <Text className="mt-4 text-[10px] leading-4 text-neutral-400">{isBs ? 'Fleksibilno. Otkaži bilo kada.' : 'Flexible. Cancel anytime.'}</Text>
            </Card>
          </Pressable>

          <Pressable
            className={`relative flex-1 overflow-hidden rounded-2xl border-2 ${plan === 'yearly' ? 'border-amber-400' : 'border-neutral-800'}`}
            onPress={() => choosePlan('yearly')}
          >
            <Card transparent>
            <View className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-1">
              <Text className="text-[8px] font-black uppercase text-black">{isBs ? 'UŠTEDI 27%' : 'SAVE 27%'}</Text>
            </View>
            <View className={`mb-4 h-5 w-5 items-center justify-center rounded-full border-2 ${plan === 'yearly' ? 'border-amber-400' : 'border-neutral-600'}`}>
              {plan === 'yearly' && <View className="h-2 w-2 rounded-full bg-amber-400" />}
            </View>
            <Text className="text-xs font-black uppercase tracking-wider text-white">{isBs ? 'GODIŠNJE' : 'YEARLY'}</Text>
            <Text className="mt-3 text-2xl font-black text-amber-400">€34.99</Text>
            <Text className="mt-1 text-[10px] font-bold text-neutral-500 line-through">€47.88</Text>
            <Text className="mt-4 text-[10px] leading-4 text-neutral-400">{isBs ? 'Najbolja vrijednost.' : 'Best value. One payment.'}</Text>
            </Card>
          </Pressable>
        </View>

        <Pressable
          className="mt-4 w-full overflow-hidden rounded-2xl"
          disabled={isPremium || activating}
          onPress={activate}
          style={{ alignSelf: 'stretch', width: '100%' }}
        >
          <LinearGradient
            colors={isPremium ? ['#262626', '#262626'] : ['#fcd34d', '#f59e0b']}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 10,
              justifyContent: 'center',
              minHeight: 64,
              paddingHorizontal: 20,
              width: '100%',
            }}
          >
            {activating ? <ActivityIndicator color="#0a0a0a" /> : (
              <>
                <Crown color={isPremium ? '#a3a3a3' : '#0a0a0a'} size={20} />
                <Text
                  className={`text-sm font-black uppercase tracking-wider ${isPremium ? 'text-neutral-400' : 'text-black'}`}
                  style={{ flexShrink: 1, textAlign: 'center' }}
                >
                  {isPremium
                    ? (isBs ? 'PRO JE AKTIVAN' : 'PRO IS ACTIVE')
                    : plan === 'yearly'
                      ? (isBs ? 'AKTIVIRAJ GODIŠNJI MISERY PRO' : 'ACTIVATE YEARLY MISERY PRO')
                      : (isBs ? 'AKTIVIRAJ MJESEČNI MISERY PRO' : 'ACTIVATE MONTHLY MISERY PRO')}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Text className="mb-3 mt-8 text-base font-black uppercase tracking-[2px] text-amber-400">
          {isBs ? 'SVE ŠTO DOBIJAŠ' : 'EVERYTHING YOU GET'}
        </Text>
        <View style={{ gap: 10 }}>
          {FEATURES.map(({ icon: Icon, en, bs, detailEn, detailBs }) => (
            <Card key={en}>
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                <Icon color="#fbbf24" size={22} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-neutral-100">{isBs ? bs : en}</Text>
                <Text className="mt-1 text-[11px] leading-4 text-neutral-500">{isBs ? detailBs : detailEn}</Text>
              </View>
              <Check color="#fbbf24" size={19} strokeWidth={3} />
            </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
