import { useEffect, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown, Flame, LockKeyhole, Sparkles, Trophy, Zap } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { Card } from './Card';
import { getPremiumPackages, hasRevenueCatConfig, PremiumPackages } from '@/lib/revenueCat';

type Plan = 'monthly' | 'yearly';
const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

const FEATURES = [
  { icon: LockKeyhole, en: 'Private game rooms', bs: 'Privatne sobe za igru', detailEn: 'Create locked rooms hidden from Public Games.', detailBs: 'Kreiraj zaključane sobe koje nisu vidljive u Javnim igrama.' },
  { icon: Flame, en: 'Unlock the Spicy deck', bs: 'Otključaj Ljuti špil', detailEn: 'Extreme and bizarre misery cards.', detailBs: 'Ekstremne i bizarne karte nesreće.' },
  { icon: Sparkles, en: 'Every premium pack', bs: 'Svi premium špilovi', detailEn: 'New themed packs as they arrive.', detailBs: 'Novi tematski špilovi čim stignu.' },
  { icon: Trophy, en: 'Exclusive game content', bs: 'Ekskluzivni sadržaj', detailEn: 'More ways to make game night miserable.', detailBs: 'Još više načina za nesretnu noć igre.' },
  { icon: Zap, en: 'Future Pro features', bs: 'Buduće Pro mogućnosti', detailEn: 'All upcoming Pro additions included.', detailBs: 'Sve buduće Pro funkcije su uključene.' },
];

export function Paywall() {
  const { isPremium, language, managePremium, premiumPlan, premiumReady, purchasePremium, restorePremium } = useGame();
  const [activating, setActivating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [packages, setPackages] = useState<PremiumPackages>({ monthly: null, yearly: null });
  const [plan, setPlan] = useState<Plan>('yearly');
  const isBs = language === 'bs';

  useEffect(() => {
    if (!hasRevenueCatConfig()) return;
    getPremiumPackages().then(setPackages).catch((error) => console.warn('[RevenueCat] paywall offerings failed', error));
  }, []);

  const yearlySavings = useMemo(() => {
    const monthlyPrice = packages.monthly?.product.price;
    const yearlyPrice = packages.yearly?.product.price;
    if (!monthlyPrice || !yearlyPrice) return null;
    return Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100));
  }, [packages.monthly, packages.yearly]);

  const choosePlan = (next: Plan) => {
    if (next !== plan) playSound('click');
    setPlan(next);
  };

  const activate = async () => {
    if (activating) return;
    playSound('click');
    setActivating(true);
    try {
      if (isPremium) await managePremium();
      else await purchasePremium(plan);
    } catch (error) {
      if (!(error as any)?.userCancelled) {
        Alert.alert(isBs ? 'Kupovina nije uspjela' : 'Purchase failed', error instanceof Error ? error.message : String(error));
      }
    } finally {
      setActivating(false);
    }
  };

  const restore = async () => {
    if (restoring) return;
    playSound('click');
    setRestoring(true);
    try {
      const status = await restorePremium();
      Alert.alert(
        status.active ? (isBs ? 'PRO vraćen' : 'PRO restored') : (isBs ? 'Nema kupovine' : 'No purchase found'),
        status.active
          ? (isBs ? 'Misery PRO je ponovo aktivan.' : 'Misery PRO is active again.')
          : (isBs ? 'Nije pronađena aktivna kupovina.' : 'No active Misery PRO purchase was found.'),
      );
    } catch (error) {
      Alert.alert(isBs ? 'Vraćanje nije uspjelo' : 'Restore failed', error instanceof Error ? error.message : String(error));
    } finally {
      setRestoring(false);
    }
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
            {isBs ? 'Više karata. Više patnje. ' : 'More cards. More misery. '}
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
            {isBs ? 'VIŠE KARATA.\nVIŠE PATNJE.' : 'MORE CARDS.\nMORE MISERY.'}
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
            <Text className="mt-3 text-2xl font-black text-amber-400">{packages.monthly?.product.priceString ?? '—'}</Text>
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
              <Text className="text-[8px] font-black uppercase text-black">
                {yearlySavings !== null ? (isBs ? `UŠTEDI ${yearlySavings}%` : `SAVE ${yearlySavings}%`) : (isBs ? 'NAJBOLJA PONUDA' : 'BEST VALUE')}
              </Text>
            </View>
            <View className={`mb-4 h-5 w-5 items-center justify-center rounded-full border-2 ${plan === 'yearly' ? 'border-amber-400' : 'border-neutral-600'}`}>
              {plan === 'yearly' && <View className="h-2 w-2 rounded-full bg-amber-400" />}
            </View>
            <Text className="text-xs font-black uppercase tracking-wider text-white">{isBs ? 'GODIŠNJE' : 'YEARLY'}</Text>
            <Text className="mt-3 text-2xl font-black text-amber-400">{packages.yearly?.product.priceString ?? '—'}</Text>
            <Text className="mt-1 text-[10px] font-bold text-neutral-500">{isBs ? 'naplata godišnje' : 'billed yearly'}</Text>
            <Text className="mt-4 text-[10px] leading-4 text-neutral-400">{isBs ? 'Najbolja vrijednost.' : 'Best value. One payment.'}</Text>
            </Card>
          </Pressable>
        </View>

        <Pressable
          className="mt-4 w-full overflow-hidden rounded-2xl"
          disabled={activating || !premiumReady}
          onPress={activate}
          style={{ alignSelf: 'stretch', width: '100%' }}
        >
          <LinearGradient
            colors={['#fcd34d', '#f59e0b']}
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
            {activating || !premiumReady ? <ActivityIndicator color="#0a0a0a" /> : (
              <>
                <Crown color="#0a0a0a" size={20} />
                <Text
                  className="text-sm font-black uppercase tracking-wider text-black"
                  style={{ flexShrink: 1, textAlign: 'center' }}
                >
                  {isPremium
                    ? (isBs ? 'UPRAVLJAJ PRETPLATOM' : 'MANAGE SUBSCRIPTION')
                    : plan === 'yearly'
                      ? (isBs ? 'AKTIVIRAJ GODIŠNJI MISERY PRO' : 'ACTIVATE YEARLY MISERY PRO')
                      : (isBs ? 'AKTIVIRAJ MJESEČNI MISERY PRO' : 'ACTIVATE MONTHLY MISERY PRO')}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Pressable className="items-center py-4" disabled={restoring || activating} onPress={restore}>
          {restoring ? (
            <ActivityIndicator color="#fbbf24" size="small" />
          ) : (
            <Text className="text-xs font-black uppercase tracking-wider text-neutral-400">
              {isBs ? 'VRATI KUPOVINU' : 'RESTORE PURCHASES'}
            </Text>
          )}
        </Pressable>
        {!hasRevenueCatConfig() ? (
          <Text className="text-center text-[10px] leading-4 text-red-400">
            {isBs ? 'RevenueCat javni SDK ključ nije konfigurisan.' : 'RevenueCat public SDK key is not configured.'}
          </Text>
        ) : null}
        {isPremium && premiumPlan ? (
          <Text className="text-center text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            {isBs ? `AKTIVAN ${premiumPlan === 'yearly' ? 'GODIŠNJI' : 'MJESEČNI'} PLAN` : `ACTIVE ${premiumPlan.toUpperCase()} PLAN`}
          </Text>
        ) : null}
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
