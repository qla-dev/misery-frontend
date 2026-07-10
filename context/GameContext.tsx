import React, { createContext, useContext, useMemo, useState } from 'react';
import { Language } from '@/types';
import { GameSession, LobbyView, PlayerInput } from './game-types';

interface GameContextValue {
  language: Language;
  toggleLanguage: () => void;
  lobbyView: LobbyView;
  setLobbyView: (view: LobbyView) => void;
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
  countdown: number | null;
  setCountdown: React.Dispatch<React.SetStateAction<number | null>>;
  joinStatusText: string;
  setJoinStatusText: (text: string) => void;
  infoModalOpen: boolean;
  setInfoModalOpen: (open: boolean) => void;
  session: GameSession | null;
  setSession: (session: GameSession | null) => void;
  muted: boolean;
  setMuted: (value: boolean) => void;
  showRules: boolean;
  setShowRules: (value: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [lobbyView, setLobbyView] = useState<LobbyView>('WELCOME');
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const [joinStatusText, setJoinStatusText] = useState('');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [session, setSession] = useState<GameSession | null>(null);

  const value = useMemo(
    () => ({
      language,
      toggleLanguage: () => setLanguage((prev) => (prev === 'en' ? 'bs' : 'en')),
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
      countdown,
      setCountdown,
      joinStatusText,
      setJoinStatusText,
      infoModalOpen,
      setInfoModalOpen,
      session,
      setSession,
      muted,
      setMuted,
      showRules,
      setShowRules,
    }),
    [
      language,
      lobbyView,
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
      countdown,
      joinStatusText,
      infoModalOpen,
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
