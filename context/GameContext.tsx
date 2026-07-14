import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Language } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSession, LobbyView, PlayerInput } from './game-types';
import { AppState } from 'react-native';
import {
  addRevenueCatStatusListener,
  configureRevenueCat,
  hasRevenueCatConfig,
  identifyRevenueCatUser,
  openRevenueCatCustomerCenter,
  PremiumPlan,
  PremiumStatus,
  purchaseRevenueCatPlan,
  restoreRevenueCatPurchases,
  syncRevenueCatStatus,
} from '@/lib/revenueCat';
import { ApiUser } from '@/lib/api';

const LANGUAGE_KEY = '@misery-index/language';
const MUSIC_MUTED_KEY = '@misery-index/music-muted';

interface GameContextValue {
  isPremium: boolean;
  premiumExpirationDate: string | null;
  premiumPlan: PremiumPlan | null;
  premiumReady: boolean;
  purchasePremium: (plan: PremiumPlan) => Promise<PremiumStatus>;
  restorePremium: () => Promise<PremiumStatus>;
  managePremium: () => Promise<PremiumStatus>;
  refreshPremium: () => Promise<PremiumStatus>;
  setPremiumIdentity: (user: ApiUser | null, token: string | null) => Promise<PremiumStatus>;
  gameRuntime: any | null;
  setGameRuntime: (runtime: any | null) => void;
  isGameCountingDown: boolean;
  setIsGameCountingDown: (value: boolean) => void;
  laneResult: 'success' | 'failure' | 'steal' | null;
  setLaneResult: (result: 'success' | 'failure' | 'steal' | null) => void;
  laneResultPlayerName: string | null;
  setLaneResultPlayerName: (name: string | null) => void;
  language: Language;
  toggleLanguage: () => void;
  lobbyView: LobbyView;
  setLobbyView: (view: LobbyView) => void;
  lobbyTransitionTarget: LobbyView | null;
  setLobbyTransitionTarget: (view: LobbyView | null) => void;
  lobbyEntryFade: boolean;
  setLobbyEntryFade: (value: boolean) => void;
  setupTab: 'CREATE' | 'JOIN' | 'PUBLIC';
  setSetupTab: (tab: 'CREATE' | 'JOIN' | 'PUBLIC') => void;
  pendingDeepLinkCode: string | null;
  setPendingDeepLinkCode: (code: string | null) => void;
  userName: string;
  setUserName: (name: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  targetScore: number;
  setTargetScore: (score: number) => void;
  selectedDeck: 'NORMAL' | 'SPICY';
  setSelectedDeck: (deck: 'NORMAL' | 'SPICY') => void;
  isSocialUser: boolean;
  setIsSocialUser: (value: boolean) => void;
  socialProvider: 'google' | 'apple' | null;
  setSocialProvider: (provider: 'google' | 'apple' | null) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;
  enteredCode: string;
  setEnteredCode: (code: string) => void;
  roomPlayers: PlayerInput[];
  setRoomPlayers: React.Dispatch<React.SetStateAction<PlayerInput[]>>;
  isCopied: boolean;
  setIsCopied: (value: boolean) => void;
  joinStatusText: string;
  setJoinStatusText: (text: string) => void;
  infoModalOpen: boolean;
  setInfoModalOpen: (open: boolean) => void;
  roomExitWarningOpen: boolean;
  setRoomExitWarningOpen: (open: boolean) => void;
  session: GameSession | null;
  setSession: (session: GameSession | null) => void;
  musicMuted: boolean;
  setMusicMuted: (value: boolean) => void;
  showRules: boolean;
  setShowRules: (value: boolean) => void;
  turnNotices: TurnNotice[];
  setTurnNotices: React.Dispatch<React.SetStateAction<TurnNotice[]>>;
}

export interface TurnNotice {
  id: number;
  type: 'start' | 'hold' | 'end' | 'finish';
  steal?: boolean;
  playerName?: string;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpirationDate, setPremiumExpirationDate] = useState<string | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<PremiumPlan | null>(null);
  const [premiumReady, setPremiumReady] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [lobbyView, setLobbyView] = useState<LobbyView>('WELCOME');
  const [lobbyTransitionTarget, setLobbyTransitionTarget] = useState<LobbyView | null>(null);
  const [lobbyEntryFade, setLobbyEntryFade] = useState(false);
  const [setupTab, setSetupTab] = useState<'CREATE' | 'JOIN' | 'PUBLIC'>('CREATE');
  const [pendingDeepLinkCode, setPendingDeepLinkCode] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [targetScore, setTargetScore] = useState(7);
  const [selectedDeck, setSelectedDeck] = useState<'NORMAL' | 'SPICY'>('NORMAL');
  const [isSocialUser, setIsSocialUser] = useState(false);
  const [socialProvider, setSocialProvider] = useState<'google' | 'apple' | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [roomPlayers, setRoomPlayers] = useState<PlayerInput[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [joinStatusText, setJoinStatusText] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [roomExitWarningOpen, setRoomExitWarningOpen] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [turnNotices, setTurnNotices] = useState<TurnNotice[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameRuntime, setGameRuntime] = useState<any | null>(null);
  const [isGameCountingDown, setIsGameCountingDown] = useState(false);
  const [laneResult, setLaneResult] = useState<'success' | 'failure' | 'steal' | null>(null);
  const [laneResultPlayerName, setLaneResultPlayerName] = useState<string | null>(null);
  const [settingsRestored, setSettingsRestored] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([LANGUAGE_KEY, MUSIC_MUTED_KEY])
      .then((entries) => {
        const saved = Object.fromEntries(entries);
        if (saved[LANGUAGE_KEY] === 'en' || saved[LANGUAGE_KEY] === 'bs') {
          setLanguage(saved[LANGUAGE_KEY] as Language);
        }
        setMusicMuted(saved[MUSIC_MUTED_KEY] === 'true');
      })
      .catch(() => undefined)
      .finally(() => setSettingsRestored(true));
  }, []);

  useEffect(() => {
    if (!settingsRestored) return;
    void AsyncStorage.setItem(LANGUAGE_KEY, language).catch(() => undefined);
  }, [language, settingsRestored]);

  useEffect(() => {
    if (!settingsRestored) return;
    void AsyncStorage.setItem(MUSIC_MUTED_KEY, String(musicMuted)).catch(() => undefined);
  }, [musicMuted, settingsRestored]);

  const applyPremiumStatus = useCallback((status: PremiumStatus) => {
    setIsPremium(status.active);
    setPremiumExpirationDate(status.expirationDate);
    setPremiumPlan(status.plan);
    return status;
  }, []);

  const premiumStatusFromBackendUser = useCallback((user: ApiUser): PremiumStatus => {
    const plan = user.pro_status === 'monthly' || user.pro_status === 'yearly' ? user.pro_status : null;
    const expirationDate = user.pro_ends_at ?? null;
    const active = Boolean(plan) && (!expirationDate || new Date(expirationDate).getTime() > Date.now());
    return {
      active,
      expirationDate: active ? expirationDate : null,
      managementURL: null,
      plan: active ? plan : null,
      productIdentifier: active ? (user.revenuecat_product_id ?? null) : null,
    };
  }, []);

  const refreshPremium = useCallback(async () => {
    const status = await syncRevenueCatStatus();
    return applyPremiumStatus(status);
  }, [applyPremiumStatus]);

  const purchasePremium = useCallback(async (plan: PremiumPlan) => {
    const status = await purchaseRevenueCatPlan(plan);
    return applyPremiumStatus(status);
  }, [applyPremiumStatus]);

  const restorePremium = useCallback(async () => {
    const status = await restoreRevenueCatPurchases();
    return applyPremiumStatus(status);
  }, [applyPremiumStatus]);

  const managePremium = useCallback(async () => {
    const status = await openRevenueCatCustomerCenter();
    return applyPremiumStatus(status);
  }, [applyPremiumStatus]);

  const setPremiumIdentity = useCallback(async (user: ApiUser | null, _token: string | null) => {
    setPremiumReady(false);
    const fallbackStatus = user ? premiumStatusFromBackendUser(user) : {
      active: false,
      expirationDate: null,
      managementURL: null,
      plan: null,
      productIdentifier: null,
    } satisfies PremiumStatus;
    applyPremiumStatus(fallbackStatus);
    try {
      const revenueCatStatus = await identifyRevenueCatUser(user?.id ?? null);
      applyPremiumStatus(revenueCatStatus);
      return revenueCatStatus;
    } catch (error) {
      console.warn('[RevenueCat] account linking failed', error);
      return fallbackStatus;
    } finally {
      setPremiumReady(true);
    }
  }, [applyPremiumStatus, premiumStatusFromBackendUser]);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const initialize = async () => {
      if (!hasRevenueCatConfig()) {
        if (active) setPremiumReady(true);
        return;
      }
      try {
        await configureRevenueCat();
        const status = await syncRevenueCatStatus();
        if (active) applyPremiumStatus(status);
        unsubscribe = await addRevenueCatStatusListener((nextStatus) => {
          if (!active) return;
          applyPremiumStatus(nextStatus);
        });
      } catch (error) {
        console.warn('[RevenueCat] initialization failed', error);
      } finally {
        if (active) setPremiumReady(true);
      }
    };
    void initialize();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [applyPremiumStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !hasRevenueCatConfig()) return;
      refreshPremium().catch((error) => console.warn('[RevenueCat] resume sync failed', error));
    });
    return () => subscription.remove();
  }, [refreshPremium]);

  const value = useMemo(
    () => ({
      isPremium,
      premiumExpirationDate,
      premiumPlan,
      premiumReady,
      purchasePremium,
      restorePremium,
      managePremium,
      refreshPremium,
      setPremiumIdentity,
      language,
      gameRuntime,
      setGameRuntime,
      isGameCountingDown,
      setIsGameCountingDown,
      laneResult,
      setLaneResult,
      laneResultPlayerName,
      setLaneResultPlayerName,
      toggleLanguage: () => setLanguage((prev) => (prev === 'en' ? 'bs' : 'en')),
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
      infoModalOpen,
      setInfoModalOpen,
      roomExitWarningOpen,
      setRoomExitWarningOpen,
      session,
      setSession,
      musicMuted,
      setMusicMuted,
      showRules,
      setShowRules,
      turnNotices,
      setTurnNotices,
    }),
    [
      isPremium,
      premiumExpirationDate,
      premiumPlan,
      premiumReady,
      purchasePremium,
      restorePremium,
      managePremium,
      refreshPremium,
      setPremiumIdentity,
      language,
      gameRuntime,
      isGameCountingDown,
      laneResult,
      laneResultPlayerName,
      lobbyView,
      lobbyTransitionTarget,
      lobbyEntryFade,
      setupTab,
      pendingDeepLinkCode,
      userName,
      selectedColor,
      targetScore,
      selectedDeck,
      isSocialUser,
      socialProvider,
      roomCode,
      enteredCode,
      roomPlayers,
      isCopied,
      joinStatusText,
      infoModalOpen,
      roomExitWarningOpen,
      session,
      musicMuted,
      showRules,
      turnNotices,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
