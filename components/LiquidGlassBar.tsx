import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LiquidGlassBarProps extends ViewProps {
  position: 'top' | 'bottom';
  children: React.ReactNode;
}

export function LiquidGlassBar({ position, children, style, ...rest }: LiquidGlassBarProps) {
  const insets = useSafeAreaInsets();
  const paddingStyle =
    position === 'top'
      ? { paddingTop: insets.top + 8, paddingBottom: 12 }
      : { paddingBottom: insets.bottom + 12, paddingTop: 12 };

  return (
    <View
      style={[
        styles.wrapper,
        position === 'top' ? styles.top : styles.bottom,
        paddingStyle,
        style,
      ]}
      {...rest}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 55 : 90}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
    borderColor: 'rgba(38,38,38,0.6)',
  },
  top: {
    top: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bottom: {
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,10,0.35)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
