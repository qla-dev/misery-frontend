import React from 'react';
import { Modal, View } from 'react-native';
import { ButtonTab } from './ButtonTab';

type ConfirmModalProps = {
  children: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onRequestClose?: () => void;
  visible: boolean;
};

export function ConfirmModal({
  children,
  confirmLabel,
  onConfirm,
  onRequestClose = onConfirm,
  visible,
}: ConfirmModalProps) {
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
                onPress={onConfirm}
                size="100"
                type="primary"
              >
                {confirmLabel}
              </ButtonTab>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
