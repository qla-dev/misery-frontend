import { ChatComposer } from '@/components/ChatComposer';
import { useGame } from '@/context/GameContext';
import { ApiChatMessage } from '@/lib/api';
import { useRef } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const messages: ApiChatMessage[] = gameRuntime?.chatMessages ?? [];
  const currentUserId = session?.userId;
  const listRef = useRef<FlatList<ApiChatMessage>>(null);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
      style={{ backgroundColor: '#0b141a', flex: 1 }}
    >
      <FlatList
        ref={listRef}
        contentContainerStyle={{ flexGrow: 1, gap: 5, justifyContent: messages.length ? 'flex-end' : 'center', paddingBottom: 12, paddingHorizontal: 10, paddingTop: insets.top + 56 }}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={(
          <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: '#8696a0', fontFamily: 'Outfit_600SemiBold', fontSize: 14, textAlign: 'center' }}>
              {isBs ? 'Još nema poruka. Započni razgovor.' : 'No messages yet. Start the conversation.'}
            </Text>
          </View>
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: messages.length > 1 })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const own = Number(item.user_id) === Number(currentUserId);
          return (
            <View style={{ alignItems: own ? 'flex-end' : 'flex-start' }}>
              <View
                style={{
                  backgroundColor: own ? '#005c4b' : '#202c33',
                  borderRadius: 9,
                  borderTopLeftRadius: own ? 9 : 2,
                  borderTopRightRadius: own ? 2 : 9,
                  maxWidth: '82%',
                  minWidth: 72,
                  paddingBottom: 6,
                  paddingHorizontal: 9,
                  paddingTop: own ? 6 : 5,
                }}
              >
                {!own && (
                  <Text numberOfLines={1} style={{ color: playerColor(item.user?.color), fontFamily: 'Outfit_700Bold', fontSize: 11, marginBottom: 1 }}>
                    {item.user?.name ?? (isBs ? 'Igrač' : 'Player')}
                  </Text>
                )}
                <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 7 }}>
                  <Text style={{ color: '#e9edef', flexShrink: 1, fontFamily: 'Outfit_400Regular', fontSize: 16, lineHeight: 21 }}>
                    {item.message}
                  </Text>
                  <Text style={{ color: '#8696a0', fontFamily: 'Outfit_400Regular', fontSize: 9, lineHeight: 15 }}>
                    {messageTime(item.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
      <View style={{ paddingBottom: Math.max(insets.bottom, 5) }}>
        <ChatComposer isBs={isBs} onSend={send} />
      </View>
    </KeyboardAvoidingView>
  );
}
