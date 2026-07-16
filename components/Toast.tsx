import { BlurView } from 'expo-blur';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  autoClose?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Toast({ visible, title, subtitle, icon, autoClose = true, style }: ToastProps) {
  const insets = useSafeAreaInsets();
  const [autoClosed, setAutoClosed] = useState(false);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const presented = visible && !autoClosed;

  useEffect(() => {
    if (!visible) {
      setAutoClosed(false);
      return undefined;
    }
    if (!autoClose) return undefined;

    const timeout = setTimeout(() => setAutoClosed(true), 3500);
    return () => clearTimeout(timeout);
  }, [autoClose, visible]);

  useEffect(() => {
    Animated.spring(progress, {
      damping: 19,
      mass: 0.75,
      stiffness: 220,
      toValue: presented ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [presented, progress]);

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      style={[
        {
          elevation: 9999,
          left: 12,
          opacity: progress,
          position: 'absolute',
          right: 12,
          top: insets.top + 8,
          transform: [{
            translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }),
          }],
          zIndex: 9999,
        },
        style,
      ]}
    >
      <BlurView
        intensity={62}
        tint="dark"
        style={{
          borderColor: 'rgba(255,255,255,0.14)',
          borderRadius: 18,
          borderWidth: 1,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            alignItems: 'center',
            backgroundColor: 'rgba(18,18,20,0.78)',
            flexDirection: 'row',
            gap: 12,
            minHeight: 66,
            paddingHorizontal: 13,
            paddingVertical: 11,
          }}
        >
          {icon ? (
            <View
              style={{
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.09)',
                borderRadius: 13,
                height: 40,
                justifyContent: 'center',
                width: 40,
              }}
            >
              {icon}
            </View>
          ) : null}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text
              numberOfLines={1}
              style={{ color: '#ffffff', fontFamily: 'Outfit_700Bold', fontSize: 15, lineHeight: 19 }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={2}
                style={{ color: '#a3a3a3', fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 16, marginTop: 2 }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}
