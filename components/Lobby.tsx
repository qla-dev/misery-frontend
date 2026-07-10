import React, { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Apple, Check, Copy, Crown, Flame, Loader2, LogIn, Plus, Share2, Sparkles, User } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { Animated, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { AppButton, Section, Surface } from './AppPrimitives';
import { AppInput } from './AppInput';
import { GradientButton } from './GradientButton';
import ManSilhouette from './ManSilhouette';
import { ButtonTab } from './ButtonTab';
import { Card } from './Card';
import { ConfirmModal } from './ConfirmModal';
import { LoadingState } from './LoadingState';

const AVAILABLE_COLORS = [
  { id: 'yellow', nameEn: 'Amber Gold', nameBs: 'Zlatni Ćilibar', bgClass: 'bg-yellow-400', borderClass: 'border-yellow-400 bg-yellow-400/5 text-yellow-400' },
  { id: 'blue', nameEn: 'Electric Blue', nameBs: 'Električna Plava', bgClass: 'bg-blue-400', borderClass: 'border-blue-400 bg-blue-400/5 text-blue-400' },
  { id: 'emerald', nameEn: 'Neon Emerald', nameBs: 'Neon Zelena', bgClass: 'bg-emerald-400', borderClass: 'border-emerald-400 bg-emerald-400/5 text-emerald-400' },
  { id: 'purple', nameEn: 'Vibrant Purple', nameBs: 'Ljubičasta', bgClass: 'bg-purple-400', borderClass: 'border-purple-400 bg-purple-400/5 text-purple-400' },
  { id: 'rose', nameEn: 'Radical Rose', nameBs: 'Koralno Crvena', bgClass: 'bg-rose-400', borderClass: 'border-rose-400 bg-rose-400/5 text-rose-400' },
  { id: 'cyan', nameEn: 'Cyber Cyan', nameBs: 'Sajber Plava', bgClass: 'bg-cyan-400', borderClass: 'border-cyan-400 bg-cyan-400/5 text-cyan-400' },
];

const BOT_NAMES = ['Sanjin', 'Lejla', 'Aida', 'Kenan', 'Selma', 'Tarik', 'Emina', 'Amar'];
const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');
const RAIN_LOTTIE = require('../assets/animations/rain.json');
const ROOM_CODE_REGEX = /^(?=(?:.*[A-Z]){4})(?=(?:.*\d){4})[A-Z\d]{8}$/;

function generateRoomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const code = [
    ...Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]),
    ...Array.from({ length: 4 }, () => digits[Math.floor(Math.random() * digits.length)]),
  ];

  for (let index = code.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [code[index], code[randomIndex]] = [code[randomIndex], code[index]];
  }

  return code.join('');
}

