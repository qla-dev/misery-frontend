type GameRealtimeSubscriptionOptions = {
  channel: string;
  cluster?: string;
  event: string;
  getToken?: () => Promise<unknown>;
  host?: string;
  key?: string;
  onUpdate: () => void;
  port?: number;
  provider: 'pusher' | 'ably' | 'reverb';
  scheme?: string;
};

export declare function subscribeToGameUpdates(
  options: GameRealtimeSubscriptionOptions,
): Promise<() => Promise<void>>;
