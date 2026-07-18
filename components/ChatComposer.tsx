import { Send } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { playHaptic } from '@/lib/sound';

interface ChatComposerProps {
  isBs: boolean;
  onSend: (message: string) => void;
}

export function ChatComposer({ isBs, onSend }: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const trimmed = message.trim();
  const composerHeight = 40;

  const submit = () => {
    if (!trimmed) return;
    playHaptic('click');
    onSend(trimmed);
    setMessage('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 10, height: composerHeight, width: '100%' }}>
      <View style={{ backgroundColor: '#303036', borderRadius: composerHeight / 2, flex: 1, height: composerHeight, justifyContent: 'center' }}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={isBs ? 'Poruka' : 'Message'}
          blurOnSubmit={false}
          maxLength={20}
          onChangeText={setMessage}
          onSubmitEditing={submit}
          placeholder={isBs ? 'Poruka' : 'Message'}
          placeholderTextColor="#737373"
          returnKeyType="send"
          submitBehavior="submit"
          style={{ borderWidth: 0, color: '#f1f5f9', fontFamily: 'Outfit_400Regular', fontSize: 15, height: composerHeight, paddingHorizontal: 14, paddingRight: 44, paddingVertical: 0 }}
          underlineColorAndroid="transparent"
          value={message}
        />
        <Text style={{ color: '#737373', fontFamily: 'Outfit_500Medium', fontSize: 9, position: 'absolute', right: 12, top: (composerHeight - 11) / 2 }}>
          {message.length}/20
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !trimmed }}
        hitSlop={4}
        onPress={submit}
        style={{
          backgroundColor: trimmed ? '#facc15' : '#ffffff',
          borderRadius: composerHeight / 2,
          flexShrink: 0,
          height: composerHeight,
          overflow: 'hidden',
          width: composerHeight,
        }}
      >
      <View
        pointerEvents="none"
        accessibilityLabel={isBs ? 'Pošalji' : 'Send'}
        style={{
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderRadius: composerHeight / 2,
          flexShrink: 0,
          height: composerHeight,
          justifyContent: 'center',
          width: composerHeight,
        }}
      >
        <Send color={trimmed ? '#09090b' : '#52525b'} fill={trimmed ? '#09090b' : 'transparent'} size={17} />
      </View>
      </Pressable>
    </View>
  );
}
