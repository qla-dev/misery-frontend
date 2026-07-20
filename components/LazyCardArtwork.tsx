import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleProp, View, ViewStyle } from 'react-native';
import { Card } from '@/types';

const GENERIC_CARD_ARTWORK = require('../assets/images/def-card.png');

type LazyCardArtworkProps = {
  alignTop?: boolean;
  card: Card;
  resizeMode?: 'contain' | 'cover';
  style?: StyleProp<ViewStyle>;
};

export function LazyCardArtwork({
  alignTop = false,
  card,
  resizeMode = 'cover',
  style,
}: LazyCardArtworkProps) {
  const uri = card.image && card.image !== '0' ? card.image : null;
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [containerSize, setContainerSize] = useState({ height: 0, width: 0 });
  const [sourceSize, setSourceSize] = useState({ height: 0, width: 0 });

  useEffect(() => {
    setShouldLoad(false);
    setLoaded(false);
    setFailed(false);
    setSourceSize({ height: 0, width: 0 });
    if (!uri) return undefined;

    const timer = setTimeout(() => setShouldLoad(true), 120);
    return () => clearTimeout(timer);
  }, [uri]);

  const loading = Boolean(uri && shouldLoad && !loaded && !failed);
  const positionedImage = alignTop && containerSize.height > 0 && containerSize.width > 0 && sourceSize.width > 0 && sourceSize.height > 0
    ? (() => {
        const scale = Math.max(containerSize.height / sourceSize.height, containerSize.width / sourceSize.width);
        const height = sourceSize.height * scale;
        const width = sourceSize.width * scale;
        return { height, left: (containerSize.width - width) / 2, top: 0, width };
      })()
    : resizeMode === 'cover' && containerSize.width > 0 && containerSize.height > 0 && sourceSize.width > 0 && sourceSize.height > 0
    ? (() => {
        const scale = Math.max(containerSize.width / sourceSize.width, containerSize.height / sourceSize.height);
        const width = sourceSize.width * scale;
        const height = sourceSize.height * scale;
        return { height, left: (containerSize.width - width) / 2, top: 0, width };
      })()
    : { bottom: 0, left: 0, right: 0, top: 0 };

  return (
    <View
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        setContainerSize((current) => current.height === height && current.width === width ? current : { height, width });
      }}
      pointerEvents="none"
      style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}
    >
      <Image
        accessibilityLabel="Generic Misery Meter artwork"
        resizeMode="contain"
        source={GENERIC_CARD_ARTWORK}
        style={{ height: '78%', width: '78%' }}
      />
      {shouldLoad && uri && !failed ? (
        <Image
          accessibilityLabel={card.titleEn}
          fadeDuration={0}
          onError={() => {
            setFailed(true);
            setLoaded(false);
          }}
          onLoad={(event) => {
            const { height, width } = event.nativeEvent.source;
            setSourceSize({ height, width });
            setLoaded(true);
          }}
          resizeMode={alignTop ? 'stretch' : resizeMode}
          source={{ uri }}
          style={[{
            opacity: loaded && (!alignTop || (sourceSize.width > 0 && sourceSize.height > 0)) ? 1 : 0,
            position: 'absolute',
          }, positionedImage]}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator
          color="#facc15"
          pointerEvents="none"
          size="small"
          style={{ position: 'absolute', transform: [{ scale: 0.68 }] }}
        />
      ) : null}
    </View>
  );
}
