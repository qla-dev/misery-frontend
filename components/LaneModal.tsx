import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { Ban, Check, Pause, Play, ShieldAlert, Square, X } from 'lucide-react-native';
import { playHaptic } from '@/lib/sound';

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
  score?: number;
  scoreLabel?: string;
  holding?: boolean;
  persistent?: boolean;
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
  score,
  scoreLabel = 'MISERY VALUE',
  holding = false,
  persistent = false,
}: LaneModalProps) {
  const [rendered, setRendered] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.25)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);
  const closingRef = useRef(false);
  const dismissRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!visible) {
      closingRef.current = false;
      setRendered(false);
      return;
    }

    setRendered(true);
    playHaptic(holding || neutral ? 'click' : warning ? 'steal' : success ? 'correct' : 'wrong');
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

    const dismiss = () => {
      if (closingRef.current) return;
      closingRef.current = true;
      Animated.timing(opacity, {
        duration: 180,
        easing: Easing.in(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
        onCompleteRef.current?.();
      });
    };
    dismissRef.current = dismiss;
    const timer = persistent ? null : setTimeout(dismiss, 2400);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [holding, neutral, opacity, persistent, rotation, scale, success, visible, warning]);

  const rotate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-45deg', '45deg'],
  });

  return (
    <Modal
      animationType="none"
      onRequestClose={() => {
        playHaptic();
        dismissRef.current();
      }}
      statusBarTranslucent
      transparent
      visible={rendered && visible}
    >
      <Animated.View
        className={`flex-1 items-center justify-center px-8 ${neutral ? 'bg-white' : warning ? 'bg-amber-400' : success ? 'bg-emerald-500' : 'bg-red-500'}`}
        style={{ opacity }}
      >
        <Animated.View
          className="items-center"
          style={{ gap: 22, transform: [{ translateY: -31 }, { scale }, { rotate }] }}
        >
          <View className={`h-40 w-40 items-center justify-center rounded-full border-[6px] ${neutral ? 'border-neutral-950 bg-neutral-950/5' : 'border-white bg-white/15'}`}>
            {holding ? (
              <Pause
                color={neutral ? '#0a0a0a' : '#ffffff'}
                fill={neutral ? '#0a0a0a' : '#ffffff'}
                size={76}
                strokeWidth={2.5}
              />
            ) : neutral ? (
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
            {score !== undefined && (
              <View className={`mt-2 rounded-xl border px-5 py-2 ${neutral ? 'border-neutral-950/20 bg-neutral-950/5' : 'border-white/40 bg-white/15'}`}>
                <Text className={`text-center font-mono text-[9px] font-black uppercase tracking-[2px] ${neutral ? 'text-neutral-950/60' : 'text-white/75'}`}>
                  {`${scoreLabel}  •  ${score.toFixed(1)}`}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
        <View
          pointerEvents="box-none"
          style={{
            alignItems: 'center',
            bottom: 20,
            left: 0,
            position: 'absolute',
            right: 0,
          }}
        >
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              playHaptic();
              dismissRef.current();
            }}
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(64,64,64,0.3)',
              borderRadius: 22,
              height: 44,
              justifyContent: 'center',
              width: 44,
            }}
          >
            <X color={neutral ? '#171717' : '#ffffff'} size={22} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
