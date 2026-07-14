import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { Ban, BellRing, Check, Pause, Play, ShieldAlert, Square, X } from 'lucide-react-native';
import { playHaptic } from '@/lib/sound';
import { LaneProgress, LaneProgressBadge } from '@/components/LaneProgressBadge';

type LaneModalProps = {
  failureMessage: string;
  failureTitle: string;
  onComplete?: () => void;
  playerName?: string;
  laneProgress?: LaneProgress;
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
  bell?: boolean;
};

export function LaneModal({
  failureMessage,
  failureTitle,
  onComplete,
  playerName,
  laneProgress,
  success,
  successMessage,
  successTitle,
  visible,
  warning = false,
  neutral = false,
  ending = false,
  score,
  scoreLabel = 'MISERY RATE',
  holding = false,
  persistent = false,
  bell = false,
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
    playHaptic(bell ? 'bell' : holding || neutral ? 'click' : warning ? 'steal' : success ? 'correct' : 'wrong');
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
    const timer = persistent ? null : setTimeout(dismiss, 2000);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [bell, holding, neutral, opacity, persistent, rotation, scale, success, visible, warning]);

  const rotate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-45deg', '45deg'],
  });
  const darkForeground = neutral || warning;

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
          <View className={`h-40 w-40 items-center justify-center rounded-full border-[6px] ${darkForeground ? 'border-neutral-950 bg-neutral-950/5' : 'border-white bg-white/15'}`}>
            {holding ? (
              <Pause
                color={darkForeground ? '#0a0a0a' : '#ffffff'}
                fill={darkForeground ? '#0a0a0a' : '#ffffff'}
                size={76}
                strokeWidth={2.5}
              />
            ) : darkForeground && !warning ? (
              ending
                ? <Square color="#0a0a0a" fill="#0a0a0a" size={72} strokeWidth={2.5} />
                : <Play color="#0a0a0a" fill="#0a0a0a" size={82} strokeWidth={2.5} />
            ) : bell ? (
              <BellRing color={darkForeground ? '#0a0a0a' : '#ffffff'} size={88} strokeWidth={3.5} />
            ) : warning && score !== undefined ? (
              <View className="items-center justify-center" style={{ height: 126, width: 132 }}>
                <Text
                  className="font-black text-neutral-950"
                  style={{
                    fontFamily: 'JetBrainsMono_700Bold',
                    fontSize: 44,
                    height: 62,
                    includeFontPadding: false,
                    lineHeight: 58,
                    paddingTop: 3,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    width: 132,
                  }}
                >
                  {score.toFixed(2)}
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="mt-1 text-center font-mono text-[9px] font-black uppercase tracking-[2px] text-neutral-950/65"
                  minimumFontScale={0.72}
                  numberOfLines={1}
                  style={{ lineHeight: 14, width: 124 }}
                >
                  {scoreLabel}
                </Text>
              </View>
            ) : warning ? (
              <ShieldAlert color="#0a0a0a" size={90} strokeWidth={3.5} />
            ) : success ? (
              <Check color="#ffffff" size={94} strokeWidth={4} />
            ) : (
              <Ban color="#ffffff" size={90} strokeWidth={3.5} />
            )}
          </View>
          {laneProgress && (
            <LaneProgressBadge
              addsCard={laneProgress.addsCard}
              count={laneProgress.count}
              dark={darkForeground}
              label={laneProgress.label}
              target={laneProgress.target}
            />
          )}
          <View className="items-center" style={{ gap: 8 }}>
            {!laneProgress && (
              <Text className={`text-center text-4xl font-black uppercase tracking-wider ${darkForeground ? 'text-neutral-950' : 'text-white'}`}>
                {success ? successTitle : failureTitle}
              </Text>
            )}
            <Text className={`text-center text-sm font-bold uppercase tracking-widest ${darkForeground ? 'text-neutral-950/65' : 'text-white/85'}`}>
              {success ? successMessage : failureMessage}
            </Text>
            {score !== undefined && !warning && (
              <View className={`mt-2 rounded-xl border px-5 py-2 ${neutral ? 'border-neutral-950/20 bg-neutral-950/5' : 'border-white/40 bg-white/15'}`}>
                <Text className={`text-center font-mono text-[9px] font-black uppercase tracking-[2px] ${neutral ? 'text-neutral-950/60' : 'text-white/75'}`}>
                  {`${scoreLabel}  •  ${score.toFixed(2)}`}
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
          {laneProgress ? (
            <Text
              className={`mb-5 text-center text-4xl font-black uppercase tracking-wider ${darkForeground ? 'text-neutral-950' : 'text-white'}`}
              numberOfLines={1}
            >
              {success ? successTitle : failureTitle}
            </Text>
          ) : playerName ? (
            <Text
              className={`mb-5 text-center text-4xl font-black uppercase tracking-wider ${darkForeground ? 'text-neutral-950' : 'text-white'}`}
              numberOfLines={1}
            >
              {playerName}
            </Text>
          ) : null}
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
            <X color={darkForeground ? '#171717' : '#ffffff'} size={22} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
