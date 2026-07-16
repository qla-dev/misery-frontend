import { BlurView } from 'expo-blur';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  autoClose?: boolean;
  onClose?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Toast({ visible, title, subtitle, icon, autoClose = true, onClose, onPress, style }: ToastProps) {
  const insets = useSafeAreaInsets();
  const [autoClosed, setAutoClosed] = useState(false);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  const dismissedRef = useRef(false);
  const presented = visible && !autoClosed;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      dismissedRef.current = false;
      dragY.setValue(0);
      setAutoClosed(false);
      return undefined;
    }
    if (!autoClose) return undefined;

    const timeout = setTimeout(() => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      setAutoClosed(true);
      onCloseRef.current?.();
    }, 3500);
    return () => clearTimeout(timeout);
  }, [autoClose, dragY, visible]);

  useEffect(() => {
    Animated.spring(progress, {
      damping: 19,
      mass: 0.75,
      stiffness: 220,
      toValue: presented ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [presented, progress]);

  const dismissFromSwipe = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    Animated.parallel([
      Animated.timing(dragY, {
        duration: 150,
        toValue: -110,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        duration: 150,
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      dragY.setValue(0);
      setAutoClosed(true);
      onCloseRef.current?.();
    });
  }, [dragY, progress]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (
      presented && gesture.dy < -4 && Math.abs(gesture.dy) > Math.abs(gesture.dx)
    ),
    onPanResponderMove: (_, gesture) => {
      dragY.setValue(Math.max(-110, Math.min(0, gesture.dy)));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy <= -34 || gesture.vy <= -0.55) {
        dismissFromSwipe();
        return;
      }
      Animated.spring(dragY, {
        damping: 18,
        stiffness: 240,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragY, {
        damping: 18,
        stiffness: 240,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  }), [dismissFromSwipe, dragY, presented]);

  const toast = (
    <Animated.View
      {...panResponder.panHandlers}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents={presented ? 'auto' : 'none'}
      style={[
        {
          elevation: 9999,
          left: 12,
          opacity: progress,
          position: 'absolute',
          right: 12,
          top: insets.top - 2,
          transform: [{
            translateY: Animated.add(
              progress.interpolate({ inputRange: [0, 1], outputRange: [-28, 0] }),
              dragY,
            ),
          }],
          zIndex: 9999,
        },
        style,
      ]}
    >
      {onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress}>
          <ToastContent icon={icon} subtitle={subtitle} title={title} />
        </Pressable>
      ) : (
        <ToastContent icon={icon} subtitle={subtitle} title={title} />
      )}
    </Animated.View>
  );

  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {toast}
        </View>
      </FullWindowOverlay>
    );
  }

  return toast;
}

function ToastContent({ icon, subtitle, title }: Pick<ToastProps, 'icon' | 'subtitle' | 'title'>) {
  return (
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
  );
}
