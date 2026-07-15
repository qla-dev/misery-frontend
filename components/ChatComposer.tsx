import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface ChatComposerProps {
  isBs: boolean;
  onSend: (message: string) => Promise<void>;
}

export function ChatComposer({ isBs, onSend }: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const trimmed = message.trim();

  const submit = async () => {
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ backgroundColor: '#111b21', flexDirection: 'row', gap: 9, paddingHorizontal: 10, paddingVertical: 9 }}>
      <View style={{ backgroundColor: '#202c33', borderRadius: 24, flex: 1, justifyContent: 'center', minHeight: 46 }}>
        <TextInput
          accessibilityLabel={isBs ? 'Poruka' : 'Message'}
          editable={!sending}
          maxLength={20}
          onChangeText={setMessage}
          onSubmitEditing={() => void submit()}
          placeholder={isBs ? 'Poruka' : 'Message'}
          placeholderTextColor="#8696a0"
          returnKeyType="send"
          style={{ color: '#f1f5f9', fontFamily: 'Outfit_400Regular', fontSize: 16, paddingHorizontal: 16, paddingRight: 46, paddingVertical: 10 }}
          value={message}
        />
        <Text style={{ bottom: 7, color: '#8696a0', fontFamily: 'Outfit_500Medium', fontSize: 10, position: 'absolute', right: 13 }}>
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
          backgroundColor: trimmed ? '#facc15' : '#374248',
          borderRadius: 23,
          height: 46,
          justifyContent: 'center',
          opacity: pressed ? 0.75 : 1,
          width: 46,
        })}
      >
        <Send color={trimmed ? '#111b21' : '#8696a0'} fill={trimmed ? '#111b21' : 'transparent'} size={19} />
      </Pressable>
    </View>
  );
}
