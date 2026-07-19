import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, ChevronRight, Copy, Crown, Loader2, LockKeyhole, Share2, ShieldAlert, User, X, type LucideProps } from 'lucide-react-native';
import * as LucideDeckIcons from 'lucide-react-native/icons';
import LottieView from 'lottie-react-native';
import { ActivityIndicator, Animated, BackHandler, Easing, Keyboard, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from 'expo-glass-effect';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/context/GameContext';
import { playClickSound, playSound } from '@/lib/sound';
import { AppButton, Section, Surface } from './AppPrimitives';
import { AppInput } from './AppInput';
import { GradientButton } from './GradientButton';
import { ButtonTab } from './ButtonTab';
import { Card } from './Card';
import { ConfirmModal } from './ConfirmModal';
import { LoadingState } from './LoadingState';
import { LoadingOverlay } from './LoadingOverlay';
import { LobbyOpeningOverlay } from './LobbyOpeningOverlay';
import { InactivityKickCountdown } from './InactivityKickCountdown';
import { LaneModal } from './LaneModal';
import { SetupTabs } from './SetupTabs';
import { WelcomeSilhouetteRow } from './WelcomeSilhouetteRow';
import { api, ApiError, ApiGame, ApiStack, ApiUser } from '@/lib/api';
import { subscribeToGameUpdates } from '@/lib/gameRealtime';
import { DeckType } from '@/context/game-types';

const HOST_LOBBY_EXPIRY_MS = 120_000;
const HOST_LOBBY_WARNING_MS = 60_000;
const HOST_LOBBY_FINAL_COUNTDOWN_SECONDS = 3;

const AVAILABLE_COLORS = [
  { id: 'yellow', hex: '#facc15', nameEn: 'Amber Gold', nameBs: 'Zlatni Ćilibar', bgClass: 'bg-yellow-400', borderClass: 'border-yellow-400 bg-yellow-400/5 text-yellow-400' },
  { id: 'blue', hex: '#60a5fa', nameEn: 'Electric Blue', nameBs: 'Električna Plava', bgClass: 'bg-blue-400', borderClass: 'border-blue-400 bg-blue-400/5 text-blue-400' },
  { id: 'emerald', hex: '#10b981', nameEn: 'Neon Emerald', nameBs: 'Neon Zelena', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-500 bg-emerald-500/5 text-emerald-500' },
  { id: 'purple', hex: '#c084fc', nameEn: 'Vibrant Purple', nameBs: 'Ljubičasta', bgClass: 'bg-purple-400', borderClass: 'border-purple-400 bg-purple-400/5 text-purple-400' },
  { id: 'rose', hex: '#ef4444', nameEn: 'Signal Red', nameBs: 'Signalna Crvena', bgClass: 'bg-red-500', borderClass: 'border-red-500 bg-red-500/5 text-red-500' },
  { id: 'orange', hex: '#f97316', nameEn: 'Solar Orange', nameBs: 'Sunčano Narandžasta', bgClass: 'bg-orange-500', borderClass: 'border-orange-500 bg-orange-500/5 text-orange-500' },
  { id: 'brown', hex: '#8B5A2B', nameEn: 'Earth Brown', nameBs: 'Zemljano Smeđa', bgClass: 'bg-[#8B5A2B]', borderClass: 'border-[#8B5A2B] bg-[#8B5A2B]/5 text-[#8B5A2B]' },
  { id: 'silver', hex: '#d4d4d4', nameEn: 'Moon Silver', nameBs: 'Mjesečevo Srebrna', bgClass: 'bg-neutral-300', borderClass: 'border-neutral-300 bg-neutral-300/5 text-neutral-300' },
];

const FALLBACK_STACKS: ApiStack[] = [
  { id: 1, name: 'Normal', slug: 'normal', color: '#facc15', icon_key: 'sparkles', description: 'Funny and awkward situations', description_bs: 'Smiješne i čudne situacije', is_premium: false, active_cards_count: 0 },
  { id: 2, name: 'Spicy', slug: 'spicy', color: '#fb7185', icon_key: 'flame', description: 'Friendly, absurd and wildly unfortunate', description_bs: 'Prijateljski, apsurdno i divlje', is_premium: true, active_cards_count: 0 },
  { id: 3, name: '18+', slug: '18-plus', color: '#ef4444', icon_key: 'shield-alert', description: 'Explicit sexual situations for adults only', description_bs: 'Eksplicitne seksualne situacije samo za odrasle', is_premium: true, active_cards_count: 0 },
];

function iconForStack(iconKey: string, color: string) {
  const componentName = iconKey
    .trim()
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const icons = LucideDeckIcons as unknown as Record<string, React.ComponentType<LucideProps>>;
  const DeckIcon = icons[componentName] ?? icons.Sparkles;

  return <DeckIcon color={color} size={18} />;
}

function StackedCardsCount({ color, count }: { color: string; count: number }) {
  return (
    <View
      accessibilityLabel={`${count} active cards`}
      className="absolute right-3 top-2.5 flex-row items-center"
      style={{ gap: 4 }}
    >
      <Svg height={18} viewBox="0 0 24 20" width={21}>
        <Path d="M3.2 4.8 15.7 1.4a2 2 0 0 1 2.45 1.42l2.4 9" fill="none" opacity={0.35} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} />
        <Path d="m2.35 8.25 13.3-2.35a2 2 0 0 1 2.32 1.62l1.7 9.55" fill="none" opacity={0.65} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} />
        <Path d="M3.8 9.25h13.4a2 2 0 0 1 2 2v5.15a2 2 0 0 1-2 2H3.8a2 2 0 0 1-2-2v-5.15a2 2 0 0 1 2-2Z" fill={`${color}16`} stroke={color} strokeLinejoin="round" strokeWidth={1.7} />
        <Path d="M5.1 12.25h5.3" opacity={0.7} stroke={color} strokeLinecap="round" strokeWidth={1.45} />
      </Svg>
      <Text style={{ color, fontFamily: 'JetBrainsMono_700Bold', fontSize: 10 }}>
        {count}
      </Text>
    </View>
  );
}

function deckToStack(deck: DeckType) {
  return deck || 'normal';
}

function deckLabel(deck: DeckType, stacks: ApiStack[]) {
  return stacks.find((stack) => stack.slug === deck)?.name?.toUpperCase() ?? deck.toUpperCase();
}

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');
const ROOM_CODE_REGEX = /^(?=(?:.*[A-Z]){4})(?=(?:.*\d){4})[A-Z\d]{8}$/;
const LAST_USERNAME_KEY = '@misery-index/last-username';
const LAST_GUEST_USERNAME_KEY = '@misery-index/last-guest-username';
const AUTH_TOKEN_KEY = '@misery-index/auth-token';
const AUTH_USER_KEY = '@misery-index/auth-user';
const AUTH_PROVIDER_KEY = '@misery-index/auth-provider';
const TERMS_URL = 'https://miserymeter.app/terms';
const GOOGLE_AUTH_EXTRA = Constants.expoConfig?.extra?.googleAuth ?? {};
const GOOGLE_AUTH_CONFIG = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || GOOGLE_AUTH_EXTRA.webClientId,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_AUTH_EXTRA.iosClientId,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_AUTH_EXTRA.androidClientId,
};
// The Google provider throws during render when the platform client ID is
// absent. Keep startup safe for misconfigured builds; sign-in itself remains
// disabled by the real-config guard in handleSocialSignIn.
const GOOGLE_AUTH_REQUEST_CONFIG = {
  webClientId: GOOGLE_AUTH_CONFIG.webClientId || 'unconfigured.apps.googleusercontent.com',
  iosClientId: GOOGLE_AUTH_CONFIG.iosClientId || 'unconfigured.apps.googleusercontent.com',
  androidClientId: GOOGLE_AUTH_CONFIG.androidClientId || 'unconfigured.apps.googleusercontent.com',
};
const GOOGLE_IOS_REVERSED_CLIENT_ID = GOOGLE_AUTH_CONFIG.iosClientId
  ? `com.googleusercontent.apps.${GOOGLE_AUTH_CONFIG.iosClientId.replace('.apps.googleusercontent.com', '')}`
  : null;
const GOOGLE_REDIRECT_URI = GOOGLE_IOS_REVERSED_CLIENT_ID
  ? `${GOOGLE_IOS_REVERSED_CLIENT_ID}:/oauthredirect`
  : undefined;
WebBrowser.maybeCompleteAuthSession();

function logLobbyTransition(event: string, details: Record<string, unknown> = {}) {
  if (!__DEV__) return;
  console.info('[LobbyTransition]', new Date().toISOString(), event, {
    platform: Platform.OS,
    expoOs: process.env.EXPO_OS,
    ...details,
  });
}

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

function GoogleIcon({ color = '#000', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 210 210" fill={color}>
      <Path d="M0 105C0 47.103 47.103 0 105 0c23.383 0 45.515 7.523 64.004 21.756l-24.4 31.696C133.172 44.652 119.477 40 105 40c-35.841 0-65 29.159-65 65s29.159 65 65 65c28.867 0 53.398-18.913 61.852-45H105V85h105v20c0 57.897-47.103 105-105 105S0 162.897 0 105Z" />
    </Svg>
  );
}

function AppleIcon({
  buttonAligned = false,
  color = '#000',
  size = 16,
}: {
  buttonAligned?: boolean;
  color?: string;
  size?: number;
}) {
  const renderedSize = buttonAligned ? size + 2 : size;

  return (
    <Svg
      width={renderedSize}
      height={renderedSize}
      viewBox="0 0 814 1000"
      fill={color}
      style={buttonAligned ? { transform: [{ translateX: 3 }, { translateY: -2 }] } : undefined}
    >
      <Path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2Zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3Z" />
    </Svg>
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
    <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
      {icon}
      <Text className={`font-black text-sm tracking-wider uppercase ${tone === 'light' ? 'text-black' : 'text-neutral-300'}`}>
        {label}
      </Text>
    </View>
  );
}

