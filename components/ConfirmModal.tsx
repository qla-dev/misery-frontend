import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ButtonTab } from './ButtonTab';
import { FullWindowOverlay } from 'react-native-screens';

type ConfirmModalProps = {
  children: React.ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  confirmLoading?: boolean;
  confirmType?: 'primary' | 'secondary' | 'third' | 'success' | 'danger';
  onCancel?: () => void;
  onConfirm: () => void;
  onRequestClose?: () => void;
  visible: boolean;
  maxWidth?: number;
  fullWindowOverlay?: boolean;
};

export function ConfirmModal({
  children,
  cancelLabel,
  confirmLabel,
  confirmLoading = false,
  confirmType = 'primary',
  onCancel,
  onConfirm,
  onRequestClose = onConfirm,
  visible,
  maxWidth = 384,
  fullWindowOverlay = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel?.();
  };

  if (!visible) return null;

  const content = (
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
                type={confirmType}
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
  );

  if (fullWindowOverlay && Platform.OS === 'ios') {
    return <FullWindowOverlay>{content}</FullWindowOverlay>;
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onRequestClose}
      transparent
      visible={visible}
    >
      {content}
    </Modal>
  );
}
