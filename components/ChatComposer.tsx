import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { playHaptic } from '@/lib/sound';

interface ChatComposerProps {
  isBs: boolean;
  onSend: (message: string) => Promise<void>;
}

export function ChatComposer({ isBs, onSend }: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const trimmed = message.trim();
  const composerHeight = 42;

  const submit = async () => {
    if (!trimmed || sending) return;
    playHaptic('click');
    setSending(true);
    try {
      await onSend(trimmed);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: 10, height: composerHeight, width: '100%' }}>
      <View style={{ backgroundColor: '#18181b', borderColor: '#333333', borderRadius: composerHeight / 2, borderWidth: 1, flex: 1, height: composerHeight, justifyContent: 'center' }}>
        <TextInput
          accessibilityLabel={isBs ? 'Poruka' : 'Message'}
          editable={!sending}
          maxLength={20}
          onChangeText={setMessage}
          onSubmitEditing={() => void submit()}
          placeholder={isBs ? 'Poruka' : 'Message'}
          placeholderTextColor="#737373"
          returnKeyType="send"
          style={{ color: '#f1f5f9', fontFamily: 'Outfit_400Regular', fontSize: 15, height: composerHeight, paddingHorizontal: 14, paddingRight: 44, paddingVertical: 0 }}
          value={message}
        />
        <Text style={{ color: '#737373', fontFamily: 'Outfit_500Medium', fontSize: 9, position: 'absolute', right: 12, top: (composerHeight - 11) / 2 }}>
          {message.length}/20
        </Text>
      </View>
      <Pressable
        accessibilityLabel={isBs ? 'Pošalji' : 'Send'}
        accessibilityRole="button"
        disabled={!trimmed || sending}
        onPress={() => void submit()}
        style={({ pressed }) => ({
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: trimmed ? '#facc15' : '#262626',
          borderRadius: composerHeight / 2,
          height: composerHeight,
          justifyContent: 'center',
          opacity: pressed ? 0.75 : 1,
          width: composerHeight,
        })}
      >
        {sending
          ? <ActivityIndicator color="#09090b" size="small" />
          : <Send color={trimmed ? '#09090b' : '#737373'} fill={trimmed ? '#09090b' : 'transparent'} size={17} />}
      </Pressable>
    </View>
  );
}
