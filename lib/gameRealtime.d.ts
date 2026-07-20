import type { ApiRealtimeGameUpdate } from '@/lib/api';

type GameRealtimeSubscriptionOptions = {
  channel: string;
  cluster?: string;
  event: string;
  getToken?: () => Promise<unknown>;
  host?: string;
  key?: string;
  onUpdate: (update: ApiRealtimeGameUpdate) => void;
  port?: number;
  provider: 'pusher' | 'ably' | 'reverb';
  scheme?: string;
};

export declare function subscribeToGameUpdates(
  options: GameRealtimeSubscriptionOptions,
): Promise<() => Promise<void>>;
