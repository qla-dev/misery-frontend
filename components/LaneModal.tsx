import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { Ban, BellRing, Check, LogOut, Pause, Play, ShieldAlert, Square, X } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { playHaptic } from '@/lib/sound';
import { LaneProgress, LaneProgressBadge } from '@/components/LaneProgressBadge';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CarnivalMaskIcon({ color = '#0a0a0a', size = 96 }: { color?: string; size?: number }) {
  return (
    <Svg accessibilityLabel="Steal" height={size} style={{ transform: [{ translateY: 4 }] }} viewBox="0 0 530.25 530.251" width={size}>
      <Path
        d="M511.086 187.131c-37.584-20.402-77.071-34.679-120.667-33.221-24.969.843-49.149 6.877-73.324 12.632-13.353 3.173-26.705 6.403-39.988 9.887-4.051 1.066-8.036 1.528-11.982 1.682-3.943-.147-7.929-.616-11.976-1.682-13.287-3.484-26.635-6.714-39.992-9.887-24.178-5.75-48.355-11.789-73.324-12.632-43.6-1.458-83.086 12.823-120.667 33.221-17.105 9.285-21.56 17.524-18.052 32.65 4.172 17.987 9.73 35.785 17.702 52.374 7.078 14.739 14.834 29.23 23.48 43.306 14.003 22.785 29.139 43.353 55.571 52.846 16.043 5.759 32.413 8.97 49.392 7.948 9.458-.574 18.027-4.621 26.472-8.807 8.387-4.163 16.956-8 24.498-13.623 7.488-5.587 15.45-10.791 21.951-17.408 0 0 26.892-26.174 44.946-30.196 18.064 4.027 44.946 30.196 44.946 30.196 6.501 6.617 14.464 11.821 21.959 17.408 7.537 5.623 16.115 9.455 24.497 13.623 8.438 4.186 17.007 8.232 26.472 8.807 16.979 1.021 33.347-2.189 49.392-7.948 26.43-9.488 41.574-30.061 55.566-52.846 8.648-14.071 16.4-28.566 23.48-43.306 7.967-16.589 13.525-34.382 17.702-52.374 3.506-15.126-.951-23.365-18.052-32.65zM132.998 288.92c-33.932-11.542-51.534-50.034-51.534-50.034s37.416-19.77 71.348-8.233 51.527 50.029 51.527 50.029-37.414 19.775-71.341 8.238zm264.258 0c-33.93 11.537-71.35-8.237-71.35-8.237s17.604-38.492 51.538-50.029c33.925-11.537 71.341 8.233 71.341 8.233s-17.594 38.491-51.529 50.033z"
        fill={color}
      />
    </Svg>
  );
}

