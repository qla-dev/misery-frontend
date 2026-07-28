export type ApiTarget = 'local' | 'production';

// Change this value before building the app.
export const API_TARGET: ApiTarget = 'production';

const API_URLS = {
  local: 'http://192.168.0.31:8000/api',
  production: 'https://miserymeter.app/api',
} as const;

export const API_BASE_URL = API_URLS[API_TARGET];

export class ApiError extends Error {
  readonly body: unknown;
  readonly status: number;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiUser {
  id: number;
  name: string;
  email: string | null;
  color: string | null;
  is_bot?: boolean;
  pro_status?: 'inactive' | 'monthly' | 'yearly';
  pro_started_at?: string | null;
  pro_ends_at?: string | null;
  revenuecat_product_id?: string | null;
  revenuecat_entitlement_id?: string | null;
}
export interface ApiCard { id: number; title: string; title_bs?: string | null; subtitle: string | null; subtitle_bs?: string | null; score: number | string; image: string | null; deck: string }
export interface ApiMove { id: number; player_id: number; correct: boolean; is_steal: boolean; player: ApiUser; card: ApiCard | null; created_at: string }
export type ApiGameEventType = 'MOVE_RESULT' | 'TURN_STARTED' | 'TURN_ENDED' | 'TURN_HOLD' | 'STEAL_OFFERED' | 'GAME_FINISHED';
export interface ApiGameEvent { id: number; type: ApiGameEventType; target_user_id: number | null; payload: Record<string, unknown>; created_at: string }
export interface ApiChatMessage { id: number; game_id: number; user_id: number; message: string; user: ApiUser; created_at: string }
export interface ApiQuestion { id: number; question: string; answer: string; category: string; difficulty: number }
export interface ApiGame { id: number; state_revision?: number; state_sent_at?: string; code: string; owner_id: number; started: boolean; created_at: string; host_in_lobby: boolean; lobby_member_ids: number[]; is_private: boolean; is_synthetic?: boolean; synthetic_host_name?: string | null; terminated_at: string | null; termination_reason: 'host_left' | 'host_inactive' | string | null; stack_id: number | null; stack: 'normal' | 'spicy' | string | null; target_score: number; winner_id: number | null; current_player_id: number | null; turn_owner_id: number | null; is_steal_turn: boolean; sync_driver: 'polling' | 'pusher' | 'ably' | 'reverb'; ingame_polling_interval_ms: number; pusher: { key: string; cluster: string; channel: string; event: string; heartbeat_interval_ms: number } | null; ably: { channel: string; event: string; token_endpoint: string; heartbeat_interval_ms: number } | null; reverb: { key: string; host: string; port: number; scheme: 'http' | 'https' | string; channel: string; event: string; heartbeat_interval_ms: number } | null; members: ApiUser[]; hands: Record<string, ApiCard[]>; current_card: ApiCard | null; moves: ApiMove[]; chat_messages: ApiChatMessage[] }
export interface ApiGame { events: ApiGameEvent[] }
export interface ApiRealtimeGameState {
  id: number;
  code: string;
  owner_id: number;
  started: boolean;
  host_in_lobby: boolean;
  is_private: boolean;
  terminated_at: string | null;
  termination_reason: string | null;
  stack_id: number | null;
  stack: string | null;
  target_score: number;
  winner_id: number | null;
  current_player_id: number | null;
  turn_owner_id: number | null;
  is_steal_turn: boolean;
  current_card: ApiCard | null;
  members: ApiUser[];
  lobby_member_ids: number[];
  hand_card_ids: Record<string, number[]>;
}
export interface ApiRealtimeGameUpdate {
  version: 1;
  game_id: number;
  reason: string;
  sent_at: string;
  state_revision?: number;
  deleted: boolean;
  state: ApiRealtimeGameState | null;
  events: ApiGameEvent[];
  chat_message: ApiChatMessage | null;
}
export interface ApiStack { id: number; name: string; slug: string; color: string; icon_key: string; description: string | null; description_bs: string | null; is_premium: boolean; active_cards_count: number }
export interface SocialAuthResponse { token: string; user: ApiUser; is_new_user: boolean }

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

async function request<T>(path: string, init?: RequestInit, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const externalSignal = init?.signal;
  let didTimeout = false;
  const abortFromExternalSignal = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      didTimeout = true;
      controller.abort();
      reject(new ApiError('Server is not responding. Please try again.', 0, null));
    }, timeoutMs);
  });

  try {
    const requestPromise = (async () => {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers },
      });
      const responseText = response.status === 204 ? '' : await response.text();
      let body: any = null;

      if (responseText) {
        try {
          body = JSON.parse(responseText);
        } catch {
          body = { message: responseText };
        }
      }

      if (!response.ok) {
        const details = {
          method: init?.method ?? 'GET',
          url,
          status: response.status,
          message: body?.message || `API request failed (${response.status})`,
        };
        if (__DEV__) {
          if (response.status === 404) console.warn('[API] resource no longer exists', details);
          else console.error('[API] request failed', details);
        }
        throw new ApiError(details.message, response.status, body);
      }

      return (body?.data ?? body) as T;
    })();

    return await Promise.race([requestPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof ApiError || externalSignal?.aborted) throw error;
    if (didTimeout || (error instanceof Error && error.name === 'AbortError')) {
      throw new ApiError('Server is not responding. Please try again.', 0, null);
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', 0, null);
  } finally {
    if (timeout) clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromExternalSignal);
  }
}

