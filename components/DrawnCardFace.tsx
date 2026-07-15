import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Language } from '@/types';

const DEFAULT_CARD_IMAGE = require('../assets/images/def-card.png');

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
  const [imageFailed, setImageFailed] = useState(false);
  const staticScoreReveal = useRef(new Animated.Value(scoreRevealed ? 1 : 0)).current;
  const staticPromptFloat = useRef(new Animated.Value(0)).current;
  const revealAnimation = scoreReveal ?? staticScoreReveal;
  const promptAnimation = promptFloat ?? staticPromptFloat;
  const isCorrect = result === 'correct';
  const isWrong = result === 'wrong';
  const cardGradient: [string, string, string, string] = isWrong
    ? ['#5a1414', '#311616', '#171010', '#090909']
    : isCorrect
      ? ['#0c4430', '#173126', '#101713', '#090909']
      : ['#242424', '#111111', '#000000', '#000000'];
  const cardGradientLocations: [number, number, number, number] = isWrong || isCorrect
    ? [0, 0.36, 0.7, 1]
    : [0, 0.13, 0.3, 1];
  const titleFontSize = Math.min(30, Math.max(25, height * 0.052));
  const scoreTabWidth = 112;

  useEffect(() => setImageFailed(false), [card.image]);
  useEffect(() => staticScoreReveal.setValue(scoreRevealed ? 1 : 0), [scoreRevealed, staticScoreReveal]);

  return (
    <LinearGradient
      colors={cardGradient}
      end={{ x: 0.82, y: 1 }}
      locations={cardGradientLocations}
      start={{ x: 0.12, y: 0 }}
      style={{
        alignItems: 'center',
        borderColor: isWrong ? '#ef4444' : isCorrect ? '#10b981' : '#facc15',
        borderRadius: 18,
        borderWidth: 5,
        height,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <View style={{ borderColor: 'rgba(251,191,36,0.35)', borderRadius: 11, borderWidth: 2, bottom: 9, left: 9, position: 'absolute', right: 9, top: 9 }} />
      <View className="w-full items-center px-3 pt-8" style={{ gap: 10, zIndex: 2 }}>
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
            textAlign: 'center',
          }}
        >
          {isBs ? card.titleBs : card.titleEn}
        </Text>
        {(card.descriptionBs || card.descriptionEn) && (
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
            {isBs ? card.descriptionBs : card.descriptionEn}
          </Text>
        )}
        <View
          className="items-center justify-center"
          pointerEvents="none"
          style={{
            aspectRatio: 1,
            backgroundColor: '#000000',
            overflow: 'hidden',
            width: '100%',
          }}
        >
          {card.image && !imageFailed ? (
            <Image
              accessibilityLabel={isBs ? card.titleBs : card.titleEn}
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
        className="absolute items-center"
        style={{ backgroundColor: '#000000', bottom: 12, left: 12, paddingTop: 8, right: 12, zIndex: 4 }}
      >
        <Text
          adjustsFontSizeToFit
          className="mb-1 uppercase text-amber-400"
          minimumFontScale={0.65}
          numberOfLines={1}
          style={{
            fontFamily: 'BebasNeue_400Regular',
            fontSize: 15,
            letterSpacing: 1.2,
            lineHeight: 17,
            textAlign: 'center',
            width: scoreTabWidth,
          }}
        >
          {isBs ? 'STOPA BIJEDE' : 'MISERY RATE'}
        </Text>
        <LinearGradient
          colors={['#facc15', '#facc15']}
          style={{ alignItems: 'center', height: 70, justifyContent: 'center', padding: 8, width: scoreTabWidth }}
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
    </LinearGradient>
  );
}
