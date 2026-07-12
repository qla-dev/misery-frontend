import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { AlertOctagon, Loader2, ShieldAlert, Trophy, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Animated, Easing, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Card, Player, Language, GameState, GameMode } from '@/types';
import { CARD_DECK } from '@/data/cards';
import Illustration from './Illustration';
import { GradientButton } from './GradientButton';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { ButtonTab } from './ButtonTab';
import LottieView from 'lottie-react-native';
import { ConfirmModal } from './ConfirmModal';
import { api, ApiCard } from '@/lib/api';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

const PLAYER_COLOR_HEX: Record<string, string> = {
  yellow: '#facc15',
  blue: '#60a5fa',
  emerald: '#10b981',
  purple: '#c084fc',
  red: '#ef4444',
  orange: '#f97316',
  '#8B5A2B': '#8B5A2B',
  neutral: '#d4d4d4',
};

function getPlayerColorHex(colorClasses: string) {
  const colorKey = Object.keys(PLAYER_COLOR_HEX).find((key) => colorClasses.includes(key));
  return colorKey ? PLAYER_COLOR_HEX[colorKey] : '#facc15';
}

interface GameBoardProps {
  mode: GameMode;
  initialPlayers: { id?: number; name: string; color: string; isBot?: boolean }[];
  targetScore: number;
  deckType?: 'NORMAL' | 'SPICY';
  gameId?: number;
  userId?: number;
}

function CardLogo({ compact = false }: { compact?: boolean }) {
  const fontSize = compact ? 32 : 54;
  const lineHeight = compact ? 32 : 54;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ color: '#fbbf24', fontFamily: 'Outfit_900Black', fontSize, letterSpacing: -2, lineHeight }}>M</Text>
        <LottieView
          autoPlay
          loop
          source={MASCOT_LOTTIE}
          style={{
            height: compact ? 48 : 78,
            marginHorizontal: -3,
            marginTop: compact ? -27 : -44,
            transform: [{ translateX: compact ? 2 : 4 }],
            width: compact ? 24 : 38,
          }}
        />
        <Text style={{ color: '#fbbf24', fontFamily: 'Outfit_900Black', fontSize, letterSpacing: -2, lineHeight }}>SERY</Text>
      </View>
      <Text style={{ color: '#fff', fontFamily: 'Outfit_900Black', fontSize, letterSpacing: -2, lineHeight, marginTop: compact ? -8 : -13 }}>
        METER
      </Text>
    </View>
  );
}

