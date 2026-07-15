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
  pro_status?: 'inactive' | 'monthly' | 'yearly';
  pro_started_at?: string | null;
  pro_ends_at?: string | null;
  revenuecat_product_id?: string | null;
  revenuecat_entitlement_id?: string | null;
}
export interface ApiCard { id: number; title: string; title_bs?: string | null; subtitle: string | null; subtitle_bs?: string | null; score: number | string; image: string | null; deck: string }
export interface ApiMove { id: number; player_id: number; correct: boolean; player: ApiUser; card: ApiCard | null; created_at: string }
export interface ApiChatMessage { id: number; game_id: number; user_id: number; message: string; user: ApiUser; created_at: string }
export interface ApiQuestion { id: number; question: string; answer: string; category: string; difficulty: number }
export interface ApiGame { id: number; code: string; owner_id: number; started: boolean; host_in_lobby: boolean; is_private: boolean; terminated_at: string | null; termination_reason: 'host_left' | 'host_inactive' | string | null; stack_id: number | null; stack: 'normal' | 'spicy' | string | null; target_score: number; winner_id: number | null; current_player_id: number | null; turn_owner_id: number | null; awaiting_finish: boolean; is_steal_turn: boolean; ingame_polling_interval_ms: number; members: ApiUser[]; hands: Record<string, ApiCard[]>; current_card: ApiCard | null; moves: ApiMove[]; chat_messages: ApiChatMessage[] }
export interface ApiStack { id: number; name: string; slug: string; color: string; icon_key: string; description: string | null; description_bs: string | null; is_premium: boolean }
export interface SocialAuthResponse { token: string; user: ApiUser; is_new_user: boolean }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...init,
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
    if (response.status === 404) console.warn('[API] resource no longer exists', details);
    else console.error('[API] request failed', details);
    throw new ApiError(details.message, response.status, body);
  }

  return (body?.data ?? body) as T;
}

export const api = {
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
  listAvailableGames: () => request<ApiGame[]>('/games'),
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
  }),
  getGameByCode: (code: string) => request<ApiGame>(`/games/code/${encodeURIComponent(code.trim().toUpperCase())}`),
  joinGame: (code: string, name: string, color: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new Error('Enter a room code.');
    return request<{ game: ApiGame; user: ApiUser; color_changed: boolean }>(`/games/code/${encodeURIComponent(normalizedCode)}/join`, { method: 'POST', body: JSON.stringify({ name, color }) });
  },
  getGame: (id: number, userId?: number | null, signal?: AbortSignal) => request<ApiGame>(`/games/${id}${userId ? `?user_id=${encodeURIComponent(String(userId))}` : ''}`, { signal }),
  setHostLobbyPresence: (id: number, userId: number, present: boolean) => request<ApiGame>(`/games/${id}/host-lobby-presence`, { method: 'POST', body: JSON.stringify({ user_id: userId, present }) }),
  lockLobbyRoom: (id: number, userId: number, proActive: boolean) => request<ApiGame>(`/games/${id}/lock`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, pro_active: proActive }),
  }),
  kickLobbyPlayer: (id: number, userId: number, playerId: number) => request<ApiGame>(`/games/${id}/kick`, { method: 'POST', body: JSON.stringify({ user_id: userId, player_id: playerId }) }),
  deleteGame: (id: number) => request<void>(`/games/${id}`, { method: 'DELETE' }),
  startGame: (id: number, userId: number, stack: string, targetScore: number) => request<ApiGame>(`/games/${id}/start`, { method: 'POST', body: JSON.stringify({ user_id: userId, stack, target_score: targetScore }) }),
  submitMove: (id: number, playerId: number, correct: boolean) => request<{ game: ApiGame }>(`/games/${id}/moves`, { method: 'POST', body: JSON.stringify({ player_id: playerId, correct }) }),
  sendChatMessage: (id: number, userId: number, message: string) => request<ApiChatMessage>(`/games/${id}/messages`, { method: 'POST', body: JSON.stringify({ user_id: userId, message }) }),
  finishTurn: (id: number, playerId: number) => request<{ game: ApiGame }>(`/games/${id}/finish-turn`, { method: 'POST', body: JSON.stringify({ player_id: playerId }) }),
  passSteal: (id: number, playerId: number) => request<{ game: ApiGame }>(`/games/${id}/pass-steal`, { method: 'POST', body: JSON.stringify({ player_id: playerId }) }),
  expireInactivePlayer: (id: number, userId: number) => request<ApiGame>(`/games/${id}/inactivity-timeout`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  leaveGame: (id: number, userId: number) => request<ApiGame>(`/games/${id}/leave`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
};
