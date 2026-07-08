import { ScrollView, Text, View } from 'react-native';
import { useGame } from '@/context/GameContext';

export default function RulesScreen() {
  const { language } = useGame();
  const isBs = language === 'bs';

  const sections = [
    {
      n: '1. MISERY LANE',
      bs: 'Svaki igrač počinje sa 3 već poredane kartice (od najmanje do najviše bijedne). To je vaša Traka Bijede.',
      en: 'Each player starts with 3 pre-arranged cards, ordered from lowest to highest misery index. This forms your starting lane.',
    },
    {
      n: '2. YOUR TURN',
      bs: 'Izvlači se nova misteriozna kartica. Vidite naziv i ilustraciju, ali je ocjena skrivena. Kliknite na "Ubaci ovdje" dugme na traci gdje mislite da taj događaj pripada.',
      en: 'A new mystery card is drawn. You can read the scenario and see the graphic, but the score is hidden. Tap the "Insert Here" slot in your lane where you guess this card belongs.',
    },
    {
      n: '3. STEALING (MULTIPLAYER)',
      bs: 'Ako pogriješite, drugi igrači po krugu dobijaju ponudu da UKRADU karticu! Oni mogu procijeniti i ubaciti je na svoju traku.',
      en: 'If you guess wrong, other players in clockwise order get a single chance to STEAL the card by correctly placing it in their own lanes.',
    },
    {
      n: '4. HOW TO WIN',
      bs: 'Prvi igrač koji uspije sakupiti traženi broj ispravno poređanih kartica u svojoj traci pobjeđuje! U solo modu imate 3 života.',
      en: 'First player to correctly build a lane of the target number of cards wins! In Solo Mode, you try to build the longest lane with 3 lives.',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-neutral-950 px-6 pt-[100px] pb-6" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-black uppercase tracking-widest text-amber-400 mb-1">📖 {isBs ? 'PRAVILA IGRE' : 'GAME RULES'}</Text>
      <Text className="text-xs text-neutral-400 leading-relaxed mb-6">
        {isBs
          ? 'Dobrodošli u Indeks Bijede! Cilj igre je da tačno posložite kartice sa nesrećnim životnim događajima na skalu od 0 do 100.'
          : 'Welcome to Misery Meter! Your goal is to correctly arrange miserable real-life events along your personal Misery Lane from 0 to 100.'}
      </Text>
      <View className="space-y-4">
        {sections.map((s) => (
          <View key={s.n} className="p-4 bg-neutral-900/40 rounded-xl border border-neutral-900">
            <Text className="font-bold text-amber-400 font-mono text-[10px] uppercase tracking-wider mb-1">{isBs ? s.n : s.n}</Text>
            <Text className="text-neutral-300 text-xs leading-relaxed">{isBs ? s.bs : s.en}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
