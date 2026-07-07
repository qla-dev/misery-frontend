import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, ScrollViewProps, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';

type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'light';

export function Surface({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`rounded-xl border border-neutral-900 bg-neutral-900/35 p-4 ${className}`}>
      {children}
    </View>
  );
}

export function AppButton({
  children,
  onPress,
  disabled,
  variant = 'secondary',
  className = '',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
}) {
  const content = (
    <View className={`min-h-12 flex-row items-center justify-center gap-2 px-4 ${className}`}>
      {children}
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.9 : 1 })}
        className="overflow-hidden rounded-xl"
      >
        <LinearGradient colors={['#fbbf24', '#facc15', '#fbbf24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantClass =
    variant === 'light'
      ? 'bg-white'
      : variant === 'dark'
        ? 'bg-black border border-neutral-800'
        : 'bg-neutral-900/45 border border-neutral-800';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: disabled ? 0.5 : pressed ? 0.9 : 1 })}
      className={`rounded-xl ${variantClass}`}
    >
      {content}
    </Pressable>
  );
}

export function SegmentTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row rounded-xl border border-neutral-900 bg-neutral-950/55 p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-lg ${
              selected ? 'bg-amber-400' : ''
            }`}
          >
            {option.icon}
            <Text className={`text-xs font-black uppercase tracking-wider ${selected ? 'text-black' : 'text-neutral-500'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ScreenScroll({
  children,
  contentContainerStyle,
  ...props
}: ScrollViewProps & { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-neutral-950"
      contentContainerStyle={[
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 24,
        },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function Section({
  titleEn,
  titleBs,
  children,
  className = '',
  gap = 'md',
}: {
  titleEn?: string;
  titleBs?: string;
  children: React.ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}) {
  const { language } = useGame();
  const gapValue = gap === 'sm' ? 8 : gap === 'lg' ? 24 : 14;

  return (
    <View className={className} style={{ gap: gapValue }}>
      {titleEn && (
        <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
          {language === 'bs' && titleBs ? titleBs : titleEn}
        </Text>
      )}
      {children}
    </View>
  );
}
