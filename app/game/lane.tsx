import { useGame } from '@/context/GameContext';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function MiseryLaneScreen() {
  const { gameRuntime, language } = useGame();
  const isBs = language === 'bs';
  const player = gameRuntime?.currentActingPlayer;

  if (!player) {
    return <View className="flex-1 bg-neutral-950" />;
  }

  return (
    <ScrollView
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
            {gameRuntime.canPlaceCard && (
              <Pressable
                className="items-center rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-3"
                onPress={() => gameRuntime.handleSlotSelect(index)}
              >
                <Text className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {isBs ? 'UMETNI OVDJE' : 'INSERT HERE'}
                </Text>
              </Pressable>
            )}
            <View className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
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
            </View>
          </View>
        ))}
        {gameRuntime.canPlaceCard && (
          <Pressable
            className="items-center rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 px-4 py-3"
            onPress={() => gameRuntime.handleSlotSelect(player.lane.length)}
          >
            <Text className="text-xs font-black uppercase tracking-wider text-amber-400">
              {isBs ? 'UMETNI OVDJE' : 'INSERT HERE'}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
