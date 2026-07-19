import { useGame } from '@/context/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { BellRing, Check, Pause, Play, X } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { API_BASE_URL, ApiCard, api } from '@/lib/api';
import { CARD_DECK } from '@/data/cards';
import { Card } from '@/types';
import { MiseryLogo } from './MiseryLogo';
import { cardTitle } from '@/lib/cardText';

const DEFAULT_CARD_IMAGE = require('../assets/images/def-card.png');
const RULEBOOK_SPECTRUM_IMAGE = require('../assets/images/rulebook-misery-spectrum-transparent.png');
const RULEBOOK_TIMER_IMAGE = require('../assets/images/rulebook-60-second-timer-transparent.png');
const RULEBOOK_TROPHY_IMAGE = require('../assets/images/rulebook-victory-trophy.png');

function FloatingRuleArt({ children, style }: { children: ReactNode; style?: object }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { duration: 1800, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
        Animated.timing(progress, { duration: 1800, easing: Easing.inOut(Easing.sin), toValue: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

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
            {hidden ? '?.??' : card.index.toFixed(1)}
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
    <FloatingRuleArt style={{ alignItems: 'center', aspectRatio: 1, justifyContent: 'center', overflow: 'hidden', width: '100%' }}>
      <Image accessibilityLabel="Misery meter pointing from bad through awful to WTF" resizeMode="contain" source={RULEBOOK_SPECTRUM_IMAGE} style={{ height: '100%', width: '100%' }} />
    </FloatingRuleArt>
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
      <FloatingRuleArt style={{ alignItems: 'center', width: '48%' }}>
        <RulebookGameCard card={card} isBs={isBs} width={142} />
      </FloatingRuleArt>
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

function CarnivalMaskIcon({ color = '#0a0a0a', size = 28 }: { color?: string; size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 530.25 530.251" width={size}>
      <Path d="M511.086 187.131c-37.584-20.402-77.071-34.679-120.667-33.221-24.969.843-49.149 6.877-73.324 12.632-13.353 3.173-26.705 6.403-39.988 9.887-4.051 1.066-8.036 1.528-11.982 1.682-3.943-.147-7.929-.616-11.976-1.682-13.287-3.484-26.635-6.714-39.992-9.887-24.178-5.75-48.355-11.789-73.324-12.632-43.6-1.458-83.086 12.823-120.667 33.221-17.105 9.285-21.56 17.524-18.052 32.65 4.172 17.987 9.73 35.785 17.702 52.374 7.078 14.739 14.834 29.23 23.48 43.306 14.003 22.785 29.139 43.353 55.571 52.846 16.043 5.759 32.413 8.97 49.392 7.948 9.458-.574 18.027-4.621 26.472-8.807 8.387-4.163 16.956-8 24.498-13.623 7.488-5.587 15.45-10.791 21.951-17.408 0 0 26.892-26.174 44.946-30.196 18.064 4.027 44.946 30.196 44.946 30.196 6.501 6.617 14.464 11.821 21.959 17.408 7.537 5.623 16.115 9.455 24.497 13.623 8.438 4.186 17.007 8.232 26.472 8.807 16.979 1.021 33.347-2.189 49.392-7.948 26.43-9.488 41.574-30.061 55.566-52.846 8.648-14.071 16.4-28.566 23.48-43.306 7.967-16.589 13.525-34.382 17.702-52.374 3.506-15.126-.951-23.365-18.052-32.65zM132.998 288.92c-33.932-11.542-51.534-50.034-51.534-50.034s37.416-19.77 71.348-8.233 51.527 50.029 51.527 50.029-37.414 19.775-71.341 8.238zm264.258 0c-33.93 11.537-71.35-8.237-71.35-8.237s17.604-38.492 51.538-50.029c33.925-11.537 71.341 8.233 71.341 8.233s-17.594 38.491-51.529 50.033z" fill={color} />
    </Svg>
  );
}

function Outcome({ color, description, icon, title }: { color: string; description: string; icon: ReactNode; title: string }) {
  return (
    <View className="flex-row items-start" style={{ gap: 12 }}>
      <View style={{ alignItems: 'center', backgroundColor: color, borderColor: color === '#ffffff' ? '#d4d4d4' : color, borderRadius: 999, borderWidth: 1, height: 44, justifyContent: 'center', marginTop: 1, width: 44 }}>{icon}</View>
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
      .catch((error) => {
        if (__DEV__) console.warn('[Rulebook] Real cards unavailable; using bundled cards.', error);
      });
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
        <Text className="text-center uppercase text-neutral-900" style={{ fontFamily: 'AmaticSC_Bold', fontSize: 29, letterSpacing: 2 }}>{isBs ? 'STAZA PATNJE' : 'MISERY LANE'}</Text>
      </View>
      <LaneExample cards={ruleCards} hidden isBs={isBs} />
      <Text className="mt-4 text-sm leading-5 text-neutral-800">
        {isBs
          ? 'Na tvom potezu nova kartica prvo ulazi u stazu sa znakom ?.??. Izaberi mjesto između postojećih ocjena gdje misliš da pripada. Ne pogađaš broj, nego njen pravilan položaj.'
          : 'On your turn, the new card first enters the lane with a ?.??. Choose the place between the known scores where you think it belongs. You are not guessing the number, only its correct position.'}
      </Text>
      <LaneExample cards={ruleCards} isBs={isBs} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs ? 'Nakon postavljanja Game Master otkriva stvarnu ocjenu Stope patnje i pokazuje da li je položaj tačan.' : 'After placement, the Game Master reveals the real Misery Rate and shows whether the position is correct.'}
      </Text>

      <Fold />
      <RuleHeader number="6" title={isBs ? 'VRIJEME ZA ODGOVOR' : 'TIME TO ANSWER'} />
      <View className="mt-4 flex-row items-center bg-amber-400 p-4" style={{ gap: 12 }}>
        <Text className="flex-1 text-xs leading-[17px] text-neutral-900">
          {isBs ? 'Svaki igrač ima ' : 'Each player has '}
          <Text className="font-black">{isBs ? 'jednu minutu' : 'one minute'}</Text>
          {isBs ? ' da odgovori ili završi potrebnu radnju na svom potezu, ' : ' to answer or complete the required action on every turn, '}
          <Text className="italic">{isBs ? 'uključujući pokušaj krađe' : 'including a steal attempt'}</Text>
          {isBs ? '. Odbrojavanje počinje čim tvoj potez postane aktivan.' : '. The countdown begins as soon as your turn becomes active.'}
        </Text>
        <FloatingRuleArt style={{ aspectRatio: 1, width: '42%' }}>
          <Image
            accessibilityLabel={isBs ? 'Ilustracija vremenskog ograničenja od 60 sekundi' : '60-second time-limit illustration'}
            resizeMode="contain"
            source={RULEBOOK_TIMER_IMAGE}
            style={{ height: '100%', width: '100%' }}
          />
        </FloatingRuleArt>
      </View>
      <View className="flex-row items-start bg-amber-100 p-4" style={{ gap: 12 }}>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-amber-400">
          <BellRing color="#171717" size={23} strokeWidth={2.6} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-black uppercase text-neutral-900">{isBs ? 'UPOZORENJA · 15 / 30 / 45 SEKUNDI' : 'WARNINGS · 15 / 30 / 45 SECONDS'}</Text>
          <Text className="mt-2 text-sm leading-5 text-neutral-700">
            {isBs
              ? 'Ako igrač ne reaguje u roku od 60 sekundi, izbacuje se. Igra se nastavlja kada ode obični igrač; ako host napusti igru ili postane neaktivan, cijela igra se završava.'
              : 'If the player does not act within 60 seconds, they are removed. The game continues when a regular player leaves; if the host leaves or becomes inactive, the entire game ends.'}
          </Text>
        </View>
      </View>

      <Fold />
      <RuleHeader number="7" title="GAME MASTER" />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs
          ? 'Aplikacija je vaš Game Master. Vodi redoslijed poteza, prikazuje čiji je potez, zaključava nedostupne akcije, otkriva ocjene i kroz posebne flash poruke objašnjava svaki rezultat, krađu i pobjedu.'
          : 'The app is your Game Master. It manages turn order, shows whose turn it is, locks unavailable actions, reveals scores, and uses dedicated flash messages to explain every result, steal, and victory.'}
      </Text>

      <Fold />
      <RuleHeader number="8" title={isBs ? 'FLASH PORUKE' : 'FLASH MESSAGES'} />
      <Text className="mt-3 text-sm leading-5 text-neutral-800">
        {isBs ? 'Game Master koristi flash poruke preko cijelog ekrana da jasno pokaže trenutno stanje igre:' : 'The Game Master uses full-screen flash messages to clearly show the current game state:'}
      </Text>
      <View className="mt-4" style={{ gap: 14 }}>
        <Outcome color="#10b981" description={isBs ? 'Zelena flash poruka znači da je položaj tačan. Kartica ostaje u tvojoj stazi.' : 'A green flash message means the position is correct. The card stays in your lane.'} icon={<Check color="#ffffff" size={26} strokeWidth={3.2} />} title={isBs ? 'TAČNO' : 'RIGHT'} />
        <Outcome color="#ef4444" description={isBs ? 'Crvena flash poruka znači da je procjena bila previsoka ili preniska. Kartica ne ulazi u tvoju stazu.' : 'A red flash message means your guess was too high or too low. The card does not enter your lane.'} icon={<X color="#ffffff" size={27} strokeWidth={3.2} />} title={isBs ? 'POGREŠNO' : 'WRONG'} />
        <Outcome color="#facc15" description={isBs ? 'Žuta flash poruka znači da je igra privremeno na čekanju dok drugi igrač završi svoju odluku.' : 'A yellow flash message means the game is on hold while another player completes their decision.'} icon={<Pause color="#171717" fill="#171717" size={24} strokeWidth={2.5} />} title={isBs ? 'NA ČEKANJU' : 'ON HOLD'} />
        <Outcome color="#ffffff" description={isBs ? 'Bijela flash poruka znači da je tvoj potez i da sada biraš dostupnu akciju.' : 'A white flash message means it is your turn and you can choose an available action.'} icon={<Play color="#171717" fill="#171717" size={24} strokeWidth={2.5} />} title={isBs ? 'TVOJ POTEZ' : 'YOUR TURN'} />
      </View>

      <Fold />
      <RuleHeader number="9" title={isBs ? 'KRAĐA' : 'STEALING'} />
      <View className="mt-4">
        <Outcome color="#facc15" description={isBs ? 'Nakon pogrešnog poteza, ostali igrači redom dobijaju posebnu flash poruku sa izborom da prihvate ili preskoče krađu. Ko prihvati, pokušava pravilno postaviti istu karticu u svoju stazu. Uspješna krađa dodaje karticu kradljivcu; ako svi preskoče ili pogriješe, kartica se odbacuje.' : 'After a wrong move, the other players receive a dedicated flash message in order and may accept or pass the steal. Whoever accepts tries to place the same card correctly in their own lane. A successful steal adds it to the stealer’s lane; if everyone passes or misses, the card is discarded.'} icon={<CarnivalMaskIcon />} title={isBs ? 'PRILIKA ZA KRAĐU' : 'STEAL CHANCE'} />
      </View>

      <Fold />
      <RuleHeader number="10" title={isBs ? 'KAKO POBIJEDITI' : 'HOW TO WIN'} />
      <View className="mt-4 flex-row items-center p-4" style={{ gap: 12 }}>
        <View className="flex-1 justify-center">
          <Text className="text-left text-sm font-black uppercase leading-5 text-neutral-900">
            {isBs ? 'CILJANI BROJ KARTICA BIRA SE PRIJE POČETKA IGRE.' : 'THE TARGET NUMBER OF CARDS IS SELECTED BEFORE THE GAME STARTS.'}
          </Text>
          <Text className="mt-2 text-left text-xs leading-5 text-neutral-900">
            {isBs ? 'Prvi igrač koji doda ciljani broj kartica u svoju stazu pobjeđuje.' : 'The first player to add the target number of cards to their lane wins.'}
          </Text>
        </View>
        <FloatingRuleArt style={{ alignItems: 'center', alignSelf: 'center', aspectRatio: 1, justifyContent: 'center', width: '42%' }}>
          <Image
            accessibilityLabel={isBs ? 'Pobjednički pehar' : 'Victory trophy'}
            resizeMode="contain"
            source={RULEBOOK_TROPHY_IMAGE}
            style={{ height: '100%', width: '100%' }}
          />
        </FloatingRuleArt>
      </View>
      </View>
    </View>
  );
}
