import * as Ably from 'ably';
import PusherJs from 'pusher-js';

type SubscriptionOptions = {
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

export async function subscribeToGameUpdates(options: SubscriptionOptions): Promise<() => Promise<void>> {
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

  if (options.provider !== 'ably' || !options.getToken) {
    throw new Error('Native Pusher is unavailable on web; polling fallback will be used.');
  }
  const client = new Ably.Realtime({
    authCallback: (_params, callback) => {
      options.getToken!()
        .then((token) => callback(null, token as Ably.TokenRequest))
        .catch((error) => callback(error instanceof Error ? error.message : String(error), null));
    },
  });
  const channel = client.channels.get(options.channel);
  await channel.subscribe(options.event, options.onUpdate);
  return async () => {
    channel.unsubscribe(options.event, options.onUpdate);
    await channel.detach().catch(() => undefined);
    client.close();
  };
}
