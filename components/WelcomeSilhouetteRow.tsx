import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import LottieView from 'lottie-react-native';
import ManSilhouette from './ManSilhouette';

const RAIN_LOTTIE = require('../assets/animations/rain.json');
const SILHOUETTE_COUNT = 7;
const CENTER_INDEX = 3;
const ITEM_WIDTH = 64;
const GROUP_WIDTH = SILHOUETTE_COUNT * ITEM_WIDTH;

export function WelcomeSilhouetteRow({ flip = false }: { flip?: boolean }) {
  const motion = useRef(new Animated.Value(0)).current;
  const centerWhiteOpacity = useRef(new Animated.Value(0)).current;
  const centerShock = useRef(new Animated.Value(0)).current;
  const cloudY = useRef(new Animated.Value(-8)).current;
  const cancelledRef = useRef(false);
  const movementRef = useRef<Animated.CompositeAnimation | null>(null);
  const blinkRef = useRef<Animated.CompositeAnimation | null>(null);
  const whiteFadeRef = useRef<Animated.CompositeAnimation | null>(null);
  const cloudFloatRef = useRef<Animated.CompositeAnimation | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    cancelledRef.current = false;

    const startCloudFloat = (returningFromStrike = false) => {
      cloudFloatRef.current?.stop();
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(cloudY, {
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            toValue: -11,
            useNativeDriver: true,
          }),
          Animated.timing(cloudY, {
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            toValue: -8,
            useNativeDriver: true,
          }),
        ])
      );
      cloudFloatRef.current = returningFromStrike
        ? Animated.sequence([
            Animated.timing(cloudY, {
              duration: 350,
              easing: Easing.out(Easing.quad),
              toValue: -8,
              useNativeDriver: true,
            }),
            float,
          ])
        : float;
      cloudFloatRef.current.start();
    };

    const runCycle = (carryWhiteIntoMovement = false) => {
      if (cancelledRef.current) return;
      if (!carryWhiteIntoMovement) centerWhiteOpacity.setValue(0);
      centerShock.setValue(0);
      motion.setValue(0);

      startCloudFloat(carryWhiteIntoMovement);

      if (carryWhiteIntoMovement) {
        whiteFadeRef.current = Animated.sequence([
          Animated.delay(2000),
          Animated.timing(centerWhiteOpacity, {
            duration: 1000,
            easing: Easing.inOut(Easing.quad),
            toValue: 0,
            useNativeDriver: true,
          }),
        ]);
        whiteFadeRef.current.start();
      }

      movementRef.current = Animated.sequence([
        Animated.timing(motion, {
          duration: 1400,
          easing: Easing.linear,
          toValue: -GROUP_WIDTH * 0.18,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          duration: 1200,
          easing: Easing.bezier(0.35, 0.225, 0.7, 0.55),
          toValue: -GROUP_WIDTH * 0.42,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          duration: 600,
          easing: Easing.linear,
          toValue: -GROUP_WIDTH * 0.72,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          duration: 1400,
          easing: Easing.bezier(0.2, 0.5, 0.65, 1),
          toValue: -GROUP_WIDTH,
          useNativeDriver: true,
        }),
      ]);

      movementRef.current.start(({ finished }) => {
        if (!finished || cancelledRef.current) return;

        // The next repeated group now occupies the exact same pixels. Resetting
        // to the middle group is therefore invisible and restores alignment.
        motion.setValue(0);
        cloudFloatRef.current?.stop();
        blinkRef.current = Animated.sequence([
          Animated.delay(1150),
          Animated.timing(cloudY, {
            duration: 350,
            easing: Easing.inOut(Easing.quad),
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(centerWhiteOpacity, { duration: 60, toValue: 1, useNativeDriver: true }),
              Animated.timing(centerWhiteOpacity, { duration: 50, toValue: 0.05, useNativeDriver: true }),
              Animated.timing(centerWhiteOpacity, { duration: 55, toValue: 1, useNativeDriver: true }),
              Animated.timing(centerWhiteOpacity, { duration: 45, toValue: 0, useNativeDriver: true }),
              Animated.timing(centerWhiteOpacity, { duration: 55, toValue: 1, useNativeDriver: true }),
              Animated.timing(centerWhiteOpacity, { duration: 50, toValue: 0.15, useNativeDriver: true }),
              Animated.timing(centerWhiteOpacity, { duration: 60, toValue: 1, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(centerShock, { duration: 55, toValue: -3, useNativeDriver: true }),
              Animated.timing(centerShock, { duration: 55, toValue: 4, useNativeDriver: true }),
              Animated.timing(centerShock, { duration: 50, toValue: -4, useNativeDriver: true }),
              Animated.timing(centerShock, { duration: 50, toValue: 3, useNativeDriver: true }),
              Animated.timing(centerShock, { duration: 55, toValue: -2, useNativeDriver: true }),
              Animated.timing(centerShock, { duration: 55, toValue: 2, useNativeDriver: true }),
              Animated.timing(centerShock, { duration: 80, toValue: 0, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(cloudY, {
                duration: 120,
                easing: Easing.out(Easing.quad),
                toValue: -4,
                useNativeDriver: true,
              }),
              Animated.timing(cloudY, {
                duration: 140,
                easing: Easing.inOut(Easing.quad),
                toValue: 2,
                useNativeDriver: true,
              }),
              Animated.timing(cloudY, {
                duration: 120,
                easing: Easing.out(Easing.quad),
                toValue: 0,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]);
        blinkRef.current.start(({ finished: blinkFinished }) => {
          if (blinkFinished && !cancelledRef.current) runCycle(true);
        });
      });
    };

    runCycle();
    return () => {
      cancelledRef.current = true;
      movementRef.current?.stop();
      blinkRef.current?.stop();
      whiteFadeRef.current?.stop();
      cloudFloatRef.current?.stop();
    };
  }, [centerShock, centerWhiteOpacity, cloudY, motion]);

  const centeredOffset = (viewportWidth - GROUP_WIDTH) / 2 - GROUP_WIDTH;

  return (
    <View
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      style={{ alignSelf: 'stretch', height: 124, marginHorizontal: -20, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          alignItems: 'flex-end',
          bottom: 0,
          flexDirection: 'row',
          opacity: viewportWidth > 0 ? 1 : 0,
          position: 'absolute',
          transform: [{ translateX: Animated.add(motion, centeredOffset) }],
          width: GROUP_WIDTH * 3,
        }}
      >
        {Array.from({ length: 3 }).flatMap((_, groupIndex) =>
          Array.from({ length: SILHOUETTE_COUNT }).map((__, index) => {
            const isCenter = index === CENTER_INDEX;
            const isRestingCenter = groupIndex === 1 && isCenter;
            return (
              <Animated.View
                key={`${groupIndex}-${index}`}
                style={{
                  alignItems: 'center',
                  opacity: isCenter ? 1 : 0.92,
                  transform: [
                    { scaleX: index % 2 === 0 ? -1 : 1 },
                    { translateY: flip ? 2 : 0 },
                    { translateX: isRestingCenter ? centerShock : 0 },
                  ],
                  width: ITEM_WIDTH,
                }}
              >
                <ManSilhouette color="#facc15" height={96} width={72} />
                {isRestingCenter ? (
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      bottom: 0,
                      opacity: centerWhiteOpacity,
                      position: 'absolute',
                    }}
                  >
                    <ManSilhouette color="#ffffff" height={96} width={72} />
                  </Animated.View>
                ) : null}
              </Animated.View>
            );
          })
        )}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={{
          height: 58,
          left: '50%',
          marginLeft: -29,
          position: 'absolute',
          top: 0,
          transform: [{ translateY: cloudY }],
          width: 58,
          zIndex: 20,
        }}
      >
        <LottieView autoPlay loop source={RAIN_LOTTIE} style={{ height: 58, width: 58 }} />
      </Animated.View>
    </View>
  );
}
