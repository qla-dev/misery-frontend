import Lobby from '@/components/Lobby';
import { TabFadeView } from '@/components/TabFadeView';

export default function PlayScreen() {
  return (
    <TabFadeView>
      <Lobby />
    </TabFadeView>
  );
}
