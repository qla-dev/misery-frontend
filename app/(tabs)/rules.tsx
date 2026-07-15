import { ScrollView, Text, View } from 'react-native';
import { useGame } from '@/context/GameContext';
import { Card } from '@/components/Card';
import { TabFadeView } from '@/components/TabFadeView';

export default function RulesScreen() {
  const { language } = useGame();
  const isBs = language === 'bs';

  const sections = [
    {
      n: '1. MISERY LANE',
      nBs: '1. STAZA PATNJE',
      bs: 'Svaki igrač počinje sa 3 već poredane kartice (od najmanje do najviše bijedne). To je vaša Staza patnje.',
      en: 'Each player starts with 3 pre-arranged cards, ordered from lowest to highest misery index. This forms your starting lane.',
    },
    {
      n: '2. YOUR TURN',
      bs: 'Izvlači se nova misteriozna kartica. Vidite naziv i ilustraciju, ali je ocjena skrivena. Kliknite na "Ubaci ovdje" dugme na stazi gdje mislite da taj događaj pripada.',
      en: 'A new mystery card is drawn. You can read the scenario and see the graphic, but the score is hidden. Tap the "Insert Here" slot in your lane where you guess this card belongs.',
    },
    {
      n: '3. STEALING (MULTIPLAYER)',
      bs: 'Ako pogriješite, drugi igrači po krugu dobijaju ponudu da UKRADU karticu! Oni mogu procijeniti i ubaciti je na svoju stazu.',
      en: 'If you guess wrong, other players in clockwise order get a single chance to STEAL the card by correctly placing it in their own lanes.',
    },
    {
      n: '4. HOW TO WIN',
      bs: 'Prvi igrač koji uspije sakupiti traženi broj ispravno poređanih kartica u svojoj stazi pobjeđuje! U solo modu imate 3 života.',
      en: 'First player to correctly build a lane of the target number of cards wins! In Solo Mode, you try to build the longest lane with 3 lives.',
    },
  ];

  return (
    <TabFadeView>
      <ScrollView
        className="flex-1 bg-neutral-950"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 24, paddingTop: 16 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
      <Text className="text-center text-2xl font-black uppercase tracking-widest text-amber-400 mb-1">📖 {isBs ? 'PRAVILA IGRE' : 'GAME RULES'}</Text>
      <Text className="text-center text-sm text-neutral-400 leading-6 mb-6">
        {isBs
          ? 'Dobrodošli u Misery Meter! Cilj igre je da tačno posložite kartice sa nesrećnim životnim događajima na skalu od 0 do 100.'
          : 'Welcome to Misery Meter! Your goal is to correctly arrange miserable real-life events along your personal Misery Lane from 0 to 100.'}
      </Text>
      <View style={{ gap: 16 }}>
        {sections.map((s) => (
          <Card key={s.n} body={isBs ? s.bs : s.en} title={isBs ? (s.nBs ?? s.n) : s.n} />
        ))}
      </View>
      </ScrollView>
    </TabFadeView>
  );
}
