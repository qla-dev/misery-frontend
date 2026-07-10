import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { AlertOctagon, ArrowRight, Check, Heart, Loader2, ShieldAlert, Trophy, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Player, Language, GameState, GameMode } from '@/types';
import { CARD_DECK } from '@/data/cards';
import CardItem from './CardItem';
import Illustration from './Illustration';
import { LiquidGlassBar } from './LiquidGlassBar';
import { GradientButton } from './GradientButton';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';

interface GameBoardProps {
  mode: GameMode;
  initialPlayers: { name: string; color: string; isBot?: boolean }[];
  targetScore: number;
  deckType?: 'NORMAL' | 'SPICY';
}

export default function GameBoard({
  mode,
  initialPlayers,
  targetScore,
  deckType = 'NORMAL',
}: GameBoardProps) {
  const { language, toggleLanguage, muted, setMuted, showRules, setShowRules } = useGame();
  const isBs = language === 'bs';

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
  const [shakeCard, setShakeCard] = useState(false);
  const [isLaneSheetOpen, setIsLaneSheetOpen] = useState(false);

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
          id: `player-${idx}`,
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
    triggerSound('click');
    const actingPlayerIndex = activeStealerIndex !== undefined ? activeStealerIndex : currentPlayerIndex;
    const actingPlayer = players[actingPlayerIndex];
    const isCorrect = verifySlotChoice(actingPlayer.lane, drawnCard, slotIdx);

    if (isCorrect) {
      triggerSound('correct');
      const updatedPlayers = players.map((p, idx) => {
        if (idx === actingPlayerIndex) {
          const newLane = [...p.lane];
          newLane.splice(slotIdx, 0, drawnCard);
          return { ...p, lane: newLane, score: newLane.length };
        }
        return p;
      });
      const historyLog = {
        playerName: actingPlayer.name,
        cardTitle: isBs ? drawnCard.titleBs : drawnCard.titleEn,
        guessIndex: slotIdx,
        correctIndex: slotIdx,
        success: true,
      };
      setGameState((prev) => {
        const checkVictory = updatedPlayers[actingPlayerIndex].lane.length >= targetScore;
        return {
          ...prev,
          players: updatedPlayers,
          phase: checkVictory ? 'VICTORY' : 'CORRECT_REVEAL',
          guessHistory: [historyLog, ...prev.guessHistory],
        };
      });
    } else {
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
      } else {
        const nextStealerIdx = (actingPlayerIndex + 1) % players.length;
        if (nextStealerIdx === currentPlayerIndex) {
          setGameState((prev) => ({ ...prev, phase: 'WRONG_REVEAL', guessHistory: [historyLog, ...prev.guessHistory] }));
        } else {
          setGameState((prev) => ({ ...prev, phase: 'STEAL_DECISION', activeStealerIndex: nextStealerIdx, guessHistory: [historyLog, ...prev.guessHistory] }));
        }
      }
    }
  };

  const handleStealChoice = (accept: boolean) => {
    const { players, currentPlayerIndex, activeStealerIndex, drawnCard } = gameState;
    if (activeStealerIndex === undefined || !drawnCard) return;
    if (accept) {
      triggerSound('steal');
      setGameState((prev) => ({ ...prev, phase: 'PLAYING' }));
    } else {
      triggerSound('click');
      const nextStealerIdx = (activeStealerIndex + 1) % players.length;
      if (nextStealerIdx === currentPlayerIndex) {
        setGameState((prev) => ({ ...prev, phase: 'WRONG_REVEAL', activeStealerIndex: undefined }));
      } else {
        setGameState((prev) => ({ ...prev, activeStealerIndex: nextStealerIdx }));
      }
    }
  };

  const handleProceedNextRound = () => {
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
        <View className="px-4 pt-4 pb-32 space-y-4">
          {mode === 'MULTIPLAYER' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2.5">
                {gameState.players.map((p, idx) => {
                  const isActiveTurn = idx === gameState.currentPlayerIndex;
                  const isStealing = activeStealer && p.id === activeStealer.id;
                  return (
                    <View
                      key={p.id}
                      className={`px-3 py-2 rounded-xl flex-row items-center gap-2 border ${
                        isActiveTurn
                          ? 'bg-amber-400 border-yellow-500'
                          : isStealing
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-neutral-900/40 border-neutral-900/80'
                      }`}
                    >
                      <View className={`w-2 h-2 rounded-full ${p.color.split(' ')[0]} ${p.color.split(' ')[1]}`} />
                      <Text className={`text-xs font-bold ${isActiveTurn ? 'text-black' : 'text-neutral-400'}`}>{p.name}</Text>
                      <View className="bg-black/10 px-1.5 py-0.5 rounded">
                        <Text className={`text-[10px] font-mono ${isActiveTurn ? 'text-black' : 'text-neutral-400'}`}>{p.lane.length} pts</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-4 flex-row justify-between items-center">
            <View>
              {mode === 'SOLO' ? (
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] text-neutral-500 font-mono uppercase font-bold tracking-wider">{isBs ? 'Životi:' : 'Lives:'}</Text>
                  <View className="flex-row gap-1">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <Heart
                        key={idx}
                        size={16}
                        color={idx < (currentPlayer.lives || 0) ? '#ef4444' : '#404040'}
                        fill={idx < (currentPlayer.lives || 0) ? '#ef4444' : 'none'}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <View className="flex-col">
                  <Text className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest font-bold">{isBs ? 'TRENUTNI IGRAČ' : 'CURRENT PLAYER'}</Text>
                  <Text className="text-xs font-black text-white mt-1 uppercase tracking-wider">{currentPlayer.name}</Text>
                </View>
              )}
            </View>
            <View className="items-end">
              <Text className="text-[9px] text-neutral-500 font-mono uppercase font-bold tracking-widest">{isBs ? 'CILJ KARATA' : 'GOAL CARDS'}</Text>
              <Text className="text-sm font-black text-amber-400 font-mono tracking-tight">
                {currentPlayer.lane.length} / {targetScore}
              </Text>
            </View>
          </View>

          {!isVictoryPhase && !isGameOverPhase && (
            <View className="items-center justify-center py-2">
              <View className="mb-4 px-4 py-1.5 rounded-full bg-neutral-900/60 border border-neutral-900 items-center">
                {isStealPhase ? (
                  <Text className="text-red-400 text-[10px] font-mono tracking-wider uppercase font-bold">{isBs ? `MOGUĆNOST KRAĐE ZA ${activeStealer?.name}!` : `STEAL OPTION FOR ${activeStealer?.name}!`}</Text>
                ) : activeStealer ? (
                  <Text className="text-blue-400 text-[10px] font-mono">🕵️ {isBs ? `${activeStealer.name} pokušava ukrasti!` : `${activeStealer.name} is attempting a steal!`}</Text>
                ) : (
                  <Text className="text-[10px] text-neutral-300 tracking-wider uppercase font-mono font-bold">
                    👤 {isBs ? 'Na redu je:' : 'Current Turn:'} <Text className="text-amber-400 font-extrabold">{currentPlayer.name}</Text>
                  </Text>
                )}
              </View>

              <View className={`relative ${shakeCard ? 'scale-95' : ''}`}>
                <CardItem
                  card={gameState.drawnCard}
                  state={isCorrectPhase || isWrongPhase ? 'face-up' : 'mystery'}
                  language={language}
                  size="lg"
                  highlighted={isWrongPhase}
                />
                {isCorrectPhase && (
                  <View className="absolute inset-0 bg-emerald-950/95 rounded-xl items-center justify-center p-4 z-10 border-2 border-emerald-500/30">
                    <View className="w-12 h-12 rounded-full bg-emerald-500 items-center justify-center mb-3">
                      <Check size={24} color="#fff" strokeWidth={4} />
                    </View>
                    <Text className="text-lg font-black uppercase text-white tracking-wider">{isBs ? 'TAČNO!' : 'CORRECT!'}</Text>
                    <Text className="text-[10px] text-emerald-400/90 font-mono mt-1.5 text-center">{isBs ? 'Događaj je ubačen.' : 'Event successfully placed.'}</Text>
                  </View>
                )}
                {isWrongPhase && (
                  <View className="absolute inset-0 bg-red-950/95 rounded-xl items-center justify-center p-4 z-10 border-2 border-red-500/30">
                    <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center mb-3">
                      <X size={24} color="#fff" strokeWidth={4} />
                    </View>
                    <Text className="text-lg font-black uppercase text-white tracking-wider">{isBs ? 'NETAČNO!' : 'INCORRECT!'}</Text>
                    <Text className="text-[10px] text-red-400/90 font-mono mt-1.5 text-center">{isBs ? 'Previše ili premalo bijede.' : 'Too high or too low.'}</Text>
                  </View>
                )}
              </View>
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

          {(isCorrectPhase || isWrongPhase) && (
            <View className="bg-neutral-900/40 border border-neutral-900 rounded-2xl p-5 items-center space-y-4">
              <Text className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold">{isBs ? 'STVARNI INDEKS BIJEDE JE BIO:' : 'THE ACTUAL MISERY INDEX WAS:'}</Text>
              <Text className="text-4xl font-black text-amber-400 font-mono">{gameState.drawnCard?.index.toFixed(1)}</Text>
              <Text className="text-[10px] text-neutral-500 italic">{isBs ? 'Rezultat je potvrđen.' : 'The outcome is locked.'}</Text>
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

          {gameState.guessHistory.length > 0 && (
            <View className="bg-neutral-900/30 border border-neutral-900 rounded-2xl p-3.5 space-y-2">
              <Text className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider font-bold">{isBs ? 'HISTORIJA ODIGRAVANJA' : 'RECENT MOVES'}</Text>
              <View className="space-y-1.5">
                {gameState.guessHistory.slice(0, 5).map((log, idx) => (
                  <View key={idx} className="flex-row items-start gap-1.5 border-b border-neutral-900/30 pb-1.5 last:border-b-0">
                    <View className={`w-1.5 h-1.5 rounded-full mt-1.5 ${log.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <Text className="text-[10px] font-mono text-neutral-400 leading-snug flex-1">
                      <Text className="text-neutral-300 font-bold">{log.playerName}</Text> {isBs ? 'je pokušao' : 'guessed'} "<Text className="text-amber-400 font-medium">{log.cardTitle}</Text>" → <Text className={log.success ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>{log.success ? (isBs ? 'TAČNO' : 'CORRECT') : (isBs ? 'NETAČNO' : 'FAILED')}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className="pt-8 pb-4 flex-row items-center justify-between border-t border-neutral-900/30">
            <View className="flex-row gap-2">
              <Text className="text-[8px] text-neutral-600 font-mono">{isBs ? 'Mod:' : 'Mode:'} <Text className="text-amber-500 font-bold">{mode}</Text></Text>
              <Text className="text-neutral-700 text-[8px] font-mono">•</Text>
              <Text className="text-[8px] text-neutral-600 font-mono">{isBs ? 'Špil:' : 'Deck:'} <Text className="text-amber-500 font-bold">{deckType}</Text></Text>
            </View>
            <View className="flex-row gap-2.5 font-bold">
              <Text className="text-[8px] text-neutral-600 font-mono">{isBs ? 'U špilu:' : 'Remaining:'} <Text className="text-neutral-400">{gameState.deck.length}</Text></Text>
              <Text className="text-[8px] text-neutral-600 font-mono">{isBs ? 'Izbačeno:' : 'Discard:'} <Text className="text-neutral-400">{gameState.discardPile.length}</Text></Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LiquidGlassBar position="bottom">
        <View className="px-4 py-3">
          {gameState.phase === 'PLAYING' &&
            (currentActingPlayer.isBot ? (
              <View className="py-4 bg-neutral-900 rounded-xl items-center flex-row gap-2 border border-neutral-800">
                <Loader2 size={16} color="#fbbf24" className="animate-spin" />
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">{isBs ? `${currentActingPlayer.name} bira slot...` : `${currentActingPlayer.name} is choosing...`}</Text>
              </View>
            ) : (
              <GradientButton onPress={() => setIsLaneSheetOpen(true)}>
                <Text className="text-black font-black uppercase text-xs tracking-wider">📋 {isBs ? 'TRENUTNI RASPORED' : 'CURRENT SCHEDULE'}</Text>
              </GradientButton>
            ))}

          {isStealPhase && activeStealer &&
            (activeStealer.isBot ? (
              <View className="py-4 bg-neutral-900 rounded-xl items-center flex-row gap-2 border border-neutral-800">
                <Loader2 size={16} color="#fbbf24" className="animate-spin" />
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">🤖 {activeStealer.name} {isBs ? 'razmišlja o krađi...' : 'is deciding...'}</Text>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <GradientButton onPress={() => handleStealChoice(true)}>
                  <Text className="text-black font-black uppercase text-xs tracking-wider">{isBs ? 'DA, POKUŠAJ KRAĐU' : 'YES, TRY STEAL'}</Text>
                </GradientButton>
                <Pressable onPress={() => handleStealChoice(false)} className="flex-1 py-4 bg-neutral-900 rounded-xl items-center justify-center border border-neutral-800">
                  <Text className="text-neutral-400 font-bold uppercase text-xs tracking-wider">{isBs ? 'NE, PROSLIJEDI' : 'NO, PASS'}</Text>
                </Pressable>
              </View>
            ))}

          {(isCorrectPhase || isWrongPhase) &&
            (currentActingPlayer.isBot ? (
              <View className="py-4 bg-neutral-900 rounded-xl items-center flex-row gap-2 border border-neutral-800">
                <Loader2 size={16} color="#fbbf24" className="animate-spin" />
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500">{isBs ? 'SLJEDEĆI KRUG (AUTOMATSKI)...' : 'NEXT ROUND (AUTOMATIC)...'}</Text>
              </View>
            ) : (
              <GradientButton onPress={handleProceedNextRound}>
                <Text className="text-black font-black uppercase text-xs tracking-wider">{isBs ? 'SLJEDEĆI KRUG' : 'CONTINUE / NEXT TURN'}</Text>
                <ArrowRight size={16} color="#0a0a0a" strokeWidth={3} />
              </GradientButton>
            ))}
        </View>
      </LiquidGlassBar>

      <Modal visible={isLaneSheetOpen && gameState.phase === 'PLAYING'} transparent animationType="slide" onRequestClose={() => setIsLaneSheetOpen(false)}>
        <View className="flex-1 bg-neutral-950">
          <View className="bg-neutral-900 px-5 py-4 border-b border-neutral-800 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-black tracking-widest uppercase text-amber-400">{isBs ? 'TRENUTNI RASPORED' : 'CURRENT ALIGNMENT'}</Text>
              <Text className="text-[10px] text-neutral-500 font-mono uppercase mt-0.5">{isBs ? 'TRAKA BIJEDE' : 'MISERY LANE'}</Text>
            </View>
            <Pressable onPress={() => setIsLaneSheetOpen(false)} className="p-1.5 rounded-lg bg-neutral-800">
              <X size={16} color="#a3a3a3" />
            </Pressable>
          </View>
          <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
            <Text className="text-center text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold mb-4">{isBs ? 'Gdje se ovaj događaj uklapa u tvoju traku?' : 'Where does this fit in your Misery Lane?'}</Text>
            <View className="relative pl-8 pr-1 py-2 space-y-4">
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
                        <Text className="text-[10px] uppercase tracking-wider text-neutral-500">{isBs ? `${currentActingPlayer.name} bira slot...` : `${currentActingPlayer.name} is choosing...`}</Text>
                      ) : (
                        <>
                          <Text className="font-extrabold text-amber-400">➕ <Text className="font-sans">{isBs ? 'Ubaci ovdje' : 'Insert Here'}</Text></Text>
                          <Text className="text-[9px] text-neutral-500">
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
                        <Text className="text-[11px] font-black uppercase tracking-wide text-neutral-200" numberOfLines={1}>{isBs ? card.titleBs : card.titleEn}</Text>
                        {(card.descriptionBs || card.descriptionEn) && <Text className="text-[9px] text-neutral-500" numberOfLines={1}>{isBs ? card.descriptionBs : card.descriptionEn}</Text>}
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
                    <Text className="text-[10px] uppercase tracking-wider text-neutral-500">{isBs ? `${currentActingPlayer.name} bira slot...` : `${currentActingPlayer.name} is choosing...`}</Text>
                  ) : (
                    <>
                      <Text className="font-extrabold text-amber-400">➕ <Text className="font-sans">{isBs ? 'Ubaci ovdje' : 'Insert Here'}</Text></Text>
                      <Text className="text-[9px] text-neutral-500">{isBs ? `(više od ${currentActingPlayer.lane[currentActingPlayer.lane.length - 1].index.toFixed(1)})` : `(greater than ${currentActingPlayer.lane[currentActingPlayer.lane.length - 1].index.toFixed(1)})`}</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showRules} transparent animationType="fade" onRequestClose={() => setShowRules(false)}>
        <View className="flex-1 bg-neutral-950/95 p-6">
      <ScrollView className="flex-1 pt-[100px]" showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center justify-between border-b border-neutral-900 pb-3 mb-4">
              <Text className="text-base font-black text-amber-400 uppercase tracking-widest">📖 {isBs ? 'PRAVILA IGRE' : 'GAME RULES'}</Text>
              <Pressable onPress={() => setShowRules(false)} className="p-1.5 rounded-lg bg-neutral-800">
                <X size={16} color="#a3a3a3" />
              </Pressable>
            </View>
            <View className="space-y-3.5">
              <Text className="text-sm text-neutral-300 leading-6 font-sans">
                {isBs ? 'Dobrodošli u Misery Meter! Cilj igre je da tačno posložite kartice sa nesrećnim životnim događajima na skalu od 0 do 100.' : 'Welcome to Misery Meter! Your goal is to correctly arrange miserable real-life events along your personal Misery Lane from 0 to 100.'}
              </Text>
              <View className="p-3.5 bg-neutral-900/40 rounded-xl border border-neutral-900 space-y-1">
                <Text className="font-bold text-amber-400 block font-mono text-[11px] uppercase tracking-wider">{isBs ? '1. TRACA BIJEDE' : '1. MISERY LANE'}</Text>
                <Text className="text-neutral-300 text-sm leading-6">{isBs ? 'Svaki igrač počinje sa 3 već poredane kartice (od najmanje do najviše bijedne). To je vaša Traka Bijede.' : 'Each player starts with 3 pre-arranged cards, ordered from lowest to highest misery index. This forms your starting lane.'}</Text>
              </View>
              <View className="p-3.5 bg-neutral-900/40 rounded-xl border border-neutral-900 space-y-1">
                <Text className="font-bold text-amber-400 block font-mono text-[11px] uppercase tracking-wider">{isBs ? '2. VAŠ POTEZ' : '2. YOUR TURN'}</Text>
                <Text className="text-neutral-300 text-sm leading-6">{isBs ? 'Izvlači se nova misteriozna kartica. Vidite naziv i ilustraciju, ali je ocjena skrivena. Kliknite na "Ubaci ovdje" dugme na traci gdje mislite da taj događaj pripada.' : 'A new mystery card is drawn. You can read the scenario and see the graphic, but the score is hidden. Tap the "Insert Here" slot in your lane where you guess this card belongs.'}</Text>
              </View>
              <View className="p-3.5 bg-neutral-900/40 rounded-xl border border-neutral-900 space-y-1">
                <Text className="font-bold text-amber-400 block font-mono text-[11px] uppercase tracking-wider">{isBs ? '3. KRAĐE (VIŠE IGRAČA)' : '3. STEALING (MULTIPLAYER)'}</Text>
                <Text className="text-neutral-300 text-sm leading-6">{isBs ? 'Ako pogriješite, drugi igrači po krugu dobijaju ponudan da UKRADU karticu! Oni mogu procijeniti i ubaciti je na svoju traku.' : 'If you guess wrong, other players in clockwise order get a single chance to STEAL the card by correctly placing it in their own lanes.'}</Text>
              </View>
              <View className="p-3.5 bg-neutral-900/40 rounded-xl border border-neutral-900 space-y-1">
                <Text className="font-bold text-amber-400 block font-mono text-[11px] uppercase tracking-wider">{isBs ? '4. KAKO POBIJEDITI' : '4. HOW TO WIN'}</Text>
                <Text className="text-neutral-300 text-sm leading-6">{isBs ? `Prvi igrač koji uspije sakupiti ${targetScore} kartica u svojoj traci pobjeđuje! U solo modu imate 3 života.` : `First player to correctly build a lane of ${targetScore} cards wins! In Solo Mode, you try to build the longest lane with 3 lives.`}</Text>
              </View>
            </View>
          </ScrollView>
          <Pressable onPress={() => setShowRules(false)} className="mt-5 rounded-xl overflow-hidden">
            <View className="bg-amber-400 py-3.5 items-center">
              <Text className="text-black font-extrabold uppercase text-[10px] tracking-wider">{isBs ? 'ZATVORI I IGRAJ' : 'CLOSE & CONTINUE'}</Text>
            </View>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
