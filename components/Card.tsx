import React from 'react';
import { Text, View } from 'react-native';

type CardProps = {
  body?: string;
  children?: React.ReactNode;
  title?: string;
  transparent?: boolean;
};

export function Card({ body, children, title, transparent = false }: CardProps) {
  return (
    <View className={`rounded-xl p-4 ${transparent ? 'bg-transparent' : 'bg-neutral-900/40'}`}>
      {title ? (
        <Text className="mb-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-400">
          {title}
        </Text>
      ) : null}
      {body ? <Text className="text-sm leading-6 text-neutral-300">{body}</Text> : null}
      {children}
    </View>
  );
}
