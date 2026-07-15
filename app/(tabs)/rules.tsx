import { ScrollView } from 'react-native';
import { RulebookContent } from '@/components/RulebookContent';
import { TabFadeView } from '@/components/TabFadeView';

export default function RulesScreen() {
  return (
    <TabFadeView>
      <ScrollView
        className="flex-1 bg-neutral-950"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16, paddingTop: 16 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <RulebookContent />
      </ScrollView>
    </TabFadeView>
  );
}
