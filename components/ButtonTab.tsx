import React from 'react';
import { Pressable, Text } from 'react-native';

interface ButtonTabProps {
  category: 'button' | 'tab';
  type: 'primary' | 'secondary' | 'third';
  size: '50' | '100' | 'auto';
  onPress?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ButtonTab({
  category,
  type,
  size,
  onPress,
  children,
  disabled = false,
  className = '',
}: ButtonTabProps) {
  // Determine size styling
  const sizeStyle =
    size === '50'
      ? { width: '50%' }
      : size === '100'
        ? { width: '100%' }
        : { width: 'auto' };

  // Determine category height & padding
  const categoryClass = category === 'tab' ? 'h-[60px] rounded-xl' : 'h-[58px] rounded-xl';
  
  // Determine type colors
  const typeClass =
    type === 'primary'
      ? 'bg-amber-400 border border-amber-400'
      : type === 'third'
        ? 'bg-white border border-white'
        : 'bg-transparent border border-neutral-800';

  const stateClass = disabled ? 'bg-neutral-800 border-transparent' : typeClass;

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
      {typeof children === 'string' ? (
        <Text
          className={`uppercase tracking-wider font-black ${
            category === 'tab' ? 'text-[15px]' : 'text-sm'
          } ${disabled ? 'text-neutral-500' : type === 'primary' || type === 'third' ? 'text-neutral-950' : 'text-neutral-400'}`}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
