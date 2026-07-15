import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ButtonTab } from './ButtonTab';

type ConfirmModalProps = {
  children: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  confirmLoading?: boolean;
  onCancel?: () => void;
  onConfirm: () => void;
  onRequestClose?: () => void;
  visible: boolean;
  maxWidth?: number;
};

export function ConfirmModal({
  children,
  cancelLabel,
  confirmLabel,
  confirmLoading = false,
  onCancel,
  onConfirm,
  onRequestClose = onConfirm,
  visible,
  maxWidth = 384,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 items-center justify-center bg-black/85 p-4"
      >
        <View className="w-full" style={{ maxWidth }}>
          <View className="relative rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            {children}
            <View className="mt-4">
              <ButtonTab
                category="button"
                disabled={confirmLoading}
                onPress={handleConfirm}
                size="100"
                type="primary"
              >
                {confirmLoading ? (
                  <View className="flex-row items-center justify-center gap-2">
                    <ActivityIndicator color="#737373" size="small" />
                    <Text className="text-sm font-black uppercase tracking-wider text-neutral-500">{confirmLabel}</Text>
                  </View>
                ) : confirmLabel}
              </ButtonTab>
            </View>
            {cancelLabel && onCancel && (
              <View className="mt-3">
                <ButtonTab
                  category="button"
                  disabled={confirmLoading}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
