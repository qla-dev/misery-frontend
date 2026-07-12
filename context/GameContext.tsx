import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Language } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSession, LobbyView, PlayerInput } from './game-types';

interface GameContextValue {
  isPremium: boolean;
  activatePremium: () => Promise<void>;
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
  setupTab: 'CREATE' | 'JOIN';
  setSetupTab: (tab: 'CREATE' | 'JOIN') => void;
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
  muted: boolean;
  setMuted: (value: boolean) => void;
  showRules: boolean;
  setShowRules: (value: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [lobbyView, setLobbyView] = useState<LobbyView>('WELCOME');
  const [lobbyTransitionTarget, setLobbyTransitionTarget] = useState<LobbyView | null>(null);
  const [setupTab, setSetupTab] = useState<'CREATE' | 'JOIN'>('CREATE');
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
  const [muted, setMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);
  const [gameRuntime, setGameRuntime] = useState<any | null>(null);
  const [isGameCountingDown, setIsGameCountingDown] = useState(false);
  const [laneResult, setLaneResult] = useState<'success' | 'failure' | 'steal' | null>(null);
  const [laneResultPlayerName, setLaneResultPlayerName] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@misery-meter/premium').then((value) => setIsPremium(value === 'active')).catch(() => undefined);
  }, []);

  const activatePremium = async () => {
    await AsyncStorage.setItem('@misery-meter/premium', 'active');
    setIsPremium(true);
  };

  const value = useMemo(
    () => ({
      isPremium,
      activatePremium,
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
      infoModalOpen,
      setInfoModalOpen,
      roomExitWarningOpen,
      setRoomExitWarningOpen,
      session,
      setSession,
      muted,
      setMuted,
      showRules,
      setShowRules,
    }),
    [
      isPremium,
      language,
      gameRuntime,
      isGameCountingDown,
      laneResult,
      laneResultPlayerName,
      lobbyView,
      lobbyTransitionTarget,
      setupTab,
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
      muted,
      showRules,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
