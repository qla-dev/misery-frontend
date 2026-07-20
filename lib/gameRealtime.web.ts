import * as Ably from 'ably';
import PusherJs from 'pusher-js';
import type { ApiRealtimeGameUpdate } from '@/lib/api';

type SubscriptionOptions = {
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

export async function subscribeToGameUpdates(options: SubscriptionOptions): Promise<() => Promise<void>> {
  if (options.provider === 'pusher') {
    if (!options.key || !options.cluster) throw new Error('Pusher public configuration is missing.');
    const client = new PusherJs(options.key, {
      cluster: options.cluster,
      disableStats: true,
      forceTLS: true,
    });
    const channel = client.subscribe(options.channel);
    channel.bind(options.event, options.onUpdate);
    return async () => {
      channel.unbind(options.event, options.onUpdate);
      client.unsubscribe(options.channel);
      client.disconnect();
    };
  }

  if (options.provider === 'reverb') {
    if (!options.key || !options.host) throw new Error('Reverb public configuration is missing.');
    const port = Number(options.port) || (options.scheme === 'http' ? 80 : 443);
    const client = new PusherJs(options.key, {
      cluster: 'mt1',
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      forceTLS: options.scheme !== 'http',
      wsHost: options.host,
      wsPort: port,
      wssPort: port,
    });
    const channel = client.subscribe(options.channel);
    channel.bind(options.event, options.onUpdate);
    return async () => {
      channel.unbind(options.event, options.onUpdate);
      client.unsubscribe(options.channel);
      client.disconnect();
    };
  }

  if (options.provider !== 'ably' || !options.getToken) throw new Error('Realtime configuration is unavailable.');
  const client = new Ably.Realtime({
    authCallback: (_params, callback) => {
      options.getToken!()
        .then((token) => callback(null, token as Ably.TokenRequest))
        .catch((error) => callback(error instanceof Error ? error.message : String(error), null));
    },
  });
  const channel = client.channels.get(options.channel);
    await channel.subscribe(options.event, (message) => options.onUpdate(message.data as ApiRealtimeGameUpdate));
  return async () => {
      channel.unsubscribe(options.event);
    await channel.detach().catch(() => undefined);
    client.close();
  };
}
