import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { AlertOctagon, Crown, Loader2, Medal, Trophy, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Animated, Easing, LayoutAnimation, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Card, Player, Language, GameState, GameMode } from '@/types';
import { CARD_DECK } from '@/data/cards';
import Illustration from './Illustration';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { ButtonTab } from './ButtonTab';
import LottieView from 'lottie-react-native';
import { api, ApiCard, API_BASE_URL } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryConfetti } from './VictoryConfetti';
import { DrawnCardFace } from './DrawnCardFace';

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

function pointsFromLane(lane: Card[]) {
  return Math.max(0, lane.length - 3);
}

function cardsForDeck(deckType: 'NORMAL' | 'SPICY') {
  return CARD_DECK.filter((card) => deckType === 'SPICY' ? card.isSpicy === true : card.isSpicy !== true);
}

function shuffleCards(cards: Card[]) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
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
  const {
    language,
    laneResult,
    setGameRuntime,
    setIsGameCountingDown,
    setLaneResult,
    setLaneResultPlayerName,
    setLobbyEntryFade,
    setLobbyView,
    session,
    setSession,
    setTurnNotices,
  } = useGame();
  const isBs = language === 'bs';
  const { height } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const cardTopOffset = 104 + (mode === 'MULTIPLAYER' ? 52 : 0);
  const cardTopPadding = 12;
  const drawnCardHeight = height - cardTopOffset - cardTopPadding - 105;
  const cardAreaHeight = drawnCardHeight + cardTopPadding;
  const dummyArtworkSize = Math.min(220, drawnCardHeight * 0.39);
  const cardFlip = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;
  const cardPromptFloat = useRef(new Animated.Value(0)).current;
  const finishedScreenOpacity = useRef(new Animated.Value(1)).current;
  const scoreReveal = useRef(new Animated.Value(0)).current;
  const optimisticLaneCardsRef = useRef<Record<string, Card[]>>({});
  const pendingPlacementRef = useRef<{ actingPlayerId: string; card: Card; slotIdx: number } | null>(null);
  const lastObservedMoveIdRef = useRef<number | null>(null);
  const acceptedStealCardIdRef = useRef<string | null>(null);
  const observedTurnRef = useRef<{ actorId: number; cardId: string; isSteal: boolean; announced: boolean } | null>(null);
  const observedTurnOwnerIdRef = useRef<number | null>(null);
  const turnNoticeIdRef = useRef(0);
  const gameFinishedAnnouncedRef = useRef(false);
  const winnerCelebratedRef = useRef(false);
  const finishedExitInProgressRef = useRef(false);
  const consecutivePollFailuresRef = useRef(0);

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
  const [isLaneCollapsing, setIsLaneCollapsing] = useState(false);
  const [connectionWarningVisible, setConnectionWarningVisible] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const [isLaneSheetOpen, setIsLaneSheetOpen] = useState(false);
  const [isDrawnCardFlipped, setIsDrawnCardFlipped] = useState(false);
  const [lastInsertedCardId, setLastInsertedCardId] = useState<string | null>(null);
  const [isServerTurnReady, setIsServerTurnReady] = useState(!gameId);
  const [isAwaitingTurnFinish, setIsAwaitingTurnFinish] = useState(false);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [lastResultCardScore, setLastResultCardScore] = useState<number | null>(null);
  const [revealedScoreCardId, setRevealedScoreCardId] = useState<string | null>(null);
  const laneNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [serverCurrentPlayerId, setServerCurrentPlayerId] = useState<number | null>(null);
  const [serverTurnOwnerId, setServerTurnOwnerId] = useState<number | null>(null);
  const [serverWinnerId, setServerWinnerId] = useState<number | null>(null);
  const [lastStealWasFromLocalPlayer, setLastStealWasFromLocalPlayer] = useState(false);
  const [isTurnInactive, setIsTurnInactive] = useState(false);
  const [inactivityWarningVisible, setInactivityWarningVisible] = useState(false);
  const toLocalCard = (card: ApiCard): Card => ({
    id: String(card.id),
    titleEn: card.title,
    titleBs: card.title,
    descriptionEn: card.subtitle ?? undefined,
    descriptionBs: card.subtitle ?? undefined,
    index: Number(card.score),
    image: card.image && card.image !== '0'
      ? card.image.startsWith('http://') || card.image.startsWith('https://')
        ? card.image
        : card.image.startsWith('/')
          ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${card.image}`
          : `${API_BASE_URL.replace(/\/api\/?$/, '')}/storage/${card.image.replace(/^\/?(?:storage\/)?/, '')}`
      : undefined,
    illustrationType: 'general_misery',
  });

  useEffect(() => {
    cardFlip.setValue(0);
    scoreReveal.setValue(0);
    setIsDrawnCardFlipped(false);
    setRevealedScoreCardId(null);
  }, [cardFlip, gameState.drawnCard?.id, scoreReveal]);

  const isDrawnCardScoreRevealed = Boolean(
    gameState.drawnCard && revealedScoreCardId === gameState.drawnCard.id
  );

  useEffect(() => {
    observedTurnRef.current = null;
    setTurnNotices([]);
  }, [gameId, setTurnNotices]);

  useFocusEffect(
    useCallback(() => {
      const canReveal = laneResult === null && isDrawnCardScoreRevealed;
      if (!canReveal) {
        scoreReveal.stopAnimation();
        scoreReveal.setValue(0);
        return;
      }
      scoreReveal.setValue(0);
      const animation = Animated.sequence([
        Animated.delay(180),
        Animated.timing(scoreReveal, {
          duration: 900,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ]);
      animation.start();
      return () => animation.stop();
    }, [gameState.drawnCard?.id, isDrawnCardScoreRevealed, laneResult, scoreReveal])
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
        return { ...player, lane, score: pointsFromLane(lane) };
      }),
    }));
  }, [laneResult]);

  const flipDrawnCard = () => {
    if (isDrawnCardFlipped && !canReflipWhileStealPending) return;
    if (
      gameId &&
      !canReflipWhileStealPending &&
      (!isServerTurnReady ||
        isAwaitingTurnFinish ||
        Number(serverCurrentPlayerId) !== Number(userId))
    ) return;
    playSound('shuffle');
    const nextFlipped = !isDrawnCardFlipped;
    setIsDrawnCardFlipped(nextFlipped);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(cardFlip, {
      toValue: nextFlipped ? 1 : 0,
      duration: 560,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || canReflipWhileStealPending || !nextFlipped) return;
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
    const shuffledDeck = shuffleCards(cardsForDeck(deckType));

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
        score: 0,
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
          score: 0,
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
    playSound(type);
  };

  const handleSlotSelect = (slotIdx: number) => {
    const { players, currentPlayerIndex, drawnCard, phase, activeStealerIndex } = gameState;
    if (!drawnCard || phase !== 'PLAYING') return;
    if (gameId && (!isServerTurnReady || isAwaitingTurnFinish || Number(serverCurrentPlayerId) !== Number(userId))) return;
    triggerSound('click');
    const actingPlayerIndex = activeStealerIndex !== undefined ? activeStealerIndex : currentPlayerIndex;
    const actingPlayer = players[actingPlayerIndex];
    const isCorrect = verifySlotChoice(actingPlayer.lane, drawnCard, slotIdx);
    setLastResultCardScore(drawnCard.index);
    setRevealedScoreCardId(drawnCard.id);
    setSelectedSlotIndex(slotIdx);
    setSelectedSlotResult(isCorrect ? 'success' : 'failure');
    if (gameId && userId) {
      setIsSubmittingMove(true);
      void api.submitMove(gameId, userId, isCorrect)
        .then(({ game }) => {
          const nextIndex = players.findIndex((player) => Number(player.id) === Number(game.current_player_id));
          setServerCurrentPlayerId(game.current_player_id);
          setServerTurnOwnerId(game.turn_owner_id);
          setServerWinnerId(game.winner_id);
          setIsAwaitingTurnFinish(game.awaiting_finish);
          if (!isCorrect) acceptedStealCardIdRef.current = null;
          setGameState((prev) => ({
            ...prev,
            currentPlayerIndex: nextIndex >= 0 ? nextIndex : prev.currentPlayerIndex,
            activeStealerIndex: game.is_steal_turn && nextIndex >= 0 ? nextIndex : undefined,
            drawnCard: game.current_card ? toLocalCard(game.current_card) : prev.drawnCard,
            phase: game.winner_id
              ? 'VICTORY'
              : isCorrect
              ? prev.phase
              : game.is_steal_turn
                ? 'STEAL_DECISION'
                : 'PLAYING',
          }));
        })
        .catch(() => setIsAwaitingTurnFinish(false))
        .finally(() => setIsSubmittingMove(false));
    }

    if (isCorrect) {
      pendingPlacementRef.current = { actingPlayerId: actingPlayer.id, card: drawnCard, slotIdx };
      setLaneResultPlayerName(actingPlayer.name);
      const wasStealAttempt = activeStealerIndex !== undefined;
      setLastStealWasFromLocalPlayer(false);
      setLaneResult(wasStealAttempt ? 'steal' : 'success');
      const historyLog = {
        playerName: actingPlayer.name,
        cardTitle: isBs ? drawnCard.titleBs : drawnCard.titleEn,
        cardScore: drawnCard.index,
        guessIndex: slotIdx,
        correctIndex: slotIdx,
        success: true,
      };
      setGameState((prev) => {
        const checkVictory = pointsFromLane([...actingPlayer.lane, drawnCard]) >= targetScore;
        return {
          ...prev,
          phase: checkVictory ? 'VICTORY' : 'CORRECT_REVEAL',
          guessHistory: [historyLog, ...prev.guessHistory],
        };
      });
    } else {
      setLaneResultPlayerName(actingPlayer.name);
      setLaneResult('failure');
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 600);
      const historyLog = {
        playerName: actingPlayer.name,
        cardTitle: isBs ? drawnCard.titleBs : drawnCard.titleEn,
        cardScore: drawnCard.index,
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
      const pollController = new AbortController();
      const pollTimeout = setTimeout(() => pollController.abort(), 8000);
      try {
        const game = await api.getGame(gameId, pollController.signal);
        consecutivePollFailuresRef.current = 0;
        setConnectionWarningVisible(false);
        const serverPlayerIndex = game.current_player_id === null
          ? 0
          : game.members.findIndex((player) => Number(player.id) === Number(game.current_player_id));
        const safeServerPlayerIndex = serverPlayerIndex >= 0 ? serverPlayerIndex : 0;
        setIsServerTurnReady(true);
        setIsAwaitingTurnFinish(game.awaiting_finish);
        setServerCurrentPlayerId(game.current_player_id);
        setServerTurnOwnerId(game.turn_owner_id);
        setServerWinnerId(game.winner_id);
        nextPollDelay = Math.max(250, Number(game.ingame_polling_interval_ms) || 3000);
        const latestMove = game.moves[0];
        if (lastObservedMoveIdRef.current === null) {
          lastObservedMoveIdRef.current = latestMove?.id ?? 0;
        } else if (latestMove && latestMove.id !== lastObservedMoveIdRef.current) {
          lastObservedMoveIdRef.current = latestMove.id;
          if (Number(latestMove.player_id) !== Number(userId)) {
            setLaneResultPlayerName(latestMove.player.name);
            setLastResultCardScore(latestMove.card ? Number(latestMove.card.score) : null);
            if (latestMove.card) setRevealedScoreCardId(String(latestMove.card.id));
            const wasStolen = latestMove.correct &&
              game.turn_owner_id !== null &&
              Number(latestMove.player_id) !== Number(game.turn_owner_id);
            setLastStealWasFromLocalPlayer(
              Boolean(wasStolen && Number(game.turn_owner_id) === Number(userId)),
            );
            setLaneResult(wasStolen ? 'steal' : latestMove.correct ? 'success' : 'failure');
          }
        }
        setGameState((prev) => ({
          ...prev,
          currentPlayerIndex: safeServerPlayerIndex,
          activeStealerIndex: game.is_steal_turn ? safeServerPlayerIndex : undefined,
          phase: game.winner_id
            ? 'VICTORY'
            : game.is_steal_turn && !game.awaiting_finish
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
            return { ...player, lane, score: pointsFromLane(lane) };
          }),
          guessHistory: game.moves.map((move) => ({
            playerName: move.player.name,
            cardTitle: move.card?.title ?? '',
            cardScore: move.card ? Number(move.card.score) : undefined,
            guessIndex: -1,
            correctIndex: -1,
            success: move.correct,
          })),
        }));
      } catch (error) {
        consecutivePollFailuresRef.current += 1;
        const timedOut = error instanceof Error && error.name === 'AbortError';
        if (timedOut || consecutivePollFailuresRef.current >= 2) {
          setConnectionWarningVisible(true);
        }
      } finally {
        clearTimeout(pollTimeout);
      }
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
      setRevealedScoreCardId(null);
      scoreReveal.stopAnimation();
      scoreReveal.setValue(0);
      if (gameId) {
        acceptedStealCardIdRef.current = String(drawnCard.id);
        if (observedTurnRef.current) observedTurnRef.current.announced = true;
        setTurnNotices((current) => [...current, {
          id: ++turnNoticeIdRef.current,
          type: 'start',
          steal: true,
        }]);
      }
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
        setServerCurrentPlayerId(game.current_player_id);
        setServerTurnOwnerId(game.turn_owner_id);
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
      newDeck = shuffleCards(cardsForDeck(deckType));
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

  const leaveFinishedGame = (destination: 'WELCOME' | 'SETUP' | 'ROOM_CREATED' | 'ROOM_JOINED') => {
    if (finishedExitInProgressRef.current) return;
    finishedExitInProgressRef.current = true;
    Animated.timing(finishedScreenOpacity, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
      toValue: 0,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        finishedExitInProgressRef.current = false;
        return;
      }
      setLobbyEntryFade(true);
      setTurnNotices([]);
      setLaneResult(null);
      setLaneResultPlayerName(null);
      setGameRuntime(null);
      setIsGameCountingDown(false);
      if (destination === 'WELCOME' || destination === 'SETUP') setSession(null);
      setLobbyView(destination);
      router.replace('/');
    });
  };

  const handleLaneResultFadeComplete = () => {
    if (isLaneCollapsing || selectedSlotResult === null) return;
    setIsLaneCollapsing(true);
    LayoutAnimation.configureNext(
      {
        duration: 420,
        create: { property: LayoutAnimation.Properties.opacity, type: LayoutAnimation.Types.easeInEaseOut },
        delete: { property: LayoutAnimation.Properties.opacity, type: LayoutAnimation.Types.easeInEaseOut },
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      },
      () => {
        setIsLaneCollapsing(false);
        if (isAwaitingTurnFinish) void handleProceedNextRound();
      }
    );
    setSelectedSlotIndex(null);
    setSelectedSlotResult(null);
  };

  const handleRestartGame = () => {
    if (mode !== 'MULTIPLAYER' || !gameId || !userId) {
      leaveFinishedGame('WELCOME');
      return;
    }
    const roomOwnerId = session?.ownerId ?? initialPlayers[0]?.id;
    if (Number(roomOwnerId) === Number(userId)) {
      void api.setHostLobbyPresence(gameId, userId, true).catch(() => undefined);
    }
    leaveFinishedGame(Number(roomOwnerId) === Number(userId) ? 'ROOM_CREATED' : 'ROOM_JOINED');
  };
  const handleBack = () => leaveFinishedGame('SETUP');

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
  const localPlayer = gameId && userId
    ? gameState.players.find((player) => Number(player.id) === Number(userId)) ?? gameState.players[0]
    : gameState.players.find((player) => !player.isBot) ?? gameState.players[0];
  const leaderboard = [...gameState.players].sort((a, b) => {
    const scoreDifference = pointsFromLane(b.lane) - pointsFromLane(a.lane);
    if (scoreDifference !== 0) return scoreDifference;
    if (a.id === currentActingPlayer?.id) return -1;
    if (b.id === currentActingPlayer?.id) return 1;
    return a.name.localeCompare(b.name);
  });
  const podiumPlayers = leaderboard.slice(0, 3);
  const podiumOrder = podiumPlayers.length === 3 ? [1, 0, 2] : podiumPlayers.map((_, index) => index).reverse();
  const isLocalServerTurn = Boolean(
    gameId && userId && Number(serverCurrentPlayerId) === Number(userId)
  );
  const didLocalWin = Boolean(
    isVictoryPhase && (!gameId || (userId && Number(serverWinnerId) === Number(userId)))
  );
  const canFlipCard = Boolean(
    !isDrawnCardFlipped &&
    gameState.phase === 'PLAYING' &&
    (!gameId || (
      isServerTurnReady &&
      !isAwaitingTurnFinish &&
      !isSubmittingMove &&
      isLocalServerTurn
    ))
  );
  const shouldFloatDrawnCard = canFlipCard || isDrawnCardFlipped;
  const isLocalStealAttempt = Boolean(gameId && isLocalServerTurn && activeStealer);
  const isOtherPlayerStealingMyCard = Boolean(
    gameId &&
    userId &&
    activeStealer &&
    !isLocalServerTurn &&
    Number(serverTurnOwnerId) === Number(userId)
  );
  const canReflipWhileStealPending = Boolean(
    isOtherPlayerStealingMyCard &&
    activeStealer &&
    !isAwaitingTurnFinish &&
    gameState.phase !== 'VICTORY'
  );
  const shouldWatchLocalInactivity = Boolean(
    gameId &&
    userId &&
    isServerTurnReady &&
    isLocalServerTurn &&
    !isAwaitingTurnFinish &&
    !isSubmittingMove &&
    gameState.phase === 'PLAYING'
  );

  useEffect(() => {
    setIsTurnInactive(false);
    setInactivityWarningVisible(false);
    if (!shouldWatchLocalInactivity) return;

    const timer = setTimeout(() => {
      setIsTurnInactive(true);
      setInactivityWarningVisible(true);
      playSound('bell');
    }, 10_000);

    return () => {
      clearTimeout(timer);
    };
  }, [
    gameState.drawnCard?.id,
    gameState.phase,
    isDrawnCardFlipped,
    isLocalServerTurn,
    isServerTurnReady,
    isSubmittingMove,
    isAwaitingTurnFinish,
    serverCurrentPlayerId,
    shouldWatchLocalInactivity,
  ]);

  const faceDownPrompt = gameId && !isLocalServerTurn
    ? !isAwaitingTurnFinish && currentActingPlayer?.name
      ? activeStealer
        ? isBs
          ? isOtherPlayerStealingMyCard
            ? `${currentActingPlayer.name} POKUŠAVA UKRASTI TVOJU KARTU`
            : `${currentActingPlayer.name} POKUŠAVA UKRASTI KARTU`
          : isOtherPlayerStealingMyCard
            ? `${currentActingPlayer.name} IS TRYING TO STEAL YOUR CARD`
            : `${currentActingPlayer.name} IS TRYING TO STEAL A CARD`
        : isBs ? `${currentActingPlayer.name} IGRA` : `${currentActingPlayer.name} IS PLAYING`
      : isBs ? 'ČEKANJE SLJEDEĆEG POTEZA' : 'WAITING FOR THE NEXT TURN'
    : isLocalStealAttempt
      ? isBs ? 'DODIRNI ZA OKRETANJE I POKUŠAJ KRAĐU' : 'TAP TO FLIP TO TRY TO STEAL'
      : isBs ? 'DODIRNI ZA OKRETANJE' : 'TAP TO FLIP';

  useEffect(() => {
    if (!shouldFloatDrawnCard) {
      cardFloat.stopAnimation();
      cardFloat.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          toValue: -5,
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [cardFloat, shouldFloatDrawnCard]);

  useEffect(() => {
    if (isVictoryPhase || isGameOverPhase) {
      cardPromptFloat.stopAnimation();
      cardPromptFloat.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cardPromptFloat, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          toValue: -3,
          useNativeDriver: true,
        }),
        Animated.timing(cardPromptFloat, {
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [cardPromptFloat, isGameOverPhase, isVictoryPhase]);

  useEffect(() => {
    if (!gameId || !userId || !isServerTurnReady || !gameState.drawnCard || !serverCurrentPlayerId) return;
    const currentTurn = {
      actorId: Number(serverCurrentPlayerId),
      cardId: String(gameState.drawnCard.id),
      isSteal: Boolean(activeStealer),
      announced: false,
    };
    const previousTurn = observedTurnRef.current;
    const currentIsMine = currentTurn.actorId === Number(userId);

    if (!previousTurn) {
      observedTurnRef.current = currentTurn;
      if (currentIsMine && !currentTurn.isSteal) {
        currentTurn.announced = true;
        setTurnNotices((current) => [...current, {
          id: ++turnNoticeIdRef.current,
          type: 'start',
          steal: currentTurn.isSteal,
        }]);
      }
      return;
    }

    const changed = previousTurn.actorId !== currentTurn.actorId ||
      previousTurn.cardId !== currentTurn.cardId ||
      previousTurn.isSteal !== currentTurn.isSteal;
    if (!changed) return;

    observedTurnRef.current = currentTurn;
    const previousWasMine = previousTurn.actorId === Number(userId);
    const nextActorName = gameState.players.find((player) => Number(player.id) === currentTurn.actorId)?.name;
    setTurnNotices((current) => {
      const next = [...current];
      if (previousWasMine && previousTurn.announced && !previousTurn.isSteal && currentTurn.isSteal) next.push({
        id: ++turnNoticeIdRef.current,
        type: 'hold',
        steal: true,
        playerName: nextActorName,
      });
      if (currentIsMine && !currentTurn.isSteal) {
        currentTurn.announced = true;
        next.push({ id: ++turnNoticeIdRef.current, type: 'start' });
      }
      return next;
    });
  }, [activeStealer, gameId, gameState.drawnCard, isServerTurnReady, serverCurrentPlayerId, setTurnNotices, userId]);

  useEffect(() => {
    if (!gameId || !userId || serverTurnOwnerId === null) return;
    const previousOwnerId = observedTurnOwnerIdRef.current;
    observedTurnOwnerIdRef.current = Number(serverTurnOwnerId);
    if (previousOwnerId === null) return;
    if (previousOwnerId === Number(userId) && Number(serverTurnOwnerId) !== Number(userId)) {
      setTurnNotices((current) => [...current.filter((notice) => notice.type !== 'hold'), {
        id: ++turnNoticeIdRef.current,
        type: 'end',
      }]);
    }
  }, [gameId, serverTurnOwnerId, setTurnNotices, userId]);

  useEffect(() => {
    setGameRuntime({
      canPlaceCard:
        gameState.phase === 'PLAYING' &&
        isDrawnCardFlipped &&
        Boolean(currentActingPlayer) &&
        !currentActingPlayer?.isBot &&
          (!gameId || (isServerTurnReady && !isAwaitingTurnFinish && !isSubmittingMove && Number(serverCurrentPlayerId) === Number(userId))),
      canFinishTurn: Boolean(
        gameId &&
        userId &&
        isAwaitingTurnFinish &&
        Number(serverCurrentPlayerId) === Number(userId)
      ),
      currentActingPlayer,
      localPlayer,
      drawnCard: gameState.drawnCard,
      isDrawnCardFlipped,
      isDrawnCardScoreRevealed,
      guessHistory: gameState.guessHistory,
      handleSlotSelect,
      handleProceedNextRound,
      handleStealChoice,
      leaveFinishedGame,
      lastInsertedCardId,
      lastResultCardScore,
      lastStealWasFromLocalPlayer,
      handleLaneResultFadeComplete,
      hasPendingLaneAnimation: selectedSlotResult !== null || isLaneCollapsing,
      inactivityWarningVisible,
      connectionWarningVisible,
      isTurnInactive,
      dismissInactivityWarning: () => setInactivityWarningVisible(false),
      laneResult,
      selectedSlotIndex,
      selectedSlotResult,
      phase: gameState.phase,
      players: gameState.players,
      activeStealer,
      stealDecisionVisible: Boolean(
        laneResult === null &&
        isStealPhase &&
        activeStealer &&
        !activeStealer.isBot &&
        (!gameId || Number(activeStealer.id) === Number(userId))
      ),
    });
  }, [connectionWarningVisible, currentActingPlayer, gameId, gameState, inactivityWarningVisible, isAwaitingTurnFinish, isDrawnCardFlipped, isDrawnCardScoreRevealed, isServerTurnReady, isSubmittingMove, isTurnInactive, laneResult, lastInsertedCardId, lastResultCardScore, lastStealWasFromLocalPlayer, localPlayer, selectedSlotIndex, selectedSlotResult, serverCurrentPlayerId, setGameRuntime, userId]);

  useEffect(() => {
    if (!didLocalWin || winnerCelebratedRef.current) return;
    winnerCelebratedRef.current = true;
    playSound('applause');
  }, [didLocalWin]);

  useEffect(() => {
    const finished = gameState.phase === 'VICTORY' || gameState.phase === 'GAME_OVER';
    if (!finished || gameFinishedAnnouncedRef.current) return;
    gameFinishedAnnouncedRef.current = true;
    setTurnNotices([{
      id: ++turnNoticeIdRef.current,
      type: 'finish',
    }]);
    router.navigate('/game');
  }, [gameState.phase, setTurnNotices]);

  if (gameState.players.length === 0 || !gameState.drawnCard) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Loader2 size={48} color="#fbbf24" className="animate-spin mb-4" />
        <Text className="font-mono text-sm uppercase text-amber-400">Loading game engine...</Text>
      </View>
    );
  }

  return (
    <Animated.View className="flex-1 bg-neutral-950" style={{ opacity: finishedScreenOpacity }}>
      <VictoryConfetti visible={didLocalWin} />
      {(isVictoryPhase || isGameOverPhase) && (
        <LinearGradient
          colors={isVictoryPhase
            ? ['#2b2205', '#12100a', '#050505']
            : ['#260909', '#130909', '#050505']}
          locations={[0, 0.48, 1]}
          style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
        />
      )}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View
          className="px-5 space-y-4"
          style={{
            paddingBottom: isVictoryPhase || isGameOverPhase ? 132 + safeAreaInsets.bottom : 128,
            paddingTop: isVictoryPhase || isGameOverPhase ? 118 : 104,
          }}
        >
          {mode === 'MULTIPLAYER' && !isVictoryPhase && !isGameOverPhase && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-5 px-5 py-1"
              style={{ transform: [{ translateY: -3 }] }}
            >
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
                          <Text className="text-[10px] font-mono text-white">{pointsFromLane(p.lane)} pts</Text>
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
                accessibilityLabel={isCorrectPhase || isWrongPhase
                  ? (isBs ? 'Završi potez' : 'Finish turn')
                  : canReflipWhileStealPending
                    ? isDrawnCardFlipped
                      ? (isBs ? 'Okreni kartu licem prema dolje' : 'Flip card face down')
                      : (isBs ? 'Ponovo otkrij kartu' : 'Reveal card again')
                    : faceDownPrompt}
                disabled={!isCorrectPhase && !isWrongPhase && !canFlipCard && !canReflipWhileStealPending}
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
                      { translateY: cardFloat },
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
                    <Animated.Text
                      adjustsFontSizeToFit
                      className="absolute bottom-8 left-6 right-6 text-center font-mono text-[10px] font-black uppercase tracking-[3px] text-amber-400/70"
                      minimumFontScale={0.7}
                      numberOfLines={1}
                      style={{ transform: [{ translateY: cardPromptFloat }] }}
                    >
                      {faceDownPrompt}
                    </Animated.Text>
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
                      { translateY: cardFloat },
                      { rotateY: cardFlip.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] }) },
                    ],
                  }}
                >
                  <DrawnCardFace
                    artworkSize={dummyArtworkSize}
                    card={gameState.drawnCard}
                    height={drawnCardHeight}
                    isOnline={Boolean(gameId)}
                    language={language}
                    promptFloat={cardPromptFloat}
                    result={isWrongPhase ? 'wrong' : isCorrectPhase ? 'correct' : 'neutral'}
                    scoreReveal={scoreReveal}
                    showFinishPrompt={(isCorrectPhase || isWrongPhase) && !currentActingPlayer.isBot}
                  />
                </Animated.View>
              </Pressable>
            </View>
          )}
          {isVictoryPhase && (
            <View className="w-full items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full border border-amber-200/50 bg-amber-400 shadow-lg">
                <Trophy size={34} color="#0a0a0a" strokeWidth={2.7} />
              </View>
              <Text className="mt-4 text-center font-mono text-[10px] font-black uppercase tracking-[4px] text-amber-300">
                {isBs ? 'KONAČNI POREDAK' : 'FINAL STANDINGS'}
              </Text>
              <Text className="mt-1 text-center text-3xl font-black uppercase tracking-tight text-white">
                {isBs ? 'IMAMO POBJEDNIKA!' : 'WE HAVE A CHAMPION!'}
              </Text>
              <Text className="mt-2 max-w-[290px] text-center text-xs leading-5 text-neutral-400">
                {isBs ? 'Traka bijede je završena. Pogledajte konačni poredak.' : 'The Misery Lane is complete. Here are the final rankings.'}
              </Text>

              <View className="mt-8 w-full flex-row items-end justify-center" style={{ gap: 8 }}>
                  {podiumOrder.map((playerIndex) => {
                    const player = podiumPlayers[playerIndex];
                    const rank = playerIndex + 1;
                    const isWinner = rank === 1;
                    const podiumHeight = rank === 1 ? 118 : rank === 2 ? 90 : 76;
                    const medalColor = rank === 1 ? '#facc15' : rank === 2 ? '#d4d4d4' : '#d97706';
                    return (
                      <View key={player.id} className="flex-1 items-center">
                        {isWinner ? <Crown size={24} color="#facc15" fill="#facc15" style={{ marginBottom: 5 }} /> : <View style={{ height: 29 }} />}
                        <View
                          className="mb-2 h-12 w-12 items-center justify-center rounded-full border-2 bg-neutral-950/80"
                          style={{ borderColor: medalColor }}
                        >
                          <View className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: getPlayerColorHex(player.color) }} />
                        </View>
                        <Text className="mb-2 max-w-full text-center text-xs font-black text-white" numberOfLines={1}>{player.name}</Text>
                        <View
                          className="w-full items-center rounded-t-2xl border border-white/10 pt-3"
                          style={{ backgroundColor: isWinner ? '#facc15' : 'rgba(38,38,38,0.86)', height: podiumHeight }}
                        >
                          <Text style={{ color: isWinner ? '#0a0a0a' : medalColor, fontFamily: 'BebasNeue_400Regular', fontSize: 34, lineHeight: 38 }}>{rank}</Text>
                          <Text className={`mt-1 font-mono text-[10px] font-black uppercase ${isWinner ? 'text-neutral-950/70' : 'text-neutral-400'}`}>
                            {pointsFromLane(player.lane)} PTS
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>

              <View className="mt-8 w-full flex-row items-center" style={{ gap: 12 }}>
                <View className="h-px flex-1 bg-amber-400/30" />
                <Text className="font-mono text-[9px] font-black uppercase tracking-[3px] text-amber-200/70">
                  {isBs ? 'REZULTATI' : 'LEADERBOARD'}
                </Text>
                <View className="h-px flex-1 bg-amber-400/30" />
              </View>

              <View className="mt-2 w-full">
                  {leaderboard.map((player, index) => {
                    const isWinner = index === 0;
                    const isLocal = player.id === localPlayer?.id;
                    const rankColor = index === 0 ? '#facc15' : index === 1 ? '#d4d4d4' : index === 2 ? '#d97706' : '#737373';
                    return (
                      <View
                        key={player.id}
                        className="relative flex-row items-center border-b border-white/10 py-4"
                      >
                        <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl border" style={{ borderColor: `${rankColor}70`, backgroundColor: `${rankColor}12` }}>
                          <Text style={{ color: rankColor, fontFamily: 'BebasNeue_400Regular', fontSize: 29, lineHeight: 32 }}>{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center" style={{ gap: 7 }}>
                            <View className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: getPlayerColorHex(player.color) }} />
                            <Text className="flex-shrink text-sm font-black uppercase tracking-wide text-neutral-100" numberOfLines={1}>{player.name}</Text>
                            {isLocal && <Text className="font-mono text-[8px] font-black uppercase tracking-wider text-amber-400">{isBs ? 'TI' : 'YOU'}</Text>}
                          </View>
                          <Text className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[2px] text-neutral-500">
                            {isWinner ? (isBs ? 'POBJEDNIK' : 'CHAMPION') : isBs ? `MJESTO ${index + 1}` : `RANK ${index + 1}`}
                          </Text>
                        </View>
                        {index < 3 && <Medal color={rankColor} size={18} strokeWidth={2.2} style={{ marginRight: 10 }} />}
                        <Text style={{ color: isWinner ? '#facc15' : '#ffffff', fontFamily: 'BebasNeue_400Regular', fontSize: 27, lineHeight: 31 }}>{pointsFromLane(player.lane)}</Text>
                        <Text className="ml-1 font-mono text-[8px] font-black uppercase text-neutral-500">PTS</Text>
                      </View>
                    );
                  })}
              </View>

            </View>
          )}

          {isGameOverPhase && (
            <View className="w-full items-center space-y-5">
              <View className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full items-center justify-center">
                <AlertOctagon size={32} color="#ef4444" />
              </View>
              <Text className="text-xl font-black text-red-500 uppercase tracking-tight">{isBs ? 'KRAJ IGRE!' : 'GAME OVER!'}</Text>
              <Text className="max-w-[300px] text-xs text-neutral-400 leading-relaxed text-center">{isBs ? `Izgubili ste sve živote! Uspjeli ste dodati ${currentPlayer.lane.length - 3} novih kartica u vašu Traku Bijede.` : `You ran out of lives! You managed to add ${currentPlayer.lane.length - 3} new cards to your Misery Lane.`}</Text>
              <View className="w-full items-center border-y border-red-500/20 py-5">
                <Text className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">{isBs ? 'KONAČNI REZULTAT' : 'FINAL SCORE'}</Text>
                <View className="mt-1 flex-row items-end">
                  <Text style={{ color: '#facc15', fontFamily: 'BebasNeue_400Regular', fontSize: 52, lineHeight: 56 }}>{pointsFromLane(currentPlayer.lane)}</Text>
                  <Text className="mb-2 ml-2 font-mono text-[9px] font-black uppercase tracking-widest text-neutral-500">PTS</Text>
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {(isVictoryPhase || isGameOverPhase) && (
        <View
          className="absolute bottom-0 left-0 right-0 flex-row border-t border-neutral-800 bg-black px-5 pt-4"
          style={{ gap: 12, paddingBottom: Math.max(safeAreaInsets.bottom, 16), zIndex: 30 }}
        >
          <View className="flex-1">
            <ButtonTab category="button" type="primary" size="100" onPress={handleRestartGame}>
              {isBs ? (isGameOverPhase ? 'POKUŠAJ PONOVO' : 'IGRAJ PONOVO') : (isGameOverPhase ? 'TRY AGAIN' : 'PLAY AGAIN')}
            </ButtonTab>
          </View>
          <View className="flex-1">
            <ButtonTab category="button" type="secondary" size="100" onPress={handleBack}>
              {isBs ? 'GLAVNI MENI' : 'MAIN MENU'}
            </ButtonTab>
          </View>
        </View>
      )}

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

    </Animated.View>
  );
}
