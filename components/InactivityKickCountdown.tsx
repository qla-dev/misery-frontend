import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { playSound } from '@/lib/sound';

type InactivityKickCountdownProps = {
  isBs: boolean;
  message?: string;
  onDismiss: () => void;
  value: number | null;
};

export function InactivityKickCountdown({ isBs, message, onDismiss, value }: InactivityKickCountdownProps) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (value === null) {
      setDismissed(false);
      return;
    }
    if (dismissed) return;
    playSound('countdown');
    scale.setValue(0.7);
    Animated.spring(scale, {
      damping: 8,
      stiffness: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [dismissed, scale, value]);

  if (value === null || dismissed) return null;

  const words = message?.trim().split(/\s+/) ?? [];
  const title = message
    ? words.slice(0, -1).join(' ')
    : isBs ? 'BIT ĆEŠ' : 'YOU WILL BE';
  const titleDetail = message
    ? words.at(-1) ?? ''
    : isBs ? 'UKLONJEN' : 'REMOVED';
  const titleStyle = {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    includeFontPadding: false,
    letterSpacing: 1.2,
    lineHeight: 50,
    width: '100%' as const,
  };

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible>
      <View className="flex-1 items-center justify-center bg-red-500 px-8">
        <Pressable
          accessibilityLabel={isBs ? 'Zatvori upozorenje' : 'Close warning'}
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => {
            playSound('click');
            setDismissed(true);
            onDismiss();
          }}
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.24)',
            borderRadius: 22,
            height: 44,
            justifyContent: 'center',
            position: 'absolute',
            right: 22,
            top: 54,
            width: 44,
          }}
        >
          <X color="#ffffff" size={23} strokeWidth={2.8} />
        </Pressable>
        <Animated.Text
          className="text-center text-white"
          style={{
            fontFamily: 'BebasNeue_400Regular',
            fontSize: 180,
            lineHeight: 190,
            transform: [{ scale }],
          }}
        >
          {value}
        </Animated.Text>
        <View className="items-center justify-center" style={{ marginTop: 14, width: '100%' }}>
          <Text
            adjustsFontSizeToFit
            className="text-center font-black uppercase text-white/90"
            minimumFontScale={0.72}
            numberOfLines={1}
            style={titleStyle}
          >
            {title}
          </Text>
          <View className="items-center justify-center" style={{ width: '100%' }}>
            <Text
              adjustsFontSizeToFit
              className="text-center font-black uppercase text-white"
              minimumFontScale={0.72}
              numberOfLines={1}
              style={titleStyle}
            >
              {titleDetail}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
