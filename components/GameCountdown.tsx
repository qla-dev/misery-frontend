import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const STEPS = [3, 2, 1, 'GO'] as const;
const STEP_DELAYS = [0, 2000, 3000, 4000];
const COMPLETE_DELAY = 5475;
const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

interface GameCountdownProps {
  bottomLabel: string;
  finalLabel: string;
  onComplete: () => void;
}

export function GameCountdown({ bottomLabel, finalLabel, onComplete }: GameCountdownProps) {
  const { width, height } = useWindowDimensions();
  const steps = useMemo(() => [3, 2, 1, finalLabel], [finalLabel]);
  const [stepIndex, setStepIndex] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const rings = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;
  const onCompleteRef = useRef(onComplete);
  const ringSize = Math.min(width * 1.72, height * 0.76);
  const originSize = Math.min(width * 0.48, height * 0.216);
  const value = steps[stepIndex];
  const isFinal = stepIndex === steps.length - 1;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timers = STEPS.slice(1).map((_, index) =>
      setTimeout(() => setStepIndex(index + 1), STEP_DELAYS[index + 1])
    );
    const exitTimer = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 1,
        duration: 360,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, COMPLETE_DELAY - 360);
    const completeTimer = setTimeout(() => onCompleteRef.current(), COMPLETE_DELAY);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [exit]);

  useEffect(() => {
    const animations = rings.map((ring, index) => {
      ring.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 360),
          Animated.timing(ring, {
            toValue: 1,
            duration: 2300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring, { toValue: 0, duration: 1, useNativeDriver: true }),
        ])
      );
    });
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [rings]);

  useEffect(() => {
    if (isFinal) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulse.setValue(0);
    Animated.timing(pulse, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isFinal, pulse, value]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.titleAmber}>M</Text>
            <LottieView autoPlay loop source={MASCOT_LOTTIE} style={styles.mascot} />
            <Text style={styles.titleAmber}>SERY</Text>
          </View>
          <Text style={styles.titleWhite}>METER</Text>
        </View>
        <View style={[styles.stage, { height: height * 0.32 }]}>
        <View style={[styles.countShape, { height: originSize, width: originSize }]}>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ringLayer]}>
            {rings.map((ring, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.ring,
                  {
                    width: ringSize,
                    height: ringSize,
                    borderRadius: ringSize / 2,
                    opacity: ring.interpolate({ inputRange: [0, 0.58, 1], outputRange: [0.22, 0.14, 0] }),
                    transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [originSize / ringSize, 1.22] }) }],
                  },
                ]}
              />
            ))}
          </View>
          <Animated.Text
            style={[
              styles.count,
              { fontSize: isFinal ? originSize * 0.58 : originSize * 0.82, lineHeight: originSize },
              {
                opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [
                  { translateX: value === 1 ? -2 : 0 },
                  { translateY: isFinal ? originSize * 0.015 : originSize * 0.045 },
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) },
                  { scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) },
                ],
              },
            ]}
          >
            {value}
          </Animated.Text>
        </View>
        </View>
        <Text style={styles.bottom}>{bottomLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: { alignItems: 'center', transform: [{ translateY: -31 }], width: '100%' },
  titleBlock: { alignItems: 'center', marginBottom: -15 },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  titleAmber: {
    color: '#fbbf24',
    fontFamily: 'Outfit_900Black',
    fontSize: 66,
    letterSpacing: -2,
    lineHeight: 66,
  },
  titleWhite: {
    color: '#ffffff',
    fontFamily: 'Outfit_900Black',
    fontSize: 66,
    letterSpacing: -2,
    lineHeight: 66,
    marginTop: -16,
  },
  mascot: {
    height: 95,
    marginBottom: -4,
    marginHorizontal: -4,
    marginTop: -52,
    transform: [{ translateY: -5 }, { translateX: 5 }],
    width: 44,
  },
  stage: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  countShape: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  ringLayer: { alignItems: 'center', justifyContent: 'center' },
  ring: { backgroundColor: 'rgba(251,191,36,0.1)', position: 'absolute' },
  count: {
    bottom: 0,
    color: '#fbbf24',
    fontFamily: 'BebasNeue_400Regular',
    includeFontPadding: false,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    textShadowColor: 'rgba(251,191,36,0.5)',
    textShadowOffset: { width: 0, height: 12 },
    textShadowRadius: 24,
    zIndex: 2,
  },
  bottom: {
    color: '#ffffff',
    fontFamily: 'Outfit_700Bold',
    fontSize: 20,
    letterSpacing: 1.5,
    paddingTop: 10,
  },
});
