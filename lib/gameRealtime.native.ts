import { Pusher, PusherEvent } from '@pusher/pusher-websocket-react-native';
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

type ChannelState = {
  event: string;
  listeners: Set<() => void>;
  ready: Promise<void>;
  releaseTimer: ReturnType<typeof setTimeout> | null;
};

const pusher = Pusher.getInstance();
const channels = new Map<string, ChannelState>();
let initializedFor = '';

function dispatchEvent(event: PusherEvent) {
  const state = channels.get(event.channelName);
  if (!state || event.eventName !== state.event) return;
  state.listeners.forEach((listener) => listener());
}

export async function subscribeToGameUpdates(options: SubscriptionOptions): Promise<() => Promise<void>> {
  if (options.provider === 'ably') {
    if (!options.getToken) throw new Error('Ably token callback is missing.');
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

  if (!options.key || !options.cluster) throw new Error('Pusher public configuration is missing.');
  const identity = `${options.key}:${options.cluster}`;
  if (initializedFor && initializedFor !== identity) {
    channels.clear();
    await pusher.reset();
  }
  if (initializedFor !== identity) {
    await pusher.init({ apiKey: options.key, cluster: options.cluster, useTLS: true, onEvent: dispatchEvent });
    initializedFor = identity;
  }

  await pusher.connect();
  let state = channels.get(options.channel);
  if (!state) {
    state = {
      event: options.event,
      listeners: new Set(),
      ready: pusher.subscribe({ channelName: options.channel }).then(() => undefined),
      releaseTimer: null,
    };
    channels.set(options.channel, state);
  }
  if (state.releaseTimer) {
    clearTimeout(state.releaseTimer);
    state.releaseTimer = null;
  }
  state.listeners.add(options.onUpdate);
  await state.ready;

  let released = false;
  return async () => {
    if (released) return;
    released = true;
    const current = channels.get(options.channel);
    if (!current) return;
    current.listeners.delete(options.onUpdate);
    if (current.listeners.size > 0) return;
    current.releaseTimer = setTimeout(() => {
      const latest = channels.get(options.channel);
      if (!latest || latest.listeners.size > 0) return;
      channels.delete(options.channel);
      void pusher.unsubscribe({ channelName: options.channel }).then(() => {
        if (channels.size === 0) return pusher.disconnect();
        return undefined;
      }).catch(() => undefined);
    }, 750);
  };
}
