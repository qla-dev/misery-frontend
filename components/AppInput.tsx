import React, { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

export function AppInput({
  leftIcon,
  className = '',
  inputClassName = '',
  onBlur,
  onFocus,
  placeholderTextColor = '#404040',
  ...props
}: TextInputProps & {
  leftIcon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      className={`h-[58px] flex-row items-center gap-3.5 rounded-xl border px-4 ${
        focused ? 'border-amber-400' : 'border-neutral-800'
      } ${className}`}
    >
      {leftIcon}
      <TextInput
        placeholderTextColor={placeholderTextColor}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={`flex-1 py-0 text-sm font-semibold text-neutral-200 ${inputClassName}`}
        {...props}
      />
    </View>
  );
}
