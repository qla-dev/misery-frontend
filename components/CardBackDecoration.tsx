import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

export function CardBackDecoration() {
  return (
    <View pointerEvents="none" style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}>
      <LinearGradient
        colors={['#2b2205', '#12100a', '#050505']}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.48, 1]}
        start={{ x: 0.5, y: 0 }}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />
    </View>
  );
}
