import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { LaneCard } from '@/components/LaneCard';
import { playClickSound, playHaptic } from '@/lib/sound';
import { Language, Player } from '@/types';

export function PlayerLaneModal({ language, onClose, player }: {
  language: Language;
  onClose: () => void;
  player: Player | null;
}) {
  const isBs = language === 'bs';

  if (!player) return null;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible
    >
      <View accessibilityViewIsModal className="flex-1 bg-neutral-950">
        <View
          className="flex-row items-center justify-between border-b border-neutral-800 bg-neutral-900 px-5 pb-4"
          style={{ paddingTop: 64 }}
        >
          <View className="flex-1 pr-4">
            <Text className="text-base font-black uppercase tracking-widest text-amber-400" numberOfLines={1}>
              {`${isBs ? 'STAZA OD' : 'LANE OF'} ${player.name}`}
            </Text>
            <Text className="mt-1 font-mono text-[10px] font-black uppercase tracking-widest text-neutral-500">
              {`${player.lane.length} ${isBs ? 'KARATA' : 'CARDS'}`}
            </Text>
          </View>
          <Pressable
            className="rounded-xl bg-neutral-800 p-2.5"
            hitSlop={10}
            onPress={() => {
              playClickSound();
              playHaptic('click');
              onClose();
            }}
          >
            <X color="#d4d4d4" size={20} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 48, paddingTop: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-neutral-800" />
            <Text className="font-mono text-[9px] font-black uppercase tracking-[2px] text-neutral-500">
              {isBs ? 'STAZA PATNJE' : 'MISERY LANE'}
            </Text>
            <View className="h-px flex-1 bg-neutral-800" />
          </View>
          <View style={{ gap: 12 }}>
            {player.lane.map((card) => <LaneCard card={card} key={card.id} language={language} />)}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