const BOLT_PATH = 'M 362 0 L 187 0 L 184 12 L 143 139 L 107 248 L 198 248 L 200 250 L 158 387 L 147 433 L 199 362 L 346 176 L 345 174 L 242 173 L 310 74 L 357 9 Z';
const WARNING_PATH = 'M 317 317 L 256 388 L 258 394 L 265 395 L 289 376 L 290 381 L 284 410 L 287 416 L 293 417 L 316 412 L 328 412 L 302 442 L 301 446 L 303 449 L 332 463 L 334 466 L 300 480 L 298 484 L 299 488 L 302 491 L 308 491 L 400 473 L 396 470 L 342 449 L 328 442 L 328 440 L 385 375 L 305 398 L 304 397 L 318 321 Z';
const HEAD_PATH = 'M 134.98 391.89 L 128.34 393.84 Q 121.00 396.00 114.25 399.60 L 112.75 400.40 Q 106.00 404.00 100.28 409.08 L 92.57 415.93 Q 88.00 420.00 84.40 424.95 L 83.60 426.05 Q 80.00 431.00 77.26 436.47 L 76.15 438.70 Q 73.00 445.00 71.11 451.79 L 70.25 454.90 Q 68.00 463.00 67.60 471.40 L 67.28 478.09 Q 67.00 484.00 67.90 489.85 L 68.10 491.15 Q 69.00 497.00 70.97 502.58 L 72.38 506.58 Q 75.00 514.00 79.05 520.75 L 79.95 522.25 Q 84.00 529.00 89.37 534.75 L 93.82 539.53 Q 98.00 544.00 102.95 547.60 L 104.05 548.40 Q 109.00 552.00 114.47 554.74 L 117.14 556.07 Q 123.00 559.00 129.30 560.80 L 130.70 561.20 Q 137.00 563.00 143.55 563.00 L 163.00 563.00 Q 173.00 563.00 182.36 559.49 L 190.34 556.50 Q 197.00 554.00 202.85 549.95 L 204.15 549.05 Q 210.00 545.00 214.89 539.83 L 222.71 531.54 Q 227.00 527.00 230.15 521.60 L 230.85 520.40 Q 234.00 515.00 236.07 509.10 L 239.19 500.17 Q 241.00 495.00 241.90 489.60 L 242.10 488.40 Q 243.00 483.00 242.74 477.53 L 242.40 470.40 Q 242.00 462.00 239.75 453.90 L 238.89 450.79 Q 237.00 444.00 233.85 437.70 L 232.46 434.91 Q 230.00 430.00 226.85 425.50 L 226.15 424.50 Q 223.00 420.00 218.99 416.24 L 213.31 410.92 Q 207.00 405.00 199.35 400.95 L 190.00 396.00 Q 190.00 396.00 190.00 396.00 L 159.23 438.90 Q 157.00 442.00 154.30 444.70 L 153.70 445.30 Q 151.00 448.00 147.20 448.38 L 144.50 448.65 Q 141.00 449.00 138.30 446.75 L 137.19 445.82 Q 135.00 444.00 134.10 441.30 L 133.90 440.70 Q 133.00 438.00 133.75 435.25 L 144.64 395.30 Q 145.00 394.00 145.00 392.65 L 145.00 391.00 Q 145.00 391.00 145.00 391.00 L 141.15 391.00 Q 138.00 391.00 134.98 391.89 Z';
const BODY_PATH = 'M 69.25 582.25 L 66.35 583.22 Q 61.00 585.00 56.05 587.70 L 54.95 588.30 Q 50.00 591.00 45.82 594.78 L 35.67 603.96 Q 29.00 610.00 24.53 617.81 L 20.53 624.82 Q 17.00 631.00 14.75 637.75 L 13.87 640.38 Q 12.00 646.00 11.10 651.85 L 10.90 653.15 Q 10.00 659.00 10.03 664.92 L 10.98 839.37 Q 11.00 843.00 12.80 846.15 L 13.20 846.85 Q 15.00 850.00 17.57 852.57 L 18.30 853.30 Q 21.00 856.00 24.55 857.42 L 26.82 858.33 Q 31.00 860.00 35.50 860.00 L 36.50 860.00 Q 41.00 860.00 45.18 858.33 L 47.45 857.42 Q 51.00 856.00 53.70 853.30 L 54.43 852.57 Q 57.00 850.00 58.80 846.85 L 59.20 846.15 Q 61.00 843.00 61.02 839.37 L 61.97 700.87 Q 62.00 697.00 64.25 693.85 L 64.75 693.15 Q 67.00 690.00 70.85 689.57 L 73.14 689.32 Q 76.00 689.00 78.25 690.80 L 78.78 691.22 Q 81.00 693.00 81.90 695.70 L 82.10 696.30 Q 83.00 699.00 83.00 701.85 L 83.00 1167.15 Q 83.00 1172.00 84.80 1176.50 L 85.22 1177.56 Q 87.00 1182.00 90.15 1185.60 L 91.20 1186.81 Q 94.00 1190.00 97.60 1192.25 L 98.40 1192.75 Q 102.00 1195.00 106.07 1196.22 L 108.98 1197.09 Q 112.00 1198.00 115.15 1198.00 L 115.85 1198.00 Q 119.00 1198.00 122.01 1197.07 L 126.15 1195.80 Q 132.00 1194.00 136.51 1189.86 L 141.03 1185.72 Q 144.00 1183.00 145.80 1179.40 L 146.20 1178.60 Q 148.00 1175.00 148.09 1170.98 L 149.96 1086.00 Q 150.00 1084.00 149.99 1082.00 L 149.01 908.29 Q 149.00 906.00 149.45 903.75 L 149.55 903.25 Q 150.00 901.00 151.62 899.38 L 153.06 897.94 Q 155.00 896.00 157.70 895.55 L 158.30 895.45 Q 161.00 895.00 163.23 896.59 L 166.03 898.59 Q 168.00 900.00 168.90 902.25 L 169.10 902.75 Q 170.00 905.00 170.00 907.42 L 170.00 1165.15 Q 170.00 1171.00 172.25 1176.40 L 172.75 1177.60 Q 175.00 1183.00 179.31 1186.95 L 182.49 1189.86 Q 187.00 1194.00 192.85 1195.80 L 195.25 1196.54 Q 200.00 1198.00 204.95 1197.55 L 206.17 1197.44 Q 211.00 1197.00 215.50 1195.20 L 216.56 1194.78 Q 221.00 1193.00 224.60 1189.85 L 225.81 1188.80 Q 229.00 1186.00 231.25 1182.40 L 231.75 1181.60 Q 234.00 1178.00 234.95 1173.86 L 235.65 1170.85 Q 237.00 1165.00 237.00 1159.00 L 237.00 699.51 Q 237.00 696.00 239.25 693.30 L 239.75 692.70 Q 242.00 690.00 245.49 689.61 L 248.14 689.32 Q 251.00 689.00 253.25 690.80 L 254.43 691.74 Q 256.00 693.00 256.90 694.80 L 257.10 695.20 Q 258.00 697.00 258.00 699.01 L 258.00 837.15 Q 258.00 840.00 258.90 842.70 L 259.10 843.30 Q 260.00 846.00 261.90 848.12 L 266.98 853.76 Q 269.00 856.00 271.70 857.35 L 272.30 857.65 Q 275.00 859.00 278.01 859.22 L 286.16 859.80 Q 289.00 860.00 291.70 859.10 L 292.30 858.90 Q 295.00 858.00 297.22 856.22 L 300.75 853.40 Q 305.00 850.00 307.25 845.05 L 307.75 843.95 Q 310.00 839.00 310.00 833.56 L 310.00 663.47 Q 310.00 658.00 309.10 652.60 L 308.90 651.40 Q 308.00 646.00 306.13 640.86 L 301.79 628.93 Q 300.00 624.00 297.30 619.50 L 296.70 618.50 Q 294.00 614.00 290.64 609.97 L 288.50 607.40 Q 284.00 602.00 278.42 597.73 L 274.04 594.38 Q 267.00 589.00 258.90 585.40 L 252.39 582.51 Q 249.00 581.00 245.40 580.10 L 244.60 579.90 Q 241.00 579.00 237.29 578.94 L 180.00 578.03 Q 178.00 578.00 176.00 578.04 L 83.11 579.86 Q 76.00 580.00 69.25 582.25 Z';

function GoogleIcon({ color = '#000' }: { color?: string }) {
  return (
    <View style={{ width: 16, height: 16 }}>
      <Text style={{ color, fontSize: 16, fontWeight: '900', lineHeight: 16 }}>G</Text>
    </View>
  );
}

function SocialButtonContent({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'light' | 'dark';
}) {
  return (
    <View className="flex-row items-center justify-center gap-3">
      {icon}
      <Text className={`font-black text-sm tracking-wider uppercase ${tone === 'light' ? 'text-black' : 'text-neutral-300'}`}>
        {label}
      </Text>
    </View>
  );
}

