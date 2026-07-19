import { useGame } from '@/context/GameContext';
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { LaneCard } from '@/components/LaneCard';
import { TabFadeView } from '@/components/TabFadeView';
import { cardDescription, cardTitle } from '@/lib/cardText';
import { INSERT_SLOT_FADE_MS } from '@/lib/gameTiming';
import { shouldKeepSelectedInputMounted, shouldKeepTopCardVisible } from '@/lib/localMovePresentation';

function SelectedInsertSlot({ isBs, onFadeComplete, result, shouldFade }: { isBs: boolean; onFadeComplete?: () => void; result: 'success' | 'failure' | null; shouldFade: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onFadeCompleteRef = useRef(onFadeComplete);

  useEffect(() => {
    onFadeCompleteRef.current = onFadeComplete;
  }, [onFadeComplete]);

  useEffect(() => {
    if (!shouldFade) return;
    const animation = Animated.timing(opacity, {
      duration: INSERT_SLOT_FADE_MS,
      toValue: 0,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) onFadeCompleteRef.current?.();
    });
    return () => animation.stop();
  }, [opacity, shouldFade]);

  // Keep the exact same slot geometry throughout its lifetime. The result is
  // communicated only through color so the control does not visually jump.
  const color = result === 'success'
    ? '#10b981'
    : result === 'failure'
      ? '#ef4444'
      : '#facc15';
  const borderColor = result === 'success'
    ? 'rgba(16,185,129,0.7)'
    : result === 'failure'
      ? 'rgba(239,68,68,0.7)'
      : 'rgba(250,204,21,0.4)';
  const backgroundColor = result === 'success'
    ? 'rgba(16,185,129,0.12)'
    : result === 'failure'
      ? 'rgba(239,68,68,0.12)'
      : 'rgba(250,204,21,0.05)';

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        backgroundColor,
        borderColor,
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        opacity,
        paddingHorizontal: 16,
        paddingVertical: 12,
        transform: [{
          scale: opacity.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }),
        }],
      }}
    >
      <Text className="text-xs font-black uppercase tracking-wider" style={{ color }}>
        {isBs ? 'UMETNI OVDJE' : 'INSERT HERE'}
      </Text>
    </Animated.View>
  );
}

function PendingCardGlow({ active, children }: { active: boolean; children: ReactNode }) {
  const glow = useRef(new Animated.Value(active ? 0.12 : 0)).current;

  useEffect(() => {
    if (!active) {
      glow.setValue(0);
      return;
    }

    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(glow, { duration: 1200, toValue: 0.2, useNativeDriver: true }),
      Animated.timing(glow, { duration: 1200, toValue: 0.08, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [active, glow]);

  return (
    <View className="mb-6" style={{ position: 'relative' }}>
      {active && (
        <Animated.View
          pointerEvents="none"
          style={{
            backgroundColor: '#facc15',
            borderRadius: 16,
            bottom: -2,
            left: -2,
            opacity: glow,
            position: 'absolute',
            right: -2,
            shadowColor: '#facc15',
            shadowOffset: { height: 0, width: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 7,
            top: -2,
          }}
        />
      )}
      <View className="overflow-hidden rounded-xl border border-amber-400/50 bg-amber-400/5">
        {children}
      </View>
    </View>
  );
}

export default function MiseryLaneScreen() {
  const { gameRuntime, language } = useGame();
  const isBs = language === 'bs';
  // The lane tab belongs to this device's player. Turn ownership may move to
  // another player or stealer, but it must never change the lane being shown.
  const player = gameRuntime?.localPlayer;

  if (!player) {
    return <TabFadeView><View className="flex-1 bg-neutral-950" /></TabFadeView>;
  }

  return (
    <TabFadeView><ScrollView
      className="flex-1 bg-neutral-950 px-5"
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 104 }}
      showsVerticalScrollIndicator={false}
    >
      {gameRuntime.drawnCard && shouldKeepTopCardVisible(
        gameRuntime.drawnCard.id,
        gameRuntime.lastInsertedCardId,
      ) ? (
        <PendingCardGlow active={Boolean(gameRuntime.canPlaceCard)}>
          <LaneCard
            card={gameRuntime.isDrawnCardFlipped
              ? gameRuntime.drawnCard
              : { ...gameRuntime.drawnCard, titleBs: '????????', titleEn: '????????', descriptionBs: '???', descriptionEn: '???' }}
            hiddenScore={!gameRuntime.isDrawnCardScoreRevealed}
            language={language}
            isNew={false}
          />
        </PendingCardGlow>
      ) : null}

      <View className="mb-6 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-neutral-800" />
        <Text className="font-mono text-[9px] font-black uppercase tracking-[2px] text-neutral-500">
          {isBs ? 'STAZA PATNJE' : 'MISERY LANE'}
        </Text>
        <View className="h-px flex-1 bg-neutral-800" />
      </View>

      <View style={{ gap: 12 }}>
        {player.lane.map((card: any, index: number) => (
          <View key={card.id} style={{ gap: 12 }}>
            {shouldKeepSelectedInputMounted(gameRuntime.selectedSlotIndex, index) ? (
              <SelectedInsertSlot
                isBs={isBs}
                onFadeComplete={gameRuntime.handleLaneResultFadeComplete}
                result={gameRuntime.selectedSlotResult}
                shouldFade={gameRuntime.laneResult === null && gameRuntime.selectedSlotResult !== null}
              />
            ) : gameRuntime.canPlaceCard ? (
              <Pressable
                className="items-center rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-3"
                onPress={() => gameRuntime.handleSlotSelect(index)}
              >
                <Text className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {isBs ? 'UMETNI OVDJE' : 'INSERT HERE'}
                </Text>
              </Pressable>
            ) : null}
            <LaneCard card={card} language={language} isNew={card.id === gameRuntime.lastInsertedCardId} />
          </View>
        ))}
        {shouldKeepSelectedInputMounted(gameRuntime.selectedSlotIndex, player.lane.length) ? (
          <SelectedInsertSlot
            isBs={isBs}
            onFadeComplete={gameRuntime.handleLaneResultFadeComplete}
            result={gameRuntime.selectedSlotResult}
            shouldFade={gameRuntime.laneResult === null && gameRuntime.selectedSlotResult !== null}
          />
        ) : gameRuntime.canPlaceCard ? (
          <Pressable
            className="items-center rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-3"
            onPress={() => gameRuntime.handleSlotSelect(player.lane.length)}
          >
            <Text className="text-xs font-black uppercase tracking-wider text-amber-400">
              {isBs ? 'UMETNI OVDJE' : 'INSERT HERE'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView></TabFadeView>
  );
}
