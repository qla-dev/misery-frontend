import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { Ban, BellRing, Check, Pause, Play, ShieldAlert, Square, X } from 'lucide-react-native';
import { playHaptic } from '@/lib/sound';
import { LaneProgress, LaneProgressBadge } from '@/components/LaneProgressBadge';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type LaneModalProps = {
  failureMessage: string;
  failureTitle: string;
  onComplete?: () => void;
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
  const isScoredSteal = warning && score !== undefined;
  const modalTitleStyle = {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 64,
    paddingBottom: 2,
    paddingTop: 8,
  };
  const modalMessageStyle = {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    includeFontPadding: true,
    lineHeight: 20,
  };
  const contentGap = 10;
  const message = success ? successMessage : failureMessage;
  const title = success ? successTitle : failureTitle;

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
      <AnimatedPressable
        accessible={false}
        className={`flex-1 items-center justify-center px-8 ${neutral ? 'bg-white' : warning ? 'bg-amber-400' : success ? 'bg-emerald-500' : 'bg-red-500'}`}
        onPress={() => {
          playHaptic();
          dismissRef.current();
        }}
        style={{ opacity }}
      >
        <Animated.View
          className="items-center"
          style={{ gap: contentGap, transform: [{ translateY: -31 }, { scale }, { rotate }], width: '100%' }}
        >
          <View className={`${isScoredSteal ? 'h-44 w-44' : 'h-40 w-40'} items-center justify-center rounded-full border-[6px] ${darkForeground ? 'border-neutral-950 bg-neutral-950/5' : 'border-white bg-white/15'}`}>
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
              <BellRing color={darkForeground ? '#0a0a0a' : '#ffffff'} size={70} strokeWidth={2} />
            ) : warning && score !== undefined ? (
              <View className="items-center justify-center" style={{ height: 142, width: 154 }}>
                <Text
                  className="font-black text-neutral-950"
                  style={{
                    fontFamily: 'BebasNeue_400Regular',
                    fontSize: 54,
                    fontWeight: '400',
                    height: 70,
                    includeFontPadding: false,
                    lineHeight: 66,
                    paddingTop: 3,
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    width: 154,
                  }}
                >
                  {score.toFixed(2)}
                </Text>
                <Text
                  adjustsFontSizeToFit
                  className="mt-1 text-center uppercase text-neutral-950/65"
                  minimumFontScale={0.72}
                  numberOfLines={1}
                  style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 15, letterSpacing: 1.2, lineHeight: 17, width: 144 }}
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
              emphasized
              label={laneProgress.label}
              playerName={laneProgress.playerName}
              target={laneProgress.target}
            />
          )}
          {!laneProgress && title ? (
            <View className="items-center justify-center" style={{ width: '100%' }}>
              <Text
                className={`text-center font-black uppercase ${darkForeground ? 'text-neutral-950' : 'text-white'}`}
                style={modalTitleStyle}
              >
                {title}
              </Text>
            </View>
          ) : null}
          {message ? (
            <View className="items-center justify-center" style={{ width: '100%' }}>
              <Text
                className={`text-center font-bold uppercase tracking-widest ${darkForeground ? 'text-neutral-950/65' : 'text-white/85'}`}
                style={modalMessageStyle}
              >
                {message}
              </Text>
            </View>
          ) : null}
          {score !== undefined && !warning ? (
            <View className={`rounded-xl border px-5 py-2 ${neutral ? 'border-neutral-950/20 bg-neutral-950/5' : 'border-white/40 bg-white/15'}`}>
              <Text className={`text-center font-mono text-[9px] font-black uppercase tracking-[2px] ${neutral ? 'text-neutral-950/60' : 'text-white/75'}`}>
                {`${scoreLabel}  •  ${score.toFixed(2)}`}
              </Text>
            </View>
          ) : null}
        </Animated.View>
        <View
          pointerEvents="box-none"
          style={{
            alignItems: 'center',
            bottom: 14,
            gap: 0,
            left: 0,
            position: 'absolute',
            right: 0,
          }}
        >
          {laneProgress && title ? (
            <Text
              className={`text-center font-black uppercase ${darkForeground ? 'text-neutral-950' : 'text-white'}`}
              numberOfLines={1}
              style={[modalTitleStyle, { marginBottom: -2 }]}
            >
              {title}
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
      </AnimatedPressable>
    </Modal>
  );
}
