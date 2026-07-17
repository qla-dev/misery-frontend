import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleProp, View, ViewStyle } from 'react-native';
import { Card } from '@/types';

const GENERIC_CARD_ARTWORK = require('../assets/images/def-card.png');

type LazyCardArtworkProps = {
  card: Card;
  resizeMode?: 'contain' | 'cover';
  style?: StyleProp<ViewStyle>;
};

export function LazyCardArtwork({
  card,
  resizeMode = 'cover',
  style,
}: LazyCardArtworkProps) {
  const uri = card.image && card.image !== '0' ? card.image : null;
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setShouldLoad(false);
    setLoaded(false);
    setFailed(false);
    if (!uri) return undefined;

    const timer = setTimeout(() => setShouldLoad(true), 120);
    return () => clearTimeout(timer);
  }, [uri]);

  const loading = Boolean(uri && shouldLoad && !loaded && !failed);

  return (
    <View pointerEvents="none" style={[{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
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
          onLoad={() => setLoaded(true)}
          resizeMode={resizeMode}
          source={{ uri }}
          style={{ bottom: 0, left: 0, opacity: loaded ? 1 : 0, position: 'absolute', right: 0, top: 0 }}
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
