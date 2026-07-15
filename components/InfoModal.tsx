import { useGame } from '@/context/GameContext';
import { ScrollView, useWindowDimensions } from 'react-native';
import { ConfirmModal } from './ConfirmModal';
import { RulebookContent } from './RulebookContent';

export function InfoModal({ onLeaveGame }: { onLeaveGame?: () => void }) {
  const { height } = useWindowDimensions();
  const { language, infoModalOpen, setInfoModalOpen } = useGame();
  const isBs = language === 'bs';

  return (
    <ConfirmModal
      confirmLabel={isBs ? 'RAZUMIJEM' : 'GOT IT'}
      cancelLabel={onLeaveGame ? (isBs ? 'NAPUSTI IGRU' : 'LEAVE GAME') : undefined}
      maxWidth={540}
      onCancel={onLeaveGame ? () => {
        setInfoModalOpen(false);
        onLeaveGame();
      } : undefined}
      onConfirm={() => setInfoModalOpen(false)}
      onRequestClose={() => setInfoModalOpen(false)}
      visible={infoModalOpen}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 4, paddingHorizontal: 12 }}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        style={{ marginHorizontal: -12, maxHeight: Math.max(320, height - (onLeaveGame ? 260 : 210)) }}
      >
        <RulebookContent compact />
      </ScrollView>
    </ConfirmModal>
  );
}
