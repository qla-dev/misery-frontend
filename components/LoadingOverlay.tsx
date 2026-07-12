import React, { useEffect, useRef, useState } from 'react';
import LottieView from 'lottie-react-native';
import { Animated, Modal, Text, View } from 'react-native';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

const COPY = {
  createEn: {
    title: 'CREATING YOUR ROOM',
    steps: [
      'Setting up your room...',
      'Creating a private room code...',
      'Making space for your players...',
      'Adding the finishing touches...',
    ],
  },
  createBs: {
    title: 'KREIRAMO TVOJU SOBU',
    steps: [
      'Pripremamo tvoju sobu...',
      'Kreiramo privatni kod sobe...',
      'Pravimo mjesto za igrače...',
      'Dodajemo završne detalje...',
    ],
  },
  startEn: {
    title: 'STARTING THE GAME',
    steps: [
      'Preparing the game table...',
      'Shuffling the misery cards...',
      'Getting every player ready...',
      'The game is almost ready...',
    ],
  },
  startBs: {
    title: 'POKREĆEMO IGRU',
    steps: [
      'Pripremamo stol za igru...',
      'Miješamo karte nesreće...',
      'Pripremamo sve igrače...',
      'Igra je skoro spremna...',
    ],
  },
};

type LoadingOverlayProps = {
  isBs?: boolean;
  mode?: 'create' | 'start';
  visible: boolean;
};

export function LoadingOverlay({ isBs = false, mode = 'create', visible }: LoadingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const copy = mode === 'start'
    ? (isBs ? COPY.startBs : COPY.startEn)
    : (isBs ? COPY.createBs : COPY.createEn);

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      opacity.setValue(1);
      return;
    }

    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(opacity, { duration: 180, toValue: 0, useNativeDriver: true }),
        Animated.timing(opacity, { duration: 180, toValue: 1, useNativeDriver: true }),
      ]).start();
      setStepIndex((current) => (current + 1) % copy.steps.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [copy.steps.length, opacity, visible]);

  const message = copy.steps[stepIndex];

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityViewIsModal
        className="flex-1 items-center justify-center bg-black/95 px-8"
      >
        <View className="w-full max-w-sm items-center" style={{ transform: [{ translateY: -36 }] }}>
          <Animated.View
            className="min-h-12 items-center justify-center"
            style={{ opacity }}
          >
            <Text className="text-center text-sm font-bold leading-5 text-neutral-300">
              {message}
            </Text>
          </Animated.View>

          <LottieView
            autoPlay
            loop
            source={MASCOT_LOTTIE}
            style={{ height: 148, marginVertical: 18, width: 112 }}
          />

          <Text className="text-center text-xl font-black uppercase tracking-wider text-amber-400">
            {copy.title}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
