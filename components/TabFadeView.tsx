import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function TabFadeView({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, {
        duration: 240,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }).start();

      return () => {
        opacity.stopAnimation();
        opacity.setValue(0);
      };
    }, [opacity])
  );

  return (
    <Animated.View className="flex-1 bg-neutral-950" style={{ opacity }}>
      {children}
    </Animated.View>
  );
}
