import LottieView from 'lottie-react-native';
import { Modal, Text, View } from 'react-native';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

type LobbyOpeningOverlayProps = {
  changed: boolean;
  color: string;
  isBs?: boolean;
  visible: boolean;
};

export function LobbyOpeningOverlay({ changed, color, isBs = false, visible }: LobbyOpeningOverlayProps) {
  return (
    <Modal animationType="fade" onRequestClose={() => undefined} statusBarTranslucent transparent visible={visible}>
      <View accessibilityViewIsModal className="flex-1 items-center justify-center bg-black/95 px-8">
        <View
          className="w-full max-w-sm items-center"
          style={changed ? { transform: [{ translateY: -30 }] } : undefined}
        >
          <Text className="text-center text-xl font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'OTVARAMO LOBI' : 'OPENING LOBBY'}
          </Text>
          <View className="flex-row items-center justify-center" style={{ gap: 16, marginVertical: 14 }}>
            <LottieView autoPlay loop source={MASCOT_LOTTIE} style={{ height: 132, width: 100 }} />
            <View
              className="h-14 w-14 rounded-full border-2 border-white/20"
              style={{ backgroundColor: color }}
            />
          </View>
          <Text className="text-center text-sm font-bold leading-6 text-neutral-300">
            {changed
              ? isBs
                ? 'Tvoja boja je već zauzeta. Dodijelili smo ti novu boju.'
                : 'Your color is already taken. We assigned you a new color.'
              : isBs
                ? 'Tvoja boja je spremna.'
                : 'Your color is ready.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
