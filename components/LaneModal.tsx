import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Text, View } from 'react-native';
import { Ban, Check, Play, ShieldAlert, Square } from 'lucide-react-native';

type LaneModalProps = {
  failureMessage: string;
  failureTitle: string;
  onComplete?: () => void;
  playerName?: string;
  success: boolean;
  successMessage: string;
  successTitle: string;
  visible: boolean;
  warning?: boolean;
  neutral?: boolean;
  ending?: boolean;
};

export function LaneModal({
  failureMessage,
  failureTitle,
  onComplete,
  playerName,
  success,
  successMessage,
  successTitle,
  visible,
  warning = false,
  neutral = false,
  ending = false,
}: LaneModalProps) {
  const [rendered, setRendered] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.25)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!visible) {
      setRendered(false);
      return;
    }

    setRendered(true);
    opacity.setValue(0);
    scale.setValue(0.25);
    rotation.setValue(success ? -0.18 : -0.1);

    Animated.parallel([
      Animated.timing(opacity, {
        duration: 180,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        damping: 9,
        mass: 0.7,
        stiffness: 180,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(rotation, {
        damping: 8,
        stiffness: 140,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        duration: 180,
        easing: Easing.in(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
        onCompleteRef.current?.();
      });
    }, 1400);

    return () => clearTimeout(timer);
  }, [opacity, rotation, scale, success, visible]);

  const rotate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-45deg', '45deg'],
  });

  return (
    <Modal animationType="none" statusBarTranslucent transparent visible={rendered && visible}>
      <Animated.View
        className={`flex-1 items-center justify-center px-8 ${neutral ? 'bg-white' : warning ? 'bg-amber-400' : success ? 'bg-emerald-500' : 'bg-red-500'}`}
        style={{ opacity }}
      >
        <Animated.View
          className="items-center"
          style={{ gap: 22, transform: [{ translateY: -36 }, { scale }, { rotate }] }}
        >
          <View className={`h-40 w-40 items-center justify-center rounded-full border-[6px] ${neutral ? 'border-neutral-950 bg-neutral-950/5' : 'border-white bg-white/15'}`}>
            {neutral ? (
              ending
                ? <Square color="#0a0a0a" fill="#0a0a0a" size={72} strokeWidth={2.5} />
                : <Play color="#0a0a0a" fill="#0a0a0a" size={82} strokeWidth={2.5} />
            ) : warning ? (
              <ShieldAlert color="#ffffff" size={90} strokeWidth={3.5} />
            ) : success ? (
              <Check color="#ffffff" size={94} strokeWidth={4} />
            ) : (
              <Ban color="#ffffff" size={90} strokeWidth={3.5} />
            )}
          </View>
          <View className="items-center" style={{ gap: 8 }}>
            {playerName && (
              <Text className={`text-center text-base font-black uppercase tracking-widest ${neutral ? 'text-neutral-950/70' : 'text-white/90'}`}>
                {playerName}
              </Text>
            )}
            <Text className={`text-center text-4xl font-black uppercase tracking-wider ${neutral ? 'text-neutral-950' : 'text-white'}`}>
              {success ? successTitle : failureTitle}
            </Text>
            <Text className={`text-center text-sm font-bold uppercase tracking-widest ${neutral ? 'text-neutral-950/65' : 'text-white/85'}`}>
              {success ? successMessage : failureMessage}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
