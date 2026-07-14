import { Host, Label, Picker } from '@expo/ui/swift-ui';
import { controlSize, foregroundStyle, frame, labelStyle, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

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
    <Host matchContents={{ vertical: true }}>
      <Picker
        selection={value}
        onSelectionChange={onChange}
        modifiers={[pickerStyle('segmented'), controlSize('large'), frame({ height: 44 })]}
      >
        <Label
          modifiers={[
            tag('CREATE'),
            labelStyle('titleAndIcon'),
            foregroundStyle(value === 'CREATE' ? '#fbbf24' : '#a3a3a3'),
          ]}
          systemImage="plus.circle.fill"
          title={isBs ? 'Kreiraj Sobu' : 'Create Room'}
        />
        <Label
          modifiers={[
            tag('JOIN'),
            labelStyle('titleAndIcon'),
            foregroundStyle(value === 'JOIN' ? '#fbbf24' : '#a3a3a3'),
          ]}
          systemImage="rectangle.portrait.and.arrow.right"
          title={isBs ? 'Unesi Kod' : 'Enter Code'}
        />
        <Label
          modifiers={[
            tag('PUBLIC'),
            labelStyle('titleAndIcon'),
            foregroundStyle(value === 'PUBLIC' ? '#fbbf24' : '#a3a3a3'),
          ]}
          systemImage="globe"
          title={isBs ? 'Javne Igre' : 'Public Games'}
        />
      </Picker>
    </Host>
  );
}