function MechanicalDigit({ character, dark, delay, runKey }: { character: string; dark: boolean; delay: number; runKey: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      delay,
      duration: 320,
      easing: Easing.out(Easing.back(1.15)),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [character, delay, progress, runKey]);

  if (character === '.') {
    return <Text style={{ color: dark ? '#0a0a0a' : '#ffffff', fontFamily: 'BebasNeue_400Regular', fontSize: 28, lineHeight: 38 }}>.</Text>;
  }

  return (
    <View
      style={{
        backgroundColor: dark ? 'rgba(10,10,10,0.1)' : 'rgba(255,255,255,0.12)',
        borderColor: dark ? 'rgba(10,10,10,0.22)' : 'rgba(255,255,255,0.32)',
        borderRadius: 5,
        borderWidth: 1,
        height: 39,
        overflow: 'hidden',
        width: 27,
      }}
    >
      <View style={{ backgroundColor: dark ? 'rgba(10,10,10,0.16)' : 'rgba(255,255,255,0.16)', height: 1, left: 0, position: 'absolute', right: 0, top: 19 }} />
      <Animated.Text
        style={{
          color: dark ? '#0a0a0a' : '#ffffff',
          fontFamily: 'BebasNeue_400Regular',
          fontSize: 31,
          lineHeight: 39,
          opacity: progress,
          textAlign: 'center',
          transform: [
            { perspective: 280 },
            { rotateX: progress.interpolate({ inputRange: [0, 1], outputRange: ['-88deg', '0deg'] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
          ],
        }}
      >
        {character}
      </Animated.Text>
    </View>
  );
}

function MechanicalScoreHeader({ dark, label, runKey, score }: { dark: boolean; label: string; runKey: number; score: number }) {
  const value = score.toFixed(2);
  const digitCount = value.replace('.', '').length;
  let digitIndex = -1;
  return (
    <View accessibilityLabel={`${label} ${value}`} className="absolute items-center" style={{ top: 40 }}>
      <Text
        className={`font-mono text-[10px] font-black uppercase tracking-[2px] ${dark ? 'text-neutral-950/60' : 'text-white/75'}`}
        style={{ marginBottom: 6 }}
      >
        {label}
      </Text>
      <View className="flex-row items-center" style={{ gap: 3 }}>
        {value.split('').map((character, index) => {
          if (character !== '.') digitIndex += 1;
          const delay = character === '.'
            ? 0
            : 220 + (digitCount <= 1 ? 0 : digitIndex * (1210 / (digitCount - 1)));
          return <MechanicalDigit character={character} dark={dark} delay={delay} key={`${character}-${index}`} runKey={runKey} />;
        })}
      </View>
    </View>
  );
}

type LaneModalProps = {
  failureMessage: string;
  failureTitle: string;
  onComplete?: () => void;
  laneProgress?: LaneProgress;
  success: boolean;
  successMessage: string;
  successTitle: string;
  successTitleDetail?: string;
  visible: boolean;
  warning?: boolean;
  neutral?: boolean;
  ending?: boolean;
  score?: number;
  scoreLabel?: string;
  holding?: boolean;
  persistent?: boolean;
  bell?: boolean;
  leaving?: boolean;
  suppressHaptic?: boolean;
};

export function LaneModal({
  failureMessage,
  failureTitle,
  onComplete,
  laneProgress,
  success,
  successMessage,
  successTitle,
  successTitleDetail,
  visible,
  warning = false,
  neutral = false,
  ending = false,
  score,
  scoreLabel = 'MISERY RATE',
  holding = false,
  persistent = false,
  bell = false,
  leaving = false,
  suppressHaptic = false,
}: LaneModalProps) {
  const [rendered, setRendered] = useState(false);
  const [scoreAnimationRun, setScoreAnimationRun] = useState(0);
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
    setScoreAnimationRun((run) => run + 1);
    if (!suppressHaptic) {
      playHaptic(bell ? 'bell' : holding || neutral ? 'click' : warning ? 'steal' : success ? 'correct' : 'wrong');
    }
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
  }, [bell, holding, neutral, opacity, persistent, rotation, scale, success, suppressHaptic, visible, warning]);

  const rotate = rotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-45deg', '45deg'],
  });
  const darkForeground = neutral || warning;
  const modalTitleStyle = {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    includeFontPadding: true,
    letterSpacing: 1.2,
    lineHeight: 64,
    paddingBottom: 2,
    paddingTop: 8,
  };
  const twoRowTitleStyle = {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 48,
    includeFontPadding: false,
    letterSpacing: 1.2,
    lineHeight: 50,
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
        {score !== undefined ? <MechanicalScoreHeader dark={darkForeground} label={scoreLabel} runKey={scoreAnimationRun} score={score} /> : null}
        <Animated.View
          className="items-center"
          style={{ gap: contentGap, transform: [{ translateY: -31 }, { scale }, { rotate }], width: '100%' }}
        >
          <View className={`h-40 w-40 items-center justify-center rounded-full border-[6px] ${darkForeground ? 'border-neutral-950 bg-neutral-950/5' : 'border-white bg-white/15'}`}>
            {leaving ? (
              <LogOut color={darkForeground ? '#0a0a0a' : '#ffffff'} size={82} strokeWidth={3.2} />
            ) : holding ? (
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
              <CarnivalMaskIcon />
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
              plusColor={warning ? '#059669' : '#ffffff'}
              target={laneProgress.target}
            />
          )}
          {!laneProgress && title ? (
            <View
              className="items-center justify-center"
              style={{ marginTop: success && successTitleDetail ? 14 : 0, width: '100%' }}
            >
              <Text
                adjustsFontSizeToFit
                className={`text-center font-black uppercase ${darkForeground ? 'text-neutral-950' : 'text-white'}`}
                minimumFontScale={0.72}
                numberOfLines={1}
                style={success && successTitleDetail ? twoRowTitleStyle : modalTitleStyle}
              >
                {title}
              </Text>
              {success && successTitleDetail ? (
                <View className="items-center justify-center" style={{ width: '100%' }}>
                  <Text
                    adjustsFontSizeToFit
                    className={`text-center font-black uppercase ${darkForeground ? 'text-neutral-950' : 'text-white'}`}
                    minimumFontScale={0.72}
                    numberOfLines={1}
                    style={[twoRowTitleStyle, { width: '100%' }]}
                  >
                    {successTitleDetail}
                  </Text>
                </View>
              ) : null}
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
