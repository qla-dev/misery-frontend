import type { PusherEvent } from '@pusher/pusher-websocket-react-native';
import * as Ably from 'ably';

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

const channels = new Map<string, ChannelState>();
let initializedFor = '';

function getNativePusher() {
  try {
    const { Pusher } = require('@pusher/pusher-websocket-react-native') as typeof import('@pusher/pusher-websocket-react-native');
    return Pusher.getInstance();
  } catch {
    throw new Error('Native Pusher is unavailable; polling fallback will be used.');
  }
}

function subscribeToReverb(options: SubscriptionOptions): Promise<() => Promise<void>> {
  if (!options.key || !options.host) throw new Error('Reverb public configuration is missing.');
  const secure = options.scheme !== 'http';
  const defaultPort = secure ? 443 : 80;
  const port = Number(options.port) || defaultPort;
  const authority = `${options.host}${port === defaultPort ? '' : `:${port}`}`;
  const url = `${secure ? 'wss' : 'ws'}://${authority}/app/${encodeURIComponent(options.key)}?protocol=7&client=misery-native&version=1.0&flash=false`;

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let connected = false;
    let released = false;
    const timeout = setTimeout(() => {
      if (connected || released) return;
      released = true;
      socket.close();
      reject(new Error('Reverb connection timed out.'));
    }, 8_000);

    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(String(message.data));
        if (payload.event === 'pusher:connection_established') {
          socket.send(JSON.stringify({
            event: 'pusher:subscribe',
            data: { auth: '', channel: options.channel },
          }));
          return;
        }
        if (payload.event === 'pusher_internal:subscription_succeeded' && payload.channel === options.channel) {
          if (connected || released) return;
          connected = true;
          clearTimeout(timeout);
          resolve(async () => {
            if (released) return;
            released = true;
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({
                event: 'pusher:unsubscribe',
                data: { channel: options.channel },
              }));
            }
            socket.close();
          });
          return;
        }
        if (payload.event === options.event && payload.channel === options.channel) options.onUpdate();
      } catch {
        // Ignore malformed transport frames; snapshots remain the authority.
      }
    };
    socket.onerror = () => {
      if (connected || released) return;
      released = true;
      clearTimeout(timeout);
      reject(new Error('Reverb connection failed.'));
    };
    socket.onclose = () => {
      if (connected || released) return;
      released = true;
      clearTimeout(timeout);
      reject(new Error('Reverb connection closed before subscription.'));
    };
  });
}

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
    return subscribeToReverb(options);
  }

  if (!options.key || !options.cluster) throw new Error('Pusher public configuration is missing.');
  const pusher = getNativePusher();
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