function PlayerCard({
  index,
  isBs,
  player,
  roomState,
}: {
  index: number;
  isBs: boolean;
  player: { color: string; isBot?: boolean; name: string };
  roomState: 'created' | 'joined';
}) {
  const playerColor =
    AVAILABLE_COLORS.find((color) => color.borderClass === player.color) ??
    AVAILABLE_COLORS[index % AVAILABLE_COLORS.length];

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className={`h-4 w-4 rounded-full ${playerColor.bgClass}`} />
          <Text className="text-base font-bold text-neutral-200">{player.name}</Text>
          {index === 0 && <Crown size={18} color="#facc15" fill="#facc15" />}
        </View>
        <View className="flex-row items-center gap-2">
          {player.isBot ? (
            roomState === 'joined' && index !== 0 ? (
              <Text className="rounded-md bg-neutral-800 px-2.5 py-1 font-mono text-[10px] text-neutral-400">
                BOT
              </Text>
            ) : (
              <Text className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase text-amber-300">
                {roomState === 'joined' ? 'HOST BOT' : 'BOT'}
              </Text>
            )
          ) : (
            <Text
              className={`rounded-md bg-yellow-500 px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase text-black ${
                roomState === 'joined' ? 'animate-pulse' : ''
              }`}
            >
              {roomState === 'created' ? (isBs ? 'TI (HOST)' : 'YOU (HOST)') : isBs ? 'TI' : 'YOU'}
            </Text>
          )}
          <Text className="ml-2 font-mono text-sm text-emerald-400">✓</Text>
        </View>
      </View>
    </Card>
  );
}

function RoomCodeCard({
  code,
  isBs,
  isCopied,
  onCopy,
  onShare,
}: {
  code: string;
  isBs: boolean;
  isCopied: boolean;
  onCopy: () => void;
  onShare: () => void;
}) {
  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View style={{ gap: 4 }}>
          <Text className="font-mono text-[9px] font-bold uppercase tracking-widest text-neutral-500">
            {isBs ? 'KOD SOBE' : 'ROOM CODE'}
          </Text>
          <Text className="font-mono text-xl font-black tracking-[4px] text-amber-400">
            {code}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <GlassView
            colorScheme="dark"
            glassEffectStyle="regular"
            isInteractive
            style={{ borderRadius: 12, height: 40, overflow: 'hidden', width: 40 }}
            tintColor="rgba(255,255,255,0.08)"
          >
            <Pressable
              accessibilityLabel={isBs ? 'Kopiraj kod sobe' : 'Copy room code'}
              accessibilityRole="button"
              className="h-full w-full items-center justify-center"
              onPress={onCopy}
            >
              {isCopied ? <Check size={18} color="#34d399" /> : <Copy size={18} color="#d4d4d4" />}
            </Pressable>
          </GlassView>
          <GlassView
            colorScheme="dark"
            glassEffectStyle="regular"
            isInteractive
            style={{ borderRadius: 12, height: 40, overflow: 'hidden', width: 40 }}
            tintColor="rgba(255,255,255,0.08)"
          >
            <Pressable
              accessibilityLabel={isBs ? 'Podijeli kod sobe' : 'Share room code'}
              accessibilityRole="button"
              className="h-full w-full items-center justify-center"
              onPress={onShare}
            >
              <Share2 size={18} color="#d4d4d4" />
            </Pressable>
          </GlassView>
        </View>
      </View>
    </Card>
  );
}

function AnimatedILetter({ style }: { style?: any }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const boltOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.08, 0.42, 0.08],
  });
  const warningOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.65, 0.1],
  });
  const warningScale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.86, 1.16, 0.86],
  });

  return (
    <View style={[{ height: 95, width: 44 }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 412 1208">
        <Defs>
          <SvgLinearGradient id="whiteBody" x1="80" y1="420" x2="250" y2="1190" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#ffffff" />
            <Stop offset="0.55" stopColor="#f7f7f7" />
            <Stop offset="1" stopColor="#ffffff" />
          </SvgLinearGradient>
          <SvgLinearGradient id="yellowBolt" x1="170" y1="0" x2="330" y2="490" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#ffd900" />
            <Stop offset="0.45" stopColor="#ffcc00" />
            <Stop offset="1" stopColor="#ffc400" />
          </SvgLinearGradient>
        </Defs>
        <Path d={BOLT_PATH} fill="url(#yellowBolt)" />
        <Path d={WARNING_PATH} fill="url(#yellowBolt)" />
        <Path d={HEAD_PATH} fill="url(#whiteBody)" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <Path d={BODY_PATH} fill="url(#whiteBody)" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      </Svg>

      <Animated.View pointerEvents="none" style={[{ bottom: 60, height: 34, left: 11, opacity: boltOpacity, position: 'absolute', width: 28 }]}>
        <Svg width="100%" height="100%" viewBox="90 0 275 438">
          <Path d={BOLT_PATH} fill="#fff176" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            height: 17,
            left: 26,
            opacity: warningOpacity,
            position: 'absolute',
            top: 24,
            transform: [{ scale: warningScale }],
            width: 18,
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="250 310 160 190">
          <Path d={WARNING_PATH} fill="#fff176" />
        </Svg>
      </Animated.View>
    </View>
  );
}

function WelcomeSilhouetteRow({ flip = false }: { flip?: boolean }) {
  const count = 7;
  const stormIndex = 3;

  return (
    <View className="flex-row items-end justify-center pt-5">
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          className="items-center"
          style={{
            marginHorizontal: -4,
            opacity: idx === stormIndex ? 1 : 0.92,
            transform: [
              { scaleX: idx % 2 === 0 ? -1 : 1 },
              { translateY: flip ? 2 : 0 },
            ],
          }}
        >
          {idx === stormIndex ? (
            <View
              pointerEvents="none"
              style={{
                height: 58,
                position: 'absolute',
                left: 6,
                top: -28,
                width: 58,
                zIndex: 10,
              }}
            >
              <LottieView
                autoPlay
                loop
                source={RAIN_LOTTIE}
                style={{ height: 58, width: 58 }}
              />
            </View>
          ) : null}
          <ManSilhouette
            width={72}
            height={96}
            color={idx === stormIndex ? '#ffffff' : '#facc15'}
          />
        </View>
      ))}
    </View>
  );
}

