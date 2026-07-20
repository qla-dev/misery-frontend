import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Language } from '@/types';
import { cardDescription, cardTitle } from '@/lib/cardText';
import { LazyCardArtwork } from './LazyCardArtwork';

const SCORE_FOOTER_HEIGHT = 104;
const SCORE_TAB_HEIGHT = 70;
const SCORE_TAB_BOTTOM = -2;
const SCORE_LABEL_HEIGHT = SCORE_FOOTER_HEIGHT - SCORE_TAB_HEIGHT - SCORE_TAB_BOTTOM;
const HEADER_GAP = 5;
const TITLE_LINE_HEIGHT_EXTRA = 4;
const OUTER_BORDER_WIDTH = 5;
const INNER_BORDER_INSET = 9;
const INNER_BORDER_WIDTH = 2;
const ARTWORK_BORDER_PADDING = 5;
const BORDER_TO_BORDER_GAP = INNER_BORDER_INSET - OUTER_BORDER_WIDTH;
const ARTWORK_HORIZONTAL_INSET = INNER_BORDER_INSET + INNER_BORDER_WIDTH + ARTWORK_BORDER_PADDING;

type DrawnCardFaceProps = {
  card: Card;
  height: number;
  isOnline?: boolean;
  language: Language;
  promptFloat?: Animated.Value;
  result?: 'neutral' | 'correct' | 'wrong';
  scoreReveal?: Animated.Value;
  scoreRevealed?: boolean;
  showFinishPrompt?: boolean;
};

