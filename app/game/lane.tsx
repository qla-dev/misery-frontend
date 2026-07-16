import { useGame } from '@/context/GameContext';
import { Card } from '@/components/Card';
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { TabFadeView } from '@/components/TabFadeView';
import { cardDescription, cardTitle } from '@/lib/cardText';
import { INSERT_SLOT_FADE_MS } from '@/lib/gameTiming';

function SelectedInsertSlot({ isBs, onFadeComplete, result, shouldFade }: { isBs: boolean; onFadeComplete?: () => void; result: 'success' | 'failure'; shouldFade: boolean }) {
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

  const color = result === 'success' ? '#10b981' : '#ef4444';
  const backgroundColor = result === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)';

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        backgroundColor,
        borderColor: color,
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 2,
        opacity,
        paddingHorizontal: 16,
        paddingVertical: 12,
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

function LaneCard({ card, hiddenScore = false, isBs, isNew }: { card: any; hiddenScore?: boolean; isBs: boolean; isNew: boolean }) {
  const entrance = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (!isNew) {
      entrance.setValue(1);
      return;
    }
    entrance.setValue(0);
    Animated.spring(entrance, {
      damping: 10,
      mass: 0.7,
      stiffness: 150,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance, isNew]);

  return (
    <Animated.View
      style={{
        opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-52, 0] }) },
          { scale: entrance.interpolate({ inputRange: [0, 0.72, 1], outputRange: [0.55, 1.08, 1] }) },
          { rotate: entrance.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '0deg'] }) },
        ],
      }}
    >
      <Card>
        <View className="flex-row items-center gap-4">
          <Text className="font-mono text-xl font-black text-amber-400">
            {hiddenScore ? '?.??' : card.index.toFixed(2)}
          </Text>
          <View className="flex-1">
            <Text className="text-base font-black uppercase leading-5 text-neutral-100">
              {cardTitle(card, isBs ? 'bs' : 'en')}
            </Text>
            {cardDescription(card, isBs ? 'bs' : 'en') && (
              <Text className="mt-1 text-xs leading-5 text-neutral-500">
                {cardDescription(card, isBs ? 'bs' : 'en')}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
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
      {gameRuntime.drawnCard &&
      gameRuntime.selectedSlotResult !== 'success' &&
      gameRuntime.lastInsertedCardId !== gameRuntime.drawnCard.id ? (
        <PendingCardGlow active={Boolean(gameRuntime.canPlaceCard)}>
          <LaneCard
            card={gameRuntime.isDrawnCardFlipped
              ? gameRuntime.drawnCard
              : { ...gameRuntime.drawnCard, titleBs: '????????', titleEn: '????????', descriptionBs: '???', descriptionEn: '???' }}
            hiddenScore={!gameRuntime.isDrawnCardScoreRevealed}
            isBs={isBs}
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
            {gameRuntime.selectedSlotIndex === index && gameRuntime.selectedSlotResult ? (
              <SelectedInsertSlot
                isBs={isBs}
                onFadeComplete={gameRuntime.handleLaneResultFadeComplete}
                result={gameRuntime.selectedSlotResult}
                shouldFade={gameRuntime.laneResult === null}
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
            <LaneCard card={card} isBs={isBs} isNew={card.id === gameRuntime.lastInsertedCardId} />
          </View>
        ))}
        {gameRuntime.selectedSlotIndex === player.lane.length && gameRuntime.selectedSlotResult ? (
          <SelectedInsertSlot
            isBs={isBs}
            onFadeComplete={gameRuntime.handleLaneResultFadeComplete}
            result={gameRuntime.selectedSlotResult}
            shouldFade={gameRuntime.laneResult === null}
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
