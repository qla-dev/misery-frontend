import { Pressable, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { useGame } from '@/context/GameContext';
import { playSound } from '@/lib/sound';
import { LiquidGlassBar } from './LiquidGlassBar';

export function HeaderActions({ showBack, onBack }: { showBack?: boolean; onBack?: () => void }) {
  const { language, toggleLanguage, setInfoModalOpen } = useGame();
  const isBs = language === 'bs';

  const handleBack = () => {
    playSound('click');
    onBack?.();
  };

  return (
    <View className="flex-row items-center justify-end gap-2 px-4">
      {showBack && onBack && (
        <Pressable
          onPress={handleBack}
          className="p-1.5 rounded-full bg-neutral-900/60 border border-neutral-800"
        >
          <Text className="text-amber-400 text-xs">←</Text>
        </Pressable>
      )}
      <Pressable
        onPress={toggleLanguage}
        className="px-3 py-1.5 rounded-full bg-neutral-900/80 border border-neutral-800"
      >
        <Text className="text-neutral-300 font-extrabold text-[10px] tracking-wider uppercase">
          {language === 'en' ? 'English 🇺🇸' : 'Bosanski 🇧🇦'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          playSound('click');
          setInfoModalOpen(true);
        }}
        className="p-1.5 rounded-full bg-neutral-900/80 border border-neutral-800"
      >
        <Info size={14} color="#fbbf24" />
      </Pressable>
    </View>
  );
}

export function ScreenChrome({
  header,
  footer,
  children,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-1 bg-neutral-950">
      {header && (
        <LiquidGlassBar position="top">
          {header}
        </LiquidGlassBar>
      )}
      <View className="flex-1">{children}</View>
      {footer && (
        <LiquidGlassBar position="bottom">
          {footer}
        </LiquidGlassBar>
      )}
    </View>
  );
}
