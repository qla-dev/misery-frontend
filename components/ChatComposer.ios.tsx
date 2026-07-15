import { Button, Host, HStack, TextField, useNativeState } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  autocorrectionDisabled,
  background,
  buttonBorderShape,
  buttonStyle,
  clipShape,
  disabled,
  foregroundStyle,
  frame,
  onSubmit,
  padding,
  submitLabel,
  textFieldStyle,
  textInputAutocapitalization,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

interface ChatComposerProps {
  isBs: boolean;
  onSend: (message: string) => Promise<void>;
}

export function ChatComposer({ isBs, onSend }: ChatComposerProps) {
  const text = useNativeState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { width } = useWindowDimensions();
  const trimmed = message.trim();

  const submit = async () => {
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      text.set('');
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Host colorScheme="dark" matchContents={{ vertical: true }} seedColor="#facc15" style={{ backgroundColor: '#09090b', width }}>
      <HStack
        alignment="center"
        spacing={9}
        modifiers={[frame({ width: width - 20, height: 46 }), padding({ horizontal: 10, vertical: 9 }), background('#09090b')]}
      >
        <TextField
          maxLength={20}
          onTextChange={setMessage}
          placeholder={isBs ? 'Poruka' : 'Message'}
          text={text}
          modifiers={[
            frame({ width: Math.max(160, width - 75), height: 46 }),
            padding({ horizontal: 15 }),
            background('#18181b'),
            clipShape('capsule'),
            foregroundStyle('#f1f5f9'),
            textFieldStyle('plain'),
            autocorrectionDisabled(false),
            textInputAutocapitalization('sentences'),
            submitLabel('send'),
            onSubmit(() => void submit()),
            disabled(sending),
          ]}
        />
        <Button
          label=""
          onPress={() => void submit()}
          systemImage="paperplane.fill"
          modifiers={[
            frame({ width: 46, height: 46 }),
            accessibilityLabel(isBs ? 'Pošalji' : 'Send'),
            buttonStyle('borderedProminent'),
            buttonBorderShape('circle'),
            tint(trimmed ? '#facc15' : '#262626'),
            foregroundStyle(trimmed ? '#09090b' : '#737373'),
            disabled(!trimmed || sending),
          ]}
        />
      </HStack>
    </Host>
  );
}
