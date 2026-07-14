import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Language } from '@/types';

const DEFAULT_CARD_IMAGE = require('../assets/images/def-card.png');

type DrawnCardFaceProps = {
  artworkSize: number;
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
  artworkSize,
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
  const artworkTop = Math.max(112, height * 0.2);
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
        borderColor: isWrong ? '#ef4444' : isCorrect ? '#10b981' : '#fbbf24',
        borderRadius: 16,
        borderWidth: 6,
        height,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <View style={{ borderColor: 'rgba(251,191,36,0.35)', borderRadius: 10, borderWidth: 2, bottom: 12, left: 12, position: 'absolute', right: 12, top: 12 }} />
      <View className="w-full items-center px-6 pt-9" style={{ zIndex: 2 }}>
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
              marginTop: 7,
              maxWidth: '88%',
              textAlign: 'center',
            }}
          >
            {isBs ? card.descriptionBs : card.descriptionEn}
          </Text>
        )}
      </View>
      <View
        pointerEvents="none"
        style={{ alignItems: 'center', left: 0, position: 'absolute', right: 0, top: artworkTop, zIndex: 1 }}
      >
        <View
          className="items-center justify-center"
          style={{
            backgroundColor: '#000000',
            height: artworkSize,
            width: artworkSize,
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
      <View className="absolute bottom-0 left-0 right-0 items-center">
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
          colors={['#fbbf24', '#eab308']}
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
