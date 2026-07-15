import React, { useEffect, useState } from 'react';
import { Card, Language } from '@/types';
import Illustration from './Illustration';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, Text, View } from 'react-native';
import { cardDescription, cardTitle } from '@/lib/cardText';

interface CardItemProps {
  card: Card;
  state: 'face-up' | 'face-down' | 'mystery';
  language: Language;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  highlighted?: boolean;
  onPress?: () => void;
  fluidHeight?: number;
}

export default function CardItem({
  card,
  state,
  language,
  size = 'md',
  highlighted = false,
  onPress,
  fluidHeight,
}: CardItemProps) {
  const isBs = language === 'bs';
  const title = cardTitle(card, language);
  const description = cardDescription(card, language);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [card.image]);

  let cardSize: { width: number | `${number}%`; height: number | `${number}%` } = { width: 160, height: 224 };
  let iconSize = 'w-16 h-16';
  let indexSize = 20;

  if (size === 'sm') {
    cardSize = { width: 128, height: 176 };
    iconSize = 'w-12 h-12';
    indexSize = 16;
  } else if (size === 'lg') {
    cardSize = { width: 192, height: 272 };
    iconSize = 'w-24 h-24';
    indexSize = 24;
  } else if (size === 'xl') {
    cardSize = { width: '100%', height: fluidHeight ?? 480 };
    iconSize = 'w-36 h-36';
    indexSize = 38;
  }

  if (state === 'face-down') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            width: cardSize.width,
            height: cardSize.height,
            backgroundColor: '#0a0a0a',
            borderColor: 'rgba(251,191,36,0.8)',
            borderWidth: size === 'xl' ? 6 : 2,
            borderRadius: size === 'xl' ? 36 : 14,
            padding: size === 'xl' ? 24 : 16,
            justifyContent: 'space-between',
            opacity: pressed ? 0.95 : 1,
          },
        ]}
        className="relative"
      >
        <View
          className={`absolute border-2 border-amber-400/35 ${size === 'xl' ? 'top-3 left-3 right-3 bottom-3 rounded-[28px]' : 'top-1 left-1 right-1 bottom-1 rounded-lg'}`}
          pointerEvents="none"
        />

        <View className="items-center pt-2 z-10">
          <Text className="text-[8px] text-amber-500/80 font-mono tracking-widest uppercase font-semibold">
            THE ORIGINAL
          </Text>
          <Text className={`${size === 'xl' ? 'text-4xl mt-2' : 'text-sm mt-0.5'} font-black uppercase text-white tracking-tight`}>
            {isBs ? 'INDEKS' : 'MISERY'}
          </Text>
          <Text className={`${size === 'xl' ? 'text-3xl' : 'text-xs'} font-black uppercase tracking-wider text-amber-400`}>
            {isBs ? 'BIJEDE' : 'INDEX'}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center z-10">
          <View className={`${size === 'xl' ? 'w-36 h-36' : 'w-14 h-14'} rounded-full bg-amber-400/5 border-2 border-amber-400/30 items-center justify-center`}>
            <View style={{ width: size === 'xl' ? 96 : 32, height: size === 'xl' ? 96 : 32 }}>
              <Illustration type="lightning" className={size === 'xl' ? 'w-24 h-24' : 'w-8 h-8'} color="#fbbf24" />
            </View>
          </View>
        </View>

        <View className="items-center pb-1 z-10">
          <Text className="text-[7px] font-mono tracking-widest uppercase text-amber-500/60 font-medium">
            {isBs ? 'ŠTETNI DOGAĐAJI • 0 DO 100' : 'LIFE EVENTS • ZERO TO MISERABLE'}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: cardSize.width,
          height: cardSize.height,
          backgroundColor: '#171717',
          borderColor: highlighted ? '#ef4444' : 'rgba(251,191,36,0.8)',
          borderWidth: size === 'xl' ? 6 : 2,
          borderRadius: size === 'xl' ? 36 : 14,
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 12 },
          transform: [{ translateY: pressed ? 4 : 0 }],
        },
      ]}
      className="relative"
    >
      <View className="absolute top-1 left-1 w-2 h-2 border-t border-l border-amber-400/20" pointerEvents="none" />
      <View className="absolute top-1 right-1 w-2 h-2 border-t border-r border-amber-400/20" pointerEvents="none" />
      <View className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-amber-400/20" pointerEvents="none" />
      <View className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-amber-400/20" pointerEvents="none" />

      <View className={`${size === 'xl' ? 'p-7' : 'p-4'} flex-1 items-center justify-start`}>
        {state === 'mystery' && (
          <Text className="mb-2 font-mono text-[7px] font-black uppercase tracking-[2px] text-amber-400">
            MISERY METER
          </Text>
        )}
        <Text
          numberOfLines={3}
          className={`font-sans font-extrabold uppercase tracking-tight text-white mb-1.5 text-center ${size === 'xl' ? 'text-3xl leading-9' : 'text-[11px] leading-snug'}`}
        >
          {title}
        </Text>
        {description && size !== 'sm' && (
          <Text numberOfLines={size === 'xl' ? 4 : 2} className={`${size === 'xl' ? 'text-base leading-6 text-center mt-2' : 'text-[9px] leading-normal'} text-neutral-400 italic opacity-85`}>
            {description}
          </Text>
        )}
      </View>

      <View className="flex-1 items-center justify-center py-1">
        <View className={`${size === 'xl' ? 'w-44 h-44' : 'w-20 h-20'} rounded-full bg-neutral-950/60 items-center justify-center border border-neutral-800/60`}>
          {card.image && !imageFailed ? (
            <Image
              accessibilityLabel={title}
              onError={() => setImageFailed(true)}
              resizeMode="contain"
              source={{ uri: card.image }}
              style={{ height: '88%', width: '88%' }}
            />
          ) : (
            <Illustration type={card.illustrationType} className={iconSize} />
          )}
        </View>
      </View>

      <View>
        {state === 'mystery' ? (
          <LinearGradient
            colors={['#fbbf24', '#facc15', '#fbbf24']}
            className={`${size === 'xl' ? 'py-5 rounded-b-[28px]' : 'py-2 rounded-b-xl'} items-center justify-center`}
          >
            <Text className="text-[7px] font-extrabold tracking-widest leading-none text-neutral-950 opacity-80 uppercase">
              {isBs ? 'STOPA PATNJE' : 'MISERY INDEX'}
            </Text>
            <Text style={{ fontSize: indexSize, lineHeight: indexSize }} className="text-neutral-950 font-mono font-black mt-1">
              ?.??
            </Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#fbbf24', '#facc15', '#fbbf24']}
            className={`${size === 'xl' ? 'py-5 rounded-b-[28px]' : 'py-2 rounded-b-xl'} items-center justify-center`}
          >
            <Text className="text-[7px] font-extrabold tracking-widest leading-none text-neutral-950 opacity-80 uppercase">
              {isBs ? 'STOPA PATNJE' : 'MISERY INDEX'}
            </Text>
            <Text style={{ fontSize: indexSize, lineHeight: indexSize }} className="text-neutral-950 font-mono font-black mt-1">
              {card.index.toFixed(2)}
            </Text>
          </LinearGradient>
        )}
      </View>
    </Pressable>
  );
}
