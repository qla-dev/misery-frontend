import { Pressable, Text, View } from 'react-native';
import { CirclePlus, Globe2, LogIn } from 'lucide-react-native';

type SetupTab = 'CREATE' | 'JOIN' | 'PUBLIC';

export function SetupTabs({
  isBs,
  onChange,
  value,
}: {
  isBs: boolean;
  onChange: (value: SetupTab) => void;
  value: SetupTab;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        backgroundColor: 'rgba(38,38,38,0.9)',
        borderRadius: 10,
        flexDirection: 'row',
        height: 46,
        padding: 3,
        width: '100%',
      }}
    >
      {([
        ['CREATE', isBs ? 'Kreiraj Sobu' : 'Create Room', CirclePlus],
        ['JOIN', isBs ? 'Unesi Kod' : 'Enter Code', LogIn],
        ['PUBLIC', isBs ? 'Javne Igre' : 'Public Games', Globe2],
      ] as const).map(([tab, label, Icon]) => (
        <Pressable
          key={tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === tab }}
          onPress={() => onChange(tab)}
          style={({ pressed }) => ({
            alignItems: 'center',
            backgroundColor: value === tab ? '#f5f5f5' : 'transparent',
            borderRadius: 7,
            flex: 1,
            flexDirection: 'row',
            gap: 7,
            justifyContent: 'center',
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <Icon color={value === tab ? '#fbbf24' : '#a3a3a3'} size={15} strokeWidth={2.5} />
          <Text numberOfLines={1} style={{ color: value === tab ? '#fbbf24' : '#a3a3a3', fontSize: 10, fontWeight: '700' }}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
