import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { AlertOctagon, Crown, Loader2, Medal, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Animated, AppState, Easing, Image, LayoutAnimation, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Card, Player, Language, GameState, GameMode } from '@/types';
import { CARD_DECK } from '@/data/cards';
import Illustration from './Illustration';
import { useGame } from '@/context/GameContext';
import { playClickSound, playHaptic, playSound } from '@/lib/sound';
import { ButtonTab } from './ButtonTab';
import { api, ApiCard, ApiChatMessage, ApiGame, ApiGameEvent, API_BASE_URL } from '@/lib/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VictoryConfetti } from './VictoryConfetti';
import { DrawnCardFace } from './DrawnCardFace';
import { CardBackDecoration } from './CardBackDecoration';
import { logGameAction } from '@/lib/gameDiagnostics';
import { cardDescription, cardTitle } from '@/lib/cardText';
import { DeckType } from '@/context/game-types';
import { subscribeToGameUpdates } from '@/lib/gameRealtime';
import { gameEventMachineReducer, initialGameEventMachineState } from '@/lib/gameEventMachine';
import { canOfferLaneInsertion, localMovePresentationPlan, shouldReleaseLaneLockOnCardFlip } from '@/lib/localMovePresentation';
import { countdownForceReleaseDelay, GAME_COUNTDOWN_FAILSAFE_MS } from '@/lib/gameCountdownGate';

import { MiseryLogo } from './MiseryLogo';
import { PlayerLaneModal } from './PlayerLaneModal';

const VICTORY_TROPHY_IMAGE = require('../assets/images/rulebook-victory-trophy.png');
const INACTIVITY_KICK_MS = 60_000;
const INACTIVITY_WARNING_MS = 15_000;
const INACTIVITY_FINAL_SECOND_GRACE_MS = 1_250;

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

function cardsForDeck(deckType: DeckType) {
  return CARD_DECK.filter((card) => deckType === 'spicy' ? card.isSpicy === true : card.isSpicy !== true);
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
  deckType?: DeckType;
  gameId?: number;
  userId?: number;
  debugVictory?: boolean;
}

type QueuedLaneResult = {
  playerName: string | null;
  result: 'success' | 'failure' | 'steal';
  score?: number | null;
  stolenFromLocal?: boolean;
};

