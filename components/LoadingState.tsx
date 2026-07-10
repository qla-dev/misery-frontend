import React from 'react';
import LottieView from 'lottie-react-native';
import { Text, View } from 'react-native';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

type LoadingStateProps = {
  children?: React.ReactNode;
  message: string;
};

export function LoadingState({ children, message }: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <View
        className="items-center justify-center"
        style={{ gap: 16, transform: [{ translateY: -10 }] }}
      >
        <LottieView
          autoPlay
          loop
          source={MASCOT_LOTTIE}
          style={{ height: 96, width: 72 }}
        />
        <Text className="text-center text-sm font-black uppercase tracking-wider text-amber-400">
          {message}
        </Text>
        {children}
      </View>
    </View>
  );
}
