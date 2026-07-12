import { useGame } from '@/context/GameContext';
import { Card } from '@/components/Card';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { TabFadeView } from '@/components/TabFadeView';

function SelectedInsertSlot({ isBs, result, shouldFade }: { isBs: boolean; result: 'success' | 'failure'; shouldFade: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!shouldFade) return;
    Animated.timing(opacity, {
      duration: 2000,
      toValue: 0,
      useNativeDriver: true,
    }).start();
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

function LaneCard({ card, isBs, isNew }: { card: any; isBs: boolean; isNew: boolean }) {
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
          <Text className="font-mono text-xl font-black text-amber-400">{card.index.toFixed(1)}</Text>
          <View className="flex-1">
            <Text className="text-base font-black uppercase leading-5 text-neutral-100">
              {isBs ? card.titleBs : card.titleEn}
            </Text>
            {(card.descriptionBs || card.descriptionEn) && (
              <Text className="mt-1 text-xs leading-5 text-neutral-500">
                {isBs ? card.descriptionBs : card.descriptionEn}
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
  const player = gameRuntime?.currentActingPlayer;

  if (!player) {
    return <TabFadeView><View className="flex-1 bg-neutral-950" /></TabFadeView>;
  }

  return (
    <TabFadeView><ScrollView
      className="flex-1 bg-neutral-950 px-5"
      contentContainerStyle={{ paddingBottom: 120, paddingTop: 104 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-base font-black uppercase tracking-widest text-amber-400">
        {isBs ? 'TRAKA BIJEDE' : 'MISERY LANE'}
      </Text>
      <Text className="mb-6 mt-2 text-xs leading-5 text-neutral-400">
        {gameRuntime.canPlaceCard
          ? isBs
            ? 'Odaberi gdje pripada okrenuta karta.'
            : 'Choose where the flipped card belongs.'
          : isBs
            ? 'Traka je dostupna za pregled. Umetanje će se aktivirati na tvom potezu nakon okretanja karte.'
            : 'The lane is available to view. Placement activates on your turn after you flip the card.'}
      </Text>

      <View style={{ gap: 12 }}>
        {player.lane.map((card: any, index: number) => (
          <View key={card.id} style={{ gap: 12 }}>
            {gameRuntime.selectedSlotIndex === index && gameRuntime.selectedSlotResult ? (
              <SelectedInsertSlot
                isBs={isBs}
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