export default function GameBoard({
  mode,
  initialPlayers,
  targetScore,
  deckType = 'normal',
  gameId,
  userId,
  debugVictory = false,
}: GameBoardProps) {
  const {
    language,
    isGameCountingDown,
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
    turnNotices,
  } = useGame();
  const isBs = language === 'bs';
  const { height } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const cardTopOffset = 104 + (mode === 'MULTIPLAYER' ? 52 : 0);
  const cardTopPadding = 12;
  const drawnCardHeight = height - cardTopOffset - cardTopPadding - 105;
  const cardAreaHeight = drawnCardHeight + cardTopPadding;
  const cardFlip = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;
  const cardPromptFloat = useRef(new Animated.Value(0)).current;
  const finishedScreenOpacity = useRef(new Animated.Value(1)).current;
  const scoreReveal = useRef(new Animated.Value(0)).current;
  const victoryTrophyFloat = useRef(new Animated.Value(0)).current;
  const optimisticLaneCardsRef = useRef<Record<string, Card[]>>({});
  const pendingPlacementRef = useRef<{ actingPlayerId: string; card: Card; slotIdx: number } | null>(null);
  const submittedPlacementRef = useRef<{ actingPlayerId: string; card: Card; slotIdx: number } | null>(null);
  const selectedInputFadeCompletedRef = useRef(false);
  const commitPendingPlacementRef = useRef<() => void>(() => undefined);
  const localResultPresentationRef = useRef<{
    completed: boolean;
    result: 'success' | 'failure' | 'steal';
  } | null>(null);
  const lastObservedEventIdRef = useRef<number | null>(null);
  const acceptedStealCardIdRef = useRef<string | null>(null);
  const turnNoticeIdRef = useRef(0);
  const knownServerMembersRef = useRef(new Map(
    initialPlayers
      .filter((player) => player.id !== undefined)
      .map((player) => [Number(player.id), player.name] as const)
  ));
  const gameFinishedAnnouncedRef = useRef(false);
  const winnerCelebratedRef = useRef(false);
  const finishedExitInProgressRef = useRef(false);
  const consecutivePollFailuresRef = useRef(0);
  const pollCountRef = useRef(0);
  const lastPollSignatureRef = useRef('');
  const moveRequestInFlightRef = useRef(false);
  const cancelActiveSnapshotRef = useRef<() => void>(() => undefined);
  const flushDeferredRealtimeRef = useRef<() => void>(() => undefined);
  const pendingTurnCardRef = useRef<Card | null>(null);
  const holdingTurnCardRef = useRef(false);
  const laneResultRef = useRef<'success' | 'failure' | 'steal' | null>(laneResult);
  const queuedLaneResultsRef = useRef<QueuedLaneResult[]>([]);
  const laneCollapseInFlightRef = useRef(false);
  const inactivityKickInFlightRef = useRef(false);
  const inactivityWarningCountRef = useRef(0);
  const serverCurrentPlayerIdRef = useRef<number | null>(null);
  const countdownGateEpochRef = useRef({ gameId, startedAt: Date.now() });
  if (countdownGateEpochRef.current.gameId !== gameId) {
    countdownGateEpochRef.current = { gameId, startedAt: Date.now() };
  }
  // True while an "on hold" (YOU'RE ON HOLD) notice is queued or showing. A stolen-card
  // result must never appear before the hold notice it belongs to, so the lane-result
  // queue waits for this to clear.

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
  const [chatMessages, setChatMessages] = useState<ApiChatMessage[]>([]);
  const [chatMessagesHydrated, setChatMessagesHydrated] = useState(false);
  const [hiddenChatMessageIds, setHiddenChatMessageIds] = useState<number[]>([]);
  const [shakeCard, setShakeCard] = useState(false);
  const [isLaneSheetOpen, setIsLaneSheetOpen] = useState(false);
  const [selectedLanePlayerId, setSelectedLanePlayerId] = useState<string | null>(null);
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [lastInsertedCardId, setLastInsertedCardId] = useState<string | null>(null);
  const [isServerTurnReady, setIsServerTurnReady] = useState(!gameId);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [lastResultCardScore, setLastResultCardScore] = useState<number | null>(null);
  const [revealedScoreCardId, setRevealedScoreCardId] = useState<string | null>(null);
  const [serverCurrentPlayerId, setServerCurrentPlayerId] = useState<number | null>(null);
  const [serverTurnOwnerId, setServerTurnOwnerId] = useState<number | null>(null);
  const [serverWinnerId, setServerWinnerId] = useState<number | null>(null);
  const [lastStealWasFromLocalPlayer, setLastStealWasFromLocalPlayer] = useState(false);
  const [isTurnInactive, setIsTurnInactive] = useState(false);
  const [stayOnLaneAfterAnswer, setStayOnLaneAfterAnswer] = useState(false);
  const [laneInputsLockedAfterAnswer, setLaneInputsLockedAfterAnswer] = useState(false);

  useEffect(() => {
    setChatMessages([]);
    setChatMessagesHydrated(false);
  }, [gameId]);

  useEffect(() => {
    if (lastInsertedCardId === null) return;
    const timer = setTimeout(() => setLastInsertedCardId(null), 900);
    return () => clearTimeout(timer);
  }, [lastInsertedCardId]);
  const [inactivityWarningVisible, setInactivityWarningVisible] = useState(false);
  const [inactivityWarningCount, setInactivityWarningCount] = useState(0);

  useEffect(() => {
    if (!isGameCountingDown) return;
    const startedAt = countdownGateEpochRef.current.startedAt;
    const scheduledAt = Date.now();
    const delayMs = countdownForceReleaseDelay(startedAt, scheduledAt);
    const timer = setTimeout(() => {
      logGameAction('countdown.force-complete', {
        elapsedMs: Date.now() - startedAt,
        gameId,
        reason: 'stale-global-countdown-gate',
        scheduledDelayMs: delayMs,
        timeoutMs: GAME_COUNTDOWN_FAILSAFE_MS,
      });
      setIsGameCountingDown(false);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [gameId, isGameCountingDown, setIsGameCountingDown]);
  const [inactivitySecondsRemaining, setInactivitySecondsRemaining] = useState<number | null>(null);
  const [roomExitReason, setRoomExitReason] = useState<string | null>(null);
  const [activeStealOfferEvent, setActiveStealOfferEvent] = useState<ApiGameEvent | null>(null);
  const [eventMachine, dispatchGameEvent] = useReducer(gameEventMachineReducer, initialGameEventMachineState);
  const queuedServerEvents = eventMachine.current
    ? [eventMachine.current, ...eventMachine.pending]
    : eventMachine.pending;
  const presentedServerEventIdRef = useRef<number | null>(null);
  const [isLaneResultGapActive, setIsLaneResultGapActive] = useState(false);
  const initializedServerGameRef = useRef<string | null>(null);

  useEffect(() => {
    serverCurrentPlayerIdRef.current = serverCurrentPlayerId;
  }, [serverCurrentPlayerId]);

  const toLocalCard = (card: ApiCard): Card => ({
    id: String(card.id),
    titleEn: card.title,
    titleBs: card.title_bs?.trim() || card.title,
    descriptionEn: card.subtitle ?? undefined,
    descriptionBs: card.subtitle_bs?.trim() || card.subtitle || undefined,
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

  const publishLaneResult = (notice: QueuedLaneResult) => {
    laneResultRef.current = notice.result;
    setLaneResultPlayerName(notice.playerName);
    if (notice.score !== undefined) setLastResultCardScore(notice.score);
    setLastStealWasFromLocalPlayer(Boolean(notice.stolenFromLocal));
    setLaneResult(notice.result);
  };

  const enqueueLaneResult = (notice: QueuedLaneResult) => {
    if (
      laneResultRef.current !== null ||
      isLaneResultGapActive
    ) {
      queuedLaneResultsRef.current.push(notice);
      return;
    }
    publishLaneResult(notice);
  };

  useEffect(() => {
    const previousResult = laneResultRef.current;
    laneResultRef.current = laneResult;
    if (laneResult !== null || previousResult === null) return;
    setIsLaneResultGapActive(true);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const attemptPublish = () => {
      setIsLaneResultGapActive(false);
      const next = queuedLaneResultsRef.current.shift();
      if (next) {
        publishLaneResult(next);
      } else {
      }
    };
    timer = setTimeout(attemptPublish, 500);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [laneResult]);

  useEffect(() => {
    cardFlip.setValue(0);
    scoreReveal.setValue(0);
    setFlippedCardId(null);
    setRevealedScoreCardId(null);
  }, [cardFlip, gameState.drawnCard?.id, scoreReveal]);

  const isDrawnCardFlipped = Boolean(
    gameState.drawnCard && flippedCardId === gameState.drawnCard.id
  );

  const isDrawnCardScoreRevealed = Boolean(
    gameState.drawnCard &&
    revealedScoreCardId === gameState.drawnCard.id &&
    gameState.phase !== 'STEAL_DECISION'
  );

  useEffect(() => {
    laneResultRef.current = null;
    setIsLaneResultGapActive(false);
    queuedLaneResultsRef.current = [];
    localResultPresentationRef.current = null;
    dispatchGameEvent({ type: 'RESET' });
    presentedServerEventIdRef.current = null;
    lastObservedEventIdRef.current = null;
    setActiveStealOfferEvent(null);
    setTurnNotices([]);
    setStayOnLaneAfterAnswer(false);
    setLaneInputsLockedAfterAnswer(false);
  }, [gameId, setTurnNotices]);

  const completeCurrentServerEvent = useCallback((expectedTypes?: ApiGameEvent['type'][]) => {
    const current = eventMachine.current;
    if (!current || (expectedTypes && !expectedTypes.includes(current.type))) return;
    logGameAction('server-event.complete', { eventId: current.id, eventType: current.type });
    presentedServerEventIdRef.current = null;
    dispatchGameEvent({ type: 'COMPLETE', eventId: current.id });
  }, [eventMachine.current]);

  const completeLaneResultPresentation = useCallback(() => {
    if (localResultPresentationRef.current) {
      localResultPresentationRef.current.completed = true;
    }
    if (eventMachine.current?.type === 'MOVE_RESULT') {
      localResultPresentationRef.current = null;
      completeCurrentServerEvent(['MOVE_RESULT']);
    }
  }, [completeCurrentServerEvent, eventMachine.current]);

  useEffect(() => {
    if (isGameCountingDown) return;
    const event = eventMachine.current;
    if (!event || presentedServerEventIdRef.current === event.id) return;
    const payload = event.payload ?? {};
    logGameAction('server-event.consume', { eventId: event.id, eventType: event.type });
    if (event.type === 'MOVE_RESULT') {
      const isLocalResult = Number(payload.player_id) === Number(userId);
      const authoritativeResult = payload.correct ? (payload.is_steal ? 'steal' : 'success') : 'failure';
      if (isLocalResult) {
        if (!selectedInputFadeCompletedRef.current) {
          setSelectedSlotResult(payload.correct ? 'success' : 'failure');
        }
        if (payload.correct && submittedPlacementRef.current) {
          pendingPlacementRef.current = submittedPlacementRef.current;
        }
        submittedPlacementRef.current = null;
        if (selectedInputFadeCompletedRef.current) {
          LayoutAnimation.configureNext({
            duration: 340,
            create: { property: LayoutAnimation.Properties.opacity, type: LayoutAnimation.Types.easeInEaseOut },
            update: { springDamping: 0.82, type: LayoutAnimation.Types.spring },
          });
          commitPendingPlacementRef.current();
        }
      }
      presentedServerEventIdRef.current = event.id;
      const localPresentation = isLocalResult ? localResultPresentationRef.current : null;
      if (localPresentation?.result === authoritativeResult) {
        logGameAction('lane-result.local-confirmed', {
          eventId: event.id,
          overlayAlreadyCompleted: localPresentation.completed,
          result: authoritativeResult,
        });
        if (localPresentation.completed) {
          localResultPresentationRef.current = null;
          presentedServerEventIdRef.current = null;
          dispatchGameEvent({ type: 'COMPLETE', eventId: event.id });
        }
        return;
      }
      localResultPresentationRef.current = null;
      enqueueLaneResult({
        playerName: typeof payload.player_name === 'string' ? payload.player_name : null,
        result: authoritativeResult,
        score: typeof payload.score === 'number' ? payload.score : null,
        stolenFromLocal: Boolean(payload.is_steal && Number(payload.turn_owner_id) === Number(userId)),
      });
      return;
    }
    if (event.type === 'TURN_STARTED') {
      // A new turn returns presentation to Card, but lane inputs remain locked
      // independently until that new card is actually flipped.
      setStayOnLaneAfterAnswer(false);
      presentedServerEventIdRef.current = event.id;
      setTurnNotices([{ id: event.id, type: 'start' }]);
      return;
    }
    if (event.type === 'TURN_ENDED') {
      presentedServerEventIdRef.current = event.id;
      setTurnNotices([{ id: event.id, type: 'end' }]);
      return;
    }
    if (event.type === 'TURN_HOLD') {
      presentedServerEventIdRef.current = event.id;
      setTurnNotices([{
        id: event.id,
        type: 'hold',
        steal: true,
        playerName: typeof payload.player_name === 'string' ? payload.player_name : undefined,
      }]);
      return;
    }
    if (event.type === 'STEAL_OFFERED') {
      presentedServerEventIdRef.current = event.id;
      setActiveStealOfferEvent(event);
      setGameState((current) => {
        const offeredPlayerId = Number(payload.player_id ?? event.target_user_id);
        const offeredPlayerIndex = current.players.findIndex(
          (player) => Number(player.id) === offeredPlayerId
        );
        return {
          ...current,
          phase: 'STEAL_DECISION',
          activeStealerIndex: offeredPlayerIndex >= 0
            ? offeredPlayerIndex
            : current.activeStealerIndex,
        };
      });
      return;
    }
    if (event.type === 'GAME_FINISHED') {
      setGameState((current) => ({ ...current, phase: 'VICTORY' }));
      presentedServerEventIdRef.current = null;
      dispatchGameEvent({ type: 'COMPLETE', eventId: event.id });
    }
  }, [eventMachine.current, isGameCountingDown, isLaneCollapsing, selectedSlotResult, setTurnNotices, userId]);

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

  const commitPendingPlacement = useCallback(() => {
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
  }, []);
  commitPendingPlacementRef.current = commitPendingPlacement;

  const flipDrawnCard = () => {
    const queuedStealOffer = queuedServerEvents.find((event) => event.type === 'STEAL_OFFERED');
    if (
      queuedStealOffer &&
      acceptedStealCardIdRef.current !== String(queuedStealOffer.payload.card_id ?? gameState.drawnCard?.id)
    ) {
      logGameAction('card.flip.blocked', { reason: 'steal-offer-not-yet-presented' });
      return;
    }
    if (
      gameId &&
      gameState.phase === 'STEAL_DECISION' &&
      acceptedStealCardIdRef.current !== String(gameState.drawnCard?.id)
    ) {
      logGameAction('card.flip.blocked', { cardId: gameState.drawnCard?.id, reason: 'steal-not-accepted' });
      return;
    }
    if (isDrawnCardFlipped && !canReflipWhileStealPending) {
      logGameAction('card.flip.blocked', { reason: 'already-flipped', phase: gameState.phase });
      return;
    }
    if (
      gameId &&
      !canReflipWhileStealPending &&
      (!isServerTurnReady ||
        Number(serverCurrentPlayerId) !== Number(userId))
    ) {
      logGameAction('card.flip.blocked', {
        localUserId: userId,
        reason: 'server-turn-gate',
        serverPlayerId: serverCurrentPlayerId,
        serverReady: isServerTurnReady,
      });
      return;
    }
    playSound('shuffle');
    const nextFlipped = !isDrawnCardFlipped;
    logGameAction('card.flip', { cardId: gameState.drawnCard?.id, flipped: nextFlipped, phase: gameState.phase });
    if (shouldReleaseLaneLockOnCardFlip(nextFlipped)) {
      setLaneInputsLockedAfterAnswer(false);
    }
    setFlippedCardId(nextFlipped ? gameState.drawnCard?.id ?? null : null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(cardFlip, {
      toValue: nextFlipped ? 1 : 0,
      duration: 560,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || canReflipWhileStealPending || !nextFlipped) return;
      logGameAction('navigation.lane.after-flip', { cardId: gameState.drawnCard?.id });
      router.navigate('/game/lane');
    });
  };

  useEffect(() => {
    const serverGameKey = gameId ? `${gameId}:${userId ?? 'anonymous'}` : null;
    if (serverGameKey && initializedServerGameRef.current === serverGameKey) {
      logGameAction('game.initialize.skipped', { gameId, reason: 'already-initialized', userId });
      return;
    }
    if (serverGameKey) initializedServerGameRef.current = serverGameKey;
    const shuffledDeck = shuffleCards(cardsForDeck(deckType));
    logGameAction('game.initialize', {
      gameId: gameId ?? 'local',
      mode,
      playerCount: initialPlayers.length,
      targetScore,
      userId: userId ?? 'local',
    });

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

    if (debugVictory) {
      playersList.forEach((player, index) => {
        const extraCards = index === 0 ? targetScore : Math.max(1, targetScore - index - 1);
        player.lane.push(...shuffledDeck.splice(0, extraCards));
        player.lane.sort((a, b) => a.index - b.index);
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
      phase: debugVictory ? 'VICTORY' : 'PLAYING',
      targetScore,
      guessHistory: [],
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialPlayers, targetScore, deckType, debugVictory]);

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
    if (!drawnCard || phase !== 'PLAYING') {
      logGameAction('slot.select.blocked', { hasCard: Boolean(drawnCard), phase, reason: 'local-phase-gate', slotIdx });
      return;
    }
    if (queuedServerEvents.some((event) => event.type === 'STEAL_OFFERED')) {
      logGameAction('slot.select.blocked', { reason: 'steal-offer-not-yet-presented', slotIdx });
      return;
    }
    if (gameId && (!isServerTurnReady || Number(serverCurrentPlayerId) !== Number(userId))) {
      logGameAction('slot.select.blocked', {
        localUserId: userId,
        reason: 'server-turn-gate',
        serverPlayerId: serverCurrentPlayerId,
        serverReady: isServerTurnReady,
        slotIdx,
      });
      return;
    }
    playClickSound();
    playHaptic();
    const actingPlayerIndex = activeStealerIndex !== undefined ? activeStealerIndex : currentPlayerIndex;
    const actingPlayer = players[actingPlayerIndex];
    const isCorrect = verifySlotChoice(actingPlayer.lane, drawnCard, slotIdx);
    logGameAction('slot.select', {
      cardId: drawnCard.id,
      isCorrect,
      laneLength: actingPlayer.lane.length,
      playerId: actingPlayer.id,
      slotIdx,
    });
    if (gameId) {
      // Once a slot is selected, every start notice for that attempt is finished.
      // Keeping a steal-start notice alive lets it resume after the result modal
      // preempts it, producing "YOUR STEAL ATTEMPT" after the attempt has ended.
      setTurnNotices((current) => current.filter((notice) => notice.type !== 'start'));
    }
    setLastResultCardScore(drawnCard.index);
    setRevealedScoreCardId(drawnCard.id);
    // Never let the previous insertion marker animate again when Lane remounts.
    // The marker is set to the new card only after the result overlay completes.
    setLastInsertedCardId(null);
    setStayOnLaneAfterAnswer(true);
    setLaneInputsLockedAfterAnswer(true);
    setSelectedSlotIndex(slotIdx);
    selectedInputFadeCompletedRef.current = false;
    // Ordinary turns and accepted steals share one local lane presentation.
    // Keep/color the tapped input immediately; server confirmation only
    // unlocks its fade and the subsequent clamp.
    setSelectedSlotResult(isCorrect ? 'success' : 'failure');
    if (gameId) {
      const immediateResult = localMovePresentationPlan(isCorrect, activeStealerIndex !== undefined).result;
      submittedPlacementRef.current = { actingPlayerId: actingPlayer.id, card: drawnCard, slotIdx };
      localResultPresentationRef.current = { completed: false, result: immediateResult };
      enqueueLaneResult({ playerName: actingPlayer.name, result: immediateResult, score: drawnCard.index });
      logGameAction('lane-result.local-show', { cardId: drawnCard.id, result: immediateResult, slotIdx });
    }
    if (gameId && userId) {
      cancelActiveSnapshotRef.current();
      moveRequestInFlightRef.current = true;
      setIsSubmittingMove(true);
      const submitStartedAt = Date.now();
      logGameAction('move.submit.start', { gameId, isCorrect, playerId: userId });
      void api.submitMove(gameId, userId, isCorrect)
        .then(({ game }) => {
          logGameAction('move.submit.success', {
            durationMs: Date.now() - submitStartedAt,
            nextPlayerId: game.current_player_id,
          });
          const nextIndex = players.findIndex((player) => Number(player.id) === Number(game.current_player_id));
          setServerCurrentPlayerId(game.current_player_id);
          setServerTurnOwnerId(game.turn_owner_id);
          setServerWinnerId(game.winner_id);
          if (!isCorrect) acceptedStealCardIdRef.current = null;
          if (isCorrect && !game.winner_id && game.current_card) {
            // The server now completes a correct round in the move request itself.
            // Keep showing the resolved card until its result/lane animation ends;
            // the already-existing turn-notice queue will then reveal this card.
            pendingTurnCardRef.current = toLocalCard(game.current_card);
            holdingTurnCardRef.current = true;
          }
          setGameState((prev) => ({
            ...prev,
            currentPlayerIndex: nextIndex >= 0 ? nextIndex : prev.currentPlayerIndex,
            activeStealerIndex: game.is_steal_turn && nextIndex >= 0 ? nextIndex : undefined,
            drawnCard: isCorrect && !game.winner_id
              ? prev.drawnCard
              : game.current_card ? toLocalCard(game.current_card) : prev.drawnCard,
            // The response snapshot updates authoritative data only. Presentation
            // order is driven exclusively by the ordered game-event stream below;
            // otherwise a fast response can jump ahead of MOVE_RESULT.
            phase: prev.phase,
          }));
        })
        .catch((error) => {
          submittedPlacementRef.current = null;
          setSelectedSlotIndex(null);
          setSelectedSlotResult(null);
          selectedInputFadeCompletedRef.current = false;
          logGameAction('move.submit.failure', {
            durationMs: Date.now() - submitStartedAt,
            message: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          moveRequestInFlightRef.current = false;
          setIsSubmittingMove(false);
          flushDeferredRealtimeRef.current();
        });
    }

    if (isCorrect) {
      if (!gameId) pendingPlacementRef.current = { actingPlayerId: actingPlayer.id, card: drawnCard, slotIdx };
      const wasStealAttempt = activeStealerIndex !== undefined;
      if (!gameId) {
        enqueueLaneResult({
          playerName: actingPlayer.name,
          result: wasStealAttempt ? 'steal' : 'success',
          score: drawnCard.index,
        });
      }
      const historyLog = {
        playerName: actingPlayer.name,
        cardTitle: cardTitle(drawnCard, language),
        cardTitleEn: drawnCard.titleEn,
        cardTitleBs: drawnCard.titleBs?.trim() || drawnCard.titleEn,
        cardScore: drawnCard.index,
        guessIndex: slotIdx,
        correctIndex: slotIdx,
        success: true,
      };
      setGameState((prev) => {
        const checkVictory = !gameId && pointsFromLane([...actingPlayer.lane, drawnCard]) >= targetScore;
        return {
          ...prev,
          phase: gameId ? 'PLAYING' : checkVictory ? 'VICTORY' : 'CORRECT_REVEAL',
          guessHistory: [historyLog, ...prev.guessHistory],
        };
      });
    } else {
      if (!gameId) enqueueLaneResult({ playerName: actingPlayer.name, result: 'failure', score: drawnCard.index });
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 600);
      const historyLog = {
        playerName: actingPlayer.name,
        cardTitle: cardTitle(drawnCard, language),
        cardTitleEn: drawnCard.titleEn,
        cardTitleBs: drawnCard.titleBs?.trim() || drawnCard.titleEn,
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
        setGameState((prev) => ({ ...prev, phase: 'PLAYING', guessHistory: [historyLog, ...prev.guessHistory] }));
      }
    }
  };

  useEffect(() => {
    if (!gameId) return;
    logGameAction('poll.start', { gameId, userId });
    let cancelled = false;
    let paused = AppState.currentState !== 'active';
    let timer: ReturnType<typeof setTimeout> | null = null;
    let activeController: AbortController | null = null;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
    let realtimeRetryTimer: ReturnType<typeof setTimeout> | null = null;
    let heartbeatController: AbortController | null = null;
    let realtimeCleanup: (() => Promise<void>) | null = null;
    let realtimeEnabled = false;
    let realtimeStarting = false;
    let strictRealtime = false;
    let realtimeIdentity = '';
    let pendingRealtimeRefresh = false;
    let heartbeatInterval = 20_000;
    let poll: () => Promise<void>;

    const heartbeat = async () => {
      if (cancelled || paused || !realtimeEnabled || !userId || heartbeatController) return;
      const controller = new AbortController();
      heartbeatController = controller;
      try {
        await api.heartbeatGame(gameId, userId, controller.signal);
      } catch (error) {
        if (!cancelled && !paused && !controller.signal.aborted) {
          logGameAction('pusher.heartbeat.failure', { message: error instanceof Error ? error.message : String(error) });
        }
      } finally {
        if (heartbeatController === controller) heartbeatController = null;
        if (!cancelled && !paused && realtimeEnabled) heartbeatTimer = setTimeout(heartbeat, heartbeatInterval);
      }
    };

    const activateRealtime = (game: ApiGame) => {
      const config = game.sync_driver === 'pusher'
        ? game.pusher
        : game.sync_driver === 'ably' ? game.ably : game.sync_driver === 'reverb' ? game.reverb : null;
      strictRealtime = game.sync_driver === 'reverb';
      if (!config) {
        if (realtimeCleanup) void realtimeCleanup();
        realtimeCleanup = null;
        realtimeEnabled = false;
        realtimeIdentity = '';
        strictRealtime = false;
        return;
      }
      const identity = `${game.sync_driver}:${config.channel}`;
      if ((realtimeEnabled && realtimeIdentity === identity) || realtimeStarting) return;
      if (realtimeCleanup) void realtimeCleanup();
      realtimeCleanup = null;
      realtimeEnabled = false;
      realtimeStarting = true;
      heartbeatInterval = Math.max(10_000, Number(config.heartbeat_interval_ms) || 20_000);
      void subscribeToGameUpdates({
        channel: config.channel,
        cluster: game.pusher?.cluster,
        event: config.event,
        getToken: game.sync_driver === 'ably' && userId ? () => api.getAblyToken(gameId, userId) : undefined,
        host: game.reverb?.host,
        key: game.pusher?.key ?? game.reverb?.key,
        onUpdate: () => {
          pendingRealtimeRefresh = true;
          if (moveRequestInFlightRef.current) {
            logGameAction('realtime.refresh-deferred', { reason: 'move-request-in-flight' });
            return;
          }
          if (!cancelled && !paused && !activeController) {
            if (timer) clearTimeout(timer);
            // A single gameplay action can emit several realtime events in a tight
            // burst. Coalesce them before fetching and rebuilding the full snapshot.
            timer = setTimeout(() => void poll(), 80);
          }
        },
        port: game.reverb?.port,
        provider: game.sync_driver as 'pusher' | 'ably' | 'reverb',
        scheme: game.reverb?.scheme,
      }).then((cleanup) => {
        if (cancelled) {
          void cleanup();
          return;
        }
        realtimeCleanup = cleanup;
        realtimeEnabled = true;
        realtimeStarting = false;
        realtimeIdentity = identity;
        pendingRealtimeRefresh = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => void poll(), 0);
        void heartbeat();
        logGameAction('realtime.connected', { channel: config.channel, driver: game.sync_driver, gameId });
      }).catch((error) => {
        realtimeStarting = false;
        if (game.sync_driver === 'reverb') {
          setConnectionWarningVisible(true);
          logGameAction('realtime.reverb-retry', { message: error instanceof Error ? error.message : String(error) });
          if (realtimeRetryTimer) clearTimeout(realtimeRetryTimer);
          realtimeRetryTimer = setTimeout(() => {
            if (!cancelled && !paused) activateRealtime(game);
          }, 3000);
          return;
        }
        logGameAction('realtime.fallback-to-polling', { driver: game.sync_driver, message: error instanceof Error ? error.message : String(error) });
      });
    };

    poll = async () => {
      if (cancelled || paused || activeController) return;
      if (realtimeEnabled) pendingRealtimeRefresh = false;
      const pollStartedAt = Date.now();
      const pollNumber = ++pollCountRef.current;
      let nextPollDelay = 3000;
      const pollController = new AbortController();
      activeController = pollController;
      cancelActiveSnapshotRef.current = () => {
        if (activeController !== pollController) return;
        logGameAction('poll.cancelled-for-move', { pollNumber });
        pollController.abort();
      };
      const pollTimeout = setTimeout(() => pollController.abort(), 8000);
      try {
        const game = realtimeEnabled
          ? await api.getGameSnapshot(gameId, pollController.signal)
          : await api.getGame(gameId, userId, pollController.signal);
        if (cancelled || paused || pollController.signal.aborted) return;
        activateRealtime(game);
        consecutivePollFailuresRef.current = 0;
        setConnectionWarningVisible(false);
        const isStillMember = !userId || game.members.some((member) => Number(member.id) === Number(userId));
        const exitReason = game.terminated_at
          ? game.termination_reason ?? 'host_left'
          : !isStillMember ? 'player_inactive' : null;
        const nextServerMembers = new Map(game.members.map((member) => [Number(member.id), member.name] as const));
        if (!exitReason) {
          const departedPlayers = [...knownServerMembersRef.current.entries()]
            .filter(([memberId]) => memberId !== Number(userId) && !nextServerMembers.has(memberId));
          if (departedPlayers.length > 0) {
            setTurnNotices((current) => [
              ...departedPlayers.map(([, playerName]) => ({
                id: ++turnNoticeIdRef.current,
                playerName,
                type: 'departure' as const,
              })),
              ...current,
            ]);
            logGameAction('room.member-departure-notice', {
              gameId,
              players: departedPlayers.map(([memberId, playerName]) => ({ memberId, playerName })),
            });
          }
        }
        knownServerMembersRef.current = nextServerMembers;
        if (exitReason) {
          setRoomExitReason(exitReason);
          logGameAction('room.exit-detected', { gameId, reason: exitReason, userId });
          cancelled = true;
          return;
        }
        const serverPlayerIndex = game.current_player_id === null
          ? 0
          : game.members.findIndex((player) => Number(player.id) === Number(game.current_player_id));
        const safeServerPlayerIndex = serverPlayerIndex >= 0 ? serverPlayerIndex : 0;
        setIsServerTurnReady(true);
        setServerCurrentPlayerId(game.current_player_id);
        setServerTurnOwnerId(game.turn_owner_id);
        setServerWinnerId(game.winner_id);
        setChatMessages([...(game.chat_messages ?? [])].sort((a, b) => a.id - b.id));
        setChatMessagesHydrated(true);
        // Full snapshots are intentionally heavy. Never allow fallback polling
        // configuration to drive them fast enough to starve navigation or touches.
        nextPollDelay = Math.max(1000, Number(game.ingame_polling_interval_ms) || 3000);
        const latestMove = game.moves[0];
        const handCardCount = Object.values(game.hands).reduce((total, hand) => total + hand.length, 0);
        // Chat delivery must not rebuild gameplay state. Realtime chat events can
        // arrive while a card/result animation is active, and treating them as a
        // gameplay transition can reset the native game screen around that overlay.
        const gameplaySignature = [
          game.members.map((member) => member.id).join(','),
          game.current_player_id,
          game.turn_owner_id,
          game.current_card?.id ?? 0,
          game.is_steal_turn ? 1 : 0,
          game.winner_id ?? 0,
          latestMove?.id ?? 0,
          handCardCount,
        ].join(':');
        const stateChanged = gameplaySignature !== lastPollSignatureRef.current;
        lastPollSignatureRef.current = gameplaySignature;
        const pollDuration = Date.now() - pollStartedAt;
        if (stateChanged || pollDuration >= 750 || pollNumber % 5 === 0) {
          logGameAction('poll.success', {
            durationMs: pollDuration,
            handCardCount,
            intervalMs: nextPollDelay,
            moveCount: game.moves.length,
            pollNumber,
            stateChanged,
          });
        }
        const serverEvents = game.events ?? [];
        const previousEventId = lastObservedEventIdRef.current;
        const unseenEvents = previousEventId === null
          ? isGameCountingDown
            ? [...serverEvents]
            : game.winner_id
              ? serverEvents.filter((event) => event.type === 'GAME_FINISHED').slice(-1)
              : game.is_steal_turn && Number(game.current_player_id) === Number(userId)
                ? serverEvents.filter((event) => event.type === 'STEAL_OFFERED' && Number(event.target_user_id) === Number(userId)).slice(-1)
                : Number(game.current_player_id) === Number(userId)
                  ? serverEvents.filter((event) => event.type === 'TURN_STARTED' && Number(event.target_user_id) === Number(userId)).slice(-1)
                  : []
          : serverEvents.filter((event) => event.id > previousEventId);
        lastObservedEventIdRef.current = serverEvents.reduce(
          (maximum, event) => Math.max(maximum, event.id),
          previousEventId ?? 0,
        );
        const relevantEvents = unseenEvents
          .filter((event) => event.target_user_id === null || Number(event.target_user_id) === Number(userId))
          .sort((a, b) => a.id - b.id);
        if (relevantEvents.length > 0) {
          dispatchGameEvent({ type: 'INGEST', events: relevantEvents });
          logGameAction('server-events.queued', {
            eventIds: relevantEvents.map((event) => event.id),
            eventTypes: relevantEvents.map((event) => event.type),
          });
        }
        const incomingCard = game.current_card ? toLocalCard(game.current_card) : null;
        const isIncomingLocalTurn = Number(game.current_player_id) === Number(userId);
        if (stateChanged) {
          setGameState((prev) => {
            const cardChanged = Boolean(incomingCard && incomingCard.id !== prev.drawnCard?.id);
            if (cardChanged && isIncomingLocalTurn) {
              pendingTurnCardRef.current = incomingCard;
              holdingTurnCardRef.current = true;
            }
            return {
              ...prev,
              currentPlayerIndex: safeServerPlayerIndex,
              activeStealerIndex: game.is_steal_turn ? safeServerPlayerIndex : undefined,
              phase: prev.phase === 'VICTORY'
                ? prev.phase
                : prev.phase === 'STEAL_DECISION' && game.is_steal_turn
                  ? prev.phase
                  : 'PLAYING',
              drawnCard: holdingTurnCardRef.current ? prev.drawnCard : incomingCard ?? prev.drawnCard,
              players: game.members.map((member) => {
                const player = prev.players.find((candidate) => Number(candidate.id) === Number(member.id));
                if (!player) return null;
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
              }).filter((player): player is Player => player !== null),
              guessHistory: game.moves.map((move) => ({
                playerName: move.player.name,
                cardTitle: move.card?.title ?? '',
                cardTitleEn: move.card?.title ?? '',
                cardTitleBs: move.card?.title_bs?.trim() || move.card?.title || '',
                cardScore: move.card ? Number(move.card.score) : undefined,
                guessIndex: -1,
                correctIndex: -1,
                success: move.correct,
              })),
            };
          });
        }
      } catch (error) {
        if (cancelled || paused) return;
        consecutivePollFailuresRef.current += 1;
        const timedOut = error instanceof Error && error.name === 'AbortError';
        logGameAction('poll.failure', {
          durationMs: Date.now() - pollStartedAt,
          failures: consecutivePollFailuresRef.current,
          message: error instanceof Error ? error.message : String(error),
          pollNumber,
          timedOut,
        });
        if (timedOut || consecutivePollFailuresRef.current >= 2) {
          setConnectionWarningVisible(true);
        }
      } finally {
        clearTimeout(pollTimeout);
        if (activeController === pollController) activeController = null;
        cancelActiveSnapshotRef.current = () => undefined;
        const requestDuration = Date.now() - pollStartedAt;
        if (!cancelled && !paused) {
          const shouldSchedule = pendingRealtimeRefresh || !strictRealtime;
          const delay = pendingRealtimeRefresh
            ? 80
            : realtimeEnabled ? 30_000 : Math.max(0, nextPollDelay - requestDuration);
          pendingRealtimeRefresh = false;
          if (shouldSchedule) timer = setTimeout(() => void poll(), delay);
        }
      }
    };
    flushDeferredRealtimeRef.current = () => {
      if (cancelled || paused || !pendingRealtimeRefresh || activeController) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void poll(), 80);
    };
    if (!paused) void poll();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      paused = state !== 'active';
      if (paused) {
        if (timer) clearTimeout(timer);
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        if (realtimeRetryTimer) clearTimeout(realtimeRetryTimer);
        timer = null;
        heartbeatTimer = null;
        realtimeRetryTimer = null;
        activeController?.abort();
        heartbeatController?.abort();
        return;
      }
      if (!cancelled && !activeController) void poll();
      if (!cancelled && realtimeEnabled && !heartbeatController) void heartbeat();
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      if (realtimeRetryTimer) clearTimeout(realtimeRetryTimer);
      activeController?.abort();
      heartbeatController?.abort();
      if (realtimeCleanup) void realtimeCleanup();
      cancelActiveSnapshotRef.current = () => undefined;
      flushDeferredRealtimeRef.current = () => undefined;
      appStateSubscription.remove();
      logGameAction('poll.stop', { gameId, polls: pollCountRef.current });
    };
  }, [gameId]);

  const sendChatMessage = useCallback(async (rawMessage: string) => {
    const message = rawMessage.trim().slice(0, 20);
    if (!gameId || !userId || !message) return;
    const player = gameState.players.find((candidate) => Number(candidate.id) === Number(userId));
    const temporaryId = -Date.now();
    const optimisticMessage: ApiChatMessage = {
      id: temporaryId,
      game_id: gameId,
      user_id: userId,
      message,
      user: {
        id: userId,
        name: player?.name ?? (isBs ? 'Igrač' : 'Player'),
        color: player?.color ?? null,
        email: null,
      },
      created_at: new Date().toISOString(),
    };
    setChatMessages((current) => [...current, optimisticMessage]);
    try {
      const sent = await api.sendChatMessage(gameId, userId, message);
      setChatMessages((current) => {
        const withoutTemporary = current.filter((item) => item.id !== temporaryId);
        return withoutTemporary.some((item) => item.id === sent.id)
          ? withoutTemporary
          : [...withoutTemporary, sent].sort((a, b) => a.id - b.id);
      });
    } catch (error) {
      setChatMessages((current) => current.filter((item) => item.id !== temporaryId));
      throw error;
    }
  }, [gameId, gameState.players, isBs, userId]);

  const reportChatMessageLocally = useCallback((messageId: number) => {
    setHiddenChatMessageIds((current) => current.includes(messageId) ? current : [...current, messageId]);
  }, []);

  useEffect(() => {
    if (
      !holdingTurnCardRef.current ||
      !pendingTurnCardRef.current ||
      laneResult !== null ||
      selectedSlotResult !== null ||
      isLaneCollapsing
    ) return;
    const pendingCard = pendingTurnCardRef.current;
    pendingTurnCardRef.current = null;
    holdingTurnCardRef.current = false;
    setGameState((prev) => ({ ...prev, drawnCard: pendingCard }));
  }, [isLaneCollapsing, laneResult, selectedSlotResult, turnNotices]);

  const handleStealChoice = (accept: boolean) => {
    const { players, currentPlayerIndex, activeStealerIndex, drawnCard } = gameState;
    if (activeStealerIndex === undefined || !drawnCard) {
      logGameAction('steal.choice.blocked', { accept, hasCard: Boolean(drawnCard), reason: 'missing-steal-state' });
      return;
    }
    logGameAction('steal.choice', { accept, cardId: drawnCard.id, stealerId: players[activeStealerIndex]?.id });
    completeCurrentServerEvent(['STEAL_OFFERED']);
    setActiveStealOfferEvent(null);
    if (accept) {
      // The steal attempt starts from Card. Input availability remains gated
      // by laneInputsLockedAfterAnswer until the card is flipped.
      setStayOnLaneAfterAnswer(false);
      triggerSound('steal');
      setFlippedCardId(null);
      cardFlip.stopAnimation();
      cardFlip.setValue(0);
      setRevealedScoreCardId(null);
      scoreReveal.stopAnimation();
      scoreReveal.setValue(0);
      if (gameId) {
        acceptedStealCardIdRef.current = String(drawnCard.id);
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
        const passStartedAt = Date.now();
        api.passSteal(gameId, userId)
          .then(() => logGameAction('steal.pass.success', { durationMs: Date.now() - passStartedAt }))
          .catch((error) => logGameAction('steal.pass.failure', {
            durationMs: Date.now() - passStartedAt,
            message: error instanceof Error ? error.message : String(error),
          }));
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

  const handleProceedNextRound = () => {
    // Multiplayer rounds advance atomically in submitMove. This local transition is
    // only used by solo/simulator games, which have no authoritative server state.
    if (gameId) return;
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

  const leaveActiveGame = () => {
    if (!gameId || !userId) return Promise.resolve(false);
    logGameAction('room.leave-requested', { gameId, userId });
    return api.leaveGame(gameId, userId).then(() => true);
  };

  const handleLaneResultFadeComplete = () => {
    if (laneCollapseInFlightRef.current || selectedSlotResult === null) return;
    laneCollapseInFlightRef.current = true;
    logGameAction('lane-animation.collapse-start', { durationMs: 340 });
    setIsLaneCollapsing(true);
    const finishCollapse = () => {
      if (!laneCollapseInFlightRef.current) return;
      laneCollapseInFlightRef.current = false;
      logGameAction('lane-animation.collapse-complete');
      setIsLaneCollapsing(false);
    };
    LayoutAnimation.configureNext(
      {
        duration: 340,
        create: { property: LayoutAnimation.Properties.opacity, type: LayoutAnimation.Types.easeInEaseOut },
        delete: { property: LayoutAnimation.Properties.opacity, type: LayoutAnimation.Types.easeInEaseOut },
        update: { springDamping: 0.82, type: LayoutAnimation.Types.spring },
      },
      finishCollapse
    );
    setTimeout(finishCollapse, 410);
    setSelectedSlotIndex(null);
    setSelectedSlotResult(null);
    selectedInputFadeCompletedRef.current = true;
    // The input has now fully faded. Only at this point mount the new card so
    // the lane shifts once and the inserted card owns the entrance animation.
    commitPendingPlacement();
  };

  const handleRestartGame = async () => {
    if (mode !== 'MULTIPLAYER' || !gameId || !userId) {
      leaveFinishedGame('WELCOME');
      return;
    }
    const roomOwnerId = session?.ownerId ?? initialPlayers[0]?.id;
    try {
      await api.setLobbyPresence(gameId, userId, true);
    } catch (error) {
      logGameAction('rematch.lobby-presence.failure', {
        gameId,
        message: error instanceof Error ? error.message : String(error),
        userId,
      });
      setConnectionWarningVisible(true);
      return;
    }
    leaveFinishedGame(Number(roomOwnerId) === Number(userId) ? 'ROOM_CREATED' : 'ROOM_JOINED');
  };
  const handleBack = () => leaveFinishedGame('SETUP');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const runBotTurn = () => {
      // Server-room bots are advanced exclusively by the backend queue. Running
      // this local simulator as well would submit duplicate moves.
      if (gameId) return;
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
  const hasPendingLocalTurnStartNotice = Boolean(
    turnNotices.some((notice) => notice.type === 'start') ||
    queuedServerEvents.some((event) =>
      event.type === 'TURN_STARTED' && Number(event.target_user_id) === Number(userId)
    )
  );
  const hasPendingLocalTurnEndNotice = Boolean(
    turnNotices.some((notice) => notice.type === 'end' || notice.type === 'finish') ||
    queuedServerEvents.some((event) =>
      (event.type === 'TURN_ENDED' || event.type === 'GAME_FINISHED') &&
      (event.target_user_id === null || Number(event.target_user_id) === Number(userId))
    )
  );
  const didLocalWin = Boolean(
    isVictoryPhase && (!gameId || (userId && Number(serverWinnerId) === Number(userId)))
  );
  const hasUnacceptedStealOffer = Boolean(
    activeStealOfferEvent ||
    queuedServerEvents.some((event) =>
      event.type === 'STEAL_OFFERED' && Number(event.target_user_id) === Number(userId)
    )
  );
  const canFlipCard = Boolean(
    !isDrawnCardFlipped &&
    !hasUnacceptedStealOffer &&
    gameState.phase === 'PLAYING' &&
    (!gameId || (
      isServerTurnReady &&
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
    gameState.phase !== 'VICTORY'
  );
  const shouldWatchLocalInactivity = Boolean(
    gameId &&
    userId &&
    !isGameCountingDown &&
    isServerTurnReady &&
    isLocalServerTurn &&
    !isSubmittingMove &&
    (gameState.phase === 'PLAYING' || Boolean(activeStealOfferEvent))
  );
  const inactivityTurnKey = shouldWatchLocalInactivity
    ? `${serverCurrentPlayerId}:${gameState.drawnCard?.id ?? 'no-card'}:${activeStealOfferEvent?.id ?? (activeStealer ? 'steal' : 'turn')}`
    : null;

  useEffect(() => {
    if (!inactivityTurnKey || !gameId || !userId) {
      inactivityWarningCountRef.current = 0;
      inactivityKickInFlightRef.current = false;
      setIsTurnInactive(false);
      setInactivityWarningVisible(false);
      setInactivityWarningCount(0);
      setInactivitySecondsRemaining(null);
      return;
    }

    // A steal timeout starts when the server offers the steal, not after the
    // player eventually accepts it. Account for time already spent behind an
    // earlier result animation or while the app was reconnecting.
    const offeredAt = activeStealOfferEvent
      ? Date.parse(activeStealOfferEvent.created_at)
      : Number.NaN;
    const startedAt = Number.isFinite(offeredAt) ? offeredAt : Date.now();
    const deadline = startedAt + INACTIVITY_KICK_MS;
    inactivityWarningCountRef.current = 0;
    inactivityKickInFlightRef.current = false;
    setInactivityWarningCount(0);
    setInactivitySecondsRemaining(null);

    const warningTimers = [1, 2, 3].map((warningNumber) => setTimeout(() => {
      inactivityWarningCountRef.current = warningNumber;
      setInactivityWarningCount(warningNumber);
      if (warningNumber >= 3) {
        setInactivitySecondsRemaining(Math.max(1, Math.ceil((deadline - Date.now()) / 1000)));
      }
      setIsTurnInactive(true);
      setInactivityWarningVisible(true);
      playSound('bell');
    }, Math.max(0, startedAt + warningNumber * INACTIVITY_WARNING_MS - Date.now())));

    const countdownTimer = setInterval(() => {
      // Keep “1” visible through a short grace period. Without this clamp the
      // removal request and the interval raced at the deadline, producing 3, 2,
      // then immediate removal with no visible 1.
      const remaining = Math.max(1, Math.ceil((deadline - Date.now()) / 1000));
      if (inactivityWarningCountRef.current >= 3) setInactivitySecondsRemaining(remaining);
    }, 1_000);

    const kickTimer = setTimeout(() => {
      if (inactivityKickInFlightRef.current) return;
      inactivityKickInFlightRef.current = true;
      setInactivityWarningVisible(false);
      logGameAction('inactivity.kick.start', {
        finalSecondGraceMs: INACTIVITY_FINAL_SECOND_GRACE_MS,
        gameId,
        playerId: userId,
        timeoutMs: INACTIVITY_KICK_MS,
      });
      void api.expireInactivePlayer(gameId, userId)
        .then((game) => {
          const reason = game.termination_reason ?? 'player_inactive';
          logGameAction('inactivity.kick.success', { gameId, playerId: userId, reason });
          setRoomExitReason(reason);
        })
        .catch((error) => {
          inactivityKickInFlightRef.current = false;
          logGameAction('inactivity.kick.failure', {
            gameId,
            message: error instanceof Error ? error.message : String(error),
            playerId: userId,
          });
          setConnectionWarningVisible(true);
        });
    }, Math.max(0, deadline + INACTIVITY_FINAL_SECOND_GRACE_MS - Date.now()));

    return () => {
      warningTimers.forEach(clearTimeout);
      clearInterval(countdownTimer);
      clearTimeout(kickTimer);
    };
  }, [activeStealOfferEvent, gameId, inactivityTurnKey, userId]);

  const faceDownPrompt = hasPendingLocalTurnStartNotice || hasUnacceptedStealOffer
    ? ''
    : gameId && !isLocalServerTurn
    ? currentActingPlayer?.name
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
  const isCardFooterWaiting = Boolean(
    hasPendingLocalTurnStartNotice ||
    hasPendingLocalTurnEndNotice ||
    hasUnacceptedStealOffer ||
    (gameId && isLocalServerTurn && (!isServerTurnReady || isSubmittingMove))
  );

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
    setGameRuntime({
      canPlaceCard: canOfferLaneInsertion(
        gameState.phase === 'PLAYING' &&
        isDrawnCardFlipped &&
        Boolean(currentActingPlayer) &&
        !currentActingPlayer?.isBot &&
          (!gameId || (isServerTurnReady && !isSubmittingMove && Number(serverCurrentPlayerId) === Number(userId))),
        laneInputsLockedAfterAnswer,
      ),
      currentActingPlayer,
      localPlayer,
      drawnCard: gameState.drawnCard,
      isDrawnCardFlipped,
      isDrawnCardScoreRevealed,
      guessHistory: gameState.guessHistory,
      chatMessages,
      chatMessagesHydrated,
      hiddenChatMessageIds,
      reportChatMessageLocally,
      sendChatMessage,
      handleSlotSelect,
      handleStealChoice,
      leaveFinishedGame,
      leaveActiveGame,
      lastInsertedCardId,
      lastResultCardScore,
      lastStealWasFromLocalPlayer,
      stayOnLaneAfterAnswer,
      handleLaneResultFadeComplete,
      completeLaneResultPresentation,
      completeTurnNoticePresentation: () => completeCurrentServerEvent(['TURN_STARTED', 'TURN_ENDED', 'TURN_HOLD']),
      hasPendingLaneAnimation: selectedSlotResult !== null || isLaneCollapsing,
      inactivityWarningVisible,
      inactivityWarningCount,
      inactivitySecondsRemaining,
      roomExitReason,
      connectionWarningVisible,
      closePlayerLane: () => setSelectedLanePlayerId(null),
      isPlayerLaneOpen: selectedLanePlayerId !== null,
      isTurnInactive,
      dismissInactivityWarning: () => {
        setIsTurnInactive(false);
        setInactivityWarningVisible(false);
      },
      laneResult,
      selectedSlotIndex,
      selectedSlotResult,
      phase: gameState.phase,
      players: gameState.players,
      activeStealer,
      stealDecisionKey: activeStealOfferEvent ? String(activeStealOfferEvent.id) : null,
      stealDecisionVisible: Boolean(
        activeStealOfferEvent &&
        isStealPhase &&
        activeStealer &&
        !activeStealer.isBot &&
        (!gameId || Number(activeStealer.id) === Number(userId))
      ),
    });
  }, [activeStealOfferEvent, chatMessages, chatMessagesHydrated, completeCurrentServerEvent, completeLaneResultPresentation, connectionWarningVisible, currentActingPlayer, gameId, gameState, hasPendingLocalTurnEndNotice, hasPendingLocalTurnStartNotice, hiddenChatMessageIds, inactivitySecondsRemaining, inactivityWarningCount, inactivityWarningVisible, isDrawnCardFlipped, isDrawnCardScoreRevealed, isLaneCollapsing, isServerTurnReady, isSubmittingMove, isTurnInactive, laneInputsLockedAfterAnswer, laneResult, lastInsertedCardId, lastResultCardScore, lastStealWasFromLocalPlayer, localPlayer, reportChatMessageLocally, roomExitReason, selectedLanePlayerId, selectedSlotIndex, selectedSlotResult, sendChatMessage, serverCurrentPlayerId, setGameRuntime, stayOnLaneAfterAnswer, userId]);

  useEffect(() => {
    if (!didLocalWin || winnerCelebratedRef.current) return;
    winnerCelebratedRef.current = true;
    playSound('applause');
  }, [didLocalWin]);

  useEffect(() => {
    if (!isVictoryPhase) {
      victoryTrophyFloat.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(victoryTrophyFloat, { duration: 1800, easing: Easing.inOut(Easing.sin), toValue: 1, useNativeDriver: true }),
      Animated.timing(victoryTrophyFloat, { duration: 1800, easing: Easing.inOut(Easing.sin), toValue: 0, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [isVictoryPhase, victoryTrophyFloat]);

  useEffect(() => {
    const finished = gameState.phase === 'VICTORY' || gameState.phase === 'GAME_OVER';
    if (!finished || gameFinishedAnnouncedRef.current) return;
    gameFinishedAnnouncedRef.current = true;
    setTurnNotices([{
      id: ++turnNoticeIdRef.current,
      type: 'finish',
    }]);
    router.replace('/game');
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
            paddingTop: isVictoryPhase ? 73 : isGameOverPhase ? 118 : 104,
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
                      onPress={() => setSelectedLanePlayerId(String(p.id))}
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
                onPressIn={() => {
                  logGameAction('card.touch', {
                    canFlipCard,
                    canReflipWhileStealPending,
                    cardId: gameState.drawnCard?.id,
                    flipped: isDrawnCardFlipped,
                    isLocalServerTurn,
                    isServerTurnReady,
                    isSubmittingMove,
                    pendingTurnStartNotice: hasPendingLocalTurnStartNotice,
                    phase: gameState.phase,
                  });
                }}
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
                      borderColor: '#facc15',
                      borderRadius: 18,
                      borderWidth: 5,
                      height: drawnCardHeight,
                      justifyContent: 'center',
                      overflow: 'hidden',
                      width: '100%',
                    }}
                  >
                    <CardBackDecoration />
                    <View style={{ borderColor: 'rgba(251,191,36,0.35)', borderRadius: 11, borderWidth: 2, bottom: 9, left: 9, position: 'absolute', right: 9, top: 9 }} />
                    <MiseryLogo />
                    {isCardFooterWaiting ? (
                      <View className="absolute bottom-7 left-6 right-6 flex-row items-center justify-center" style={{ gap: 8 }}>
                        <Text className="font-mono text-[10px] font-black uppercase tracking-[3px] text-amber-400/70">
                          GAME MASTER
                        </Text>
                        <ActivityIndicator color="rgba(251,191,36,0.7)" size="small" />
                      </View>
                    ) : (
                      <Animated.Text
                        adjustsFontSizeToFit
                        className="absolute bottom-8 left-6 right-6 text-center font-mono text-[10px] font-black uppercase tracking-[3px] text-amber-400/70"
                        minimumFontScale={0.7}
                        numberOfLines={1}
                        style={{ transform: [{ translateY: cardPromptFloat }] }}
                      >
                        {faceDownPrompt}
                      </Animated.Text>
                    )}
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
              <Animated.View style={{ height: 120, opacity: victoryTrophyFloat.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }), transform: [{ translateY: victoryTrophyFloat.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }], width: 120 }}>
                <Image accessibilityLabel={isBs ? 'Pobjednički pehar' : 'Victory trophy'} resizeMode="contain" source={VICTORY_TROPHY_IMAGE} style={{ height: '100%', width: '100%' }} />
              </Animated.View>
              <Text className="mt-4 text-center font-mono text-[10px] font-black uppercase tracking-[4px] text-amber-300">
                {isBs ? 'KONAČNI POREDAK' : 'FINAL STANDINGS'}
              </Text>
              <Text className="mt-1 text-center text-3xl font-black uppercase tracking-tight text-white">
                {isBs ? 'IMAMO POBJEDNIKA!' : 'WE HAVE A CHAMPION!'}
              </Text>
              <Text className="mt-2 max-w-[290px] text-center text-xs leading-5 text-neutral-400">
                {isBs ? 'Staza patnje je završena. Pogledajte konačni poredak.' : 'The Misery Lane is complete. Here are the final rankings.'}
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
                          <Text style={{ color: isWinner ? '#0a0a0a' : medalColor, fontFamily: 'BebasNeue_400Regular', fontSize: 34, fontWeight: '700', lineHeight: 38 }}>{rank}</Text>
                          <Text className={`mt-1 text-[16px] font-black uppercase leading-[18px] ${isWinner ? 'text-neutral-950/80' : 'text-neutral-300'}`} style={{ fontFamily: 'BebasNeue_400Regular', letterSpacing: 0.8 }}>
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
                          <Text style={{ color: rankColor, fontFamily: 'BebasNeue_400Regular', fontSize: 29, height: 44, includeFontPadding: false, lineHeight: 44, textAlign: 'center', textAlignVertical: 'center', width: 44 }}>{index + 1}</Text>
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
              <Text className="max-w-[300px] text-xs text-neutral-400 leading-relaxed text-center">{isBs ? `Izgubili ste sve živote! Uspjeli ste dodati ${currentPlayer.lane.length - 3} novih kartica u svoju Stazu patnje.` : `You ran out of lives! You managed to add ${currentPlayer.lane.length - 3} new cards to your Misery Lane.`}</Text>
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

      <PlayerLaneModal
        language={language}
        onClose={() => setSelectedLanePlayerId(null)}
        player={gameState.players.find((player) => String(player.id) === selectedLanePlayerId) ?? null}
      />

      <Modal visible={isLaneSheetOpen && gameState.phase === 'PLAYING'} transparent animationType="slide" onRequestClose={() => setIsLaneSheetOpen(false)}>
        <View className="flex-1 bg-neutral-950">
          <View
            className="bg-neutral-900 px-5 pb-4 border-b border-neutral-800 flex-row items-center justify-between"
            style={{ paddingTop: 64 }}
          >
            <View>
              <Text className="text-base font-black tracking-widest uppercase text-amber-400">{isBs ? 'STAZA PATNJE' : 'MISERY LANE'}</Text>
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
            <Text className="text-center text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold mb-6">{isBs ? 'Gdje se ovaj događaj uklapa u tvoju Stazu patnje?' : 'Where does this fit in your Misery Lane?'}</Text>
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
                              ? isBs ? `(manje od ${card.index.toFixed(2)})` : `(less than ${card.index.toFixed(2)})`
                              : isBs ? `između ${currentActingPlayer.lane[idx - 1].index.toFixed(2)} i ${card.index.toFixed(2)}` : `between ${currentActingPlayer.lane[idx - 1].index.toFixed(2)} and ${card.index.toFixed(2)}`}
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                  <View className="relative flex-row items-center mt-1">
                    <View className="absolute -left-[25px] w-2.5 h-2.5 rounded-full bg-amber-400 border border-neutral-950" />
                    <View className="flex-1 flex-row items-center gap-3.5 bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-900">
                      <View className="w-12 h-8 rounded-lg bg-neutral-950 items-center justify-center border border-neutral-900">
                        <Text className="font-mono text-amber-400 font-black text-xs">{card.index.toFixed(2)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-black uppercase tracking-wide text-neutral-200" numberOfLines={2}>{cardTitle(card, language)}</Text>
                        {cardDescription(card, language) && <Text className="text-[11px] text-neutral-500" numberOfLines={2}>{cardDescription(card, language)}</Text>}
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
                      <Text className="text-[11px] text-neutral-500">{isBs ? `(više od ${currentActingPlayer.lane[currentActingPlayer.lane.length - 1].index.toFixed(2)})` : `(greater than ${currentActingPlayer.lane[currentActingPlayer.lane.length - 1].index.toFixed(2)})`}</Text>
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
