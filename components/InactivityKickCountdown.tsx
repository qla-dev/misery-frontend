import { useEffect, useRef } from 'react';
import { Animated, Modal, Text, View } from 'react-native';
import { playSound } from '@/lib/sound';

type InactivityKickCountdownProps = {
  isBs: boolean;
  value: number | null;
};

export function InactivityKickCountdown({ isBs, value }: InactivityKickCountdownProps) {
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (value === null) return;
    playSound('countdown');
    scale.setValue(0.7);
    Animated.spring(scale, {
      damping: 8,
      stiffness: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scale, value]);

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={value !== null}>
      <View className="flex-1 items-center justify-center bg-red-600 px-8">
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
        <Text className="text-center font-black uppercase tracking-[2px] text-white/90" style={{ fontSize: 18 }}>
          {isBs ? 'BIT ĆEŠ UKLONJEN ZBOG NEAKTIVNOSTI' : 'YOU WILL BE REMOVED FOR INACTIVITY'}
        </Text>
      </View>
    </Modal>
  );
}
