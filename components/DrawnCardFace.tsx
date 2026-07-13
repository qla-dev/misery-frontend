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

  useEffect(() => setImageFailed(false), [card.image]);
  useEffect(() => staticScoreReveal.setValue(scoreRevealed ? 1 : 0), [scoreRevealed, staticScoreReveal]);

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: isWrong ? 'rgba(239,68,68,0.14)' : isCorrect ? 'rgba(16,185,129,0.14)' : '#090909',
        borderColor: isWrong ? '#ef4444' : isCorrect ? '#10b981' : '#fbbf24',
        borderRadius: 16,
        borderWidth: 6,
        height,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <View style={{ borderColor: 'rgba(251,191,36,0.35)', borderRadius: 10, borderWidth: 2, bottom: 12, left: 12, position: 'absolute', right: 12, top: 12 }} />
      <View className="w-full items-center px-9 pt-9">
        <Text className="text-center text-2xl font-black uppercase leading-7 tracking-tight text-amber-400">
          {isBs ? card.titleBs : card.titleEn}
        </Text>
        {(card.descriptionBs || card.descriptionEn) && (
          <Text className="mt-2 text-center text-xs leading-5 text-neutral-400" numberOfLines={3}>
            {isBs ? card.descriptionBs : card.descriptionEn}
          </Text>
        )}
      </View>
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View
          className="items-center justify-center overflow-hidden rounded-full"
          style={{
            backgroundColor: '#1a1a1a',
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
              style={{ height: '112%', width: '112%' }}
            />
          ) : (
            <Image
              accessibilityLabel="Default Misery Meter card artwork"
              resizeMode="contain"
              source={DEFAULT_CARD_IMAGE}
              style={{
                height: '116%',
                transform: [{ translateY: 10 }],
                width: '116%',
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
          className="mb-1 text-base uppercase tracking-wider text-amber-400"
          minimumFontScale={0.65}
          numberOfLines={1}
          style={{ fontFamily: 'Outfit_900Black', fontWeight: '900', textAlign: 'center', width: 100 }}
        >
          {isBs ? 'STOPA BIJEDE' : 'MISERY RATE'}
        </Text>
        <LinearGradient
          colors={['#fbbf24', '#eab308']}
          style={{ alignItems: 'center', height: 70, justifyContent: 'center', padding: 8, width: 100 }}
        >
          <Animated.Text
            className="text-neutral-950"
            style={{
              fontFamily: 'JetBrainsMono_700Bold',
              fontSize: 36,
              fontWeight: '700',
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
              width: 100,
            }}
          >
            ??.?
          </Animated.Text>
          <Animated.Text
            className="text-neutral-950"
            style={{
              fontFamily: 'JetBrainsMono_700Bold',
              fontSize: 36,
              fontWeight: '700',
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
              width: 100,
            }}
          >
            {card.index.toFixed(1)}
          </Animated.Text>
        </LinearGradient>
      </View>
    </View>
  );
}
