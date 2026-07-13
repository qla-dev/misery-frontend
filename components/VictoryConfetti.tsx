import ConfettiCannon from 'react-native-confetti-cannon';
import { useWindowDimensions, View } from 'react-native';

export function VictoryConfetti({ visible }: { visible: boolean }) {
  const { width } = useWindowDimensions();
  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 100 }}
    >
      <ConfettiCannon
        autoStart
        colors={['#facc15', '#ffffff', '#10b981', '#60a5fa', '#ef4444', '#c084fc']}
        count={180}
        explosionSpeed={480}
        fadeOut
        fallSpeed={4200}
        origin={{ x: width / 2, y: 0 }}
      />
    </View>
  );
}
