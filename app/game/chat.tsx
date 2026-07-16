import { ChatComposer } from '@/components/ChatComposer';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useGame } from '@/context/GameContext';
import { ApiChatMessage } from '@/lib/api';
import { playHaptic } from '@/lib/sound';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flag } from 'lucide-react-native';

const PLAYER_COLORS: Record<string, string> = {
  yellow: '#facc15', blue: '#60a5fa', emerald: '#10b981', purple: '#c084fc',
  rose: '#fb7185', red: '#ef4444', orange: '#f97316', brown: '#a16207', silver: '#d4d4d4',
};

function playerColor(value?: string | null) {
  if (!value) return '#facc15';
  const key = Object.keys(PLAYER_COLORS).find((candidate) => value.toLowerCase().includes(candidate));
  return key ? PLAYER_COLORS[key] : value.startsWith('#') ? value : '#facc15';
}

function messageTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const { gameRuntime, language, session } = useGame();
  const insets = useSafeAreaInsets();
  const isBs = language === 'bs';
  const hiddenMessageIds: number[] = gameRuntime?.hiddenChatMessageIds ?? [];
  const messages: ApiChatMessage[] = (gameRuntime?.chatMessages ?? [])
    .filter((message: ApiChatMessage) => !hiddenMessageIds.includes(message.id));
  const currentUserId = session?.userId;
  const listRef = useRef<FlatList<ApiChatMessage>>(null);
  const [selectedMessage, setSelectedMessage] = useState<ApiChatMessage | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      Keyboard.scheduleLayoutAnimation(event);
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      Keyboard.scheduleLayoutAnimation(event);
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!keyboardVisible) return;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [keyboardVisible]);

  const send = async (message: string) => {
    try {
      if (!gameRuntime?.sendChatMessage) throw new Error(isBs ? 'Chat još nije spreman.' : 'Chat is not ready yet.');
      await gameRuntime.sendChatMessage(message);
    } catch (error) {
      Alert.alert(
        isBs ? 'Poruka nije poslana' : 'Message not sent',
        error instanceof Error ? error.message : (isBs ? 'Pokušaj ponovo.' : 'Please try again.'),
      );
      throw error;
    }
  };

  const reportSelectedMessage = () => {
    if (!selectedMessage) return;
    const playerName = selectedMessage.user?.name ?? (isBs ? 'Igrač' : 'Player');
    gameRuntime?.reportChatMessageLocally?.(selectedMessage.id);
    setSelectedMessage(null);
    Alert.alert(
      isBs ? 'PRIJAVA ZABILJEŽENA' : 'REPORT RECORDED',
      isBs
        ? `Poruka je skrivena do kraja igre. Igrač ${playerName} će biti prijavljen.`
        : `The message is hidden until the game ends. ${playerName} will be reported.`,
    );
  };

  return (
    <ImageBackground
      resizeMode="cover"
      source={require('../../assets/bg/wp6442276.jpg')}
      style={{ flex: 1 }}
    >
      <View
        pointerEvents="none"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        pointerEvents="none"
        style={{
          height: insets.top + 105,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <FlatList
          ref={listRef}
          contentContainerStyle={{ flexGrow: 1, justifyContent: messages.length ? 'flex-end' : 'center', paddingBottom: 8, paddingHorizontal: 16, paddingTop: insets.top + 56 }}
          data={messages}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="never"
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={(
            <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
              <Text style={{ color: '#737373', fontFamily: 'Outfit_600SemiBold', fontSize: 14, textAlign: 'center' }}>
                {isBs ? 'Još nema poruka. Započni razgovor.' : 'No messages yet. Start the conversation.'}
              </Text>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: messages.length > 1 })}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          onTouchStart={() => {
            if (keyboardVisible) Keyboard.dismiss();
          }}
          renderItem={({ item, index }) => {
          const own = Number(item.user_id) === Number(currentUserId);
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const startsGroup = !previous || Number(previous.user_id) !== Number(item.user_id);
          const endsGroup = !next || Number(next.user_id) !== Number(item.user_id);
          return (
            <View style={{ alignItems: own ? 'flex-end' : 'flex-start', marginBottom: endsGroup ? 9 : 2, marginTop: startsGroup && index > 0 ? 4 : 0 }}>
              <Pressable
                accessibilityHint={!own ? (isBs ? 'Držite za opcije poruke' : 'Hold for message options') : undefined}
                accessibilityRole={!own ? 'button' : undefined}
                disabled={own}
                delayLongPress={350}
                onLongPress={() => {
                  playHaptic('click');
                  setSelectedMessage(item);
                }}
                style={{
                  backgroundColor: own ? '#facc15' : '#18181b',
                  borderColor: own ? '#facc15' : '#333333',
                  borderRadius: 14,
                  borderTopLeftRadius: !own && startsGroup ? 4 : 14,
                  borderTopRightRadius: own && startsGroup ? 4 : 14,
                  borderWidth: 0,
                  maxWidth: '84%',
                  minWidth: 72,
                  paddingBottom: 7,
                  paddingHorizontal: 11,
                  paddingTop: !own && startsGroup ? 7 : 6,
                }}
              >
                {!own && startsGroup && (
                  <Text numberOfLines={1} style={{ color: playerColor(item.user?.color), fontFamily: 'Outfit_700Bold', fontSize: 11, marginBottom: 1 }}>
                    {item.user?.name ?? (isBs ? 'Igrač' : 'Player')}
                  </Text>
                )}
                <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 7 }}>
                  <Text style={{ color: own ? '#09090b' : '#f5f5f5', flexShrink: 1, fontFamily: 'Outfit_400Regular', fontSize: 16, lineHeight: 21 }}>
                    {item.message}
                  </Text>
                  <Text style={{ color: own ? 'rgba(9,9,11,0.58)' : '#737373', fontFamily: 'Outfit_500Medium', fontSize: 9, lineHeight: 15 }}>
                    {messageTime(item.created_at)}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
          }}
          showsVerticalScrollIndicator={false}
        />
      </TouchableWithoutFeedback>
      <View
        style={{
          backgroundColor: 'rgba(9,9,11,0.96)',
          paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 10),
          paddingHorizontal: 20,
          paddingTop: keyboardVisible ? 8 : 10,
          width: '100%',
          zIndex: 30,
        }}
      >
        <ChatComposer isBs={isBs} onSend={send} />
      </View>
      <ConfirmModal
        cancelLabel={isBs ? 'ODUSTANI' : 'CANCEL'}
        confirmLabel={isBs ? 'PRIJAVI' : 'REPORT'}
        confirmType="danger"
        onCancel={() => setSelectedMessage(null)}
        onConfirm={reportSelectedMessage}
        onRequestClose={() => setSelectedMessage(null)}
        visible={selectedMessage !== null}
      >
        <View style={{ gap: 12 }}>
          <View className="items-center" style={{ gap: 8 }}>
            <Flag color="#ef4444" size={34} strokeWidth={2.2} />
            <Text className="text-center text-lg font-black uppercase tracking-wider text-white">
              {isBs ? 'OPCIJE PORUKE' : 'MESSAGE OPTIONS'}
            </Text>
          </View>
          <View style={{ backgroundColor: '#404040', height: 1, width: '100%' }} />
          <View className="rounded-xl bg-neutral-950 px-4 py-3">
            <Text className="mb-1 text-xs font-black text-amber-400">
              {selectedMessage?.user?.name ?? (isBs ? 'Igrač' : 'Player')}
            </Text>
            <Text className="text-sm leading-5 text-neutral-300">{selectedMessage?.message}</Text>
          </View>
          <Text className="text-center text-xs leading-5 text-neutral-400">
            {isBs
              ? 'Prijavljivanjem će ova poruka biti skrivena do kraja igre.'
              : 'Reporting will hide this message until the game ends.'}
          </Text>
        </View>
      </ConfirmModal>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
