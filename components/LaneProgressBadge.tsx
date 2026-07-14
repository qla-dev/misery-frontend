import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

export type LaneProgress = {
  /** Leading text, e.g. "LANE OF ALEX". */
  label: string;
  /** Cards already in the lane, before this move's card is added. */
  count: number;
  /** Cards needed to win (target score). */
  target: number;
  /** Whether this move adds a card to the lane (correct / steal). */
  addsCard: boolean;
};

type LaneProgressBadgeProps = LaneProgress & {
  dark?: boolean;
};

/**
 * Bottom-of-overlay lane summary, e.g. "LANE OF ALEX 0/7".
 * When a card is added it animates a "+1" that fades in above the count digit,
 * then blends down into it while the count ticks up (0 -> 1).
 */
export function LaneProgressBadge({ label, count, target, addsCard, dark = false }: LaneProgressBadgeProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const plusOpacity = useRef(new Animated.Value(0)).current;
  const plusTranslate = useRef(new Animated.Value(0)).current;
  const countScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setDisplayCount(count);
    plusOpacity.setValue(0);
    plusTranslate.setValue(0);
    countScale.setValue(1);

    if (!addsCard) return;

    const sequence = Animated.sequence([
      Animated.delay(450),
      // "+1" pops in and floats above the counter.
      Animated.parallel([
        Animated.timing(plusOpacity, {
          duration: 260,
          easing: Easing.out(Easing.back(2)),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(plusTranslate, {
          duration: 260,
          easing: Easing.out(Easing.quad),
          toValue: -16,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(430),
      // "+1" drops down into the counter and fades as it blends in.
      Animated.parallel([
        Animated.timing(plusOpacity, {
          duration: 240,
          easing: Easing.in(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(plusTranslate, {
          duration: 240,
          easing: Easing.in(Easing.quad),
          toValue: 6,
          useNativeDriver: true,
        }),
      ]),
    ]);

    // Tick the counter up right as the "+1" blends into it.
    const bump = setTimeout(() => {
      setDisplayCount(count + 1);
      Animated.sequence([
        Animated.timing(countScale, {
          duration: 120,
          easing: Easing.out(Easing.quad),
          toValue: 1.4,
          useNativeDriver: true,
        }),
        Animated.spring(countScale, {
          damping: 6,
          stiffness: 220,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }, 450 + 260 + 430 + 30);

    sequence.start();
    return () => {
      sequence.stop();
      clearTimeout(bump);
    };
  }, [addsCard, count, countScale, label, plusOpacity, plusTranslate, target]);

  const color = dark ? '#0a0a0a' : '#ffffff';

  return (
    <View className="flex-row items-center justify-center">
      <Text
        className="text-4xl font-black uppercase tracking-wider"
        numberOfLines={1}
        style={{ color }}
      >
        {label}{' '}
      </Text>
      {/* Count digit gets its own container so the "+1" can float directly above it. */}
      <View className="items-center">
        <Animated.Text
          className="text-4xl font-black uppercase tracking-wider"
          numberOfLines={1}
          style={{ color, transform: [{ scale: countScale }] }}
        >
          {displayCount}
        </Animated.Text>
        {addsCard && (
          <View
            className="items-center"
            pointerEvents="none"
            style={{ bottom: '100%', left: 0, position: 'absolute', right: 0 }}
          >
            <Animated.Text
              className="text-2xl font-black uppercase tracking-wider"
              style={{
                color,
                opacity: plusOpacity,
                textAlign: 'center',
                transform: [{ translateY: plusTranslate }],
                width: 48,
              }}
            >
              +1
            </Animated.Text>
          </View>
        )}
      </View>
      <Text
        className="text-4xl font-black uppercase tracking-wider"
        numberOfLines={1}
        style={{ color }}
      >
        /{target}
      </Text>
    </View>
  );
}
