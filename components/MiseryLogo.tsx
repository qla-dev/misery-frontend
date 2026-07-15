import LottieView from 'lottie-react-native';
import { Text, View } from 'react-native';

const MASCOT_LOTTIE = require('../assets/animations/mascot_lottie.json');

export function MiseryLogo({ compact = false }: { compact?: boolean }) {
  const fontSize = compact ? 32 : 54;
  const lineHeight = compact ? 32 : 54;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
        <Text style={{ color: '#fbbf24', fontFamily: 'Outfit_900Black', fontSize, letterSpacing: -2, lineHeight }}>M</Text>
        <LottieView
          autoPlay
          loop
          source={MASCOT_LOTTIE}
          style={{
            height: compact ? 48 : 78,
            marginHorizontal: -3,
            marginTop: compact ? -27 : -44,
            transform: [{ translateX: compact ? 2 : 4 }],
            width: compact ? 24 : 38,
          }}
        />
        <Text style={{ color: '#fbbf24', fontFamily: 'Outfit_900Black', fontSize, letterSpacing: -2, lineHeight }}>SERY</Text>
      </View>
      <Text style={{ color: '#fff', fontFamily: 'Outfit_900Black', fontSize, letterSpacing: -2, lineHeight, marginTop: compact ? -8 : -13 }}>
        METER
      </Text>
    </View>
  );
}
