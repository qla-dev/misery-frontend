import { Pressable, Text, View } from 'react-native';

type SetupTab = 'CREATE' | 'JOIN';

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
        ['CREATE', isBs ? 'Kreiraj Sobu' : 'Create Room'],
        ['JOIN', isBs ? 'Pridruži se' : 'Enter Code'],
      ] as const).map(([tab, label]) => (
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
            justifyContent: 'center',
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <Text style={{ color: value === tab ? '#fbbf24' : '#a3a3a3', fontSize: 12, fontWeight: '700' }}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
