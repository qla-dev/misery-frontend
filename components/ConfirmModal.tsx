import React from 'react';
import { Modal, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ButtonTab } from './ButtonTab';

type ConfirmModalProps = {
  children: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  onCancel?: () => void;
  onConfirm: () => void;
  onRequestClose?: () => void;
  visible: boolean;
};

export function ConfirmModal({
  children,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  onRequestClose = onConfirm,
  visible,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel?.();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-black/85 p-4">
        <View className="w-full max-w-sm">
          <View className="relative rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            {children}
            <View className="mt-4">
              <ButtonTab
                category="button"
                onPress={handleConfirm}
                size="100"
                type="primary"
              >
                {confirmLabel}
              </ButtonTab>
            </View>
            {cancelLabel && onCancel && (
              <View className="mt-3">
                <ButtonTab
                  category="button"
                  onPress={handleCancel}
                  size="100"
                  type="secondary"
                >
                  {cancelLabel}
                </ButtonTab>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
