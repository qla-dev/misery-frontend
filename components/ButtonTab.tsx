import React from 'react';
import { Pressable, Text } from 'react-native';
import { GlassView } from 'expo-glass-effect';

interface ButtonTabProps {
  category: 'button' | 'tab';
  type: 'primary' | 'secondary' | 'third' | 'success' | 'danger';
  size: '50' | '100' | 'auto';
  onPress?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  glassEffect?: boolean;
}

export function ButtonTab({
  category,
  type,
  size,
  onPress,
  children,
  disabled = false,
  className = '',
  glassEffect = false,
}: ButtonTabProps) {
  // Determine size styling
  const sizeStyle =
    category === 'tab'
      ? { alignSelf: 'flex-start' as const }
      : size === '50'
      ? { width: '50%' }
      : size === '100'
        ? { width: '100%' }
        : { width: 'auto' };

  // Tabs stay compact; regular buttons retain the larger touch target.
  const categoryClass = category === 'tab' ? 'h-11 rounded-xl' : 'h-[58px] rounded-xl';
  
  // Determine type colors
  const typeClass =
    type === 'primary'
      ? 'bg-amber-400 border border-amber-400'
      : type === 'success'
        ? 'bg-emerald-500 border border-emerald-500'
        : type === 'danger'
          ? 'bg-red-500 border border-red-500'
      : type === 'third'
        ? 'bg-white border border-white'
        : 'bg-transparent border border-neutral-800';

  const stateClass = disabled
    ? 'bg-neutral-800 border-neutral-800'
    : typeClass;

  const content = typeof children === 'string' ? (
    <Text
      className={`uppercase tracking-wider font-black ${
        category === 'tab' ? 'text-[15px]' : 'text-sm'
      } ${disabled ? 'text-neutral-500' : type === 'primary' || type === 'third' || type === 'success' || type === 'danger' ? 'text-neutral-950' : 'text-neutral-400'}`}
    >
      {children}
    </Text>
  ) : (
    children
  );

  if (glassEffect && !disabled) {
    return (
      <GlassView
        colorScheme="dark"
        glassEffectStyle="regular"
        isInteractive
        style={[
          sizeStyle as any,
          { borderRadius: 12, height: category === 'tab' ? 44 : 58, overflow: 'hidden' },
        ]}
        tintColor={
          type === 'primary'
            ? 'rgba(251,191,36,0.22)'
            : type === 'success'
              ? 'rgba(16,185,129,0.28)'
              : type === 'danger'
                ? 'rgba(239,68,68,0.28)'
                : 'rgba(255,255,255,0.08)'
        }
      >
        <Pressable
          className={`h-full flex-row items-center justify-center gap-2 px-4 ${category === 'button' ? 'w-full' : ''} ${className}`}
          onPress={onPress}
        >
          {content}
        </Pressable>
      </GlassView>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        sizeStyle as any,
        { opacity: pressed ? 0.8 : 1 }
      ]}
      className={`flex-row items-center justify-center gap-2 border px-4 ${categoryClass} ${stateClass} ${className}`}
    >
      {content}
    </Pressable>
  );
}
