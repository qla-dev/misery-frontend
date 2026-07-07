import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text } from 'react-native';

interface GradientButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function GradientButton({
  onPress,
  disabled,
  children,
  className = '',
  textClassName = '',
}: GradientButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
      className={`rounded-xl overflow-hidden ${disabled ? 'opacity-50' : ''}`}
    >
      <LinearGradient
        colors={['#fbbf24', '#facc15', '#fbbf24']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={`py-4 px-4 flex-row items-center justify-center gap-2 ${className}`}
      >
        <Text className={`text-black font-black uppercase text-xs tracking-wider ${textClassName}`}>{children}</Text>
      </LinearGradient>
    </Pressable>
  );
}
