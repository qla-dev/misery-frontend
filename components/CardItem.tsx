import React from 'react';
import { Card, Language } from '@/types';
import Illustration from './Illustration';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

interface CardItemProps {
  card: Card;
  state: 'face-up' | 'face-down' | 'mystery';
  language: Language;
  size?: 'sm' | 'md' | 'lg';
  highlighted?: boolean;
  onPress?: () => void;
}

export default function CardItem({
  card,
  state,
  language,
  size = 'md',
  highlighted = false,
  onPress,
}: CardItemProps) {
  const isBs = language === 'bs';
  const title = isBs ? card.titleBs : card.titleEn;
  const description = isBs ? card.descriptionBs : card.descriptionEn;

  let cardSize = { width: 160, height: 224 };
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
            borderWidth: 2,
            borderRadius: 14,
            padding: 16,
            justifyContent: 'space-between',
            opacity: pressed ? 0.95 : 1,
          },
        ]}
        className="relative"
      >
        <View
          className="absolute top-1 left-1 right-1 bottom-1 border border-amber-400/15 rounded-lg"
          pointerEvents="none"
        />

        <View className="items-center pt-2 z-10">
          <Text className="text-[8px] text-amber-500/80 font-mono tracking-widest uppercase font-semibold">
            THE ORIGINAL
          </Text>
          <Text className="text-sm font-black uppercase text-white tracking-tight mt-0.5">
            {isBs ? 'INDEKS' : 'MISERY'}
          </Text>
          <Text className="text-xs font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'BIJEDE' : 'INDEX'}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center z-10">
          <View className="w-14 h-14 rounded-full bg-amber-400/5 border border-amber-400/30 items-center justify-center">
            <View style={{ width: 32, height: 32 }}>
              <Illustration type="lightning" className="w-8 h-8" color="#fbbf24" />
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
          borderWidth: 2,
          borderRadius: 14,
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

      <View className="flex-1 p-4 items-center justify-start">
        <Text
          numberOfLines={3}
          className="font-sans font-extrabold uppercase leading-snug tracking-tight text-white text-[11px] mb-1.5"
        >
          {title}
        </Text>
        {description && size !== 'sm' && (
          <Text numberOfLines={2} className="text-[9px] text-neutral-400 leading-normal italic opacity-85">
            {description}
          </Text>
        )}
      </View>

      <View className="flex-1 items-center justify-center py-1">
        <View className="w-20 h-20 rounded-full bg-neutral-950/60 items-center justify-center border border-neutral-800/60">
          <Illustration type={card.illustrationType} className={iconSize} />
        </View>
      </View>

      <View>
        {state === 'mystery' ? (
          <LinearGradient
            colors={['#fbbf24', '#facc15', '#fbbf24']}
            className="py-2 items-center justify-center rounded-b-xl"
          >
            <Text className="text-[7px] font-extrabold tracking-widest leading-none text-neutral-950 opacity-80 uppercase">
              {isBs ? 'INDEKS BIJEDE' : 'MISERY INDEX'}
            </Text>
            <Text style={{ fontSize: indexSize, lineHeight: indexSize }} className="text-neutral-950 font-mono font-black mt-1">
              ?
            </Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={['#fbbf24', '#facc15', '#fbbf24']}
            className="py-2 items-center justify-center rounded-b-xl"
          >
            <Text className="text-[7px] font-extrabold tracking-widest leading-none text-neutral-950 opacity-80 uppercase">
              {isBs ? 'INDEKS BIJEDE' : 'MISERY INDEX'}
            </Text>
            <Text style={{ fontSize: indexSize, lineHeight: indexSize }} className="text-neutral-950 font-mono font-black mt-1">
              {card.index.toFixed(1)}
            </Text>
          </LinearGradient>
        )}
      </View>
    </Pressable>
  );
}
