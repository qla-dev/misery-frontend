import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import ManSilhouette from './ManSilhouette';

interface WelcomePosterProps {
  language: 'en' | 'bs';
}

function RainCloud({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.7} viewBox="0 0 80 56">
      <Path
        d="M12 34 C8 28, 10 18, 24 16 C28 8, 48 6, 58 14 C68 10, 76 18, 72 28 C78 34, 68 42, 58 38 C48 42, 22 42, 12 34 Z"
        fill="#525252"
      />
      <Path d="M38 28 L32 42 L40 42 L36 52 L48 36 L40 36 Z" fill="#FFD700" />
      <Path d="M22 46 L20 52" stroke="#60A5FA" strokeWidth={2} />
      <Path d="M34 48 L32 54" stroke="#60A5FA" strokeWidth={2} />
      <Path d="M46 47 L44 53" stroke="#60A5FA" strokeWidth={2} />
      <Path d="M58 45 L56 51" stroke="#60A5FA" strokeWidth={2} />
    </Svg>
  );
}

function MiseryFigure({
  variant,
}: {
  variant: 'gold' | 'white-rain' | 'title-i';
}) {
  const color = variant === 'gold' ? '#FFD700' : '#FFFFFF';
  const width = variant === 'title-i' ? 28 : 34;
  const height = variant === 'title-i' ? 44 : 52;

  return (
    <View className="items-center justify-end">
      {variant === 'white-rain' && (
        <View className="absolute -top-7 z-10">
          <RainCloud size={32} />
        </View>
      )}
      <View className={variant === 'white-rain' ? 'relative overflow-hidden' : ''}>
        <ManSilhouette width={width} height={height} color={color} />
        {variant === 'white-rain' && (
          <View className="absolute inset-0 flex-row justify-center gap-[2px] px-1 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} className="w-[2px] h-3 bg-sky-400/80 rounded-full" />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function WelcomePoster({ language }: WelcomePosterProps) {
  const isBs = language === 'bs';

  return (
    <View className="items-center px-4 pt-2 pb-6">
      <View className="flex-row items-end justify-center gap-1 mb-1">
        <Text className="text-white font-display text-[11px] tracking-[3px] mb-3">THE</Text>
        <View className="flex-row items-end">
          <Text className="text-white font-display text-[42px] leading-[38px] tracking-tight">M</Text>
          <MiseryFigure variant="title-i" />
          <Text className="text-white font-display text-[42px] leading-[38px] tracking-tight">SERY</Text>
        </View>
      </View>

      <Text className="text-[#FFD700] font-display text-[42px] leading-[38px] tracking-tight -mt-1">
        INDEX
      </Text>

      <Text className="text-white/80 font-condensed text-[11px] tracking-[2px] uppercase mt-3 text-center px-6">
        {isBs
          ? 'ŽIVOTNI DOGAĐAJI NA SKALI OD NULE DO BIJEDNOG.'
          : 'LIFE EVENTS ON A SCALE FROM ZERO TO MISERABLE.'}
      </Text>

      <View className="flex-row items-end justify-center gap-2 mt-8 px-1">
        <MiseryFigure variant="gold" />
        <MiseryFigure variant="gold" />
        <MiseryFigure variant="gold" />
        <MiseryFigure variant="white-rain" />
        <MiseryFigure variant="gold" />
        <MiseryFigure variant="gold" />
        <MiseryFigure variant="gold" />
      </View>

      <Text className="text-[#FFD700] font-condensed text-[34px] tracking-[6px] uppercase mt-8">
        {isBs ? 'KARTIČNA IGRA' : 'CARD GAME'}
      </Text>

      <Text className="text-white/70 font-sans text-[10px] tracking-[1px] uppercase mt-2">
        {isBs ? 'ZA 2+ IGRAČA | DOB 14+' : 'FOR 2+ PLAYERS | AGES 14 & UP'}
      </Text>
    </View>
  );
}
