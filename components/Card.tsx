import React from 'react';
import { Text, View } from 'react-native';

type CardProps = {
  body?: string;
  children?: React.ReactNode;
  title?: string;
};

export function Card({ body, children, title }: CardProps) {
  return (
    <View className="rounded-xl bg-neutral-900/40 p-4">
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
