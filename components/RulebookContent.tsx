import { useGame } from '@/context/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { API_BASE_URL, ApiCard, api } from '@/lib/api';
import { CARD_DECK } from '@/data/cards';
import { Card } from '@/types';
import { MiseryLogo } from './MiseryLogo';
import { cardTitle } from '@/lib/cardText';

const DEFAULT_CARD_IMAGE = require('../assets/images/def-card.png');
const RULEBOOK_SPECTRUM_IMAGE = require('../assets/images/rulebook-misery-spectrum.jpg');

function toLocalCard(card: ApiCard): Card {
  const image = card.image && card.image !== '0'
    ? card.image.startsWith('http://') || card.image.startsWith('https://')
      ? card.image
      : card.image.startsWith('/')
        ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${card.image}`
        : `${API_BASE_URL.replace(/\/api\/?$/, '')}/storage/${card.image.replace(/^\/?(?:storage\/)?/, '')}`
    : undefined;

  return {
    id: String(card.id),
    titleEn: card.title,
    titleBs: card.title_bs?.trim() || card.title,
    descriptionEn: card.subtitle ?? undefined,
    descriptionBs: card.subtitle_bs?.trim() || card.subtitle || undefined,
    illustrationType: 'general_misery',
    image,
    index: Number(card.score),
  };
}

function RulebookGameCard({ card, hidden = false, isBs, width }: { card: Card; hidden?: boolean; isBs: boolean; width: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = cardTitle(card, isBs ? 'bs' : 'en');
  const compact = width < 80;
  const height = Math.round(width * 1.58);

  useEffect(() => setImageFailed(false), [card.image]);

  return (
    <LinearGradient
      colors={['#242424', '#111111', '#000000', '#000000']}
      locations={[0, 0.13, 0.3, 1]}
      style={{
        alignItems: 'center',
        borderColor: '#facc15',
        borderRadius: compact ? 7 : 12,
        borderWidth: compact ? 2 : 4,
        height,
        overflow: 'hidden',
        width,
      }}
    >
      {!compact ? <View style={{ borderColor: 'rgba(251,191,36,0.35)', borderRadius: 8, borderWidth: 1, bottom: 4, left: 4, position: 'absolute', right: 4, top: 4 }} /> : null}
      <Text
        adjustsFontSizeToFit
        minimumFontScale={0.55}
        numberOfLines={compact ? 2 : 3}
        style={{
          color: '#f8f8f5',
          fontFamily: 'BebasNeue_400Regular',
          fontSize: compact ? 7 : 14,
          letterSpacing: 0.25,
          lineHeight: compact ? 7 : 14,
          marginTop: compact ? 8 : 14,
          paddingHorizontal: compact ? 3 : 8,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <View style={{ backgroundColor: '#000', height: compact ? width - 13 : width - 22, marginTop: compact ? 5 : 9, overflow: 'hidden', width: compact ? width - 10 : width - 18 }}>
        <Image
          accessibilityLabel={title}
          onError={() => setImageFailed(true)}
          resizeMode={card.image && !imageFailed ? 'cover' : 'contain'}
          source={card.image && !imageFailed ? { uri: card.image } : DEFAULT_CARD_IMAGE}
          style={{ height: '100%', width: '100%' }}
        />
      </View>
      <View style={{ alignItems: 'center', backgroundColor: '#000', bottom: 0, left: 0, paddingTop: compact ? 2 : 4, position: 'absolute', right: 0 }}>
        {!compact ? <Text style={{ color: '#facc15', fontFamily: 'BebasNeue_400Regular', fontSize: 8, letterSpacing: 0.7 }}>{isBs ? 'STOPA PATNJE' : 'MISERY RATE'}</Text> : null}
        <View style={{ alignItems: 'center', backgroundColor: '#facc15', height: compact ? 25 : 42, justifyContent: 'center', width: compact ? 34 : 64 }}>
          <Text style={{ color: '#090909', fontFamily: 'BebasNeue_400Regular', fontSize: compact ? 15 : 25, lineHeight: compact ? 17 : 28 }}>
            {hidden ? '?' : card.index.toFixed(1)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function RuleHeader({ number, title }: { number: string; title: string }) {
  return (
    <View className="flex-row items-center bg-neutral-900 px-3 py-2">
      <Text className="mr-3 font-mono text-xl font-black text-white">{number}</Text>
      <Text
        className="flex-1 uppercase text-amber-400"
        style={{ fontFamily: 'AmaticSC_Bold', fontSize: 26, letterSpacing: 1.1, lineHeight: 29 }}
      >
        {title}
      </Text>
    </View>
  );
}

function Fold() {
  return <View className="my-5 border-t-2 border-dashed border-neutral-500" />;
}

function ScoreScale({ cards, isBs }: { cards: Card[]; isBs: boolean }) {
  const scores = ['0', '20', '40', '60', '80', '100'];
  return (
    <View className="mt-4">
      <Text
        className="mb-2 text-center uppercase text-neutral-800"
        style={{ fontFamily: 'AmaticSC_Bold', fontSize: 28, letterSpacing: 2 }}
      >
        {isBs ? 'STOPA PATNJE OBJAŠNJENA' : 'THE MISERY RATE DEMYSTIFIED'}
      </Text>
      <View className="flex-row overflow-hidden rounded-full border-2 border-amber-500">
        {scores.map((score, index) => (
          <View
            className={`flex-1 items-center py-1 ${index < scores.length - 1 ? 'border-r border-white' : ''}`}
            key={score}
            style={{ backgroundColor: index === 0 ? '#fde68a' : index < 3 ? '#fbbf24' : index < 5 ? '#f59e0b' : '#d97706' }}
          >
            <Text className="font-mono text-[9px] font-black text-neutral-950">{score}</Text>
          </View>
        ))}
      </View>
      <View className="mt-1 flex-row justify-between">
        {cards.map((card) => (
          <View className="items-center" key={card.id} style={{ width: '23%' }}>
            <View style={{ borderBottomColor: '#171717', borderBottomWidth: 9, borderLeftColor: 'transparent', borderLeftWidth: 10, borderRightColor: 'transparent', borderRightWidth: 10, height: 0, width: 0 }} />
            <View className="min-h-[48px] w-full items-center justify-center bg-neutral-900 px-1 py-2">
              <Text adjustsFontSizeToFit className="text-center font-mono text-[7px] font-black uppercase leading-[9px] text-white" minimumFontScale={0.65} numberOfLines={3}>
                {cardTitle(card, isBs ? 'bs' : 'en')}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View className="mt-2 flex-row justify-between px-1">
        <Text className="font-mono text-[8px] font-black uppercase text-neutral-600">{isBs ? 'JEDVA LOŠE' : 'BARELY BAD'}</Text>
        <Text className="font-mono text-[8px] font-black uppercase text-neutral-600">{isBs ? 'POTPUNA BIJEDA' : 'ABSOLUTE MISERY'}</Text>
      </View>
    </View>
  );
}

function RulebookSpectrumIllustration() {
  return (
    <View className="w-full items-center justify-center overflow-hidden" style={{ aspectRatio: 1 }}>
      <Image accessibilityLabel="Misery meter pointing from bad through awful to WTF" resizeMode="contain" source={RULEBOOK_SPECTRUM_IMAGE} style={{ height: '100%', width: '100%' }} />
    </View>
  );
}

function AnatomyCard({ card, isBs }: { card: Card; isBs: boolean }) {
  return (
    <View className="mt-4 flex-row items-center" style={{ gap: 12 }}>
      <View className="flex-1" style={{ height: Math.round(142 * 1.58), justifyContent: 'space-between' }}>
        {[isBs ? 'NESRETNI DOGAĐAJ' : 'MISERABLE EVENT', isBs ? 'ILUSTRACIJA' : 'ILLUSTRATION', isBs ? 'STOPA PATNJE' : 'MISERY RATE'].map((label) => (
          <View className="bg-amber-400 px-2 py-3" key={label} style={{ borderBottomRightRadius: 16, borderTopRightRadius: 16 }}>
            <Text className="text-center text-[10px] font-black text-neutral-900">{label}</Text>
          </View>
        ))}
      </View>
      <View className="w-[48%] items-center">
        <RulebookGameCard card={card} isBs={isBs} width={142} />
      </View>
    </View>
  );
}

function LaneExample({ cards, hidden = false, isBs }: { cards: Card[]; hidden?: boolean; isBs: boolean }) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        {cards.map((card, index) => (
          <View className="flex-row items-center" key={`${card.id}-${index}`}>
            <RulebookGameCard card={card} hidden={hidden && index === 1} isBs={isBs} width={52} />
            {index < cards.length - 1 ? <Text className="mx-1 text-neutral-400">›</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Outcome({ color, description, title }: { color: string; description: string; title: string }) {
  return (
    <View className="flex-row items-start" style={{ gap: 12 }}>
      <View style={{ backgroundColor: color, borderRadius: 999, height: 24, marginTop: 1, width: 24 }} />
      <View className="flex-1">
        <Text className="text-xs font-black uppercase text-neutral-900">{title}</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-700">{description}</Text>
      </View>
    </View>
  );
}

export function RulebookContent({ compact = false }: { compact?: boolean }) {
  const { language } = useGame();
  const isBs = language === 'bs';
  const [apiCards, setApiCards] = useState<Card[]>([]);
  const ruleCards = useMemo(() => {
    const pool = apiCards.length >= 4 ? apiCards : CARD_DECK;
    const positions = [0.08, 0.34, 0.62, 0.86];
    return positions.map((position) => pool[Math.min(pool.length - 1, Math.round((pool.length - 1) * position))]);
  }, [apiCards]);

  useEffect(() => {
    let active = true;
    api.getCards()
      .then((cards) => {
        if (active) {
          setApiCards(
            cards
              .map(toLocalCard)
              .filter((card) => Number.isFinite(card.index) && Boolean(card.image)),
          );
        }
      })
      .catch((error) => console.warn('[Rulebook] Real cards unavailable; using bundled cards.', error));
    return () => { active = false; };
  }, []);

  return (
    <View>
      <View className="mb-4 items-center" style={{ marginTop: compact ? 0 : -8, paddingTop: compact ? 24 : 0 }}>
        <MiseryLogo compact={compact} />
        <Text className="font-mono text-[9px] font-black uppercase tracking-[3px] text-neutral-400" style={{ marginTop: compact ? -2 : -5 }}>{isBs ? 'KAKO SE IGRA' : 'HOW TO PLAY'}</Text>
      </View>

      <View className="overflow-hidden rounded-xl bg-stone-100" style={{ padding: compact ? 14 : 18 }}>
      <RuleHeader number="1" title={isBs ? 'ŠTA POKUŠAVAM POSTIĆI?' : 'WHAT AM I TRYING TO ACCOMPLISH?'} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs ? 'Budi najbolji u rangiranju nesretnih životnih događaja, od ' : 'Be the best at ranking miserable real-life events from '}
        <Text className="italic">{isBs ? 'jedva loših' : 'barely bad'}</Text>
        {isBs ? ' do ' : ' to '}
        <Text className="italic">{isBs ? 'potpune bijede' : 'absolute misery'}</Text>
        {isBs ? ', i izgradi svoju Stazu patnje prije svih ostalih.' : ', and build your Misery Lane before everyone else.'}
      </Text>

      <Fold />
      <RuleHeader number="2" title={isBs ? 'ŠTA JE U IGRI?' : "WHAT'S IN THE GAME?"} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        <Text className="font-black">100+ {isBs ? 'KARTICA NESRETNIH DOGAĐAJA' : 'MISERABLE EVENT CARDS'}</Text>
        {isBs ? '; svaka prikazuje događaj koji se dogodio ili bi se vrlo lako mogao dogoditi.' : '; each one shows something that happened or very easily could happen.'}
      </Text>
      <View className="mt-4 flex-row items-center bg-amber-400 p-4" style={{ gap: 12 }}>
        <View style={{ width: '42%' }}><RulebookSpectrumIllustration /></View>
        <Text className="flex-1 text-xs leading-[17px] text-neutral-900">
          {isBs ? 'Kao što ćeš vidjeti, neki događaji su prilično sitni ' : "As you'll see, some events are pretty minor "}
          <Text className="italic">{isBs ? '(poput propuštenog autobusa)' : '(like missing the bus)'}</Text>
          {isBs ? ', dok su drugi mnogo gori ' : ', while others are far more miserable '}
          <Text className="italic">{isBs ? '(poput udara munje)' : '(like being struck by lightning)'}</Text>
          {isBs ? '. Svaka kartica ima svoje mjesto na ' : '. Every card has a fixed place on the '}
          <Text className="font-black">{isBs ? 'Stopa patnje' : 'Misery Rate'}</Text>
          {isBs ? ' skali.' : '.'}
        </Text>
      </View>

      <Fold />
      <RuleHeader number="3" title={isBs ? 'STOPA PATNJE' : 'THE MISERY RATE'} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        <Text className="font-black">{isBs ? 'Stopa patnje' : 'Misery Rate'}</Text>
        {isBs ? ' je sistem rangiranja koji ide od ' : ' is the game’s ranking system that runs from '}
        <Text className="font-black">0 {isBs ? 'do' : 'to'} 100</Text>
        {isBs ? '. Niska ocjena znači neugodnu sitnicu, a visoka ocjena znači bijedu koja mijenja život.' : '. A low score means an annoying inconvenience; a high score means life-changing misery.'}
      </Text>
      <ScoreScale cards={ruleCards} isBs={isBs} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs ? 'Ne moraš pogoditi ' : 'You never need the '}
        <Text className="font-black">{isBs ? 'TAČAN BROJ' : 'EXACT NUMBER'}</Text>
        {isBs ? '. Trebaš samo odlučiti gdje ' : '. You only need to decide where the '}
        <Text className="font-black">{isBs ? 'SKRIVENA OCJENA' : 'HIDDEN SCORE'}</Text>
        {isBs ? ' pripada među karticama koje su već u tvojoj stazi.' : ' belongs among the cards already in your lane.'}
      </Text>

      <Fold />
      <RuleHeader number="4" title={isBs ? 'ANATOMIJA KARTICE' : 'CARD ANATOMY'} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">{isBs ? 'Kartice u Misery Meteru nisu komplikovane.' : "Misery Meter cards aren't complicated."}</Text>
      <AnatomyCard card={ruleCards[2]} isBs={isBs} />

      <Fold />
      <RuleHeader number="5" title={isBs ? 'NEKA BIJEDA POČNE' : "LET'S GET MISERABLE"} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs
          ? 'Svaki igrač počinje s tri kartice koje su već poredane od najniže do najviše ocjene Stope patnje. One čine početak tvoje Staze patnje.'
          : 'Each player starts with three cards already arranged from the lowest to the highest Misery Rate. Those cards form the beginning of your Misery Lane.'}
      </Text>
      <View className="mt-4 bg-amber-400 px-3 py-1">
        <Text className="text-center uppercase text-neutral-900" style={{ fontFamily: 'AmaticSC_Bold', fontSize: 29, letterSpacing: 2 }}>MISERY LANE</Text>
      </View>
      <LaneExample cards={ruleCards} hidden isBs={isBs} />
      <Text className="mt-4 text-sm leading-5 text-neutral-800">
        {isBs
          ? 'Na tvom potezu nova kartica prvo ulazi u stazu sa znakom ?. Izaberi mjesto između postojećih ocjena gdje misliš da pripada. Ne pogađaš broj, nego njen pravilan položaj.'
          : 'On your turn, the new card first enters the lane with a ?. Choose the place between the known scores where you think it belongs. You are not guessing the number, only its correct position.'}
      </Text>
      <LaneExample cards={ruleCards} isBs={isBs} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs ? 'Nakon postavljanja Game Master otkriva stvarnu ocjenu Stope patnje i pokazuje da li je položaj tačan.' : 'After placement, the Game Master reveals the real Misery Rate and shows whether the position is correct.'}
      </Text>

      <Fold />
      <RuleHeader number="6" title="GAME MASTER" />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs
          ? 'Aplikacija je vaš Game Master. Vodi redoslijed poteza, prikazuje čiji je potez, zaključava nedostupne akcije, otkriva ocjene i kroz posebne overlay poruke objašnjava svaki rezultat, krađu i pobjedu.'
          : 'The app is your Game Master. It manages turn order, shows whose turn it is, locks unavailable actions, reveals scores, and uses dedicated overlays to explain every result, steal, and victory.'}
      </Text>
      <View className="mt-4 bg-amber-100 p-4">
        <Text className="text-xs font-black uppercase text-neutral-900">{isBs ? 'NEAKTIVNOST · 60 SEKUNDI' : 'INACTIVITY · 60 SECONDS'}</Text>
        <Text className="mt-2 text-sm leading-5 text-neutral-700">
          {isBs
            ? 'Aktivni igrač dobija upozorenja nakon 15, 30 i 45 sekundi. Ako ne reaguje u roku od 60 sekundi, izbacuje se. Igra se nastavlja ako je otišao obični igrač; ako host napusti igru ili postane neaktivan, cijela igra se završava.'
            : 'The active player is warned after 15, 30, and 45 seconds. If they do not act within 60 seconds, they are removed. The game continues when a regular player leaves; if the host leaves or becomes inactive, the entire game ends.'}
        </Text>
      </View>

      <Fold />
      <RuleHeader number="7" title={isBs ? 'TAČNO ILI POGREŠNO' : 'RIGHT OR WRONG'} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs ? 'Nakon otkrivanja ocjene, Game Master preko cijelog ekrana prikazuje rezultat poteza:' : 'After revealing the score, the Game Master displays the result in a full overlay:'}
      </Text>
      <View className="mt-4" style={{ gap: 14 }}>
        <Outcome color="#10b981" description={isBs ? 'Zeleni overlay znači da je položaj tačan. Kartica ostaje u tvojoj stazi.' : 'A green overlay means the position is correct. The card stays in your lane.'} title={isBs ? 'TAČNO' : 'RIGHT'} />
        <Outcome color="#ef4444" description={isBs ? 'Crveni overlay znači da je procjena bila previsoka ili preniska. Kartica ne ulazi u tvoju stazu.' : 'A red overlay means your guess was too high or too low. The card does not enter your lane.'} title={isBs ? 'POGREŠNO' : 'WRONG'} />
      </View>

      <Fold />
      <RuleHeader number="8" title={isBs ? 'KRAĐA' : 'STEALING'} />
      <View className="mt-4">
        <Outcome color="#facc15" description={isBs ? 'Nakon pogrešnog poteza, ostali igrači redom dobijaju posebni overlay sa izborom da prihvate ili preskoče krađu. Ko prihvati, pokušava pravilno postaviti istu karticu u svoju stazu. Uspješna krađa dodaje karticu kradljivcu; ako svi preskoče ili pogriješe, kartica se odbacuje.' : 'After a wrong move, the other players receive a dedicated overlay in order and may accept or pass the steal. Whoever accepts tries to place the same card correctly in their own lane. A successful steal adds it to the stealer’s lane; if everyone passes or misses, the card is discarded.'} title={isBs ? 'PRILIKA ZA KRAĐU' : 'STEAL CHANCE'} />
      </View>

      <Fold />
      <RuleHeader number="9" title={isBs ? 'KAKO POBIJEDITI' : 'HOW TO WIN'} />
      <View className="mt-4 bg-neutral-900 p-4">
        <Text className="text-center text-sm font-black uppercase leading-5 text-amber-400">
          {isBs ? 'PRVI IGRAČ KOJI DODA CILJANI BROJ KARTICA U SVOJU STAZU POBJEĐUJE.' : 'THE FIRST PLAYER TO ADD THE TARGET NUMBER OF CARDS TO THEIR LANE WINS.'}
        </Text>
        <Text className="mt-2 text-center text-xs leading-5 text-neutral-300">
          {isBs ? 'Ciljani broj kartica bira se prije početka igre.' : 'The target number of cards is selected before the game starts.'}
        </Text>
      </View>
      </View>
    </View>
  );
}
