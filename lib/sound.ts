import * as Haptics from 'expo-haptics';

// Lightweight tactile + audio feedback replacement for the web's Web Audio synth.
// The original game used short synthesized sounds; on native we map them to
// haptic notifications so play still feels responsive.

export type SoundType = 'correct' | 'wrong' | 'victory' | 'click' | 'steal';

export function playSound(type: SoundType) {
  try {
    switch (type) {
      case 'correct':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'wrong':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'steal':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'victory':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'click':
      default:
        Haptics.selectionAsync();
        break;
    }
  } catch {
    // ignore – haptics unavailable (e.g. web/preview)
  }
}
