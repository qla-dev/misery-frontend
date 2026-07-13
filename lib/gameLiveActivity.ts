import { Platform } from 'react-native';
import type { GameLiveActivityProps } from '@/widgets/GameLiveActivity';

let operationQueue: Promise<void> = Promise.resolve();

async function loadFactory() {
  if (Platform.OS !== 'ios') return null;
  try {
    return (await import('@/widgets/GameLiveActivity')).default;
  } catch (error) {
    console.warn('[LiveActivity] unavailable until the app is rebuilt with expo-widgets', error);
    return null;
  }
}

export function syncGameLiveActivity(props: GameLiveActivityProps) {
  operationQueue = operationQueue.then(async () => {
    const factory = await loadFactory();
    if (!factory) return;
    const instances = factory.getInstances();
    if (instances.length === 0) {
      factory.start(props, 'miseryindex:///game');
      return;
    }
    await Promise.all(instances.map((instance) => instance.update(props)));
  }).catch(() => undefined);
  return operationQueue;
}

export function endGameLiveActivity(props?: GameLiveActivityProps) {
  operationQueue = operationQueue.then(async () => {
    const factory = await loadFactory();
    if (!factory) return;
    await Promise.all(
      factory.getInstances().map((instance) => instance.end('immediate', props, new Date()))
    );
  }).catch(() => undefined);
  return operationQueue;
}
