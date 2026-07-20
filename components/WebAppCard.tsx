import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Card, Language } from '@/types';
import { cardDescription, cardTitle } from '@/lib/cardText';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');
const SCORE_FOOTER_HEIGHT = 104;
const SCORE_TAB_HEIGHT = 70;
const SCORE_TAB_BOTTOM = -2;
const SCORE_LABEL_HEIGHT = SCORE_FOOTER_HEIGHT - SCORE_TAB_HEIGHT - SCORE_TAB_BOTTOM;
const HEADER_GAP = 5;
const HEADER_PADDING = 20;

type WebAppCardProps = {
  card: Card;
  height: number;
  language: Language;
  scoreRevealed?: boolean;
  width: number;
};

export function WebAppCard({ card, height, language, scoreRevealed = false, width }: WebAppCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const isBs = language === 'bs';
  const title = cardTitle(card, language);
  const description = cardDescription(card, language);
  const artworkSize = Math.min(width * 0.76, height * 0.39);
  const scoreTabWidth = Math.min(112, width * 0.31);

  useEffect(() => setImageFailed(false), [card.image]);

  return (
    <LinearGradient
      colors={['#1d1d1d', '#101010', '#090909']}
      end={{ x: 0.82, y: 1 }}
      start={{ x: 0.12, y: 0 }}
      style={{
        borderColor: '#404040',
        borderRadius: 24,
        borderWidth: 1,
        height,
        overflow: 'hidden',
        padding: 18,
        width,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          borderColor: 'rgba(255,255,255,0.07)',
          borderRadius: 18,
          borderWidth: 1,
          bottom: 7,
          left: 7,
          position: 'absolute',
          right: 7,
          top: 7,
        }}
      />

      <View className="flex-row items-center justify-between">
        <Text style={{ color: '#888888', fontFamily: 'JetBrainsMono_700Bold', fontSize: 8, letterSpacing: 1.4 }}>
          MISERY
        </Text>
        <Text style={{ color: '#888888', fontFamily: 'JetBrainsMono_700Bold', fontSize: 8, letterSpacing: 1.4 }}>
          MM–{String(Math.round(card.index * 10)).padStart(3, '0')}
        </Text>
      </View>

      <View
        style={{
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: '#191919',
          borderRadius: artworkSize / 2,
          height: artworkSize,
          justifyContent: 'center',
          marginBottom: 18,
          marginTop: 26,
          overflow: 'hidden',
          width: artworkSize,
        }}
      >
        {card.image && !imageFailed ? (
          <Image
            accessibilityLabel={title}
            onError={() => setImageFailed(true)}
            resizeMode="contain"
            source={{ uri: card.image }}
            style={{ height: artworkSize * 1.2, width: artworkSize * 1.2 }}
          />
        ) : (
          <LottieView
            autoPlay
            loop
            source={MASCOT_LOTTIE}
            style={{
              height: artworkSize * 1.24,
              transform: [{ rotate: '-6deg' }, { scale: 1.2 }],
              width: artworkSize * 0.46,
            }}
          />
        )}
      </View>

      <View
        style={{
          alignItems: 'center',
          paddingBottom: HEADER_PADDING,
          paddingHorizontal: 12,
          paddingTop: HEADER_PADDING,
          rowGap: HEADER_GAP,
        }}
      >
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          numberOfLines={3}
          style={{
            color: '#f8f8f5',
            fontFamily: 'BebasNeue_400Regular',
            fontSize: Math.min(34, width * 0.087),
            letterSpacing: 0.8,
            lineHeight: Math.min(35, width * 0.09),
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        {description ? (
          <Text
            numberOfLines={3}
            style={{
              color: '#898989',
              fontFamily: 'Outfit_400Regular',
              fontSize: 11,
              lineHeight: 16,
              maxWidth: width * 0.72,
              textAlign: 'center',
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <View
        pointerEvents="none"
        style={{
          backgroundColor: '#000000',
          bottom: 0,
          height: SCORE_FOOTER_HEIGHT,
          left: 0,
          position: 'absolute',
          right: 0,
        }}
      />
      <View style={{ alignItems: 'center', bottom: 0, height: SCORE_FOOTER_HEIGHT, left: 0, position: 'absolute', right: 0 }}>
        <View style={{ alignItems: 'center', height: SCORE_LABEL_HEIGHT, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 }}>
          <Text style={{ color: '#facc15', fontFamily: 'BebasNeue_400Regular', fontSize: 15, letterSpacing: 1.2, lineHeight: 17, textAlign: 'center', width: scoreTabWidth }}>
            {isBs ? 'STOPA PATNJE' : 'MISERY RATE'}
          </Text>
        </View>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#facc15',
            bottom: SCORE_TAB_BOTTOM,
            height: SCORE_TAB_HEIGHT,
            justifyContent: 'center',
            position: 'absolute',
            width: scoreTabWidth,
          }}
        >
          <Text style={{ color: '#090909', fontFamily: 'BebasNeue_400Regular', fontSize: 42, lineHeight: 70, textAlign: 'center', width: scoreTabWidth }}>
            {scoreRevealed ? card.index.toFixed(2) : '?.??'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
