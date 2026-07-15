import { useGame } from '@/context/GameContext';
import { BookOpen } from 'lucide-react-native';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { ConfirmModal } from './ConfirmModal';

const RULES = [
  {
    titleEn: '1. MISERY LANE',
    titleBs: '1. STAZA PATNJE',
    bodyEn: 'Each player starts with 3 pre-arranged cards, ordered from lowest to highest misery index. This forms your starting lane.',
    bodyBs: 'Svaki igrač počinje sa 3 već poredane kartice, od najmanje do najviše bijedne. To je vaša Staza patnje.',
  },
  {
    titleEn: '2. YOUR TURN',
    titleBs: '2. TVOJ POTEZ',
    bodyEn: 'A mystery card is drawn with its score hidden. Place it in the slot where you think it belongs in your lane.',
    bodyBs: 'Izvlači se misteriozna kartica sa skrivenom ocjenom. Ubaci je na mjesto gdje misliš da pripada u tvojoj stazi.',
  },
  {
    titleEn: '3. STEALING',
    titleBs: '3. KRAĐA',
    bodyEn: 'After a wrong placement, the other players get a chance in order to place the card correctly and steal it.',
    bodyBs: 'Nakon netačnog poteza, ostali igrači redom dobijaju priliku da pravilno smjeste kartu i ukradu je.',
  },
  {
    titleEn: '4. HOW TO WIN',
    titleBs: '4. KAKO POBIJEDITI',
    bodyEn: 'The first player to build a lane with the target number of correctly arranged cards wins. Solo mode uses 3 lives.',
    bodyBs: 'Prvi igrač koji složi stazu sa traženim brojem pravilno poredanih kartica pobjeđuje. U solo modu imate 3 života.',
  },
];

export function InfoModal({ onLeaveGame }: { onLeaveGame?: () => void }) {
  const { height } = useWindowDimensions();
  const { language, infoModalOpen, setInfoModalOpen } = useGame();
  const isBs = language === 'bs';

  return (
    <ConfirmModal
      confirmLabel={isBs ? 'RAZUMIJEM' : 'GOT IT'}
      cancelLabel={onLeaveGame ? (isBs ? 'NAPUSTI IGRU' : 'LEAVE GAME') : undefined}
      onCancel={onLeaveGame ? () => {
        setInfoModalOpen(false);
        onLeaveGame();
      } : undefined}
      onConfirm={() => setInfoModalOpen(false)}
      onRequestClose={() => setInfoModalOpen(false)}
      visible={infoModalOpen}
    >
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 4 }}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        style={{ maxHeight: Math.max(280, height - (onLeaveGame ? 310 : 250)) }}
      >
        <View className="items-center" style={{ gap: 9 }}>
          <BookOpen color="#fbbf24" size={34} strokeWidth={2.4} />
          <Text className="text-center text-xl font-black uppercase tracking-widest text-amber-400">
            {isBs ? 'PRAVILA IGRE' : 'GAME RULES'}
          </Text>
          <Text className="text-center text-sm leading-5 text-neutral-400">
            {isBs
              ? 'Poredaj životne događaje od najmanje do najveće patnje.'
              : 'Arrange life events from the least to the most miserable.'}
          </Text>
        </View>

        {RULES.map((rule) => (
          <View
            className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4"
            key={rule.titleEn}
            style={{ gap: 7 }}
          >
            <Text className="text-sm font-black uppercase tracking-wider text-amber-400">
              {isBs ? rule.titleBs : rule.titleEn}
            </Text>
            <Text className="text-sm leading-6 text-neutral-300">
              {isBs ? rule.bodyBs : rule.bodyEn}
            </Text>
          </View>
        ))}
      </ScrollView>
    </ConfirmModal>
  );
}