function PlayerCard({
  index,
  isCurrentPlayer,
  isHost,
  isBs,
  isRemoving,
  onRemove,
  player,
}: {
  index: number;
  isCurrentPlayer: boolean;
  isHost: boolean;
  isBs: boolean;
  isRemoving?: boolean;
  onRemove?: () => void;
  player: { color: string; id?: number; name: string };
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
          {isHost && <Crown size={18} color="#facc15" fill="#facc15" />}
        </View>
        <View className="flex-row items-center gap-2">
          {(isCurrentPlayer || isHost) && (
            <Text className="rounded-md bg-yellow-500 px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase text-black">
              {isCurrentPlayer
                ? isHost
                  ? isBs ? 'TI (DOMAĆIN)' : 'YOU (HOST)'
                  : isBs ? 'TI' : 'YOU'
                : isBs ? 'DOMAĆIN' : 'HOST'}
            </Text>
          )}
          {onRemove ? (
            <Pressable
              accessibilityLabel={isBs ? `Ukloni igrača ${player.name}` : `Remove ${player.name}`}
              accessibilityRole="button"
              className="h-8 w-8 items-center justify-center rounded-full bg-red-500/15"
              disabled={isRemoving}
              hitSlop={8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemove();
              }}
            >
              {isRemoving ? <ActivityIndicator color="#ef4444" size="small" /> : <X color="#ef4444" size={17} strokeWidth={3} />}
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function RoomCodeCard({
  code,
  isBs,
  isCopied,
  isLocking = false,
  isPrivate = false,
  onCopy,
  onLock,
  onShare,
}: {
  code: string;
  isBs: boolean;
  isCopied: boolean;
  isLocking?: boolean;
  isPrivate?: boolean;
  onCopy: () => void;
  onLock?: () => void;
  onShare: () => void;
}) {
  const [glassRefreshKey, setGlassRefreshKey] = useState(0);
  useFocusEffect(useCallback(() => {
    setGlassRefreshKey((current) => current + 1);
  }, []));
  const glassButtonStyle = {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    overflow: 'hidden' as const,
    width: 40,
  };

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
          {onLock ? (
            <GlassView
              key={`lock-${glassRefreshKey}`}
              colorScheme={isPrivate ? 'light' : 'dark'}
              glassEffectStyle="regular"
              isInteractive
              style={[glassButtonStyle, isPrivate ? { backgroundColor: '#facc15', borderColor: '#facc15' } : undefined]}
              tintColor={isPrivate ? '#facc15' : 'rgba(255,255,255,0.08)'}
            >
              <Pressable
              accessibilityLabel={isPrivate
                ? isBs ? 'Otključaj sobu' : 'Unlock room'
                : isBs ? 'Zaključaj sobu' : 'Lock room'}
                accessibilityRole="button"
                className="h-full w-full items-center justify-center"
              disabled={isLocking}
                onPress={onLock}
                style={{ opacity: isLocking ? 0.55 : 1 }}
              >
                {isLocking
                  ? <ActivityIndicator color="#facc15" size="small" />
                  : <LockKeyhole color={isPrivate ? '#0a0a0a' : '#d4d4d4'} size={18} strokeWidth={2.5} />}
              </Pressable>
            </GlassView>
          ) : null}
          <GlassView
            key={`copy-${glassRefreshKey}`}
            colorScheme="dark"
            glassEffectStyle="regular"
            isInteractive
            style={glassButtonStyle}
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
            key={`share-${glassRefreshKey}`}
            colorScheme="dark"
            glassEffectStyle="regular"
            isInteractive
            style={glassButtonStyle}
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

export default function Lobby() {
  const insets = useSafeAreaInsets();
  const {
    isPremium,
    premiumPlan,
    premiumReady,
    refreshPremium,
    language,
    lobbyView,
    setLobbyView,
    lobbyTransitionTarget,
    setLobbyTransitionTarget,
    lobbyEntryFade,
    setLobbyEntryFade,
    setupTab,
    setSetupTab,
    pendingDeepLinkCode,
    setPendingDeepLinkCode,
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
    roomExitWarningOpen,
    setRoomExitWarningOpen,
    isGameCountingDown,
    setIsGameCountingDown,
    session,
    setSession,
    setPremiumIdentity,
  } = useGame();

  const isBs = language === 'bs';
  const hasActiveProPlan = Boolean(isPremium && premiumPlan);
  const lobbyScrollRef = useRef<ScrollView>(null);
  const deckScrollRef = useRef<ScrollView>(null);
  const lastDeckSnapIndexRef = useRef(0);
  const welcomeOpacity = useRef(new Animated.Value(lobbyView === 'WELCOME' ? 1 : 0)).current;
  const setupOpacity = useRef(new Animated.Value(lobbyView === 'SETUP' ? 1 : 0)).current;
  const publicGamesOpacity = useRef(new Animated.Value(lobbyView === 'PUBLIC_GAMES' ? 1 : 0)).current;
  const roomOpacity = useRef(new Animated.Value(1)).current;
  const lobbyCrossfadeRef = useRef(false);
  const authButtonsOpacity = useRef(new Animated.Value(1)).current;
  const authButtonsTransitioningRef = useRef(false);
  const joinPendingRef = useRef(false);
  const createRoomPendingRef = useRef(false);
  const codeInputFocusedRef = useRef(false);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lobbyOpeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestFailureModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hostLobbyExpiryInFlightRef = useRef(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [deckChooserWidth, setDeckChooserWidth] = useState(0);
  const [deckOptions, setDeckOptions] = useState<ApiStack[]>(FALLBACK_STACKS);
  const [joinCodeErrorOpen, setJoinCodeErrorOpen] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [serverHealth, setServerHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const serverHealthPulse = useRef(new Animated.Value(1)).current;
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [identityRestored, setIdentityRestored] = useState(false);
  const [signingInProvider, setSigningInProvider] = useState<'google' | 'apple' | null>(null);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState<number | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<{ id: number; name: string } | null>(null);
  const [isLockingRoom, setIsLockingRoom] = useState(false);
  const [isRoomPrivate, setIsRoomPrivate] = useState(false);
  const [roomPrivacyResult, setRoomPrivacyResult] = useState<'locked' | 'unlocked' | null>(null);
  const [lobbyOpening, setLobbyOpening] = useState({ changed: false, color: AVAILABLE_COLORS[0].hex, visible: false });
  const [serverGameId, setServerGameId] = useState<number | null>(session?.gameId ?? null);
  const [serverUserId, setServerUserId] = useState<number | null>(session?.userId ?? null);
  const [serverOwnerId, setServerOwnerId] = useState<number | null>(session?.ownerId ?? null);
  const [hostInLobby, setHostInLobby] = useState(true);
  const [availableGames, setAvailableGames] = useState<ApiGame[]>([]);
  const [publicGamesNow, setPublicGamesNow] = useState(Date.now());
  const [serverRealtimeConfig, setServerRealtimeConfig] = useState<{
    driver: 'pusher' | 'ably' | 'reverb';
    value: NonNullable<ApiGame['pusher'] | ApiGame['ably'] | ApiGame['reverb']>;
  } | null>(null);
  const [startModal, setStartModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });
  const [hostLobbyWarningVisible, setHostLobbyWarningVisible] = useState(false);
  const [hostLobbyFinalCountdown, setHostLobbyFinalCountdown] = useState<number | null>(null);
  const [hostLobbyTimerResetKey, setHostLobbyTimerResetKey] = useState(0);
  const deckCardWidth = deckChooserWidth ? Math.max(196, Math.min(224, deckChooserWidth * 0.68)) : 220;
  const deckSnapInterval = deckCardWidth + 10;
  const serverStartedRef = useRef(false);
  const processedGoogleTokenRef = useRef<string | null>(null);
  const observedLobbyPlayerIdsRef = useRef<Set<string> | null>(null);
  const observedPublicGameIdsRef = useRef<Set<number> | null>(null);
  const deepLinkAutoJoinAttemptedRef = useRef(false);
  const [, googleAuthResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    ...GOOGLE_AUTH_REQUEST_CONFIG,
    redirectUri: GOOGLE_REDIRECT_URI,
    selectAccount: true,
  });

  const selectDeckAtIndex = useCallback((index: number) => {
    const option = deckOptions[Math.max(0, Math.min(index, deckOptions.length - 1))];
    if (!option) return;
    if (lastDeckSnapIndexRef.current !== index) void Haptics.selectionAsync();
    lastDeckSnapIndexRef.current = index;
    setSelectedDeck(option.slug);
  }, [deckOptions, setSelectedDeck]);

  useEffect(() => {
    if (!deckChooserWidth) return;
    const index = Math.max(0, deckOptions.findIndex((option) => option.slug === selectedDeck));
    lastDeckSnapIndexRef.current = index;
    requestAnimationFrame(() => deckScrollRef.current?.scrollTo({ animated: false, x: index * deckSnapInterval }));
  }, [deckChooserWidth, deckOptions, deckSnapInterval, selectedDeck]);

  useEffect(() => {
    let cancelled = false;
    api.listStacks().then((stacks) => {
      if (cancelled || stacks.length === 0) return;
      setDeckOptions(stacks);
      if (!stacks.some((stack) => stack.slug === selectedDeck)) setSelectedDeck(stacks[0].slug);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(serverHealthPulse, { duration: 1100, toValue: 0.38, useNativeDriver: true }),
      Animated.timing(serverHealthPulse, { duration: 1100, toValue: 1, useNativeDriver: true }),
    ]));
    if (serverHealth === 'offline') {
      animation.stop();
      serverHealthPulse.setValue(1);
      return undefined;
    }
    animation.start();
    return () => animation.stop();
  }, [serverHealth, serverHealthPulse]);

  useEffect(() => {
    if (lobbyView !== 'WELCOME') return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    setServerHealth('checking');
    const checkHealth = async () => {
      if (cancelled || controller) return;
      const requestController = new AbortController();
      controller = requestController;
      try {
        const health = await api.health(requestController.signal);
        if (!cancelled) setServerHealth(health.status === 'ok' ? 'online' : 'offline');
      } catch {
        if (!cancelled && !requestController.signal.aborted) setServerHealth('offline');
      } finally {
        if (controller === requestController) controller = null;
        if (!cancelled) timer = setTimeout(checkHealth, 15_000);
      }
    };
    void checkHealth();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      controller?.abort();
    };
  }, [lobbyView]);

  useEffect(() => {
    if (Platform.OS === 'web' || (lobbyView !== 'ROOM_CREATED' && lobbyView !== 'ROOM_JOINED')) {
      observedLobbyPlayerIdsRef.current = null;
      return;
    }

    const playerIds = new Set(roomPlayers.map((player) => String(player.id ?? `name:${player.name}`)));
    const previousPlayerIds = observedLobbyPlayerIdsRef.current;
    observedLobbyPlayerIdsRef.current = playerIds;
    if (!previousPlayerIds) return;
    if ([...playerIds].some((playerId) => !previousPlayerIds.has(playerId))) playClickSound();
  }, [lobbyView, roomPlayers]);

  useEffect(() => {
    if (Platform.OS === 'web' || lobbyView !== 'PUBLIC_GAMES') {
      observedPublicGameIdsRef.current = null;
      return;
    }
    const gameIds = new Set(availableGames.map((game) => Number(game.id)));
    const previousGameIds = observedPublicGameIdsRef.current;
    observedPublicGameIdsRef.current = gameIds;
    if (!previousGameIds) return;
    if ([...gameIds].some((gameId) => !previousGameIds.has(gameId))) playClickSound();
  }, [availableGames, lobbyView]);

  useEffect(() => {
    const canPrefetchAvailableGames = lobbyView === 'SETUP' || lobbyView === 'PUBLIC_GAMES';
    if (!canPrefetchAvailableGames) {
      logLobbyTransition('available-games-disabled', { lobbyView });
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    const pollAvailableGames = async () => {
      if (cancelled || controller) return;
      const requestController = new AbortController();
      controller = requestController;
      try {
        const games = await api.listAvailableGames(requestController.signal);
        if (cancelled || requestController.signal.aborted) return;
        logLobbyTransition('available-games-received', { count: games.length, lobbyView });
        setAvailableGames(games.filter((game) =>
          !game.terminated_at && (
            !game.started ||
            game.winner_id === null ||
            game.lobby_member_ids.length > 0
          )
        ));
      } catch { /* Retry after the current request has settled. */ }
      finally {
        if (controller === requestController) controller = null;
        if (!cancelled) timer = setTimeout(pollAvailableGames, 3000);
      }
    };
    void pollAvailableGames();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      controller?.abort();
    };
  }, [lobbyView]);

  useEffect(() => {
    if (lobbyView !== 'PUBLIC_GAMES') return;
    setPublicGamesNow(Date.now());
    const timer = setInterval(() => setPublicGamesNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lobbyView]);

  const transitionLobbyView = (nextView: 'WELCOME' | 'SETUP' | 'PUBLIC_GAMES', beforeSwap?: () => void) => {
    if (lobbyCrossfadeRef.current || lobbyView === nextView) return;
    const canCrossfade = lobbyView === 'WELCOME' || lobbyView === 'SETUP' || lobbyView === 'PUBLIC_GAMES' || lobbyView === 'ROOM_CREATED' || lobbyView === 'ROOM_JOINED';
    if (!canCrossfade) {
      beforeSwap?.();
      setLobbyView(nextView);
      return;
    }

    lobbyCrossfadeRef.current = true;
    logLobbyTransition('transition-crossfade-start', { from: lobbyView, nextView });
    const outgoingOpacity = lobbyView === 'WELCOME'
      ? welcomeOpacity
      : lobbyView === 'SETUP'
        ? setupOpacity
        : lobbyView === 'PUBLIC_GAMES'
          ? publicGamesOpacity
          : roomOpacity;
    const incomingOpacity = nextView === 'WELCOME'
      ? welcomeOpacity
      : nextView === 'SETUP'
        ? setupOpacity
        : publicGamesOpacity;
    incomingOpacity.setValue(0);

    Animated.timing(outgoingOpacity, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished: fadedOut }) => {
      if (!fadedOut) {
        lobbyCrossfadeRef.current = false;
        return;
      }

      beforeSwap?.();
      setLobbyView(nextView);
      requestAnimationFrame(() => {
        Animated.timing(incomingOpacity, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }).start(({ finished }) => {
          welcomeOpacity.setValue(nextView === 'WELCOME' ? 1 : 0);
          setupOpacity.setValue(nextView === 'SETUP' ? 1 : 0);
          publicGamesOpacity.setValue(nextView === 'PUBLIC_GAMES' ? 1 : 0);
          lobbyCrossfadeRef.current = false;
          logLobbyTransition('transition-crossfade-end', { finished, nextView });
        });
      });
    });
  };

  useEffect(() => {
    if (lobbyView !== 'WELCOME' && lobbyView !== 'SETUP') roomOpacity.setValue(1);
  }, [lobbyView, roomOpacity]);

  useEffect(() => {
    if (!lobbyEntryFade || (lobbyView !== 'WELCOME' && lobbyView !== 'SETUP' && lobbyView !== 'PUBLIC_GAMES')) return;
    const incomingOpacity = lobbyView === 'WELCOME' ? welcomeOpacity : lobbyView === 'SETUP' ? setupOpacity : publicGamesOpacity;
    welcomeOpacity.setValue(0);
    setupOpacity.setValue(0);
    publicGamesOpacity.setValue(0);
    incomingOpacity.setValue(0);
    const frame = requestAnimationFrame(() => {
      Animated.timing(incomingOpacity, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }).start(() => setLobbyEntryFade(false));
    });
    return () => cancelAnimationFrame(frame);
  }, [lobbyEntryFade, lobbyView, publicGamesOpacity, setLobbyEntryFade, setupOpacity, welcomeOpacity]);

  useEffect(() => {
    if (lobbyEntryFade || lobbyCrossfadeRef.current) return;
    if (lobbyView !== 'WELCOME' && lobbyView !== 'SETUP' && lobbyView !== 'PUBLIC_GAMES') return;
    welcomeOpacity.setValue(lobbyView === 'WELCOME' ? 1 : 0);
    setupOpacity.setValue(lobbyView === 'SETUP' ? 1 : 0);
    publicGamesOpacity.setValue(lobbyView === 'PUBLIC_GAMES' ? 1 : 0);
  }, [lobbyEntryFade, lobbyView, publicGamesOpacity, setupOpacity, welcomeOpacity]);

  useEffect(() => {
    if (lobbyTransitionTarget !== 'WELCOME' && lobbyTransitionTarget !== 'SETUP' && lobbyTransitionTarget !== 'PUBLIC_GAMES') return;
    transitionLobbyView(lobbyTransitionTarget);
    setLobbyTransitionTarget(null);
  }, [lobbyTransitionTarget]);

  useEffect(() => {
    logLobbyTransition('username-restore-start');
    AsyncStorage.multiGet([LAST_USERNAME_KEY, LAST_GUEST_USERNAME_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_PROVIDER_KEY])
      .then((entries) => {
        const saved = Object.fromEntries(entries);
        const savedSocialName = saved[LAST_USERNAME_KEY];
        const savedGuestName = saved[LAST_GUEST_USERNAME_KEY];
        const savedProvider = saved[AUTH_PROVIDER_KEY];
        const savedToken = saved[AUTH_TOKEN_KEY];
        let savedUser: ApiUser | null = null;
        try {
          savedUser = saved[AUTH_USER_KEY] ? JSON.parse(saved[AUTH_USER_KEY] as string) : null;
        } catch {
          savedUser = null;
        }
        const hasSocialSession = Boolean(saved[AUTH_TOKEN_KEY]) &&
          Boolean(savedUser?.id) && (savedProvider === 'google' || savedProvider === 'apple');
        const restoredName = hasSocialSession ? savedSocialName : savedGuestName;
        logLobbyTransition('username-restore-end', { hasSavedName: Boolean(restoredName), hasSocialSession });
        if (restoredName) setUserName(restoredName);
        if (hasSocialSession) {
          void setPremiumIdentity(savedUser, savedToken ?? null);
          setIsSocialUser(true);
          setSocialProvider(savedProvider as 'google' | 'apple');
        } else {
          void setPremiumIdentity(null, null);
        }
      })
      .catch(() => undefined)
      .finally(() => setIdentityRestored(true));
  }, [setIsSocialUser, setPremiumIdentity, setSocialProvider, setUserName]);

  const handleGuestNameChange = (name: string) => {
    setUserName(name);
    const trimmedName = name.trim();
    if (trimmedName) {
      void AsyncStorage.setItem(LAST_GUEST_USERNAME_KEY, trimmedName).catch(() => undefined);
    } else {
      void AsyncStorage.removeItem(LAST_GUEST_USERNAME_KEY).catch(() => undefined);
    }
  };

  const applyServerGame = (game: ApiGame) => {
    const realtimeValue = game.sync_driver === 'pusher'
      ? game.pusher
      : game.sync_driver === 'ably' ? game.ably : game.sync_driver === 'reverb' ? game.reverb : null;
    setServerRealtimeConfig((current) => {
      if (!realtimeValue) return null;
      const driver = game.sync_driver as 'pusher' | 'ably' | 'reverb';
      if (current?.driver === driver && current.value.channel === realtimeValue.channel) return current;
      return { driver, value: realtimeValue };
    });
    setRoomCode(game.code);
    setServerOwnerId(game.owner_id);
    setHostInLobby(game.host_in_lobby ?? true);
    setIsRoomPrivate(Boolean(game.is_private));
    setSelectedDeck(game.stack ?? 'normal');
    const visibleMembers = game.winner_id
      ? game.members.filter((member) => game.lobby_member_ids?.includes(Number(member.id)))
      : game.members;
    setRoomPlayers(visibleMembers.map((member, index) => ({
      id: member.id,
      name: member.name,
      isBot: Boolean(member.is_bot),
      color: (AVAILABLE_COLORS.find((color) => color.id === member.color) ?? AVAILABLE_COLORS[index % AVAILABLE_COLORS.length]).borderClass,
    })));
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      if (!codeInputFocusedRef.current) return;
      requestAnimationFrame(() => {
        lobbyScrollRef.current?.scrollToEnd({ animated: true });
      });
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
      if (lobbyOpeningTimerRef.current) clearTimeout(lobbyOpeningTimerRef.current);
      if (requestFailureModalTimerRef.current) clearTimeout(requestFailureModalTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (lobbyView !== 'ROOM_CREATED' && lobbyView !== 'ROOM_JOINED') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setRoomExitWarningOpen(true);
      return true;
    });
    return () => subscription.remove();
  }, [lobbyView, setRoomExitWarningOpen]);

  const handleCreateRoom = async () => {
    if (createRoomPendingRef.current) return;
    createRoomPendingRef.current = true;
    if (requestFailureModalTimerRef.current) {
      clearTimeout(requestFailureModalTimerRef.current);
      requestFailureModalTimerRef.current = null;
    }
    Keyboard.dismiss();
    setIsKeyboardVisible(false);
    setIsCreatingRoom(true);
    const finalName = userName.trim() || (isBs ? 'Igrač 1' : 'Player 1');
    try {
      if (!isSocialUser) void AsyncStorage.setItem(LAST_GUEST_USERNAME_KEY, finalName).catch(() => undefined);
      const result = await api.createGame(finalName, selectedColor, deckToStack(selectedDeck));
      setServerGameId(result.game.id);
      setServerUserId(result.user.id);
      applyServerGame(result.game);
      setIsCopied(false);
      setLobbyView('ROOM_CREATED');
    } catch (error) {
      const isBackendUnavailable = error instanceof ApiError && (error.status === 0 || error.status >= 500);
      const message = isBackendUnavailable
        ? isBs ? 'Server trenutno ne odgovara. Pokušaj ponovo za nekoliko trenutaka.' : 'The server is not responding. Try again in a few moments.'
        : error instanceof Error ? error.message : String(error);
      setJoinStatusText(message);
      Keyboard.dismiss();
      setIsKeyboardVisible(false);
      setIsCreatingRoom(false);
      if (requestFailureModalTimerRef.current) clearTimeout(requestFailureModalTimerRef.current);
      requestFailureModalTimerRef.current = setTimeout(() => {
        requestFailureModalTimerRef.current = null;
        setStartModal({
          visible: true,
          title: isBackendUnavailable
            ? isBs ? 'SERVER NIJE DOSTUPAN' : 'SERVER UNAVAILABLE'
            : isBs ? 'SOBA NIJE KREIRANA' : 'CREATE ROOM FAILED',
          message,
        });
      }, Platform.OS === 'ios' ? 350 : 180);
    } finally {
      createRoomPendingRef.current = false;
      setIsCreatingRoom(false);
    }
  };

  useEffect(() => {
    const isHostWaitingInLobby = lobbyView === 'ROOM_CREATED'
      && Boolean(serverGameId)
      && Boolean(serverUserId)
      && Number(serverOwnerId) === Number(serverUserId)
      && session === null
      && !isGameCountingDown
      && !isStartingGame;

    if (!isHostWaitingInLobby || !serverGameId || !serverUserId) {
      hostLobbyExpiryInFlightRef.current = false;
      setHostLobbyWarningVisible(false);
      setHostLobbyFinalCountdown(null);
      return;
    }

    let cancelled = false;
    const deadline = Date.now() + HOST_LOBBY_EXPIRY_MS;
    hostLobbyExpiryInFlightRef.current = false;
    setHostLobbyWarningVisible(false);
    setHostLobbyFinalCountdown(null);

    const warningTimer = setTimeout(() => {
      if (!cancelled) setHostLobbyWarningVisible(true);
    }, HOST_LOBBY_WARNING_MS);

    const countdownTimer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setHostLobbyFinalCountdown(
        remaining > 0 && remaining <= HOST_LOBBY_FINAL_COUNTDOWN_SECONDS ? remaining : null,
      );
    }, 250);

    const expiryTimer = setTimeout(() => {
      if (cancelled || hostLobbyExpiryInFlightRef.current) return;
      hostLobbyExpiryInFlightRef.current = true;
      setHostLobbyWarningVisible(false);
      setHostLobbyFinalCountdown(null);
      void api.deleteGame(serverGameId, serverUserId)
        .then(() => {
          if (cancelled) return;
          transitionLobbyView('SETUP', () => {
            setServerGameId(null);
            setServerUserId(null);
            setServerOwnerId(null);
            setRoomCode('');
            setRoomPlayers([]);
          });
          setStartModal({
            visible: true,
            title: isBs ? 'SOBA JE OBRISANA' : 'ROOM DELETED',
            message: isBs
              ? 'Soba je obrisana jer igra nije pokrenuta u roku od 2 minute.'
              : 'The room was deleted because the game was not started within 2 minutes.',
          });
        })
        .catch((error) => {
          if (cancelled) return;
          hostLobbyExpiryInFlightRef.current = false;
          setHostLobbyTimerResetKey((current) => current + 1);
          setStartModal({
            visible: true,
            title: isBs ? 'BRISANJE NIJE USPJELO' : 'DELETE ROOM FAILED',
            message: error instanceof Error ? error.message : (isBs ? 'Pokušaj ponovo.' : 'Please try again.'),
          });
        });
    }, HOST_LOBBY_EXPIRY_MS);

    return () => {
      cancelled = true;
      clearTimeout(warningTimer);
      clearInterval(countdownTimer);
      clearTimeout(expiryTimer);
    };
  }, [hostLobbyTimerResetKey, isBs, isGameCountingDown, isStartingGame, lobbyView, serverGameId, serverOwnerId, serverUserId, session]);

  const handleLeaveRoom = () => {
    const gameId = serverGameId;
    const leavingUserId = serverUserId;

    joinPendingRef.current = false;
    setRoomExitWarningOpen(false);
    setSession(null);
    setIsGameCountingDown(false);
    setServerGameId(null);
    setServerUserId(null);
    setServerOwnerId(null);
    setRoomCode('');
    setRoomPlayers([]);
    transitionLobbyView('SETUP');
    if (gameId && leavingUserId) {
      void api.leaveGame(gameId, leavingUserId)
        .catch((error) => {
          if (__DEV__) console.warn('[LeaveRoom] Server room leave failed after local exit', error);
        });
    }

  };

  const handleRemoveLobbyPlayer = async (playerId?: number) => {
    if (!playerId || !serverGameId || !serverUserId || Number(serverOwnerId) !== Number(serverUserId)) return;
    setRemovingPlayerId(playerId);
    playSound('click');
    try {
      const game = await api.kickLobbyPlayer(serverGameId, serverUserId, playerId);
      applyServerGame(game);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not remove this player.';
      playSound('wrong');
      setStartModal({
        visible: true,
        title: isBs ? 'UKLANJANJE NIJE USPJELO' : 'REMOVE PLAYER FAILED',
        message: isBs ? 'Igrača nije moguće ukloniti iz sobe.' : message,
      });
    } finally {
      setRemovingPlayerId(null);
      setPlayerToRemove(null);
    }
  };

  const handleLockRoom = async () => {
    if (isLockingRoom || !serverGameId || !serverUserId) return;
    playSound('click');
    if (!isRoomPrivate && !hasActiveProPlan) {
      router.navigate('/pro');
      return;
    }

    setIsLockingRoom(true);
    try {
      const game = await api.lockLobbyRoom(serverGameId, serverUserId, hasActiveProPlan);
      applyServerGame(game);
      setRoomPrivacyResult(game.is_private ? 'locked' : 'unlocked');
    } catch (error) {
      playSound('wrong');
      setStartModal({
        visible: true,
        title: isBs ? 'SOBA NIJE ZAKLJUČANA' : 'ROOM NOT LOCKED',
        message: error instanceof Error ? error.message : isBs ? 'Pokušaj ponovo.' : 'Please try again.',
      });
    } finally {
      setIsLockingRoom(false);
    }
  };

  const handleJoinWithCode = async (codeOverride?: string) => {
    if (joinPendingRef.current) return;
    const cleanCode = (codeOverride ?? enteredCode).trim().toUpperCase();
    if (!ROOM_CODE_REGEX.test(cleanCode)) {
      Keyboard.dismiss();
      playSound('wrong');
      setJoinCodeErrorOpen(true);
      return;
    }
    setPendingDeepLinkCode(null);
    joinPendingRef.current = true;
    setRoomCode(cleanCode);
    setLobbyView('ROOM_JOINING');
    setJoinStatusText(isBs ? 'Traženje sobe...' : 'Searching for room...');

    try {
      const finalName = userName.trim() || (isBs ? 'Igrač 2' : 'Player 2');
      if (!isSocialUser) void AsyncStorage.setItem(LAST_GUEST_USERNAME_KEY, finalName).catch(() => undefined);
      const requestedGame = await api.getGameByCode(cleanCode);
      const isPremiumPack = (requestedGame.stack ?? 'normal') !== 'normal';
      const hasActivePremium = !isPremiumPack || (premiumReady ? isPremium : (await refreshPremium()).active);
      if (isPremiumPack && !hasActivePremium) {
        joinPendingRef.current = false;
        playSound('wrong');
        transitionLobbyView('SETUP');
        setStartModal({
          visible: true,
          title: isBs ? 'POTREBAN JE MISERY PRO' : 'MISERY PRO REQUIRED',
          message: isBs
            ? 'Svi igrači u sobi s premium paketom moraju imati aktivan Misery PRO.'
            : 'Every player in a premium-pack room must have an active Misery PRO subscription.',
        });
        return;
      }
      const result = await api.joinGame(cleanCode, finalName, selectedColor, Platform.OS === 'web' ? 'web' : 'native');
      setServerGameId(result.game.id);
      setServerUserId(result.user.id);
      applyServerGame(result.game);
      setJoinStatusText(isBs ? 'Soba pronađena!' : 'Room found!');
      const assignedColor = AVAILABLE_COLORS.find((color) => color.id === result.user.color) ?? AVAILABLE_COLORS[0];
      setSelectedColor(assignedColor.id);
      if (Platform.OS === 'web') {
        setLobbyView('ROOM_JOINED');
        setLobbyOpening({ changed: result.color_changed, color: assignedColor.hex, visible: false });
      } else {
        setLobbyOpening({ changed: result.color_changed, color: assignedColor.hex, visible: true });
        if (lobbyOpeningTimerRef.current) clearTimeout(lobbyOpeningTimerRef.current);
        lobbyOpeningTimerRef.current = setTimeout(() => {
          setLobbyView('ROOM_JOINED');
          setLobbyOpening((current) => ({ ...current, visible: false }));
        }, 1800);
      }
    } catch (error) {
      joinPendingRef.current = false;
      const message = error instanceof Error ? error.message : 'Room not found.';
      setJoinStatusText(message);
      transitionLobbyView('SETUP');
      const errorCode = error instanceof ApiError && error.body && typeof error.body === 'object'
        ? (error.body as { error_code?: unknown }).error_code
        : null;
      if (errorCode === 'realtime_provider_capacity_exceeded') {
        playSound('wrong');
        setStartModal({
          visible: true,
          title: isBs ? 'SERVER JE OPTEREĆEN' : 'SERVER IS AT CAPACITY',
          message: isBs
            ? 'Započeta igra je na serveru koji je opterećen. Izaberi drugu igru ili pokušaj kasnije.'
            : 'This game is running on a server that is at capacity. Choose another game or try again later.',
        });
      } else if (message === 'No more available seats in this room.') {
        playSound('wrong');
        setStartModal({
          visible: true,
          title: isBs ? 'SOBA JE PUNA' : 'ROOM IS FULL',
          message: isBs ? 'Nema više slobodnih mjesta u ovoj sobi.' : message,
        });
      } else if (message === 'Game already started.') {
        playSound('wrong');
        setStartModal({
          visible: true,
          title: isBs ? 'IGRA JE VEĆ POČELA' : 'GAME ALREADY STARTED',
          message: isBs
            ? 'Nije moguće ući u sobu nakon početka igre.'
            : 'You cannot enter this room after the game has started.',
        });
      }
    }
  };

  useEffect(() => {
    if (!identityRestored || !pendingDeepLinkCode || deepLinkAutoJoinAttemptedRef.current) return;
    deepLinkAutoJoinAttemptedRef.current = true;
    setEnteredCode(pendingDeepLinkCode);
    setSetupTab('JOIN');
    setLobbyView('SETUP');
    if (!isSocialUser && !userName.trim()) return;
    const code = pendingDeepLinkCode;
    setPendingDeepLinkCode(null);
    void handleJoinWithCode(code);
  }, [identityRestored, pendingDeepLinkCode]);

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
          ? `Pridruži se mojoj Misery Meter sobi: https://miserymeter.app/code/${roomCode}?v=2`
          : `Join my Misery Meter room: https://miserymeter.app/code/${roomCode}?v=2`,
        title: 'Misery Meter',
      });
    } catch {
      // Native share can be dismissed or unavailable without affecting the room.
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    if (isSigningIn) return;

    try {
      if (provider === 'google') {
        const hasGoogleConfig = Boolean(
          GOOGLE_AUTH_CONFIG.webClientId ||
          GOOGLE_AUTH_CONFIG.iosClientId ||
          GOOGLE_AUTH_CONFIG.androidClientId
        );
        if (!hasGoogleConfig) {
          throw new Error('Google sign-in is not configured yet. Add the Google client IDs first.');
        }

        const googleResult = await promptGoogleSignIn();
        if (googleResult.type === 'success') {
          setIsSigningIn(true);
          setSigningInProvider('google');
        }
        return;
      }

      if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
        throw new Error('Sign in with Apple is only available on supported Apple devices.');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('Apple did not return an identity token.');
      setIsSigningIn(true);
      setSigningInProvider('apple');
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ');
      const result = await api.signInWithApple(credential.identityToken, fullName);

      await AsyncStorage.multiSet([
        [AUTH_TOKEN_KEY, result.token],
        [AUTH_USER_KEY, JSON.stringify(result.user)],
        [AUTH_PROVIDER_KEY, provider],
        [LAST_USERNAME_KEY, result.user.name],
      ]);
      await setPremiumIdentity(result.user, result.token);
      transitionLobbyView('SETUP', () => {
        setUserName(result.user.name);
        setIsSocialUser(true);
        setSocialProvider(provider);
      });
    } catch (error: any) {
      setIsSigningIn(false);
      setSigningInProvider(null);
      if (error?.code === 'ERR_REQUEST_CANCELED') return;
      const message = error instanceof Error ? error.message : 'Social sign-in failed.';
      if (__DEV__) console.error('[SocialAuth] sign-in failed', { provider, message });
      setStartModal({
        visible: true,
        title: isBs ? 'PRIJAVA NIJE USPJELA' : 'SIGN-IN FAILED',
        message,
      });
    }
  };

  useEffect(() => {
    if (!googleAuthResponse) return;

    if (googleAuthResponse.type !== 'success') {
      setIsSigningIn(false);
      setSigningInProvider(null);
      if (googleAuthResponse.type === 'error') {
        setStartModal({
          visible: true,
          title: isBs ? 'PRIJAVA NIJE USPJELA' : 'SIGN-IN FAILED',
          message: 'Google sign-in failed.',
        });
      }
      return;
    }

    const idToken = googleAuthResponse.params?.id_token || googleAuthResponse.authentication?.idToken;
    if (!idToken) {
      setIsSigningIn(false);
      setSigningInProvider(null);
      setStartModal({
        visible: true,
        title: isBs ? 'PRIJAVA NIJE USPJELA' : 'SIGN-IN FAILED',
        message: 'Google did not return an ID token.',
      });
      return;
    }
    if (processedGoogleTokenRef.current === idToken) return;
    processedGoogleTokenRef.current = idToken;
    setIsSigningIn(true);
    setSigningInProvider('google');

    void api.signInWithGoogle(idToken)
      .then(async (result) => {
        await AsyncStorage.multiSet([
          [AUTH_TOKEN_KEY, result.token],
          [AUTH_USER_KEY, JSON.stringify(result.user)],
          [AUTH_PROVIDER_KEY, 'google'],
          [LAST_USERNAME_KEY, result.user.name],
        ]);
        await setPremiumIdentity(result.user, result.token);
        transitionLobbyView('SETUP', () => {
          setUserName(result.user.name);
          setIsSocialUser(true);
          setSocialProvider('google');
        });
      })
      .catch((error) => {
        processedGoogleTokenRef.current = null;
        setIsSigningIn(false);
        setSigningInProvider(null);
        const message = error instanceof Error ? error.message : 'Google sign-in failed.';
        if (__DEV__) console.error('[SocialAuth] Google sign-in failed', { message });
        setStartModal({
          visible: true,
          title: isBs ? 'PRIJAVA NIJE USPJELA' : 'SIGN-IN FAILED',
          message,
        });
      });
  }, [googleAuthResponse]);

  useEffect(() => {
    if (lobbyView !== 'WELCOME') {
      setIsSigningIn(false);
      setSigningInProvider(null);
    }
  }, [lobbyView]);

  const openUsernameModal = () => {
    playSound('click');
    setUsernameDraft(userName);
    setUsernameError('');
    setUsernameModalOpen(true);
  };

  const saveUsername = async () => {
    if (isSavingUsername) return;
    const name = usernameDraft.trim();
    if (name.length < 2) {
      setUsernameError(isBs ? 'Ime mora imati najmanje 2 znaka.' : 'Username must contain at least 2 characters.');
      return;
    }

    setUsernameError('');
    setIsSavingUsername(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Your session has expired. Please sign in again.');
      const result = await api.updateProfile(name, token);
      await AsyncStorage.multiSet([
        [LAST_USERNAME_KEY, result.user.name],
        [AUTH_USER_KEY, JSON.stringify(result.user)],
      ]);
      setUserName(result.user.name);
      setUsernameModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save username.';
      setUsernameError(message);
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSignOut = async () => {
    playSound('click');
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) void api.logout(token).catch(() => undefined);
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_PROVIDER_KEY, LAST_USERNAME_KEY]);
    await setPremiumIdentity(null, null);
    setIsSocialUser(false);
    setSocialProvider(null);
    setUserName('');
    transitionLobbyView('WELCOME');
  };

  const resetRememberedSession = () => {
    if (authButtonsTransitioningRef.current) return;
    authButtonsTransitioningRef.current = true;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(authButtonsOpacity, {
      duration: 140,
      easing: Easing.in(Easing.quad),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        authButtonsTransitioningRef.current = false;
        return;
      }

      void (async () => {
        if (isSocialUser) {
          const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
          if (token) void api.logout(token).catch(() => undefined);
          await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_PROVIDER_KEY, LAST_USERNAME_KEY]);
          await setPremiumIdentity(null, null);
        } else {
          await AsyncStorage.removeItem(LAST_GUEST_USERNAME_KEY);
        }

        LayoutAnimation.configureNext({
          duration: 320,
          create: { property: LayoutAnimation.Properties.opacity, type: LayoutAnimation.Types.easeInEaseOut },
          delete: { property: LayoutAnimation.Properties.opacity, type: LayoutAnimation.Types.easeInEaseOut },
          update: { type: LayoutAnimation.Types.easeInEaseOut },
        });
        setIsSocialUser(false);
        setSocialProvider(null);
        setUserName('');

        requestAnimationFrame(() => {
          Animated.timing(authButtonsOpacity, {
            duration: 280,
            easing: Easing.out(Easing.quad),
            toValue: 1,
            useNativeDriver: true,
          }).start(() => {
            authButtonsTransitioningRef.current = false;
          });
        });
      })().catch(() => {
        authButtonsOpacity.setValue(1);
        authButtonsTransitioningRef.current = false;
      });
    });
  };

  const startGame = async (
    mode: 'SOLO' | 'MULTIPLAYER',
    players: { name: string; color: string }[],
    tScore: number,
    deck: DeckType
  ) => {
    if (isStartingGame) return;
    Keyboard.dismiss();
    setIsKeyboardVisible(false);
    setIsStartingGame(true);
    if (mode === 'MULTIPLAYER' && (!serverGameId || !serverUserId)) {
      const message = isBs
        ? 'Veza sa serverom nije dostupna. Vrati se u postavke igre i pokušaj ponovo.'
        : 'The server connection is unavailable. Return to game settings and try again.';
      setIsStartingGame(false);
      setIsGameCountingDown(false);
      if (requestFailureModalTimerRef.current) clearTimeout(requestFailureModalTimerRef.current);
      requestFailureModalTimerRef.current = setTimeout(() => {
        requestFailureModalTimerRef.current = null;
        setStartModal({ visible: true, title: isBs ? 'SERVER NIJE DOSTUPAN' : 'SERVER UNAVAILABLE', message });
      }, Platform.OS === 'ios' ? 350 : 180);
      return;
    }
    logLobbyTransition('start-game-clicked', {
      gameId: serverGameId,
      userId: serverUserId,
      mode,
      playerCount: players.length,
      targetScore: tScore,
      deck,
    });
    let ownerId: number | undefined;
    if (serverGameId && serverUserId) {
      try {
        const stack = deckToStack(deck);
        const game = await api.startGame(serverGameId, serverUserId, stack, tScore);
        ownerId = game.owner_id;
        logLobbyTransition('start-game-api-success', {
          gameId: game.id,
          started: game.started,
          memberCount: game.members.length,
        });
        applyServerGame(game);
      } catch (error) {
        if (__DEV__) console.error('[StartGame] API failed', error);
        const isBackendUnavailable = error instanceof ApiError && (error.status === 0 || error.status >= 500);
        const message = isBackendUnavailable
          ? isBs ? 'Server trenutno ne odgovara. Pokušaj ponovo za nekoliko trenutaka.' : 'The server is not responding. Try again in a few moments.'
          : error instanceof Error ? error.message : String(error);
        setJoinStatusText(message);
        Keyboard.dismiss();
        setIsKeyboardVisible(false);
        setIsStartingGame(false);
        setIsGameCountingDown(false);
        if (requestFailureModalTimerRef.current) clearTimeout(requestFailureModalTimerRef.current);
        requestFailureModalTimerRef.current = setTimeout(() => {
          requestFailureModalTimerRef.current = null;
          setStartModal({
            visible: true,
            title: isBackendUnavailable
              ? isBs ? 'SERVER NIJE DOSTUPAN' : 'SERVER UNAVAILABLE'
              : isBs ? 'POKRETANJE NIJE USPJELO' : 'START FAILED',
            message,
          });
        }, Platform.OS === 'ios' ? 350 : 180);
        return;
      }
    }
    if (serverGameId) serverStartedRef.current = true;
    setIsGameCountingDown(true);
    setSession({ mode, players, targetScore: tScore, deckType: deck, gameId: serverGameId ?? undefined, userId: serverUserId ?? undefined, ownerId });
    logLobbyTransition('start-game-navigation');
    setTimeout(() => {
      router.push('./game');
      requestAnimationFrame(() => setIsStartingGame(false));
    }, 700);
  };

  useEffect(() => {
    if (!serverGameId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    let realtimeRetryTimer: ReturnType<typeof setTimeout> | null = null;
    let realtimeCleanup: (() => Promise<void>) | null = null;
    let realtimeReady = false;
    let pendingRealtimeRefresh = false;
    const strictRealtime = serverRealtimeConfig?.driver === 'reverb';
    const poll = async () => {
      if (cancelled) return;
      if (controller) {
        pendingRealtimeRefresh = true;
        return;
      }
      pendingRealtimeRefresh = false;
      const requestController = new AbortController();
      controller = requestController;
      try {
        const game = await api.getGame(serverGameId, serverUserId, requestController.signal);
        if (cancelled || requestController.signal.aborted) return;
        const isStillMember = !serverUserId || game.members.some((member) => Number(member.id) === Number(serverUserId));
        if (game.terminated_at || !isStillMember) {
          const removedByHost = !game.terminated_at && !isStillMember;
          setStartModal({
            visible: true,
            title: removedByHost
              ? isBs ? 'UKLONJEN SI' : 'YOU WERE REMOVED'
              : game.termination_reason === 'host_inactive' ? isBs ? 'SOBA JE ZATVORENA' : 'ROOM CLOSED' : isBs ? 'SOBA JE ZAVRŠENA' : 'ROOM ENDED',
            message: removedByHost
              ? isBs ? 'Domaćin te uklonio iz sobe.' : 'The host removed you from the lobby.'
              : game.termination_reason === 'host_inactive'
                ? isBs ? 'Domaćin je bio neaktivan i soba je zatvorena.' : 'The host was inactive and the room was closed.'
                : isBs ? 'Domaćin je napustio sobu.' : 'The host left the room.',
          });
          transitionLobbyView('SETUP', () => {
            setServerGameId(null);
            setServerUserId(null);
            setServerOwnerId(null);
            setRoomCode('');
            setRoomPlayers([]);
          });
          return;
        }
        applyServerGame(game);
        if (game.started && game.winner_id === null && !serverStartedRef.current) {
          serverStartedRef.current = true;
          setIsGameCountingDown(true);
          setSession({
            mode: 'MULTIPLAYER',
            players: game.members.map((member, index) => ({
              id: member.id,
              name: member.name,
              isBot: Boolean(member.is_bot),
              color: (AVAILABLE_COLORS.find((color) => color.id === member.color) ?? AVAILABLE_COLORS[index % AVAILABLE_COLORS.length]).borderClass,
            })),
            targetScore: game.target_score,
            deckType: selectedDeck,
            gameId: game.id,
            userId: serverUserId ?? undefined,
            ownerId: game.owner_id,
          });
          router.push('./game');
        }
      } catch (error) {
        if (cancelled || requestController.signal.aborted) return;
        if (error instanceof ApiError && error.status === 404) {
          cancelled = true;
          setIsGameCountingDown(false);
          setSession(null);
          setStartModal({
            visible: true,
            title: isBs ? 'SOBA JE OBRISANA' : 'ROOM DELETED',
            message: isBs
              ? 'Ova soba više ne postoji. Vraćen/a si na postavke igre.'
              : 'This room no longer exists. You were returned to Game Settings.',
          });
          transitionLobbyView('SETUP', () => {
            setServerGameId(null);
            setServerUserId(null);
            setServerOwnerId(null);
            setHostInLobby(true);
            setRoomCode('');
            setRoomPlayers([]);
            serverStartedRef.current = false;
          });
          return;
        }
        /* Temporary network/server failures retry after this request settles. */
      } finally {
        if (controller === requestController) controller = null;
        if (!cancelled) {
          const delay = pendingRealtimeRefresh ? 0 : realtimeReady ? 30_000 : 3000;
          if (pendingRealtimeRefresh || !strictRealtime) timer = setTimeout(poll, delay);
        }
      }
    };
    void poll();
    if (serverRealtimeConfig) {
      const realtime = serverRealtimeConfig;
      const pusherValue = realtime.driver === 'pusher'
        ? realtime.value as NonNullable<ApiGame['pusher']>
        : null;
      const reverbValue = realtime.driver === 'reverb'
        ? realtime.value as NonNullable<ApiGame['reverb']>
        : null;
      const connectRealtime = () => {
        void subscribeToGameUpdates({
          channel: realtime.value.channel,
          cluster: pusherValue?.cluster,
          event: realtime.value.event,
          getToken: realtime.driver === 'ably' && serverUserId ? () => api.getAblyToken(serverGameId, serverUserId) : undefined,
          host: reverbValue?.host,
          key: pusherValue?.key ?? reverbValue?.key,
          onUpdate: () => void poll(),
          port: reverbValue?.port,
          provider: realtime.driver,
          scheme: reverbValue?.scheme,
        }).then((cleanup) => {
          if (cancelled) {
            void cleanup();
            return;
          }
          realtimeCleanup = cleanup;
          realtimeReady = true;
          if (timer) clearTimeout(timer);
          timer = setTimeout(poll, 0);
        }).catch((error) => {
          if (realtime.driver !== 'reverb') {
            if (__DEV__) console.warn('[Lobby] Hosted realtime unavailable; polling fallback active', error);
            return;
          }
          if (__DEV__) console.warn('[Lobby] Reverb unavailable; retrying without polling fallback', error);
          if (!cancelled) realtimeRetryTimer = setTimeout(connectRealtime, 3000);
        });
      };
      connectRealtime();
    }
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (realtimeRetryTimer) clearTimeout(realtimeRetryTimer);
      controller?.abort();
      if (realtimeCleanup) void realtimeCleanup();
    };
  }, [serverGameId, serverUserId, serverRealtimeConfig, targetScore, selectedDeck, setIsGameCountingDown, setSession]);

  useEffect(() => {
    if ((lobbyView !== 'ROOM_CREATED' && lobbyView !== 'ROOM_JOINED') || !session?.gameId) return;
    setServerGameId(session.gameId);
    setServerUserId(session.userId ?? null);
    serverStartedRef.current = false;
  }, [lobbyView, session?.gameId, session?.userId]);

  useEffect(() => {
    if (lobbyView !== 'SETUP' || session !== null || isGameCountingDown) return;

    setServerGameId(null);
    setServerUserId(null);
    setIsCreatingRoom(false);
    setIsStartingGame(false);
    setLobbyOpening((current) => ({ ...current, visible: false }));
    setRoomCode('');
    setRoomPlayers([]);
    joinPendingRef.current = false;
    serverStartedRef.current = false;
  }, [isGameCountingDown, lobbyView, session, setRoomCode, setRoomPlayers]);

  const activeColorConfig = AVAILABLE_COLORS.find((c) => c.id === selectedColor) || AVAILABLE_COLORS[0];
  const hasPlayerIdentity = isSocialUser || Boolean(userName.trim());
  const hasValidRoomCode = ROOM_CODE_REGEX.test(enteredCode.trim().toUpperCase());

  const renderSetupTabs = () => (
    <SetupTabs
      isBs={isBs}
      value={setupTab}
      onChange={(tab) => {
        playSound('click');
        setSetupTab(tab);
      }}
    />
  );

  const renderAvailableGames = () => {
    const formatGameDuration = (createdAt: string) => {
      const elapsedSeconds = Math.max(0, Math.floor((publicGamesNow - new Date(createdAt).getTime()) / 1000));
      const hours = Math.floor(elapsedSeconds / 3600);
      const minutes = Math.floor((elapsedSeconds % 3600) / 60);
      const seconds = elapsedSeconds % 60;
      return `${hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    if (availableGames.length === 0) {
      return (
        <View className="flex-1" style={{ minHeight: 360, transform: [{ translateY: -30 }] }}>
          <LoadingState
            message={isBs ? 'TRENUTNO NEMA JAVNIH IGARA' : 'NO PUBLIC GAMES RIGHT NOW'}
          />
        </View>
      );
    }

    return (
      <View style={{ gap: 10 }}>
          {availableGames.map((game) => {
            const canJoin = !game.started || Boolean(game.winner_id && game.lobby_member_ids.length > 0);
            return (
            <Card key={game.id}>
              {(game.stack ?? 'normal') !== 'normal' && (
                <View
                  accessibilityLabel={isBs ? 'Potreban je Misery PRO' : 'Misery PRO required'}
                  className="absolute"
                  pointerEvents="none"
                  style={{ left: -5, top: -5, zIndex: 2 }}
                >
                  <Crown color="#facc15" fill="#facc15" size={16} strokeWidth={2.2} />
                </View>
              )}
              <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
                <View className="flex-1">
                  <Text className="text-sm font-black uppercase text-neutral-100">
                    {game.members[0]?.name ?? (isBs ? 'Soba za igru' : 'Game room')}
                  </Text>
                  <Text className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    {game.code} • {game.members.length}/8 {isBs ? 'igrača' : 'players'}
                  </Text>
                  {game.winner_id ? (
                    <Text className="mt-1 font-mono text-[11px] font-black uppercase tracking-wider text-emerald-500">
                      {isBs ? 'NOVA PARTIJA' : 'REMATCH LOBBY'}
                    </Text>
                  ) : null}
                </View>
                {game.started && !game.winner_id ? (
                  <View className="items-end justify-center" style={{ minWidth: 92 }}>
                    <Text className="font-mono text-[10px] font-black uppercase tracking-wider text-red-500">
                      {isBs ? 'U TOKU' : 'IN PROGRESS'}
                    </Text>
                    <Text className="mt-1 font-mono text-xs font-black tabular-nums text-red-500">
                      {formatGameDuration(game.created_at)}
                    </Text>
                  </View>
                ) : canJoin ? <GlassView
                  colorScheme="dark"
                  glassEffectStyle="regular"
                  isInteractive
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.055)',
                    borderColor: 'rgba(255,255,255,0.09)',
                    borderRadius: 12,
                    borderWidth: 1,
                    height: 40,
                    overflow: 'hidden',
                    width: 40,
                  }}
                  tintColor="rgba(255,255,255,0.08)"
                >
                  <Pressable
                    accessibilityLabel={isBs ? 'Pridruži se sobi' : 'Join room'}
                    accessibilityRole="button"
                    className="h-full w-full items-center justify-center"
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      playSound('click');
                      void handleJoinWithCode(game.code);
                    }}
                  >
                    <ChevronRight color="#d4d4d4" size={20} strokeWidth={2.5} />
                  </Pressable>
                </GlassView> : null}
              </View>
            </Card>
            );
          })}
      </View>
    );
  };

  const selectedDeckRequiresPro = !isPremium
    && Boolean(deckOptions.find((option) => option.slug === selectedDeck)?.is_premium);

  const renderSetupAction = (fixed = false) => (
    <View
      className="bg-neutral-950"
      style={{
        borderTopColor: fixed ? '#262626' : 'transparent',
        borderTopWidth: fixed ? 1 : 0,
        marginHorizontal: fixed ? 0 : -20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        width: fixed ? '100%' : undefined,
      }}
    >
      <ButtonTab
        category="button"
        type="primary"
        size="100"
        disabled={selectedDeckRequiresPro && setupTab === 'CREATE'
          ? false
          : setupTab === 'CREATE' || setupTab === 'PUBLIC'
            ? !hasPlayerIdentity
            : !hasPlayerIdentity || !hasValidRoomCode}
        onPress={selectedDeckRequiresPro && setupTab === 'CREATE'
          ? () => router.navigate('/pro')
          : setupTab === 'CREATE'
            ? handleCreateRoom
            : setupTab === 'PUBLIC'
              ? () => transitionLobbyView('PUBLIC_GAMES')
              : () => void handleJoinWithCode()}
      >
        {selectedDeckRequiresPro && setupTab === 'CREATE'
          ? (
            <>
              <Crown color="#0a0a0a" fill="#0a0a0a" size={18} strokeWidth={2.4} />
              <Text className="text-sm font-black uppercase tracking-wider text-neutral-950">
                {isBs ? 'OTKLJUČAJ MISERY PRO' : 'UNLOCK MISERY PRO'}
              </Text>
            </>
          )
          : setupTab === 'CREATE'
          ? !hasPlayerIdentity
            ? isBs ? 'UNESI IME' : 'ENTER NAME'
            : isBs ? 'Započni igru' : 'Start Game'
          : setupTab === 'PUBLIC'
            ? !hasPlayerIdentity
              ? isBs ? 'UNESI IME' : 'ENTER NAME'
              : isBs ? 'POGLEDAJ JAVNE IGRE' : 'SEE PUBLIC GAMES'
            : !hasPlayerIdentity
            ? isBs ? 'UNESI IME' : 'ENTER NAME'
            : !hasValidRoomCode
              ? isBs ? 'UNESI KOD SOBE' : 'ENTER ROOM CODE'
              : isBs ? 'PRIDRUŽI SE SOBI' : 'JOIN ROOM'}
      </ButtonTab>
    </View>
  );

  const renderContent = (view = lobbyView) => {
    const hasRememberedSocialSession = Boolean(
      isSocialUser && socialProvider && userName && !isSigningIn
    );
    const hasRememberedGuestName = Boolean(
      !isSocialUser && userName.trim() && !isSigningIn
    );
    const hasRememberedIdentity = hasRememberedSocialSession || hasRememberedGuestName;

    if (view === 'WELCOME') {
      return (
        <View style={{ gap: 15, position: 'relative' }}>
          <View
            style={{ gap: 22 }}
          >
            <View className="items-center" style={{ gap: 10 }}>
              <View className="items-center" style={{ transform: [{ translateY: 10 }] }}>
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
                <Text className="text-center text-[66px] font-black uppercase leading-[66px] tracking-tight text-white" style={{ marginTop: -16, paddingBottom: 5 }}>
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

            <Animated.View style={{ gap: 12, opacity: authButtonsOpacity }}>
              {hasRememberedIdentity ? (
                <View className="relative">
                <ButtonTab
                  category="button"
                  type="third"
                  size="100"
                  onPress={() => {
                    if (hasRememberedGuestName) {
                      setIsSocialUser(false);
                      setSocialProvider(null);
                    }
                    transitionLobbyView('SETUP');
                  }}
                >
                  <SocialButtonContent
                    icon={hasRememberedGuestName
                      ? <User size={16} color="#171717" />
                      : socialProvider === 'google'
                        ? <GoogleIcon />
                        : <AppleIcon buttonAligned />}
                    label={isBs ? `Nastavi kao ${userName}` : `Continue as ${userName}`}
                    tone="light"
                  />
                </ButtonTab>
                <Pressable
                  accessibilityLabel={isBs ? 'Prijavi se ponovo' : 'Sign in again'}
                  accessibilityRole="button"
                  className="absolute z-20 h-8 w-8 items-center justify-center rounded-full bg-neutral-900"
                  onPress={resetRememberedSession}
                  style={{ right: -16, top: -16 }}
                >
                  <X color="#facc15" size={17} />
                </Pressable>
                </View>
              ) : null}

              <View style={{ display: hasRememberedIdentity ? 'none' : 'flex', gap: 12 }}>
              <View style={{ gap: 10 }}>
                <ButtonTab
                  category="button"
                  type="third"
                  size="100"
                  onPress={() => handleSocialSignIn(Platform.OS === 'ios' ? 'apple' : 'google')}
                >
                  {signingInProvider === (Platform.OS === 'ios' ? 'apple' : 'google') ? (
                    <SocialButtonContent
                      icon={<ActivityIndicator color="#000" size="small" />}
                      label={Platform.OS === 'ios'
                        ? (isBs ? 'Prijava sa Apple-om' : 'Signing in with Apple')
                        : (isBs ? 'Prijava sa Google-om' : 'Signing in with Google')}
                      tone="light"
                    />
                  ) : (
                    <SocialButtonContent
                      icon={Platform.OS === 'ios' ? <AppleIcon buttonAligned /> : <GoogleIcon />}
                      label={
                        Platform.OS === 'ios'
                          ? isBs ? 'Prijavi se sa Apple-om' : 'Sign in with Apple'
                          : isBs ? 'Prijavi se sa Google-om' : 'Sign in with Google'
                      }
                      tone="light"
                    />
                  )}
                </ButtonTab>
                <ButtonTab
                  category="button"
                  type="secondary"
                  size="100"
                  onPress={() => handleSocialSignIn(Platform.OS === 'ios' ? 'google' : 'apple')}
                >
                  {signingInProvider === (Platform.OS === 'ios' ? 'google' : 'apple') ? (
                    <SocialButtonContent
                      icon={<ActivityIndicator color="#fff" size="small" />}
                      label={Platform.OS === 'ios'
                        ? (isBs ? 'Prijava sa Google-om' : 'Signing in with Google')
                        : (isBs ? 'Prijava sa Apple-om' : 'Signing in with Apple')}
                      tone="dark"
                    />
                  ) : (
                    <SocialButtonContent
                      icon={Platform.OS === 'ios' ? <GoogleIcon color="#fff" /> : <AppleIcon buttonAligned color="#fff" />}
                      label={
                        Platform.OS === 'ios'
                          ? isBs ? 'Prijavi se sa Google-om' : 'Sign in with Google'
                          : isBs ? 'Prijavi se sa Apple-om' : 'Sign in with Apple'
                      }
                      tone="dark"
                    />
                  )}
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
                  logLobbyTransition('guest-pressed', { lobbyView });
                  setIsSocialUser(false);
                  setSocialProvider(null);
                  transitionLobbyView('SETUP');
                }}
              >
                <SocialButtonContent
                  icon={<User size={16} color="#a3a3a3" />}
                  label={isBs ? 'Igraj kao gost' : 'Play as Guest'}
                  tone="dark"
                />
              </ButtonTab>
              </View>
              <Text className="px-4 text-center text-[10px] leading-4 text-neutral-600">
                {isBs ? 'Nastavkom pristajete na ' : 'By proceeding, you agree to the '}
                <Text
                  accessibilityLabel={isBs ? 'Otvori uslove korištenja' : 'Open terms of use'}
                  accessibilityRole="link"
                  onPress={() => {
                    playSound('click');
                    void WebBrowser.openBrowserAsync(TERMS_URL, {
                      controlsColor: '#facc15',
                      toolbarColor: '#0a0a0a',
                    }).catch(() => undefined);
                  }}
                  style={{ textDecorationLine: 'underline' }}
                >
                  {isBs ? 'Uslove korištenja' : 'Terms'}
                </Text>
                .
              </Text>
            </Animated.View>

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
                  transitionLobbyView('SETUP');
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
                  transitionLobbyView('SETUP');
                }}
                className="w-full py-3.5 px-4 bg-black rounded-xl flex-row items-center justify-center gap-3 shadow-md border border-neutral-800"
              >
                <AppleIcon color="#fff" />
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
                transitionLobbyView('SETUP');
              }}
              className="w-full py-3.5 bg-neutral-900/30 border border-neutral-800 rounded-xl flex-row items-center justify-center gap-2"
            >
              <User size={16} color="#a3a3a3" />
              <Text className="text-neutral-300 font-extrabold text-xs tracking-wider uppercase">
                {isBs ? 'Igraj kao gost' : 'Play as Guest'}
              </Text>
            </Pressable>
          </View>

          <View className="pb-2 items-center" style={{ gap: 4 }}>
            <Text className="text-[10px] text-neutral-600 font-mono">© 2026 Misery Meter</Text>
            <View
              accessibilityLabel={serverHealth === 'offline'
                ? isBs ? 'Serveri nisu dostupni' : 'Servers unavailable'
                : isBs ? 'Serveri aktivni' : 'Servers active'}
              className="flex-row items-center justify-center"
              style={{ gap: 6 }}
            >
              <Animated.View
                style={{
                  backgroundColor: serverHealth === 'offline' ? '#ef4444' : '#22c55e',
                  borderRadius: 4,
                  height: 6,
                  opacity: serverHealth === 'offline' ? 1 : serverHealthPulse,
                  width: 6,
                }}
              />
              <Text className="text-[10px] text-neutral-600 font-mono opacity-80">
                {serverHealth === 'offline'
                  ? isBs ? 'Serveri nisu dostupni • Multiplayer mode • Do 8 igrača' : 'Servers unavailable • Multiplayer mode • Up to 8 players'
                  : isBs ? 'Serveri aktivni • Multiplayer mode • Do 8 igrača' : 'Servers active • Multiplayer mode • Up to 8 players'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (view === 'SETUP') {
      if (setupTab === 'CREATE') {
        return (
          <View style={{ gap: 32 }}>
            {renderSetupTabs()}

            <Section titleEn="PLAYER PROFILE" titleBs="PROFIL IGRAČA">
              {isSocialUser ? (
                <View className="flex-row items-center justify-between p-3.5 rounded-xl border border-neutral-800">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center">
                      {socialProvider === 'google' ? (
                        <GoogleIcon color="#facc15" size={22} />
                      ) : (
                        <AppleIcon color="#facc15" size={22} />
                      )}
                    </View>
                    <View>
                      <Text className="font-bold text-xs text-neutral-200">{userName}</Text>
                      <Text className="text-[8px] text-emerald-400 font-mono">
                        {socialProvider === 'google' ? 'Google Account Connected' : 'Apple ID Connected'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable onPress={openUsernameModal} className="px-2 py-1 rounded bg-neutral-800">
                      <Text className="text-[9px] text-neutral-400">{isBs ? 'Promijeni ime' : 'Change username'}</Text>
                    </Pressable>
                    <Pressable onPress={handleSignOut} className="px-2 py-1 rounded bg-neutral-800">
                      <Text className="text-[9px] text-neutral-400">{isBs ? 'Odjavi se' : 'Sign out'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <AppInput
                  leftIcon={<User size={16} color="#737373" />}
                  maxLength={15}
                  value={userName}
                  onChangeText={handleGuestNameChange}
                  placeholder={isBs ? 'Npr. Hana' : 'E.g. Ashley'}
                />
              )}
            </Section>

            <Section titleEn="CHOOSE YOUR COLOR" titleBs="ODABERITE SVOJU BOJU">
              <View className="w-full flex-row items-center justify-between">
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
                      setTargetScore(num);
                    }}
                  >
                    {num.toString()}
                  </ButtonTab>
                ))}
              </View>
            </Section>

            <Section titleEn="CHOOSE THE CARD DECK" titleBs="ODABERITE ŠPIL KARTICA">
              <View
                onLayout={(event) => setDeckChooserWidth(Math.round(event.nativeEvent.layout.width))}
                style={{ marginHorizontal: -20 }}
              >
                <ScrollView
                  contentContainerStyle={{
                    gap: 10,
                    paddingLeft: 20,
                    paddingRight: Math.max(0, deckChooserWidth - deckCardWidth - 20),
                  }}
                  contentInsetAdjustmentBehavior="never"
                  decelerationRate="fast"
                  horizontal
                  onMomentumScrollEnd={(event) => {
                    if (!deckChooserWidth) return;
                    selectDeckAtIndex(Math.round(event.nativeEvent.contentOffset.x / deckSnapInterval));
                  }}
                  ref={deckScrollRef}
                  showsHorizontalScrollIndicator={false}
                  snapToAlignment="start"
                  snapToInterval={deckChooserWidth ? deckSnapInterval : undefined}
                  snapToStart
                >
                  {deckOptions.map((option, index) => {
                    const selected = selectedDeck === option.slug;
                    const premium = option.is_premium;
                    const accent = option.color || '#facc15';
                    return (
                      <Pressable
                        key={option.slug}
                        onPress={() => {
                          if (!deckChooserWidth || selected) {
                            selectDeckAtIndex(index);
                            return;
                          }
                          deckScrollRef.current?.scrollTo({ animated: true, x: index * deckSnapInterval });
                        }}
                        className="relative items-center justify-center gap-1 rounded-xl border-2 px-4 py-3"
                        style={{ backgroundColor: selected ? `${accent}0D` : 'transparent', borderColor: selected ? accent : '#171717', minHeight: 82, width: deckCardWidth }}
                      >
                        {premium && !isPremium && (
                          <View className="absolute left-3 top-3">
                            <Crown size={14} color="#facc15" fill="#facc15" />
                          </View>
                        )}
                        <StackedCardsCount
                          color={selected ? accent : '#737373'}
                          count={option.active_cards_count}
                        />
                        {iconForStack(option.icon_key, selected ? accent : '#737373')}
                        <Text style={{ color: selected ? accent : '#737373', fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
                          {option.name}
                        </Text>
                        <Text className="text-center text-[8px] leading-tight text-neutral-500">
                          {isBs ? option.description_bs || option.description : option.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </Section>

            {!isKeyboardVisible && renderSetupAction()}
          </View>
        );
      } else {
        return (
          <View style={{ gap: 32 }}>
            {renderSetupTabs()}

            <Section titleEn="PLAYER PROFILE" titleBs="PROFIL IGRAČA">
              {isSocialUser ? (
                <View className="flex-row items-center justify-between p-3.5 rounded-xl border border-neutral-800">
                  <View className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center">
                      {socialProvider === 'google' ? (
                        <GoogleIcon color="#facc15" size={22} />
                      ) : (
                        <AppleIcon color="#facc15" size={22} />
                      )}
                    </View>
                    <View>
                      <Text className="font-bold text-xs text-neutral-200">{userName}</Text>
                      <Text className="text-[8px] text-emerald-400 font-mono">
                        {socialProvider === 'google' ? 'Google Account Connected' : 'Apple ID Connected'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable onPress={openUsernameModal} className="px-2 py-1 rounded bg-neutral-800">
                      <Text className="text-[9px] text-neutral-400">{isBs ? 'Promijeni ime' : 'Change username'}</Text>
                    </Pressable>
                    <Pressable onPress={handleSignOut} className="px-2 py-1 rounded bg-neutral-800">
                      <Text className="text-[9px] text-neutral-400">{isBs ? 'Odjavi se' : 'Sign out'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <AppInput
                  leftIcon={<User size={16} color="#737373" />}
                  maxLength={15}
                  value={userName}
                  onChangeText={handleGuestNameChange}
                  placeholder={isBs ? 'Npr. Hana' : 'E.g. Ashley'}
                />
              )}
            </Section>

            <Section titleEn="CHOOSE YOUR COLOR" titleBs="ODABERITE SVOJU BOJU">
              <View className="w-full flex-row items-center justify-between">
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

            {setupTab === 'JOIN' && <Section titleEn="ENTER CODE TO JOIN" titleBs="UNESITE KOD ZA PRIDRUŽIVANJE">
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
                }}
                onBlur={() => {
                  codeInputFocusedRef.current = false;
                }}
                placeholder={isBs ? 'NPR. A1B2C3D4' : 'E.G. A1B2C3D4'}
                className="w-full"
                inputClassName="text-center font-mono font-black text-lg uppercase tracking-widest text-amber-400"
              />
            </Section>}

            {!isKeyboardVisible && renderSetupAction()}
          </View>
        );
      }
    }

    if (view === 'PUBLIC_GAMES') {
      return (
        <View className="flex-1" style={{ gap: 10 }}>
          {renderAvailableGames()}
        </View>
      );
    }

    if (view === 'ROOM_CREATED') {
      return (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 16 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 font-bold">
                  {isBs ? `IGRAČI U SOBI (${roomPlayers.length}/8)` : `PLAYERS IN LOBBY (${roomPlayers.length}/8)`}
              </Text>
              <View className="items-end" style={{ gap: 3 }}>
                {roomPlayers.length < 8 && (
                  <Text className="text-[8px] font-mono text-amber-500/80 uppercase animate-pulse">
                    {isBs ? 'Čekanje igrača...' : 'Waiting for players...'}
                  </Text>
                )}
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  {selectedDeck !== 'normal' && <Crown color="#facc15" fill="#facc15" size={11} strokeWidth={2.2} />}
                  <Text className="font-mono text-[8px] font-black uppercase tracking-wider text-neutral-400">
                    {isBs ? 'PAKET IGRE' : 'GAME PACK'}: {deckLabel(selectedDeck, deckOptions)}
                  </Text>
                </View>
              </View>
            </View>
            <RoomCodeCard
              code={roomCode}
              isBs={isBs}
              isCopied={isCopied}
              isLocking={isLockingRoom}
              isPrivate={isRoomPrivate}
              onCopy={handleCopyRoomCode}
              onLock={() => void handleLockRoom()}
              onShare={handleShareRoomCode}
            />
            <View style={{ gap: 16 }}>
              {roomPlayers.map((player, idx) => (
                <PlayerCard
                  key={`${player.name}-${idx}`}
                  index={idx}
                  isBs={isBs}
                  isCurrentPlayer={Number(player.id) === Number(serverUserId)}
                  isHost={Number(player.id) === Number(serverOwnerId)}
                  isRemoving={Number(player.id) === removingPlayerId}
                  onRemove={Number(player.id) !== Number(serverOwnerId) && player.id
                    ? () => setPlayerToRemove({ id: player.id as number, name: player.name })
                    : undefined}
                  player={player}
                />
              ))}
            </View>
          </View>
          <ButtonTab
            category="button"
            type="primary"
            size="100"
            disabled={roomPlayers.length < 2}
            onPress={() => {
              logLobbyTransition('begin-now-pressed', {
                gameId: serverGameId,
                userId: serverUserId,
                playerCount: roomPlayers.length,
                targetScore,
                selectedDeck,
              });
              startGame('MULTIPLAYER', roomPlayers, targetScore, selectedDeck);
            }}
          >
            {isBs ? 'POKRENI IGRU ODMAH' : 'BEGIN NOW'}
          </ButtonTab>
        </View>
      );
    }

    if (view === 'ROOM_JOINED') {
      return (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 16 }}>
            <View className="flex-row items-center justify-between">
              <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                {isBs ? 'IGRAČI U SOBI' : 'PLAYERS IN ROOM'}
              </Text>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                {selectedDeck !== 'normal' && <Crown color="#facc15" fill="#facc15" size={11} strokeWidth={2.2} />}
                <Text className="font-mono text-[8px] font-black uppercase tracking-wider text-neutral-400">
                  {isBs ? 'PAKET IGRE' : 'GAME PACK'}: {deckLabel(selectedDeck, deckOptions)}
                </Text>
              </View>
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
                <PlayerCard
                  key={`${player.name}-${idx}`}
                  index={idx}
                  isBs={isBs}
                  isCurrentPlayer={Number(player.id) === Number(serverUserId)}
                  isHost={Number(player.id) === Number(serverOwnerId)}
                  player={player}
                />
              ))}
            </View>
          </View>
          <ButtonTab
            category="button"
            type="secondary"
            size="100"
            disabled
          >
            <View className="flex-row items-center justify-center" style={{ gap: 8 }}>
              <ActivityIndicator color="#737373" size="small" />
              <Text className="font-black uppercase tracking-wider text-neutral-500">
                {hostInLobby
                  ? isBs ? 'ČEKA SE DOMAĆIN' : 'WAITING FOR HOST'
                  : isBs ? 'DOMAĆIN NIJE U SOBI: ČEKANJE' : 'NO HOST IN ROOM: WAITING'}
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
        enabled={lobbyView === 'SETUP'}
      >
        {lobbyView === 'WELCOME' || lobbyView === 'SETUP' || lobbyView === 'PUBLIC_GAMES' ? (
          <View className="flex-1">
            <Animated.View
              pointerEvents={lobbyView === 'WELCOME' ? 'auto' : 'none'}
              style={{ bottom: 0, left: 0, opacity: welcomeOpacity, position: 'absolute', right: 0, top: 0 }}
            >
              <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {renderContent('WELCOME')}
              </ScrollView>
            </Animated.View>

            <Animated.View
              pointerEvents={lobbyView === 'SETUP' ? 'auto' : 'none'}
              style={{ bottom: 0, left: 0, opacity: setupOpacity, position: 'absolute', right: 0, top: 0 }}
            >
              <ScrollView
                ref={lobbyScrollRef}
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 15, paddingTop: 104 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {renderContent('SETUP')}
              </ScrollView>
              {lobbyView === 'SETUP' && isKeyboardVisible && renderSetupAction(true)}
            </Animated.View>

            <Animated.View
              pointerEvents={lobbyView === 'PUBLIC_GAMES' ? 'auto' : 'none'}
              style={{ bottom: 0, left: 0, opacity: publicGamesOpacity, position: 'absolute', right: 0, top: 0 }}
            >
              <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 24, paddingTop: 100 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {renderContent('PUBLIC_GAMES')}
              </ScrollView>
            </Animated.View>
          </View>
        ) : (
        <Animated.View key={lobbyView} className="flex-1" style={{ opacity: roomOpacity }}>
          {lobbyView === 'ROOM_JOINING' ? (
            <LoadingState message={joinStatusText} />
          ) : (
            <ScrollView
              ref={lobbyScrollRef}
              className="flex-1 px-5"
              contentContainerStyle={{ paddingBottom: 24, paddingTop: 100 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderContent()}
            </ScrollView>
          )}
        </Animated.View>
        )}
      </KeyboardAvoidingView>
      <ConfirmModal
        cancelLabel={isBs ? 'ODUSTANI' : 'CANCEL'}
        confirmLabel={isBs ? 'IZBACI IGRAČA' : 'KICK OUT'}
        confirmLoading={removingPlayerId !== null}
        onCancel={() => setPlayerToRemove(null)}
        onConfirm={() => void handleRemoveLobbyPlayer(playerToRemove?.id)}
        onRequestClose={() => {
          if (removingPlayerId === null) setPlayerToRemove(null);
        }}
        visible={playerToRemove !== null}
      >
        <View className="items-center" style={{ gap: 10 }}>
          <ShieldAlert color="#fbbf24" size={38} />
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'JESI LI SIGURAN?' : 'ARE YOU SURE?'}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {isBs
              ? `Želiš li izbaciti igrača ${playerToRemove?.name ?? ''} iz sobe?`
              : `Are you sure you want to kick ${playerToRemove?.name ?? 'this player'} out of the lobby?`}
          </Text>
        </View>
      </ConfirmModal>
      <ConfirmModal
        cancelLabel={isBs ? 'ODUSTANI' : 'CANCEL'}
        confirmLabel={isSavingUsername ? (isBs ? 'PROVJERA...' : 'CHECKING...') : (isBs ? 'SPREMI' : 'SAVE')}
        confirmLoading={isSavingUsername}
        onCancel={() => setUsernameModalOpen(false)}
        onConfirm={saveUsername}
        onRequestClose={() => {
          if (!isSavingUsername) setUsernameModalOpen(false);
        }}
        visible={usernameModalOpen}
      >
        <View style={{ gap: 14 }}>
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'PROMIJENI IME' : 'CHANGE USERNAME'}
          </Text>
          <View className="relative h-[78px]">
            <AppInput
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              blurOnSubmit={false}
              maxLength={15}
              onChangeText={(value) => {
                setUsernameDraft(value);
                setUsernameError('');
              }}
              onSubmitEditing={saveUsername}
              placeholder={isBs ? 'Novo ime' : 'New username'}
              returnKeyType="done"
              value={usernameDraft}
            />
            {usernameError ? (
              <Text className="absolute left-0 right-0 top-[62px] text-center text-xs font-semibold text-red-400">
                {usernameError}
              </Text>
            ) : null}
          </View>
        </View>
      </ConfirmModal>
      <ConfirmModal
        confirmLabel={isBs ? 'POKUŠAJ PONOVO' : 'TRY AGAIN'}
        onConfirm={() => {
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
      <LoadingOverlay isBs={isBs} visible={isCreatingRoom && !startModal.visible} />
      <LoadingOverlay isBs={isBs} mode="start" visible={isStartingGame && !startModal.visible} />
      <LaneModal
        bell
        failureMessage=""
        failureTitle=""
        onComplete={() => setHostLobbyWarningVisible(false)}
        success
        successMessage={isBs
          ? 'POKRENI IGRU. SOBA ĆE BITI OBRISANA ZA 1 MINUTU.'
          : 'START THE GAME. THE ROOM WILL BE DELETED IN 1 MINUTE.'}
        successTitle={isBs ? 'SOBA JE NEAKTIVNA' : 'ROOM INACTIVE'}
        visible={hostLobbyWarningVisible && lobbyView === 'ROOM_CREATED' && session === null && !isGameCountingDown && !isStartingGame}
        warning
      />
      <InactivityKickCountdown
        isBs={isBs}
        message={isBs ? 'SOBA ĆE BITI OBRISANA' : 'THE ROOM WILL BE DELETED'}
        onDismiss={() => undefined}
        value={lobbyView === 'ROOM_CREATED' && session === null && !isGameCountingDown && !isStartingGame ? hostLobbyFinalCountdown : null}
      />
      <LaneModal
        failureMessage=""
        failureTitle=""
        onComplete={() => setRoomPrivacyResult(null)}
        success
        successMessage={roomPrivacyResult === 'unlocked'
          ? isBs ? 'SOBA JE PONOVO VIDLJIVA U JAVNIM IGRAMA' : 'THIS ROOM IS VISIBLE IN PUBLIC GAMES AGAIN'
          : isBs ? 'SOBA VIŠE NIJE VIDLJIVA U JAVNIM IGRAMA' : 'THIS ROOM IS NO LONGER VISIBLE IN PUBLIC GAMES'}
        successTitle={roomPrivacyResult === 'unlocked'
          ? isBs ? 'SOBA JE OTKLJUČANA' : 'ROOM UNLOCKED'
          : isBs ? 'SOBA JE ZAKLJUČANA' : 'ROOM LOCKED'}
        visible={roomPrivacyResult !== null}
      />
      <LobbyOpeningOverlay
        changed={lobbyOpening.changed}
        color={lobbyOpening.color}
        isBs={isBs}
        visible={lobbyOpening.visible}
      />
      <ConfirmModal
        cancelLabel={Number(serverOwnerId) === Number(serverUserId)
          ? isBs ? 'IZAĐI I OBRIŠI' : 'LEAVE & DELETE'
          : isBs ? 'NAPUSTI SOBU' : 'LEAVE ROOM'}
        confirmLabel={isBs ? 'OSTANI' : 'STAY'}
        onCancel={() => void handleLeaveRoom()}
        onConfirm={() => setRoomExitWarningOpen(false)}
        onRequestClose={() => setRoomExitWarningOpen(false)}
        visible={roomExitWarningOpen}
      >
        <View className="items-center" style={{ gap: 12 }}>
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'NAPUSTITI SOBU?' : 'LEAVE THIS ROOM?'}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {Number(serverOwnerId) === Number(serverUserId)
              ? isBs
                ? 'Igra još nije počela. Ako izađeš, ova soba će biti trajno obrisana.'
                : 'The game has not started. If you leave, this room will be permanently deleted.'
              : isBs
                ? 'Ako napustiš sobu, bit ćeš uklonjen/a iz lobbyja.'
                : 'If you leave this room, you will be removed from the lobby.'}
          </Text>
        </View>
      </ConfirmModal>
      <ConfirmModal
        confirmLabel={startModal.title === 'STARTING GAME' || startModal.title === 'START GAME PRESSED' ? 'CLOSE' : 'OK'}
        onConfirm={() => setStartModal((current) => ({ ...current, visible: false }))}
        onRequestClose={() => setStartModal((current) => ({ ...current, visible: false }))}
        visible={startModal.visible}
      >
        <View className="items-center" style={{ gap: 12 }}>
          <Text className={`text-center text-lg font-black uppercase tracking-wider ${startModal.title.includes('FAILED') ? 'text-red-400' : 'text-amber-400'}`}>
            {startModal.title}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {startModal.message}
          </Text>
        </View>
      </ConfirmModal>
    </>
  );
}
