import React, { useRef, useState } from 'react';
import { Pressable, TextInput, TextInputProps } from 'react-native';

export function AppInput({
  leftIcon,
  className = '',
  inputClassName = '',
  onBlur,
  onFocus,
  placeholderTextColor = '#404040',
  style,
  ...props
}: TextInputProps & {
  leftIcon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable
      accessibilityRole="none"
      className={`h-[58px] flex-row items-center gap-3.5 rounded-xl border px-4 ${
        focused ? 'border-amber-400' : 'border-neutral-800'
      } ${className}`}
      onPress={() => inputRef.current?.focus()}
    >
      {leftIcon}
      <TextInput
        ref={inputRef}
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
        style={[
          {
            height: 28,
            includeFontPadding: false,
            paddingBottom: 0,
            paddingTop: 0,
            textAlignVertical: 'center',
          },
          style,
        ]}
        underlineColorAndroid="transparent"
        {...props}
      />
    </Pressable>
  );
}