export default function GameBoard({
  mode,
  initialPlayers,
  targetScore,
  deckType = 'NORMAL',
  gameId,
  userId,
}: GameBoardProps) {
  const { language, laneResult, muted, setGameRuntime, setLaneResult, setLaneResultPlayerName } = useGame();
  const isBs = language === 'bs';
  const { height } = useWindowDimensions();
  const cardTopOffset = 104 + (mode === 'MULTIPLAYER' ? 52 : 0);
  const cardTopPadding = 12;
  const drawnCardHeight = height - cardTopOffset - cardTopPadding - 105;
  const cardAreaHeight = drawnCardHeight + cardTopPadding;
  const dummyArtworkSize = Math.min(192, drawnCardHeight * 0.34);
  const cardFlip = useRef(new Animated.Value(0)).current;
  const scoreReveal = useRef(new Animated.Value(0)).current;
  const optimisticLaneCardsRef = useRef<Record<string, Card[]>>({});
  const pendingPlacementRef = useRef<{ actingPlayerId: string; card: Card; slotIdx: number } | null>(null);
  const lastObservedMoveIdRef = useRef<number | null>(null);
  const acceptedStealCardIdRef = useRef<string | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    mode,
    players: [],
    currentPlayerIndex: 0,
    drawnCard: null,
    deck: [],
    discardPile: [],
    phase: 'LOBBY',
    targetScore,
    guessHistory: [],
  });

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedSlotResult, setSelectedSlotResult] = useState<'success' | 'failure' | null>(null);
  const [shakeCard, setShakeCard] = useState(false);
  const [isLaneSheetOpen, setIsLaneSheetOpen] = useState(false);
  const [isDrawnCardFlipped, setIsDrawnCardFlipped] = useState(false);
  const [lastInsertedCardId, setLastInsertedCardId] = useState<string | null>(null);
  const [isServerTurnReady, setIsServerTurnReady] = useState(!gameId);
  const [isAwaitingTurnFinish, setIsAwaitingTurnFinish] = useState(false);
  const laneNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [serverCurrentPlayerId, setServerCurrentPlayerId] = useState<number | null>(null);
  const toLocalCard = (card: ApiCard): Card => ({
    id: String(card.id),
    titleEn: card.title,
    titleBs: card.title,
    descriptionEn: card.subtitle ?? undefined,
    descriptionBs: card.subtitle ?? undefined,
    index: Number(card.score),
    illustrationType: 'general_misery',
  });

  useEffect(() => {
    cardFlip.setValue(0);
    scoreReveal.setValue(0);
    setIsDrawnCardFlipped(false);
  }, [cardFlip, gameState.drawnCard?.id, scoreReveal]);

  useFocusEffect(
    useCallback(() => {
      const canReveal = laneResult === null && ['CORRECT_REVEAL', 'WRONG_REVEAL'].includes(gameState.phase);
      if (!canReveal) return;
      scoreReveal.setValue(0);
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(scoreReveal, {
          duration: 900,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }, [gameState.drawnCard?.id, gameState.phase, laneResult, scoreReveal])
  );

  useEffect(() => {
    if (laneResult !== null) return;
    const pending = pendingPlacementRef.current;
    if (!pending) return;

    pendingPlacementRef.current = null;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const optimisticCards = optimisticLaneCardsRef.current[pending.actingPlayerId] ?? [];
    if (!optimisticCards.some((card) => card.id === pending.card.id)) {
      optimisticLaneCardsRef.current[pending.actingPlayerId] = [...optimisticCards, pending.card];
    }
    setLastInsertedCardId(pending.card.id);
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((player) => {
        if (player.id !== pending.actingPlayerId || player.lane.some((card) => card.id === pending.card.id)) return player;
        const lane = [...player.lane];
        lane.splice(pending.slotIdx, 0, pending.card);
        return { ...player, lane, score: lane.length };
      }),
    }));
  }, [laneResult]);

  useEffect(() => {
    if (laneResult !== null || selectedSlotIndex === null || selectedSlotResult === null) return;
    const timer = setTimeout(() => {
      setSelectedSlotIndex(null);
      setSelectedSlotResult(null);
    }, 2050);
    return () => clearTimeout(timer);
  }, [laneResult, selectedSlotIndex, selectedSlotResult]);

  const flipDrawnCard = () => {
    if (isDrawnCardFlipped) return;
    if (
      gameId &&
      (!isServerTurnReady ||
        isAwaitingTurnFinish ||
        Number(serverCurrentPlayerId) !== Number(userId))
    ) return;
    setIsDrawnCardFlipped(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(cardFlip, {
      toValue: 1,
      duration: 560,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      if (laneNavigationTimerRef.current) clearTimeout(laneNavigationTimerRef.current);
      laneNavigationTimerRef.current = setTimeout(() => {
        router.navigate('/game/lane');
      }, 500);
    });
  };

  useEffect(() => () => {
    if (laneNavigationTimerRef.current) clearTimeout(laneNavigationTimerRef.current);
  }, []);

  useEffect(() => {
    const deckPool = CARD_DECK.filter((card) => {
      if (deckType === 'SPICY') return card.isSpicy || card.index >= 30;
      return !card.isSpicy;
    });
    const shuffledDeck = [...deckPool].sort(() => Math.random() - 0.5);

    const colors = [
      'border-yellow-400 bg-yellow-400/5 text-yellow-400',
      'border-blue-400 bg-blue-400/5 text-blue-400',
      'border-emerald-400 bg-emerald-400/5 text-emerald-400',
      'border-purple-400 bg-purple-400/5 text-purple-400',
    ];

    const playersList: Player[] = [];

    if (mode === 'SOLO') {
      const startingLane = shuffledDeck.splice(0, 3).sort((a, b) => a.index - b.index);
      playersList.push({
        id: 'solo-player',
        name: isBs ? 'Igrač' : 'Player',
        lane: startingLane,
        color: colors[0],
        lives: 3,
        score: 3,
      });
    } else {
      initialPlayers.forEach((p, idx) => {
        const startingLane = shuffledDeck.splice(0, 3).sort((a, b) => a.index - b.index);
        playersList.push({
          id: String(p.id ?? `player-${idx}`),
          name: p.name.trim() || `${isBs ? 'Igrač' : 'Player'} ${idx + 1}`,
          lane: startingLane,
          color: p.color,
          isBot: p.isBot,
          score: 3,
        });
      });
    }

    const firstDraw = shuffledDeck.pop() || null;

    setGameState({
      mode,
      players: playersList,
      currentPlayerIndex: 0,
      drawnCard: firstDraw,
      deck: shuffledDeck,
      discardPile: [],
      phase: 'PLAYING',
      targetScore,
      guessHistory: [],
    });

    if (!muted) playSound('click');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialPlayers, targetScore, deckType]);

  const verifySlotChoice = (lane: Card[], drawnCard: Card, slotIdx: number): boolean => {
    const prevCard = slotIdx > 0 ? lane[slotIdx - 1] : null;
    const nextCard = slotIdx < lane.length ? lane[slotIdx] : null;
    const minVal = prevCard ? prevCard.index : -1;
    const maxVal = nextCard ? nextCard.index : 101;
    return drawnCard.index >= minVal && drawnCard.index <= maxVal;
  };

  const triggerSound = (type: 'correct' | 'wrong' | 'victory' | 'click' | 'steal') => {
    if (!muted) playSound(type);
  };

  const handleSlotSelect = (slotIdx: number) => {
    const { players, currentPlayerIndex, drawnCard, phase, activeStealerIndex } = gameState;
    if (!drawnCard || phase !== 'PLAYING') return;
    if (gameId && (!isServerTurnReady || isAwaitingTurnFinish || Number(serverCurrentPlayerId) !== Number(userId))) return;
    triggerSound('click');
    const actingPlayerIndex = activeStealerIndex !== undefined ? activeStealerIndex : currentPlayerIndex;
    const actingPlayer = players[actingPlayerIndex];
    const isCorrect = verifySlotChoice(actingPlayer.lane, drawnCard, slotIdx);
    setSelectedSlotIndex(slotIdx);
    setSelectedSlotResult(isCorrect ? 'success' : 'failure');
    if (gameId && userId) {
      setIsAwaitingTurnFinish(true);
      api.submitMove(gameId, userId, isCorrect).catch(() => setIsAwaitingTurnFinish(false));
    }

    if (isCorrect) {
      pendingPlacementRef.current = { actingPlayerId: actingPlayer.id, card: drawnCard, slotIdx };
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLaneResultPlayerName(actingPlayer.name);
      setLaneResult('success');
      const historyLog = {
        playerName: actingPlayer.name,
        cardTitle: isBs ? drawnCard.titleBs : drawnCard.titleEn,
        guessIndex: slotIdx,
        correctIndex: slotIdx,
        success: true,
      };
      setGameState((prev) => {
        const checkVictory = actingPlayer.lane.length + 1 >= targetScore;
        return {
          ...prev,
          phase: checkVictory ? 'VICTORY' : 'CORRECT_REVEAL',
          guessHistory: [historyLog, ...prev.guessHistory],
        };
      });
    } else {
      setLaneResultPlayerName(actingPlayer.name);
      setLaneResult('failure');
      triggerSound('wrong');
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 600);
      const historyLog = {
        playerName: actingPlayer.name,
        cardTitle: isBs ? drawnCard.titleBs : drawnCard.titleEn,
        guessIndex: slotIdx,
        correctIndex: -1,
        success: false,
      };
      if (mode === 'SOLO') {
        const updatedPlayers = players.map((p, idx) => {
          if (idx === currentPlayerIndex) {
            const currentLives = p.lives || 0;
            return { ...p, lives: Math.max(0, currentLives - 1) };
          }
          return p;
        });
        const isDead = updatedPlayers[currentPlayerIndex].lives === 0;
        setGameState((prev) => ({
          ...prev,
          players: updatedPlayers,
          phase: isDead ? 'GAME_OVER' : 'WRONG_REVEAL',
          guessHistory: [historyLog, ...prev.guessHistory],
        }));
      } else if (!gameId) {
        const nextStealerIdx = (actingPlayerIndex + 1) % players.length;
        if (nextStealerIdx === currentPlayerIndex) {
          setGameState((prev) => ({ ...prev, phase: 'WRONG_REVEAL', guessHistory: [historyLog, ...prev.guessHistory] }));
        } else {
          setGameState((prev) => ({ ...prev, phase: 'STEAL_DECISION', activeStealerIndex: nextStealerIdx, guessHistory: [historyLog, ...prev.guessHistory] }));
        }
      } else {
        setGameState((prev) => ({ ...prev, phase: 'WRONG_REVEAL', guessHistory: [historyLog, ...prev.guessHistory] }));
      }
    }
  };

  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      const pollStartedAt = Date.now();
      let nextPollDelay = 3000;
      try {
        const game = await api.getGame(gameId);
        const serverPlayerIndex = game.current_player_id === null
          ? 0
          : game.members.findIndex((player) => Number(player.id) === Number(game.current_player_id));
        const safeServerPlayerIndex = serverPlayerIndex >= 0 ? serverPlayerIndex : 0;
        setIsServerTurnReady(true);
        setIsAwaitingTurnFinish(game.awaiting_finish);
        setServerCurrentPlayerId(game.current_player_id);
        nextPollDelay = Math.max(250, Number(game.ingame_polling_interval_ms) || 3000);
        const latestMove = game.moves[0];
        if (lastObservedMoveIdRef.current === null) {
          lastObservedMoveIdRef.current = latestMove?.id ?? 0;
        } else if (latestMove && latestMove.id !== lastObservedMoveIdRef.current) {
          lastObservedMoveIdRef.current = latestMove.id;
          if (Number(latestMove.player_id) !== Number(userId)) {
            if (!muted) playSound(latestMove.correct ? 'correct' : 'wrong');
            setLaneResultPlayerName(latestMove.player.name);
            const wasStolen = latestMove.correct &&
              game.turn_owner_id !== null &&
              Number(latestMove.player_id) !== Number(game.turn_owner_id);
            setLaneResult(wasStolen ? 'steal' : latestMove.correct ? 'success' : 'failure');
          }
        }
        setGameState((prev) => ({
          ...prev,
          currentPlayerIndex: safeServerPlayerIndex,
          activeStealerIndex: game.is_steal_turn ? safeServerPlayerIndex : undefined,
          phase: game.is_steal_turn && !game.awaiting_finish
            ? acceptedStealCardIdRef.current === String(game.current_card?.id) ? 'PLAYING' : 'STEAL_DECISION'
            : game.awaiting_finish ? prev.phase : 'PLAYING',
          drawnCard: game.current_card ? toLocalCard(game.current_card) : prev.drawnCard,
          players: prev.players.map((player) => {
            const hand = game.hands[player.id];
            if (!hand) return player;
            const pendingCardId = pendingPlacementRef.current?.card.id;
            const serverLane = hand.map(toLocalCard).filter((card) => card.id !== pendingCardId);
            const serverCardIds = new Set(serverLane.map((card) => card.id));
            const pendingCards = (optimisticLaneCardsRef.current[player.id] ?? [])
              .filter((card) => !serverCardIds.has(card.id));
            optimisticLaneCardsRef.current[player.id] = pendingCards;
            const lane = [...serverLane, ...pendingCards].sort((a, b) => a.index - b.index);
            return { ...player, lane, score: lane.length };
          }),
          guessHistory: game.moves.map((move) => ({ playerName: move.player.name, cardTitle: move.card?.title ?? '', guessIndex: -1, correctIndex: -1, success: move.correct })),
        }));
      } catch { /* Retry using the default interval. */ }
      const requestDuration = Date.now() - pollStartedAt;
      if (!cancelled) timer = setTimeout(poll, Math.max(0, nextPollDelay - requestDuration));
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [gameId]);

  const handleStealChoice = (accept: boolean) => {
    const { players, currentPlayerIndex, activeStealerIndex, drawnCard } = gameState;
    if (activeStealerIndex === undefined || !drawnCard) return;
    if (accept) {
      triggerSound('steal');
      if (gameId) acceptedStealCardIdRef.current = String(drawnCard.id);
      setGameState((prev) => ({ ...prev, phase: 'PLAYING' }));
    } else {
      triggerSound('click');
      if (gameId && userId) {
        api.passSteal(gameId, userId).catch(() => undefined);
        acceptedStealCardIdRef.current = null;
        return;
      }
      const nextStealerIdx = (activeStealerIndex + 1) % players.length;
      if (nextStealerIdx === currentPlayerIndex) {
        setGameState((prev) => ({ ...prev, phase: 'WRONG_REVEAL', activeStealerIndex: undefined }));
      } else {
        setGameState((prev) => ({ ...prev, activeStealerIndex: nextStealerIdx }));
      }
    }
  };

  const handleProceedNextRound = async () => {
    if (gameId && userId) {
      triggerSound('click');
      try {
        const response = await api.finishTurn(gameId, userId);
        const game = response.game;
        acceptedStealCardIdRef.current = null;
        setIsAwaitingTurnFinish(game.awaiting_finish);
        const nextIndex = gameState.players.findIndex((player) => Number(player.id) === Number(game.current_player_id));
        setGameState((prev) => ({
          ...prev,
          currentPlayerIndex: nextIndex >= 0 ? nextIndex : prev.currentPlayerIndex,
          activeStealerIndex: game.is_steal_turn && nextIndex >= 0 ? nextIndex : undefined,
          drawnCard: game.current_card ? toLocalCard(game.current_card) : prev.drawnCard,
          phase: game.is_steal_turn ? 'STEAL_DECISION' : 'PLAYING',
        }));
      } catch { /* Polling will restore authoritative turn state. */ }
      return;
    }
    const { deck, discardPile, players, currentPlayerIndex, drawnCard } = gameState;
    triggerSound('click');
    const newDiscard = [...discardPile];
    if (drawnCard) newDiscard.push(drawnCard);
    let newDeck = [...deck];
    if (newDeck.length === 0) {
      const deckPool = CARD_DECK.filter((card) => {
        if (deckType === 'SPICY') return card.isSpicy || card.index >= 30;
        return !card.isSpicy;
      });
      newDeck = [...deckPool].sort(() => Math.random() - 0.5);
    }
    const nextCard = newDeck.pop() || null;
    const nextPlayerIndex = mode === 'SOLO' ? 0 : (currentPlayerIndex + 1) % players.length;
    setGameState((prev) => ({
      ...prev,
      deck: newDeck,
      discardPile: newDiscard,
      currentPlayerIndex: nextPlayerIndex,
      drawnCard: nextCard,
      phase: 'PLAYING',
      activeStealerIndex: undefined,
    }));
  };

  const handleRestartGame = () => {
    triggerSound('click');
    const shuffledDeck = [...CARD_DECK].sort(() => Math.random() - 0.5);
    const refreshedPlayers = gameState.players.map((p) => {
      const startingLane = shuffledDeck.splice(0, 3).sort((a, b) => a.index - b.index);
      return { ...p, lane: startingLane, lives: mode === 'SOLO' ? 3 : undefined, score: 3 };
    });
    const firstDraw = shuffledDeck.pop() || null;
    setGameState({
      mode,
      players: refreshedPlayers,
      currentPlayerIndex: 0,
      drawnCard: firstDraw,
      deck: shuffledDeck,
      discardPile: [],
      phase: 'PLAYING',
      targetScore,
      guessHistory: [],
    });
  };

  const handleBack = () => {
    triggerSound('click');
    router.back();
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const runBotTurn = () => {
      const { phase, currentPlayerIndex, activeStealerIndex, players, drawnCard } = gameState;
      if (!drawnCard || players.length === 0) return;
      const currentActorIdx = activeStealerIndex !== undefined ? activeStealerIndex : currentPlayerIndex;
      const currentActor = players[currentActorIdx];
      if (!currentActor || !currentActor.isBot) return;

      if (phase === 'PLAYING') {
        const lane = currentActor.lane;
        let correctSlot = 0;
        for (let i = 0; i <= lane.length; i++) {
          if (verifySlotChoice(lane, drawnCard, i)) {
            correctSlot = i;
            break;
          }
        }
        const isCorrectGuess = Math.random() < 0.7;
        let finalSlot = correctSlot;
        if (!isCorrectGuess) {
          const incorrectSlots: number[] = [];
          for (let i = 0; i <= lane.length; i++) if (i !== correctSlot) incorrectSlots.push(i);
          if (incorrectSlots.length > 0) finalSlot = incorrectSlots[Math.floor(Math.random() * incorrectSlots.length)];
        }
        timeoutId = setTimeout(() => handleSlotSelect(finalSlot), 2200);
      } else if (phase === 'STEAL_DECISION') {
        const acceptSteal = Math.random() < 0.6;
        timeoutId = setTimeout(() => handleStealChoice(acceptSteal), 1800);
      } else if (phase === 'CORRECT_REVEAL' || phase === 'WRONG_REVEAL') {
        timeoutId = setTimeout(() => handleProceedNextRound(), 2800);
      }
    };
    runBotTurn();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayerIndex, gameState.phase, gameState.activeStealerIndex, gameState.drawnCard]);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const activeStealer = gameState.activeStealerIndex !== undefined ? gameState.players[gameState.activeStealerIndex] : null;
  const isStealPhase = gameState.phase === 'STEAL_DECISION';
  const isCorrectPhase = gameState.phase === 'CORRECT_REVEAL';
  const isWrongPhase = gameState.phase === 'WRONG_REVEAL';
  const isVictoryPhase = gameState.phase === 'VICTORY';
  const isGameOverPhase = gameState.phase === 'GAME_OVER';
  const currentActingPlayer = activeStealer || currentPlayer;
  useEffect(() => {
    setGameRuntime({
      canPlaceCard:
        gameState.phase === 'PLAYING' &&
        isDrawnCardFlipped &&
        Boolean(currentActingPlayer) &&
        !currentActingPlayer?.isBot &&
          (!gameId || (isServerTurnReady && !isAwaitingTurnFinish && Number(serverCurrentPlayerId) === Number(userId))),
      canFinishTurn: Boolean(
        gameId &&
        userId &&
        isAwaitingTurnFinish &&
        Number(serverCurrentPlayerId) === Number(userId)
      ),
      currentActingPlayer,
      drawnCard: gameState.drawnCard,
      isDrawnCardFlipped,
      guessHistory: gameState.guessHistory,
      handleSlotSelect,
      handleProceedNextRound,
      lastInsertedCardId,
      laneResult,
      selectedSlotIndex,
      selectedSlotResult,
      phase: gameState.phase,
      players: gameState.players,
    });
  }, [currentActingPlayer, gameId, gameState, isAwaitingTurnFinish, isDrawnCardFlipped, isServerTurnReady, laneResult, lastInsertedCardId, selectedSlotIndex, selectedSlotResult, serverCurrentPlayerId, setGameRuntime, userId]);

  if (gameState.players.length === 0 || !gameState.drawnCard) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Loader2 size={48} color="#fbbf24" className="animate-spin mb-4" />
        <Text className="font-mono text-sm uppercase text-amber-400">Loading game engine...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-[104px] pb-32 space-y-4">
          {mode === 'MULTIPLAYER' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5 py-1">
              <View className="flex-row gap-2.5">
                {gameState.players.map((p, idx) => {
                  const isActiveTurn = idx === gameState.currentPlayerIndex;
                  const isStealing = activeStealer && p.id === activeStealer.id;
                  const latestResult =
                    ['CORRECT_REVEAL', 'WRONG_REVEAL', 'STEAL_DECISION'].includes(gameState.phase) &&
                    gameState.guessHistory[0]?.playerName === p.name
                      ? gameState.guessHistory[0]
                      : null;
                  const playerTabType = latestResult
                    ? latestResult.success
                      ? 'success'
                      : 'danger'
                    : isActiveTurn
                      ? 'primary'
                      : isStealing
                        ? 'third'
                        : 'secondary';
                  return (
                    <ButtonTab
                      key={p.id}
                      category="tab"
                      type={playerTabType}
                      size="auto"
                      glassEffect
                    >
                      <View className="flex-row items-center gap-2">
                        <View
                          className="h-2.5 w-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: getPlayerColorHex(p.color) }}
                        />
                        <Text className="text-xs font-bold text-white">{p.name}</Text>
                        <View className="bg-black/10 px-1.5 py-0.5 rounded">
                          <Text className="text-[10px] font-mono text-white">{p.lane.length} pts</Text>
                        </View>
                      </View>
                    </ButtonTab>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {!isVictoryPhase && !isGameOverPhase && (
            <View className="items-center justify-start w-full" style={{ minHeight: cardAreaHeight, paddingTop: cardTopPadding }}>
              <Pressable
                accessibilityLabel={isCorrectPhase || isWrongPhase ? (isBs ? 'Završi potez' : 'Finish turn') : (isBs ? 'Okreni kartu' : 'Flip card')}
                disabled={
                  (isDrawnCardFlipped && !isCorrectPhase && !isWrongPhase) ||
                  Boolean(gameId && (
                    !isServerTurnReady ||
                    isAwaitingTurnFinish ||
                    Number(serverCurrentPlayerId) !== Number(userId)
                  ))
                }
                onPress={isCorrectPhase || isWrongPhase ? handleProceedNextRound : flipDrawnCard}
                style={{ alignSelf: 'stretch', height: drawnCardHeight, transform: [{ scale: shakeCard ? 0.95 : 1 }] }}
              >
                <Animated.View
                  style={{
                    bottom: 0,
                    height: drawnCardHeight,
                    left: 0,
                    opacity: cardFlip.interpolate({ inputRange: [0, 0.48, 0.52, 1], outputRange: [1, 1, 0, 0] }),
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    transform: [
                      { perspective: 850 },
                      { rotateY: cardFlip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
                    ],
                  }}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      backgroundColor: '#050505',
                      borderColor: '#fbbf24',
                      borderRadius: 16,
                      borderWidth: 6,
                      height: drawnCardHeight,
                      justifyContent: 'center',
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(251,191,36,0.18)', 'rgba(10,10,10,0.98)', 'rgba(251,191,36,0.1)']}
                      style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                    />
                    <View style={{ borderColor: 'rgba(251,191,36,0.55)', borderRadius: 10, borderWidth: 2, bottom: 12, left: 12, position: 'absolute', right: 12, top: 12 }} />
                    <CardLogo />
                    <Text className="absolute bottom-8 font-mono text-[10px] font-black uppercase tracking-[3px] text-amber-400/70">
                      {isBs ? 'DODIRNI ZA OKRETANJE' : 'TAP TO FLIP'}
                    </Text>
                  </View>
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={{
                    bottom: 0,
                    height: drawnCardHeight,
                    left: 0,
                    opacity: cardFlip.interpolate({ inputRange: [0, 0.48, 0.52, 1], outputRange: [0, 0, 1, 1] }),
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    transform: [
                      { perspective: 850 },
                      { rotateY: cardFlip.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] }) },
                    ],
                  }}
                >
                  <View
                    style={{
                      alignItems: 'center',
                      backgroundColor: isWrongPhase
                        ? 'rgba(239,68,68,0.14)'
                        : isCorrectPhase
                          ? 'rgba(16,185,129,0.14)'
                          : '#090909',
                      borderColor: isWrongPhase ? '#ef4444' : isCorrectPhase ? '#10b981' : '#fbbf24',
                      borderRadius: 16,
                      borderWidth: 6,
                      height: drawnCardHeight,
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    <View style={{ borderColor: 'rgba(251,191,36,0.35)', borderRadius: 10, borderWidth: 2, bottom: 12, left: 12, position: 'absolute', right: 12, top: 12 }} />
                    <View className="w-full items-center px-9 pt-9">
                      <Text className="text-center text-2xl font-black uppercase leading-7 tracking-tight text-amber-400">
                        {isBs ? gameState.drawnCard.titleBs : gameState.drawnCard.titleEn}
                      </Text>
                      {(gameState.drawnCard.descriptionBs || gameState.drawnCard.descriptionEn) && (
                        <Text className="mt-2 text-center text-xs leading-5 text-neutral-400" numberOfLines={3}>
                          {isBs ? gameState.drawnCard.descriptionBs : gameState.drawnCard.descriptionEn}
                        </Text>
                      )}
                    </View>
                    <View
                      pointerEvents="none"
                      className="absolute inset-0 items-center justify-center"
                    >
                      <View
                        className="items-center justify-center rounded-full bg-amber-400"
                        style={{ height: dummyArtworkSize, width: dummyArtworkSize }}
                      >
                        <AlertOctagon size={dummyArtworkSize * 0.48} color="#0a0a0a" strokeWidth={1.8} />
                        <Text className="mt-2 font-mono text-[9px] font-black uppercase tracking-[2px] text-neutral-950/70">
                          {isBs ? 'ILUSTRACIJA USKORO' : 'ARTWORK COMING SOON'}
                        </Text>
                      </View>
                    </View>
                    {(isCorrectPhase || isWrongPhase) && !currentActingPlayer.isBot && (
                      <Text className="absolute bottom-[106px] font-mono text-[10px] font-black uppercase tracking-[2px] text-white">
                        {gameId
                          ? isBs ? 'DODIRNI ZA ZAVRŠETAK POTEZA' : 'TAP TO FINISH TURN'
                          : isBs ? 'DODIRNI KARTU ZA NASTAVAK' : 'TAP CARD TO CONTINUE'}
                      </Text>
                    )}
                    <View className="absolute bottom-0 left-0 right-0 items-center">
                      <Text
                        adjustsFontSizeToFit
                        className="mb-1 text-base uppercase tracking-wider text-amber-400"
                        minimumFontScale={0.65}
                        numberOfLines={1}
                        style={{ fontFamily: 'Outfit_900Black', fontWeight: '900', textAlign: 'center', width: 100 }}
                      >
                        {isBs ? 'STOPA BIJEDE' : 'MISERY RATE'}
                      </Text>
                      <LinearGradient
                        colors={['#fbbf24', '#eab308']}
                        style={{
                          alignItems: 'center',
                          height: 70,
                          justifyContent: 'center',
                          padding: 8,
                          width: 100,
                        }}
                      >
                        <Animated.Text
                          className="text-neutral-950"
                          style={{
                            fontFamily: 'JetBrainsMono_700Bold',
                            fontSize: 36,
                            fontWeight: '700',
                            height: 70,
                            lineHeight: 70,
                            opacity: scoreReveal.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0, 0] }),
                            position: 'absolute',
                            textAlign: 'center',
                            textAlignVertical: 'center',
                            transform: [
                              { scale: scoreReveal.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0.82, 0.82] }) },
                              { translateY: 2 },
                            ],
                            width: 100,
                          }}
                        >
                          ??.?
                        </Animated.Text>
                        <Animated.Text
                          className="text-neutral-950"
                          style={{
                            fontFamily: 'JetBrainsMono_700Bold',
                            fontSize: 36,
                            fontWeight: '700',
                            height: 70,
                            lineHeight: 70,
                            opacity: scoreReveal.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0, 1] }),
                            position: 'absolute',
                            textAlign: 'center',
                            textAlignVertical: 'center',
                            transform: [
                              { scale: scoreReveal.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1.18, 1.18, 1] }) },
                              { translateY: scoreReveal.interpolate({ inputRange: [0, 1], outputRange: [9, 2] }) },
                            ],
                            width: 100,
                          }}
                        >
                          {gameState.drawnCard.index.toFixed(1)}
                        </Animated.Text>
                      </LinearGradient>
                    </View>
                  </View>
                </Animated.View>
              </Pressable>
            </View>
          )}
          {isStealPhase && activeStealer && (
            <View className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-5 items-center space-y-4">
              <View className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 items-center justify-center">
                <ShieldAlert size={24} color="#fbbf24" />
              </View>
              <Text className="text-base font-black text-amber-400 uppercase tracking-tight">{isBs ? `MOGUĆNOST KRAĐE` : `STEAL OPPORTUNITY`}</Text>
              <Text className="text-xs text-neutral-400 leading-relaxed text-center">
                {isBs
                  ? `${currentPlayer.name} je pogriješio! ${activeStealer.name}, želiš li pokušati pogoditi gdje ovaj događaj spada na tvojoj traci? Ako pogodiš, kradeš kartu!`
                  : `${currentPlayer.name} guessed wrong! ${activeStealer.name}, would you like to attempt a steal? If correct, you keep the card. If incorrect, you pass.`}
              </Text>
            </View>
          )}

          {isVictoryPhase && (
            <View className="bg-neutral-900/50 border-2 border-amber-400/80 rounded-2xl p-6 items-center space-y-5">
              <LinearGradient colors={['#fcd34d', '#facc15']} className="w-16 h-16 rounded-full items-center justify-center">
                <Trophy size={36} color="#0a0a0a" strokeWidth={2.5} />
              </LinearGradient>
              <Text className="text-xl font-black text-amber-400 uppercase tracking-tight">{isBs ? 'IMAMO POBJEDNIKA!' : 'VICTORY / WE HAVE A CHAMPION!'}</Text>
              <View className="flex-row items-center justify-center gap-1.5">
                <Text className="text-lg font-black uppercase text-white tracking-wider">👑 {currentActingPlayer.name}</Text>
              </View>
              <Text className="text-xs text-neutral-400 leading-relaxed text-center">{isBs ? `Čestitamo! Uspješno ste poredali ${currentActingPlayer.lane.length} kartica u vašoj Traci Bijede i dokazali da najbolje procjenjujete tuđu nesreću!` : `Congratulations! You successfully placed ${currentActingPlayer.lane.length} cards in your Misery Lane and proved you know exactly how miserable life can be!`}</Text>
              <View className="p-4 bg-neutral-950/80 rounded-xl border border-neutral-900 w-full">
                <Text className="text-[9px] text-amber-400/60 font-mono uppercase tracking-widest font-bold mb-2">{isBs ? 'POBJEDNIČKA TRAKA' : 'WINNING LANE'}</Text>
                <ScrollView className="max-h-36" nestedScrollEnabled>
                  {currentActingPlayer.lane.map((card) => (
                    <View key={card.id} className="flex-row items-center justify-between py-1 border-b border-neutral-900">
                      <Text className="font-mono text-amber-400 font-extrabold text-[11px] bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-900">{card.index.toFixed(1)}</Text>
                      <Text className="flex-1 truncate pl-3 text-[11px] font-semibold text-neutral-300">{isBs ? card.titleBs : card.titleEn}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
              <View className="flex-col gap-3 pt-2 w-full">
                <Pressable onPress={handleBack} className="w-full py-3 bg-neutral-900 rounded-xl items-center justify-center border border-neutral-800">
                  <Text className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">{isBs ? 'GLAVNI MENI' : 'MAIN MENU'}</Text>
                </Pressable>
                <GradientButton onPress={handleRestartGame} className="w-full">
                  <Text className="text-black font-black uppercase text-[10px] tracking-wider">{isBs ? 'IGRAJ PONOVO' : 'PLAY AGAIN'}</Text>
                </GradientButton>
              </View>
            </View>
          )}

          {isGameOverPhase && (
            <View className="bg-neutral-900/50 border-2 border-red-500/30 rounded-2xl p-6 items-center space-y-5">
              <View className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full items-center justify-center">
                <AlertOctagon size={32} color="#ef4444" />
              </View>
              <Text className="text-xl font-black text-red-500 uppercase tracking-tight">{isBs ? 'KRAJ IGRE!' : 'GAME OVER!'}</Text>
              <Text className="text-xs text-neutral-400 leading-relaxed text-center">{isBs ? `Izgubili ste sve živote! Uspjeli ste dodati ${currentPlayer.lane.length - 3} novih kartica u vašu Traku Bijede.` : `You ran out of lives! You managed to add ${currentPlayer.lane.length - 3} new cards to your Misery Lane.`}</Text>
              <View className="p-4 bg-neutral-950/80 rounded-xl w-full items-center">
                <Text className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">{isBs ? 'KONAČNI REZULTAT' : 'FINAL SCORE'}</Text>
                <Text className="text-2xl font-black text-amber-400 uppercase tracking-tight mt-1">{currentPlayer.lane.length} CARDS</Text>
              </View>
              <View className="flex-col gap-3 pt-2 w-full">
                <Pressable onPress={handleBack} className="w-full py-3 bg-neutral-900 rounded-xl items-center justify-center border border-neutral-800">
                  <Text className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">{isBs ? 'GLAVNI MENI' : 'MAIN MENU'}</Text>
                </Pressable>
                <GradientButton onPress={handleRestartGame} className="w-full">
                  <Text className="text-black font-black uppercase text-[10px] tracking-wider">{isBs ? 'POKUŠAJ PONOVO' : 'TRY AGAIN'}</Text>
                </GradientButton>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      <Modal visible={isLaneSheetOpen && gameState.phase === 'PLAYING'} transparent animationType="slide" onRequestClose={() => setIsLaneSheetOpen(false)}>
        <View className="flex-1 bg-neutral-950">
          <View
            className="bg-neutral-900 px-5 pb-4 border-b border-neutral-800 flex-row items-center justify-between"
            style={{ paddingTop: 64 }}
          >
            <View>
              <Text className="text-base font-black tracking-widest uppercase text-amber-400">{isBs ? 'TRAKA BIJEDE' : 'MISERY LANE'}</Text>
            </View>
            <Pressable onPress={() => setIsLaneSheetOpen(false)} hitSlop={10} className="p-2.5 rounded-xl bg-neutral-800">
              <X size={20} color="#d4d4d4" />
            </Pressable>
          </View>
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingBottom: 48, paddingTop: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-center text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold mb-6">{isBs ? 'Gdje se ovaj događaj uklapa u tvoju traku?' : 'Where does this fit in your Misery Lane?'}</Text>
            <View className="relative pl-8 pr-1 py-2" style={{ gap: 22 }}>
              <LinearGradient colors={['rgba(251,191,36,0.3)', 'rgba(251,191,36,0.1)', 'rgba(251,191,36,0.3)']} className="absolute left-3 top-0 bottom-0 w-[2px]" />
              {currentActingPlayer.lane.map((card, idx) => (
                <View key={card.id}>
                  <View className="relative flex-row items-center">
                    <View className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-neutral-950 border-2 border-amber-400/40" />
                    <Pressable
                      disabled={currentActingPlayer.isBot}
                      onPress={() => { handleSlotSelect(idx); setIsLaneSheetOpen(false); }}
                      className={`w-full py-2.5 px-3 border border-dashed rounded-xl flex-row items-center justify-between ${currentActingPlayer.isBot ? 'border-neutral-800 bg-neutral-900/10' : 'border-amber-400/20 bg-amber-400/[0.01]'}`}
                    >
                      {currentActingPlayer.isBot ? (
                        <Text className="text-xs uppercase tracking-wider text-neutral-500">{isBs ? `${currentActingPlayer.name} bira slot...` : `${currentActingPlayer.name} is choosing...`}</Text>
                      ) : (
                        <>
                          <Text className="font-extrabold text-amber-400">➕ <Text className="font-sans">{isBs ? 'Ubaci ovdje' : 'Insert Here'}</Text></Text>
                          <Text className="text-[11px] text-neutral-500">
                            {idx === 0
                              ? isBs ? `(manje od ${card.index.toFixed(1)})` : `(less than ${card.index.toFixed(1)})`
                              : isBs ? `između ${currentActingPlayer.lane[idx - 1].index.toFixed(1)} i ${card.index.toFixed(1)}` : `between ${currentActingPlayer.lane[idx - 1].index.toFixed(1)} and ${card.index.toFixed(1)}`}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                  <View className="relative flex-row items-center mt-1">
                    <View className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-amber-400 border border-neutral-950" />
                    <View className="flex-1 flex-row items-center gap-3.5 bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-900">
                      <View className="w-12 h-8 rounded-lg bg-neutral-950 items-center justify-center border border-neutral-900">
                        <Text className="font-mono text-amber-400 font-black text-xs">{card.index.toFixed(1)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-black uppercase tracking-wide text-neutral-200" numberOfLines={2}>{isBs ? card.titleBs : card.titleEn}</Text>
                        {(card.descriptionBs || card.descriptionEn) && <Text className="text-[11px] text-neutral-500" numberOfLines={2}>{isBs ? card.descriptionBs : card.descriptionEn}</Text>}
                      </View>
                      <View className="w-8 h-8 opacity-45 items-center justify-center">
                        <Illustration type={card.illustrationType} className="w-7 h-7" />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <View className="relative flex-row items-center">
                <View className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-neutral-950 border-2 border-amber-400/40" />
                <Pressable
                  disabled={currentActingPlayer.isBot}
                  onPress={() => { handleSlotSelect(currentActingPlayer.lane.length); setIsLaneSheetOpen(false); }}
                  className={`w-full py-2.5 px-3 border border-dashed rounded-xl flex-row items-center justify-between ${currentActingPlayer.isBot ? 'border-neutral-800 bg-neutral-900/10' : 'border-amber-400/20 bg-amber-400/[0.01]'}`}
                >
                  {currentActingPlayer.isBot ? (
                    <Text className="text-xs uppercase tracking-wider text-neutral-500">{isBs ? `${currentActingPlayer.name} bira slot...` : `${currentActingPlayer.name} is choosing...`}</Text>
                  ) : (
                    <>
                      <Text className="font-extrabold text-amber-400">➕ <Text className="font-sans">{isBs ? 'Ubaci ovdje' : 'Insert Here'}</Text></Text>
                      <Text className="text-[11px] text-neutral-500">{isBs ? `(više od ${currentActingPlayer.lane[currentActingPlayer.lane.length - 1].index.toFixed(1)})` : `(greater than ${currentActingPlayer.lane[currentActingPlayer.lane.length - 1].index.toFixed(1)})`}</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <ConfirmModal
        cancelLabel={isBs ? 'PRESKOČI' : 'PASS'}
        confirmLabel={isBs ? 'POKUŠAJ KRAĐU' : 'TRY TO STEAL'}
        onCancel={() => handleStealChoice(false)}
        onConfirm={() => handleStealChoice(true)}
        onRequestClose={() => handleStealChoice(false)}
        visible={Boolean(isStealPhase && activeStealer && !activeStealer.isBot && (!gameId || Number(activeStealer.id) === Number(userId)))}
      >
        <View className="items-center" style={{ gap: 10 }}>
          <ShieldAlert size={38} color="#fbbf24" />
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'MOGUĆNOST KRAĐE' : 'STEAL OPPORTUNITY'}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {isBs
              ? `${activeStealer?.name}, želiš li pokušati pravilno smjestiti kartu i ukrasti je?`
              : `${activeStealer?.name}, do you want to place the card correctly and steal it?`}
          </Text>
        </View>
      </ConfirmModal>

    </View>
  );
}