export default function Lobby() {
  const insets = useSafeAreaInsets();
  const {
    language,
    lobbyView,
    setLobbyView,
    setupTab,
    setSetupTab,
    userName,
    setUserName,
    selectedColor,
    setSelectedColor,
    targetScore,
    setTargetScore,
    selectedDeck,
    setSelectedDeck,
    isSocialUser,
    setIsSocialUser,
    socialProvider,
    setSocialProvider,
    roomCode,
    setRoomCode,
    enteredCode,
    setEnteredCode,
    roomPlayers,
    setRoomPlayers,
    isCopied,
    setIsCopied,
    joinStatusText,
    setJoinStatusText,
    setSession,
  } = useGame();

  const isBs = language === 'bs';
  const lobbyScrollRef = useRef<ScrollView>(null);
  const codeInputFocusedRef = useRef(false);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCodeInputFocused, setIsCodeInputFocused] = useState(false);
  const [joinCodeErrorOpen, setJoinCodeErrorOpen] = useState(false);

  useEffect(() => {
    const keyboardSubscription = Keyboard.addListener('keyboardDidShow', () => {
      if (!codeInputFocusedRef.current) return;
      requestAnimationFrame(() => {
        lobbyScrollRef.current?.scrollToEnd({ animated: true });
      });
    });

    return () => keyboardSubscription.remove();
  }, []);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    };
  }, []);

  const handleCreateRoom = () => {
    playSound('click');
    const finalName = userName.trim() || (isBs ? 'Igrač 1' : 'Player 1');
    const userColor = AVAILABLE_COLORS.find((c) => c.id === selectedColor)?.borderClass || AVAILABLE_COLORS[0].borderClass;
    setRoomCode(generateRoomCode());
    setIsCopied(false);
    setRoomPlayers([{ name: finalName, color: userColor, isBot: false }]);
    setLobbyView('ROOM_CREATED');
  };

  const handleJoinWithCode = () => {
    const cleanCode = enteredCode.trim().toUpperCase();
    if (!ROOM_CODE_REGEX.test(cleanCode)) {
      Keyboard.dismiss();
      playSound('wrong');
      setJoinCodeErrorOpen(true);
      return;
    }
    playSound('click');
    setRoomCode(cleanCode);
    setLobbyView('ROOM_JOINING');
    setJoinStatusText(isBs ? 'Traženje sobe...' : 'Searching for room...');

    setTimeout(() => {
      setJoinStatusText(isBs ? 'Soba pronađena! Sinkronizacija...' : 'Room found! Synchronizing...');
      setTimeout(() => {
        const finalName = userName.trim() || (isBs ? 'Igrač 2' : 'Player 2');
        const userColorConfig = AVAILABLE_COLORS.find((c) => c.id === selectedColor) || AVAILABLE_COLORS[1];
        const botColorConfigs = AVAILABLE_COLORS.filter((color) => color.id !== userColorConfig.id);
        setRoomPlayers([
          { name: 'Selma 👑', color: botColorConfigs[0].borderClass, isBot: true },
          { name: 'Kenan', color: botColorConfigs[1].borderClass, isBot: true },
          { name: finalName, color: userColorConfig.borderClass, isBot: false },
        ]);
        setLobbyView('ROOM_JOINED');
      }, 1200);
    }, 1000);
  };

  const handleCopyRoomCode = async () => {
    if (!roomCode) return;
    playSound('click');
    try {
      await Clipboard.setStringAsync(roomCode);
      setIsCopied(true);
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setIsCopied(false);
    }
  };

  const handleShareRoomCode = async () => {
    if (!roomCode) return;
    playSound('click');
    try {
      await Share.share({
        message: isBs
          ? `Pridruži se mojoj Misery Meter sobi pomoću koda ${roomCode}.`
          : `Join my Misery Meter room with code ${roomCode}.`,
        title: 'Misery Meter',
      });
    } catch {
      // Native share can be dismissed or unavailable without affecting the room.
    }
  };

  const handleSocialSignIn = (provider: 'google' | 'apple') => {
    playSound('click');
    setUserName('Amel Kulasin');
    setIsSocialUser(true);
    setSocialProvider(provider);
    setLobbyView('SETUP');
  };

  useEffect(() => {
    if (lobbyView !== 'ROOM_CREATED') return;
    if (roomPlayers.length >= 4) return;
    const timer = setTimeout(() => {
      const usedNames = roomPlayers.map((p) => p.name);
      const availableNames = BOT_NAMES.filter((name) => !usedNames.includes(name) && name !== userName.trim());
      const botName = availableNames[Math.floor(Math.random() * availableNames.length)] || 'Simulirani Igrač';
      const usedColors = roomPlayers.map((p) => p.color);
      const availableColorConfigs = AVAILABLE_COLORS.filter((c) => !usedColors.includes(c.borderClass));
      const botColorConfig = availableColorConfigs[Math.floor(Math.random() * availableColorConfigs.length)] || AVAILABLE_COLORS[2];
      setRoomPlayers((prev) => [...prev, { name: botName, color: botColorConfig.borderClass, isBot: true }]);
    }, 1200 + Math.random() * 800);
    return () => clearTimeout(timer);
  }, [lobbyView, roomPlayers, userName, setRoomPlayers]);

  const startGame = (
    mode: 'SOLO' | 'MULTIPLAYER',
    players: { name: string; color: string; isBot?: boolean }[],
    tScore: number,
    deck: 'NORMAL' | 'SPICY'
  ) => {
    setSession({ mode, players, targetScore: tScore, deckType: deck });
    requestAnimationFrame(() => router.push('/game'));
  };

  const activeColorConfig = AVAILABLE_COLORS.find((c) => c.id === selectedColor) || AVAILABLE_COLORS[0];
  const hasPlayerIdentity = isSocialUser || Boolean(userName.trim());
  const hasValidRoomCode = ROOM_CODE_REGEX.test(enteredCode.trim().toUpperCase());

  const renderSetupTabs = () => (
    <View style={{ alignSelf: 'center', flexDirection: 'row', gap: 8, height: 48, maxWidth: 420, width: '100%' }}>
      <GlassView
        colorScheme="dark"
        glassEffectStyle={{
          style: setupTab === 'CREATE' ? 'regular' : 'none',
          animate: true,
          animationDuration: 0.6,
        }}
        isInteractive
        style={{ alignItems: 'center', borderRadius: 12, flex: 1, justifyContent: 'center' }}
        tintColor="rgba(251,191,36,0.16)"
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: setupTab === 'CREATE' }}
          onPress={() => {
            playSound('click');
            setSetupTab('CREATE');
          }}
          className="w-full h-full rounded-xl items-center justify-center"
          style={({ pressed }) => [
            {
              borderColor: setupTab === 'CREATE' ? 'rgba(251,191,36,0.5)' : 'rgba(38,38,38,1)',
              borderWidth: 1,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <View className="flex-row items-center justify-center gap-2 px-2">
            <View className={`w-6 h-6 rounded-md items-center justify-center ${setupTab === 'CREATE' ? 'bg-amber-400/20' : 'bg-transparent'}`}>
              <Plus size={14} color={setupTab === 'CREATE' ? '#fbbf24' : '#ffffff'} strokeWidth={3} />
            </View>
            <Text className={`text-xs font-black uppercase tracking-wider ${setupTab === 'CREATE' ? 'text-amber-300' : 'text-neutral-200'}`}>
              {isBs ? 'Kreiraj Sobu' : 'Create Room'}
            </Text>
          </View>
        </Pressable>
      </GlassView>

      <GlassView
        colorScheme="dark"
        glassEffectStyle={{
          style: setupTab === 'JOIN' ? 'regular' : 'none',
          animate: true,
          animationDuration: 0.6,
        }}
        isInteractive
        style={{ alignItems: 'center', borderRadius: 12, flex: 1, justifyContent: 'center' }}
        tintColor="rgba(251,191,36,0.16)"
      >
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: setupTab === 'JOIN' }}
          onPress={() => {
            playSound('click');
            setSetupTab('JOIN');
          }}
          className="w-full h-full rounded-xl items-center justify-center"
          style={({ pressed }) => [
            {
              borderColor: setupTab === 'JOIN' ? 'rgba(251,191,36,0.5)' : 'rgba(38,38,38,1)',
              borderWidth: 1,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <View className="flex-row items-center justify-center gap-2 px-2">
            <View className={`w-6 h-6 rounded-md items-center justify-center ${setupTab === 'JOIN' ? 'bg-amber-400/20' : 'bg-transparent'}`}>
              <LogIn size={14} color={setupTab === 'JOIN' ? '#fbbf24' : '#ffffff'} strokeWidth={3} />
            </View>
            <Text className={`text-xs font-black uppercase tracking-wider ${setupTab === 'JOIN' ? 'text-amber-300' : 'text-neutral-200'}`}>
              {isBs ? 'Pridruži se' : 'Enter Code'}
            </Text>
          </View>
        </Pressable>
      </GlassView>
    </View>
  );

  const renderContent = () => {
    if (lobbyView === 'WELCOME') {
      return (
        <View style={{ gap: 24 }}>
          <View
            style={{ gap: 22 }}
          >
            <View className="items-center" style={{ gap: 10 }}>
              <View className="items-center">
                <View className="flex-row items-center justify-center">
                  <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-amber-400">
                    M
                  </Text>
                  <LottieView
                    autoPlay
                    loop
                    source={MASCOT_LOTTIE}
                    style={{
                      height: 95,
                      marginBottom: -4,
                      marginHorizontal: -4,
                      marginTop: -52,
                      transform: [{ translateY: -5 }, { translateX: 5 }],
                      width: 44,
                    }}
                  />
                  <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-amber-400">
                    SERY
                  </Text>
                </View>
                <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-white" style={{ marginTop: -16 }}>
                  METER
                </Text>
              </View>
              <Text className="text-2xl text-neutral-400 text-center leading-7 font-handwritten tracking-[1px] uppercase px-2">
                {isBs
                  ? 'Svako od nas ima loše dane. Dokaži ko preživljava najgoru patnju.'
                  : 'We all have bad days. Prove who survives the worst misery.'}
              </Text>
            </View>

            <View className="items-center" style={{ display: 'none' }}>
              <Text className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase text-center font-black">
                MISERY METER • MISERABLE MATCH
              </Text>
              <Text className="text-center text-[46px] font-black uppercase leading-[46px] tracking-tight">
                <Text className="text-amber-400">MISERY</Text>
                {'\n'}
                <Text className="text-white">METER</Text>
              </Text>
              <Text className="text-xs text-neutral-400 text-center leading-relaxed font-sans font-bold">
                {isBs
                  ? 'Svako od nas ima loše dane. Dokaži ko preživljava najgoru patnju.'
                  : 'We all have bad days. Prove who survives the worst misery.'}
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              <View style={{ gap: 10 }}>
                <ButtonTab
                  category="button"
                  type="third"
                  size="100"
                  onPress={() => handleSocialSignIn(Platform.OS === 'ios' ? 'apple' : 'google')}
                >
                  <SocialButtonContent
                    icon={Platform.OS === 'ios' ? <Apple size={16} color="#000" /> : <GoogleIcon />}
                    label={
                      Platform.OS === 'ios'
                        ? isBs ? 'Prijavi se sa Apple-om' : 'Sign in with Apple'
                        : isBs ? 'Prijavi se sa Google-om' : 'Sign in with Google'
                    }
                    tone="light"
                  />
                </ButtonTab>
                <ButtonTab
                  category="button"
                  type="secondary"
                  size="100"
                  onPress={() => handleSocialSignIn(Platform.OS === 'ios' ? 'google' : 'apple')}
                >
                  <SocialButtonContent
                    icon={Platform.OS === 'ios' ? <GoogleIcon color="#fff" /> : <Apple size={16} color="#fff" />}
                    label={
                      Platform.OS === 'ios'
                        ? isBs ? 'Prijavi se sa Google-om' : 'Sign in with Google'
                        : isBs ? 'Prijavi se sa Apple-om' : 'Sign in with Apple'
                    }
                    tone="dark"
                  />
                </ButtonTab>
              </View>
              <View className="flex-row items-center justify-center gap-4 py-1">
                <View className="h-px bg-neutral-800 flex-1" />
                <Text className="text-[10px] font-mono text-neutral-600 font-black uppercase">{isBs ? 'ILI' : 'OR'}</Text>
                <View className="h-px bg-neutral-800 flex-1" />
              </View>
              <ButtonTab
                category="button"
                type="secondary"
                size="100"
                onPress={() => {
                  playSound('click');
                  setIsSocialUser(false);
                  setSocialProvider(null);
                  setUserName('');
                  setLobbyView('SETUP');
                }}
              >
                <SocialButtonContent
                  icon={<User size={16} color="#a3a3a3" />}
                  label={isBs ? 'Igraj kao gost' : 'Play as Guest'}
                  tone="dark"
                />
              </ButtonTab>
            </View>

            <WelcomeSilhouetteRow flip />
          </View>
          <View className="bg-neutral-900/35 border border-neutral-900/60 p-6 rounded-2xl shadow-lg" style={{ display: 'none' }}>
            <Text className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase text-center font-bold">
              MISERY METER • MISERABLE MATCH
            </Text>
            <View className="flex-row items-center justify-around py-3 bg-neutral-950/40 rounded-xl relative overflow-hidden border border-neutral-900/40 px-2">
              {['Gost 1', 'Gost 2', null, 'Gost 3', 'Gost 4'].map((label, idx) => (
                <View key={idx} className="items-center gap-1.5">
                  <View className={`w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700/60 items-center justify-center ${idx === 2 ? 'w-11 h-11 border-2 border-rose-400 bg-rose-500 -mt-1 scale-110' : ''}`}>
                    <Text className={`text-[11px] font-bold ${idx === 2 ? 'text-white text-xs' : 'text-neutral-400'}`}>
                      {idx === 2 ? '☠' : '☺'}
                    </Text>
                  </View>
                  <Text className="text-[7px] font-mono text-neutral-600">{label}</Text>
                </View>
              ))}
              <View className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Text className="text-cyan-400 text-[8px]">⛈</Text>
              </View>
            </View>
            <Text className="text-xs text-neutral-400 text-center leading-relaxed font-sans">
              {isBs
                ? 'Svako od nas ima loše dane... Ali ko prolazi kroz najgoru životnu patnju? Pridruži se i saznaj!'
                : 'We all have bad days... But who experiences the absolute worst life misery? Sign in to prove your resilience!'}
            </Text>
          </View>

          <View style={{ display: 'none' }}>
            <View style={{ gap: 12 }}>
              <Pressable
                onPress={() => {
                  setUserName('Amel Kulašin');
                  setIsSocialUser(true);
                  setSocialProvider('google');
                  setLobbyView('SETUP');
                }}
                className="w-full py-3.5 px-4 bg-white rounded-xl flex-row items-center justify-center gap-3 shadow-md"
              >
                <GoogleIcon />
                <Text className="text-black font-black text-xs tracking-wider uppercase">
                  {isBs ? 'Prijavi se sa Google-om' : 'Sign in with Google'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setUserName('Amel Kulašin');
                  setIsSocialUser(true);
                  setSocialProvider('apple');
                  setLobbyView('SETUP');
                }}
                className="w-full py-3.5 px-4 bg-black rounded-xl flex-row items-center justify-center gap-3 shadow-md border border-neutral-800"
              >
                <Apple size={16} color="#fff" />
                <Text className="text-white font-black text-xs tracking-wider uppercase">
                  {isBs ? 'Prijavi se sa Apple-om' : 'Sign in with Apple'}
                </Text>
              </Pressable>
            </View>
            <View className="flex-row items-center justify-center gap-4 py-1">
              <View className="h-px bg-neutral-900 flex-1" />
              <Text className="text-[10px] font-mono text-neutral-600 font-black uppercase">{isBs ? 'ILI' : 'OR'}</Text>
              <View className="h-px bg-neutral-900 flex-1" />
            </View>
            <Pressable
              onPress={() => {
                setIsSocialUser(false);
                setSocialProvider(null);
                setUserName('');
                setLobbyView('SETUP');
              }}
              className="w-full py-3.5 bg-neutral-900/30 border border-neutral-800 rounded-xl flex-row items-center justify-center gap-2"
            >
              <User size={16} color="#a3a3a3" />
              <Text className="text-neutral-300 font-extrabold text-xs tracking-wider uppercase">
                {isBs ? 'Igraj kao gost' : 'Play as Guest'}
              </Text>
            </Pressable>
          </View>

          <View className="pt-4 pb-2 items-center" style={{ gap: 4 }}>
            <Text className="text-[10px] text-neutral-600 font-mono">© 2026 Misery Meter</Text>
            <Text className="text-[10px] text-neutral-600 font-mono opacity-80">
              {isBs ? 'Serveri aktivni • Multiplayer mode' : 'Servers active • Multiplayer mode'}
            </Text>
          </View>
        </View>
      );
    }

    if (lobbyView === 'SETUP') {
      if (setupTab === 'CREATE') {
        return (
          <View style={{ gap: 32 }}>
            {renderSetupTabs()}

            <Section titleEn="PLAYER PROFILE" titleBs="PROFIL IGRAČA">
              {isSocialUser ? (
                <View className="flex-row items-center justify-between bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-900">
                  <View className="flex-row items-center gap-3">
                    <LinearGradient colors={['#f59e0b', '#facc15']} className="relative w-10 h-10 rounded-full items-center justify-center">
                      <Text className="text-neutral-950 font-black text-xs">
                        {userName.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text className="font-bold text-xs text-neutral-200">{userName}</Text>
                      <Text className="text-[8px] text-emerald-400 font-mono">
                        {socialProvider === 'google' ? 'Google Account Connected' : 'Apple ID Connected'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      setIsSocialUser(false);
                      setSocialProvider(null);
                      setUserName('');
                      setLobbyView('WELCOME');
                    }}
                    className="px-2 py-1 rounded bg-neutral-800"
                  >
                    <Text className="text-[9px] text-neutral-400">{isBs ? 'Odjavi se' : 'Sign out'}</Text>
                  </Pressable>
                </View>
              ) : (
                <AppInput
                  leftIcon={<User size={16} color="#737373" />}
                  maxLength={15}
                  value={userName}
                  onChangeText={setUserName}
                  placeholder={isBs ? 'Npr. Damir' : 'E.g. Damir'}
                />
              )}
            </Section>

            <Section titleEn="CHOOSE YOUR COLOR" titleBs="ODABERITE SVOJU BOJU">
              <View className="flex-row flex-wrap gap-3">
                {AVAILABLE_COLORS.map((color) => {
                  const isSelected = selectedColor === color.id;
                  return (
                    <Pressable
                      key={color.id}
                      onPress={() => {
                        playSound('click');
                        setSelectedColor(color.id);
                      }}
                      className={`h-9 w-9 rounded-full ${color.bgClass} items-center justify-center border border-white/10`}
                      style={
                        isSelected
                          ? { transform: [{ scale: 1.15 }] }
                          : { transform: [{ scale: 0.9 }] }
                      }
                    >
                      {isSelected && <Check size={14} color="#0a0a0a" strokeWidth={4} />}
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section titleEn="CARDS REQUIRED TO WIN" titleBs="CILJ KARATA ZA POBJEDU">
              <View className="flex-row gap-2">
                {[5, 7, 10, 12].map((num) => (
                  <ButtonTab
                    key={num}
                    category="button"
                    type={targetScore === num ? 'primary' : 'secondary'}
                    size="auto"
                    className="flex-1"
                    onPress={() => {
                      playSound('click');
                      setTargetScore(num);
                    }}
                  >
                    {num.toString()}
                  </ButtonTab>
                ))}
              </View>
            </Section>

            <Section titleEn="CHOOSE THE CARD DECK" titleBs="ODABERITE ŠPIL KARTICA">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    playSound('click');
                    setSelectedDeck('NORMAL');
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl border-2 items-center justify-center gap-1 ${selectedDeck === 'NORMAL' ? 'border-emerald-500 bg-emerald-500/5' : 'border-neutral-900 bg-transparent'}`}
                >
                  <Sparkles size={16} color={selectedDeck === 'NORMAL' ? '#34d399' : '#737373'} />
                  <Text className={`text-[10px] uppercase tracking-wider font-bold ${selectedDeck === 'NORMAL' ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {isBs ? 'Normala' : 'Normal'}
                  </Text>
                  <Text className={`text-[7px] ${selectedDeck === 'NORMAL' ? 'text-emerald-400/75' : 'text-neutral-500'} text-center leading-tight`}>
                    {isBs ? 'Smiješne i čudne situacije' : 'Funny & awkward situations'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    playSound('click');
                    setSelectedDeck('SPICY');
                  }}
                  className={`flex-1 py-3 px-3 rounded-xl border-2 items-center justify-center gap-1 ${selectedDeck === 'SPICY' ? 'border-rose-500 bg-rose-500/5' : 'border-neutral-900 bg-transparent'}`}
                >
                  <Flame size={16} color={selectedDeck === 'SPICY' ? '#fb7185' : '#737373'} />
                  <Text className={`text-[10px] uppercase tracking-wider font-bold ${selectedDeck === 'SPICY' ? 'text-rose-400' : 'text-neutral-500'}`}>
                    {isBs ? 'Ljuti (Spicy)' : 'Spicy'}
                  </Text>
                  <Text className={`text-[7px] ${selectedDeck === 'SPICY' ? 'text-rose-400/75' : 'text-neutral-500'} text-center leading-tight`}>
                    {isBs ? 'Ekstremne i bizarne nesreće' : 'Extreme & bizarre misery'}
                  </Text>
                </Pressable>
              </View>
            </Section>

            <ButtonTab
              category="button"
              type="primary"
              size="100"
              disabled={!hasPlayerIdentity}
              onPress={handleCreateRoom}
            >
              {!hasPlayerIdentity ? (isBs ? 'UNESI IME' : 'ENTER NAME') : isBs ? 'Započni igru' : 'Start Game'}
            </ButtonTab>
          </View>
        );
      } else {
        return (
          <View style={{ gap: 32 }}>
            {renderSetupTabs()}

            <Section titleEn="PLAYER PROFILE" titleBs="PROFIL IGRAČA">
              {isSocialUser ? (
                <View className="flex-row items-center justify-between bg-neutral-900/30 p-3.5 rounded-xl border border-neutral-900">
                  <View className="flex-row items-center gap-3">
                    <LinearGradient colors={['#f59e0b', '#facc15']} className="relative w-10 h-10 rounded-full items-center justify-center">
                      <Text className="text-neutral-950 font-black text-xs">
                        {userName.split(' ').map((n) => n[0]).join('')}
                      </Text>
                    </LinearGradient>
                    <View>
                      <Text className="font-bold text-xs text-neutral-200">{userName}</Text>
                      <Text className="text-[8px] text-emerald-400 font-mono">
                        {socialProvider === 'google' ? 'Google Account Connected' : 'Apple ID Connected'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      setIsSocialUser(false);
                      setSocialProvider(null);
                      setUserName('');
                      setLobbyView('WELCOME');
                    }}
                    className="px-2 py-1 rounded bg-neutral-800"
                  >
                    <Text className="text-[9px] text-neutral-400">{isBs ? 'Odjavi se' : 'Sign out'}</Text>
                  </Pressable>
                </View>
              ) : (
                <AppInput
                  leftIcon={<User size={16} color="#737373" />}
                  maxLength={15}
                  value={userName}
                  onChangeText={setUserName}
                  placeholder={isBs ? 'Npr. Damir' : 'E.g. Damir'}
                />
              )}
            </Section>

            <Section titleEn="CHOOSE YOUR COLOR" titleBs="ODABERITE SVOJU BOJU">
              <View className="flex-row flex-wrap gap-3">
                {AVAILABLE_COLORS.map((color) => {
                  const isSelected = selectedColor === color.id;
                  return (
                    <Pressable
                      key={color.id}
                      onPress={() => {
                        playSound('click');
                        setSelectedColor(color.id);
                      }}
                      className={`h-9 w-9 rounded-full ${color.bgClass} items-center justify-center border border-white/10`}
                      style={
                        isSelected
                          ? { transform: [{ scale: 1.15 }] }
                          : { transform: [{ scale: 0.9 }] }
                      }
                    >
                      {isSelected && <Check size={14} color="#0a0a0a" strokeWidth={4} />}
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section titleEn="ENTER CODE TO JOIN" titleBs="UNESITE KOD ZA PRIDRUŽIVANJE">
              <AppInput
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={8}
                value={enteredCode}
                onChangeText={(text) => {
                  setEnteredCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                }}
                onFocus={() => {
                  codeInputFocusedRef.current = true;
                  setIsCodeInputFocused(true);
                }}
                onBlur={() => {
                  codeInputFocusedRef.current = false;
                  setIsCodeInputFocused(false);
                }}
                placeholder={isBs ? 'NPR. A1B2C3D4' : 'E.G. A1B2C3D4'}
                className="w-full"
                inputClassName="text-center font-mono font-black text-lg uppercase tracking-widest text-amber-400"
              />
            </Section>

            <ButtonTab
              category="button"
              type="primary"
              size="100"
              disabled={!hasPlayerIdentity || !hasValidRoomCode}
              onPress={handleJoinWithCode}
            >
              {!hasPlayerIdentity
                ? isBs
                  ? 'UNESI IME'
                  : 'ENTER NAME'
                : !hasValidRoomCode
                  ? isBs
                    ? 'UNESI KOD SOBE'
                    : 'ENTER ROOM CODE'
                  : isBs
                    ? 'Započni igru'
                    : 'Start Game'}
            </ButtonTab>
          </View>
        );
      }
    }

    if (lobbyView === 'ROOM_CREATED') {
      return (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 16 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                {isBs ? `IGRAČI U SOBI (${roomPlayers.length}/4)` : `PLAYERS IN LOBBY (${roomPlayers.length}/4)`}
              </Text>
              {roomPlayers.length < 4 && (
                <Text className="text-[8px] font-mono text-amber-500/80 uppercase animate-pulse">
                  {isBs ? 'Čekanje igrača...' : 'Waiting for bots...'}
                </Text>
              )}
            </View>
            <RoomCodeCard
              code={roomCode}
              isBs={isBs}
              isCopied={isCopied}
              onCopy={handleCopyRoomCode}
              onShare={handleShareRoomCode}
            />
            <View style={{ gap: 16 }}>
              {roomPlayers.map((player, idx) => (
                <PlayerCard key={`${player.name}-${idx}`} index={idx} isBs={isBs} player={player} roomState="created" />
              ))}
            </View>
          </View>
          <ButtonTab
            category="button"
            type="primary"
            size="100"
            disabled={roomPlayers.length < 2}
            onPress={() => {
              playSound('click');
              startGame('MULTIPLAYER', roomPlayers, targetScore, selectedDeck);
            }}
          >
            {isBs ? 'POKRENI IGRU ODMAH' : 'BEGIN NOW'}
          </ButtonTab>
        </View>
      );
    }

    if (lobbyView === 'ROOM_JOINED') {
      return (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 16 }}>
            <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              {isBs ? 'SVI IGRAČI U SOBI' : 'ALL PLAYERS IN LOBBY'}
            </Text>
            <RoomCodeCard
              code={roomCode}
              isBs={isBs}
              isCopied={isCopied}
              onCopy={handleCopyRoomCode}
              onShare={handleShareRoomCode}
            />
            <View style={{ gap: 16 }}>
              {roomPlayers.map((player, idx) => (
                <PlayerCard key={`${player.name}-${idx}`} index={idx} isBs={isBs} player={player} roomState="joined" />
              ))}
            </View>
          </View>
          <ButtonTab
            category="button"
            type="primary"
            size="100"
            onPress={() => {
              playSound('click');
              startGame('MULTIPLAYER', roomPlayers, targetScore, selectedDeck);
            }}
          >
            <View className="items-center justify-center">
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Loader2 size={15} color="#0a0a0a" className="animate-spin" />
                <Text className="font-black uppercase tracking-wider text-neutral-950">
                  {isBs ? 'POKRENI IGRU' : 'BEGIN GAME'}
                </Text>
              </View>
              <Text className="font-mono text-[8px] font-bold uppercase tracking-widest text-neutral-950/60">
                {isBs ? 'ČEKA SE DOMAĆIN • TEST' : 'WAITING FOR HOST • TEST'}
              </Text>
            </View>
          </ButtonTab>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-neutral-950"
        enabled={isCodeInputFocused}
      >
        <View className="flex-1">
          {lobbyView === 'ROOM_JOINING' ? (
            <LoadingState message={joinStatusText} />
          ) : (
            <ScrollView
              ref={lobbyScrollRef}
              className="flex-1 px-5"
              contentContainerStyle={
                lobbyView === 'WELCOME'
                  ? { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }
                  : lobbyView === 'SETUP'
                    ? { paddingBottom: 15, paddingTop: 104 }
                    : { paddingBottom: 24, paddingTop: 100 }
              }
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderContent()}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
      <ConfirmModal
        confirmLabel={isBs ? 'POKUŠAJ PONOVO' : 'TRY AGAIN'}
        onConfirm={() => {
          playSound('click');
          setJoinCodeErrorOpen(false);
        }}
        onRequestClose={() => setJoinCodeErrorOpen(false)}
        visible={joinCodeErrorOpen}
      >
        <View className="items-center" style={{ gap: 10 }}>
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'NEISPRAVAN KOD SOBE' : 'INVALID ROOM CODE'}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {isBs
              ? 'Kod sobe mora imati tačno 8 znakova: 4 slova i 4 cifre, bilo kojim redoslijedom.'
              : 'The room code must contain exactly 8 characters: 4 letters and 4 digits, in any order.'}
          </Text>
          <Text className="font-mono text-xs font-bold tracking-[2px] text-neutral-500">
            A1B2C3D4
          </Text>
        </View>
      </ConfirmModal>
    </>
  );
}