export function DrawnCardFace({
  card,
  height,
  isOnline = false,
  language,
  promptFloat,
  result = 'neutral',
  scoreReveal,
  scoreRevealed = false,
  showFinishPrompt = false,
}: DrawnCardFaceProps) {
  const isBs = language === 'bs';
  const localizedTitle = cardTitle(card, language);
  const localizedDescription = cardDescription(card, language);
  const staticScoreReveal = useRef(new Animated.Value(scoreRevealed ? 1 : 0)).current;
  const staticPromptFloat = useRef(new Animated.Value(0)).current;
  const revealAnimation = scoreReveal ?? staticScoreReveal;
  const promptAnimation = promptFloat ?? staticPromptFloat;
  const isCorrect = result === 'correct';
  const isWrong = result === 'wrong';
  const cardGradient: [string, string, string, string] = isWrong
    ? ['rgba(90,20,20,0.78)', 'rgba(49,22,22,0.52)', 'rgba(23,16,16,0.18)', 'rgba(9,9,9,0)']
    : isCorrect
      ? ['rgba(12,68,48,0.78)', 'rgba(23,49,38,0.52)', 'rgba(16,23,19,0.18)', 'rgba(9,9,9,0)']
      : ['rgba(36,36,36,0.62)', 'rgba(17,17,17,0.34)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0)'];
  const cardGradientLocations: [number, number, number, number] = isWrong || isCorrect
    ? [0, 0.36, 0.7, 1]
    : [0, 0.13, 0.3, 1];
  const titleFontSize = Math.min(30, Math.max(25, height * 0.052));
  const scoreTabWidth = 112;

  useEffect(() => staticScoreReveal.setValue(scoreRevealed ? 1 : 0), [scoreRevealed, staticScoreReveal]);

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: '#000000',
        borderColor: isWrong ? '#ef4444' : isCorrect ? '#10b981' : '#facc15',
        borderRadius: 18,
        borderWidth: OUTER_BORDER_WIDTH,
        height,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <LinearGradient
        colors={cardGradient}
        end={{ x: 0.82, y: 1 }}
        locations={cardGradientLocations}
        pointerEvents="none"
        start={{ x: 0.12, y: 0 }}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 3 }}
      />
      <View
        pointerEvents="none"
        style={{ borderColor: 'rgba(250,204,21,0.35)', borderRadius: 11, borderWidth: INNER_BORDER_WIDTH, bottom: INNER_BORDER_INSET, left: INNER_BORDER_INSET, position: 'absolute', right: INNER_BORDER_INSET, top: INNER_BORDER_INSET, zIndex: 10 }}
      />
      <View
        className="items-center"
        style={{ flex: 1, width: '100%', zIndex: 2 }}
      >
        <View
          style={{
            alignItems: 'center',
            paddingBottom: 10,
            paddingHorizontal: 12,
            paddingTop: 20,
            rowGap: 0,
            width: '100%',
          }}
        >
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={3}
            style={{
              color: '#f8f8f5',
              fontFamily: 'BebasNeue_400Regular',
              fontSize: titleFontSize,
              includeFontPadding: true,
              letterSpacing: 0.7,
              // Bebas Neue's uppercase Latin-ext glyphs extend above its tight
              // cap-height. Extra leading keeps Č/Ć/Š/Ž from losing their marks
              // when a flipped-card title is resized on native platforms.
              lineHeight: titleFontSize + TITLE_LINE_HEIGHT_EXTRA,
              paddingHorizontal: 12,
              textAlign: 'center',
              width: '100%',
            }}
          >
            {localizedTitle}
          </Text>
          {localizedDescription && (
            <Text
              numberOfLines={3}
              style={{
                color: '#8f8f8f',
                fontFamily: 'Outfit_400Regular',
                fontSize: 11,
                lineHeight: 15,
                maxWidth: '88%',
                textAlign: 'center',
              }}
            >
              {localizedDescription}
            </Text>
          )}
        </View>
        <LazyCardArtwork
          alignTop
          card={card}
          style={{
            alignSelf: 'stretch',
            backgroundColor: '#000000',
            flex: 1,
            marginHorizontal: ARTWORK_HORIZONTAL_INSET,
            overflow: 'hidden',
          }}
        />
      </View>
      {showFinishPrompt && (
        <Animated.Text
          className="absolute bottom-[106px] font-mono text-[10px] font-black uppercase tracking-[2px] text-white"
          style={{ transform: [{ translateY: promptAnimation }], zIndex: 7 }}
        >
          {isOnline
            ? isBs ? 'DODIRNI ZA ZAVRŠETAK POTEZA' : 'TAP TO FINISH TURN'
            : isBs ? 'DODIRNI KARTU ZA NASTAVAK' : 'TAP CARD TO CONTINUE'}
        </Animated.Text>
      )}
      <View
        className="items-center"
        style={{
          backgroundColor: '#000000',
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          flexShrink: 0,
          height: SCORE_FOOTER_HEIGHT,
          width: '100%',
          zIndex: 6,
        }}
      >
        <View
          style={{ alignItems: 'center', height: SCORE_LABEL_HEIGHT, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }}
        >
          <Text
            adjustsFontSizeToFit
            className="uppercase text-amber-400"
            minimumFontScale={0.65}
            numberOfLines={1}
            style={{
              color: '#facc15',
              fontFamily: 'BebasNeue_400Regular',
              fontSize: 15,
              letterSpacing: 1.2,
              lineHeight: 17,
              textAlign: 'center',
              width: scoreTabWidth,
            }}
          >
            {isBs ? 'STOPA PATNJE' : 'MISERY RATE'}
          </Text>
        </View>
        <LinearGradient
          colors={['#facc15', '#facc15']}
          style={{ alignItems: 'center', bottom: SCORE_TAB_BOTTOM, height: SCORE_TAB_HEIGHT, justifyContent: 'center', padding: 8, position: 'absolute', width: scoreTabWidth }}
        >
          <Animated.Text
            className="text-neutral-950"
            style={{
              fontFamily: 'BebasNeue_400Regular',
              fontSize: 42,
              fontWeight: '400',
              height: 70,
              lineHeight: 70,
              opacity: revealAnimation.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0, 0] }),
              position: 'absolute',
              textAlign: 'center',
              textAlignVertical: 'center',
              transform: [
                { scale: revealAnimation.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0.82, 0.82] }) },
                { translateY: 2 },
              ],
              width: scoreTabWidth,
            }}
          >
            ?.??
          </Animated.Text>
          <Animated.Text
            className="text-neutral-950"
            style={{
              fontFamily: 'BebasNeue_400Regular',
              fontSize: 42,
              fontWeight: '400',
              height: 70,
              lineHeight: 70,
              opacity: revealAnimation.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0, 1] }),
              position: 'absolute',
              textAlign: 'center',
              textAlignVertical: 'center',
              transform: [
                { scale: revealAnimation.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1.18, 1.18, 1] }) },
                { translateY: revealAnimation.interpolate({ inputRange: [0, 1], outputRange: [9, 2] }) },
              ],
              width: scoreTabWidth,
            }}
          >
            {card.index.toFixed(2)}
          </Animated.Text>
        </LinearGradient>
      </View>
    </View>
  );
}
