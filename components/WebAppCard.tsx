import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Card, Language } from '@/types';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

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
  const title = isBs ? card.titleBs : card.titleEn;
  const description = isBs ? card.descriptionBs : card.descriptionEn;
  const artworkSize = Math.min(width * 0.76, height * 0.39);
  const scoreSize = Math.min(112, width * 0.31);

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

      <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
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
              marginTop: 9,
              maxWidth: width * 0.72,
              textAlign: 'center',
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          alignItems: 'center',
          backgroundColor: scoreRevealed ? '#facc15' : '#f5f5f3',
          borderRadius: scoreSize / 2,
          bottom: -18,
          height: scoreSize,
          justifyContent: 'flex-start',
          left: (width - scoreSize) / 2,
          paddingTop: 16,
          position: 'absolute',
          width: scoreSize,
        }}
      >
        <Text style={{ color: '#090909', fontFamily: 'BebasNeue_400Regular', fontSize: 43, lineHeight: 45 }}>
          {scoreRevealed ? card.index.toFixed(2) : '?.??'}
        </Text>
        <Text style={{ color: '#090909', fontFamily: 'JetBrainsMono_700Bold', fontSize: 6, letterSpacing: 1.1 }}>
          {isBs ? 'STOPA PATNJE' : 'MISERY RATE'}
        </Text>
      </View>
    </LinearGradient>
  );
}
