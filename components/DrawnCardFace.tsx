import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Language } from '@/types';
import { cardDescription, cardTitle } from '@/lib/cardText';

const DEFAULT_CARD_IMAGE = require('../assets/images/def-card.png');
const SCORE_FOOTER_HEIGHT = 104;
const SCORE_TAB_HEIGHT = 70;
const SCORE_TAB_BOTTOM = -2;
const SCORE_LABEL_HEIGHT = SCORE_FOOTER_HEIGHT - SCORE_TAB_HEIGHT - SCORE_TAB_BOTTOM;

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
  const [imageFailed, setImageFailed] = useState(false);
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

  useEffect(() => setImageFailed(false), [card.image]);
  useEffect(() => staticScoreReveal.setValue(scoreRevealed ? 1 : 0), [scoreRevealed, staticScoreReveal]);

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: '#000000',
        borderColor: isWrong ? '#ef4444' : isCorrect ? '#10b981' : '#facc15',
        borderRadius: 18,
        borderWidth: 5,
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
        style={{ borderColor: 'rgba(250,204,21,0.35)', borderRadius: 11, borderWidth: 2, bottom: 9, left: 9, position: 'absolute', right: 9, top: 9, zIndex: 5 }}
      />
      <View className="w-full items-center px-3" style={{ zIndex: 2 }}>
        <View style={{ alignItems: 'center', gap: 10, marginTop: 22, paddingVertical: 10, width: '100%' }}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={3}
            style={{
              color: '#f8f8f5',
              fontFamily: 'BebasNeue_400Regular',
              fontSize: titleFontSize,
              letterSpacing: 0.7,
              lineHeight: titleFontSize + 1,
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
        <View
          className="items-center justify-center"
          pointerEvents="none"
          style={{
            alignSelf: 'stretch',
            aspectRatio: 1,
            backgroundColor: '#000000',
            marginHorizontal: 6,
            overflow: 'hidden',
          }}
        >
          {card.image && !imageFailed ? (
            <Image
              accessibilityLabel={localizedTitle}
              onError={() => setImageFailed(true)}
              resizeMode="cover"
              source={{ uri: card.image }}
              style={{ height: '100%', width: '100%' }}
            />
          ) : (
            <Image
              accessibilityLabel="Default Misery Meter card artwork"
              resizeMode="contain"
              source={DEFAULT_CARD_IMAGE}
              style={{
                height: '78%',
                transform: [{ translateY: 10 }],
                width: '78%',
              }}
            />
          )}
        </View>
      </View>
      {showFinishPrompt && (
        <Animated.Text
          className="absolute bottom-[106px] font-mono text-[10px] font-black uppercase tracking-[2px] text-white"
          style={{ transform: [{ translateY: promptAnimation }] }}
        >
          {isOnline
            ? isBs ? 'DODIRNI ZA ZAVRŠETAK POTEZA' : 'TAP TO FINISH TURN'
            : isBs ? 'DODIRNI KARTU ZA NASTAVAK' : 'TAP CARD TO CONTINUE'}
        </Animated.Text>
      )}
      <View
        pointerEvents="none"
        style={{
          backgroundColor: '#000000',
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          bottom: 0,
          height: SCORE_FOOTER_HEIGHT,
          left: 0,
          position: 'absolute',
          right: 0,
          zIndex: 4,
        }}
      />
      <View
        className="absolute items-center"
        style={{ bottom: 0, height: SCORE_FOOTER_HEIGHT, left: 0, right: 0, zIndex: 6 }}
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
