import { useEffect, useRef } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { cardDescription, cardTitle } from '@/lib/cardText';
import {
  LANE_CARD_HEIGHT,
  LANE_CARD_SUBTITLE_LINES,
  LANE_CARD_TITLE_LINES,
} from '@/lib/localMovePresentation';
import { Language } from '@/types';

export function LaneCard({ card, hiddenScore = false, isNew = false, language }: {
  card: any;
  hiddenScore?: boolean;
  isNew?: boolean;
  language: Language;
}) {
  const entrance = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (!isNew) {
      entrance.setValue(1);
      return;
    }
    entrance.setValue(0);
    Animated.spring(entrance, {
      damping: 10,
      mass: 0.7,
      stiffness: 150,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance, isNew]);

  return (
    <Animated.View style={{
      opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
      transform: [
        { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
        { scale: entrance.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.9, 1.045, 1] }) },
        { rotate: entrance.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '0deg'] }) },
      ],
    }}>
      <View className="flex-row items-center gap-3 rounded-xl bg-neutral-900/40 px-3 py-0" style={{ height: LANE_CARD_HEIGHT }}>
        <View className="h-[72px] w-16 items-center justify-center overflow-hidden rounded-xl bg-black">
          {!hiddenScore && card.image ? (
            <>
              <Image
                resizeMode="cover"
                source={{ uri: card.image }}
                style={{ bottom: 0, left: 0, opacity: 0.25, position: 'absolute', right: 0, top: 0 }}
              />
              <View style={{ backgroundColor: 'rgba(0,0,0,0.25)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }} />
            </>
          ) : null}
          <Text className="text-center font-mono text-xl font-black text-amber-400">
            {hiddenScore ? '?.??' : card.index.toFixed(2)}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <Text className="text-base font-black uppercase leading-[18px] text-neutral-100" ellipsizeMode="tail" numberOfLines={LANE_CARD_TITLE_LINES}>
            {cardTitle(card, language)}
          </Text>
          {cardDescription(card, language) ? (
            <Text className="mt-1 text-xs leading-4 text-neutral-500" ellipsizeMode="tail" numberOfLines={LANE_CARD_SUBTITLE_LINES}>
              {cardDescription(card, language)}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
