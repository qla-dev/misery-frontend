import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { controlSize, foregroundStyle, frame, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

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
    <Host matchContents={{ vertical: true }}>
      <Picker
        selection={value}
        onSelectionChange={onChange}
        modifiers={[pickerStyle('segmented'), controlSize('large'), frame({ height: 44 })]}
      >
        <Text modifiers={[tag('CREATE'), foregroundStyle(value === 'CREATE' ? '#fbbf24' : '#a3a3a3')]}>
          {isBs ? 'Kreiraj Sobu' : 'Create Room'}
        </Text>
        <Text modifiers={[tag('JOIN'), foregroundStyle(value === 'JOIN' ? '#fbbf24' : '#a3a3a3')]}>
          {isBs ? 'Unesi Kod Sobe' : 'Enter Code'}
        </Text>
      </Picker>
    </Host>
  );
}