export const api = {
  health: (signal?: AbortSignal) => request<{ status: 'ok'; timestamp: string }>('/health', { signal }, 6_000),
  getCards: () => request<ApiCard[]>('/cards'),
  signInWithGoogle: (idToken: string) => request<SocialAuthResponse>('/auth/google', { method: 'POST', body: JSON.stringify({ id_token: idToken }) }),
  signInWithApple: (identityToken: string, fullName?: string) => request<SocialAuthResponse>('/auth/apple', { method: 'POST', body: JSON.stringify({ identity_token: identityToken, full_name: fullName || undefined }) }),
  updateProfile: (name: string, token: string) => request<{ user: ApiUser }>('/auth/profile', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  }),
  logout: (token: string) => request<{ message: string }>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }),
  deleteAccount: (token: string) => request<{ message: string }>('/auth/account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }),
  listAvailableGames: (signal?: AbortSignal) => request<ApiGame[]>('/games', { signal }, 8_000),
  getQuestions: (filters: { category?: string; difficulty?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (filters.category) query.set('category', filters.category);
    if (filters.difficulty) query.set('difficulty', String(filters.difficulty));
    if (filters.limit) query.set('limit', String(filters.limit));
    const suffix = query.toString();
    return request<ApiQuestion[]>(`/questions${suffix ? `?${suffix}` : ''}`);
  },
  listStacks: () => request<ApiStack[]>('/stacks'),
  createGame: (name: string, color: string, stack: string) => request<{ game: ApiGame; user: ApiUser }>('/games', {
    method: 'POST',
    body: JSON.stringify({ name, color, stack }),
  }, 10_000),
  getGameByCode: (code: string) => request<ApiGame>(`/games/code/${encodeURIComponent(code.trim().toUpperCase())}`),
  joinGame: (code: string, name: string, color: string, client: 'native' | 'web' = 'native') => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new Error('Enter a room code.');
    return request<{ game: ApiGame; user: ApiUser; color_changed: boolean }>(`/games/code/${encodeURIComponent(normalizedCode)}/join`, { method: 'POST', body: JSON.stringify({ name, color, client }) });
  },
  getGame: (id: number, userId?: number | null, signal?: AbortSignal) => request<ApiGame>(`/games/${id}${userId ? `?user_id=${encodeURIComponent(String(userId))}` : ''}`, { signal }, 8_000),
  heartbeatGame: (id: number, userId: number, afterEventId?: number | null, signal?: AbortSignal) => request<ApiRealtimeGameUpdate>(`/games/${id}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, after_event_id: afterEventId ?? 0 }),
    signal,
  }, 8_000),
  getAblyToken: (id: number, userId: number) => request<unknown>(`/games/${id}/realtime-token?user_id=${encodeURIComponent(String(userId))}`, undefined, 8_000),
  setHostLobbyPresence: (id: number, userId: number, present: boolean) => request<ApiGame>(`/games/${id}/host-lobby-presence`, { method: 'POST', body: JSON.stringify({ user_id: userId, present }) }),
  setLobbyPresence: (id: number, userId: number, present: boolean) => request<ApiGame>(`/games/${id}/lobby-presence`, { method: 'POST', body: JSON.stringify({ user_id: userId, present }) }),
  lockLobbyRoom: (id: number, userId: number, proActive: boolean) => request<ApiGame>(`/games/${id}/lock`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, pro_active: proActive }),
  }),
  kickLobbyPlayer: (id: number, userId: number, playerId: number) => request<ApiGame>(`/games/${id}/kick`, { method: 'POST', body: JSON.stringify({ user_id: userId, player_id: playerId }) }),
  deleteGame: (id: number, userId: number) => request<void>(`/games/${id}`, { method: 'DELETE', body: JSON.stringify({ user_id: userId }) }),
  startGame: (id: number, userId: number, stack: string, targetScore: number) => request<ApiGame>(`/games/${id}/start`, { method: 'POST', body: JSON.stringify({ user_id: userId, stack, target_score: targetScore }) }, 12_000),
  submitMove: (id: number, playerId: number, correct: boolean) => request<{ game: ApiGame }>(`/games/${id}/moves`, { method: 'POST', body: JSON.stringify({ player_id: playerId, correct }) }, 10_000),
  sendChatMessage: (id: number, userId: number, message: string) => request<ApiChatMessage>(`/games/${id}/messages`, { method: 'POST', body: JSON.stringify({ user_id: userId, message }) }, 10_000),
  passSteal: (id: number, playerId: number) => request<{ game: ApiGame }>(`/games/${id}/pass-steal`, { method: 'POST', body: JSON.stringify({ player_id: playerId }) }, 10_000),
  expireInactivePlayer: (id: number, userId: number) => request<ApiGame>(`/games/${id}/inactivity-timeout`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }, 10_000),
  leaveGame: (id: number, userId: number) => request<ApiGame>(`/games/${id}/leave`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }, 8_000),
};
