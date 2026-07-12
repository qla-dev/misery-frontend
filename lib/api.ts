export const API_TARGET: 'local' | 'production' = 'local';

const API_URLS = {
  local: 'http://192.168.0.31:8000/api',
  production: 'http://misery.qla.dev/api',
} as const;

export const API_BASE_URL = API_URLS[API_TARGET];

export interface ApiUser { id: number; name: string; email: string | null; color: string | null }
export interface ApiCard { id: number; title: string; subtitle: string | null; score: number | string; image: string; deck: string }
export interface ApiMove { id: number; player_id: number; correct: boolean; player: ApiUser; card: ApiCard | null; created_at: string }
export interface ApiGame { id: number; code: string; owner_id: number; started: boolean; current_player_id: number | null; turn_owner_id: number | null; awaiting_finish: boolean; is_steal_turn: boolean; ingame_polling_interval_ms: number; members: ApiUser[]; hands: Record<string, ApiCard[]>; current_card: ApiCard | null; moves: ApiMove[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body.message || 'API request failed');
  return (body?.data ?? body) as T;
}

export const api = {
  listAvailableGames: () => request<ApiGame[]>('/games'),
  createGame: (name: string, color: string) => request<{ game: ApiGame; user: ApiUser }>('/games', { method: 'POST', body: JSON.stringify({ name, color }) }),
  joinGame: (code: string, name: string, color: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new Error('Enter a room code.');
    return request<{ game: ApiGame; user: ApiUser; color_changed: boolean }>(`/games/code/${encodeURIComponent(normalizedCode)}/join`, { method: 'POST', body: JSON.stringify({ name, color }) });
  },
  getGame: (id: number) => request<ApiGame>(`/games/${id}`),
  deleteGame: (id: number) => request<void>(`/games/${id}`, { method: 'DELETE' }),
  startGame: (id: number, userId: number) => request<ApiGame>(`/games/${id}/start`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  submitMove: (id: number, playerId: number, correct: boolean) => request<{ game: ApiGame }>(`/games/${id}/moves`, { method: 'POST', body: JSON.stringify({ player_id: playerId, correct }) }),
  finishTurn: (id: number, playerId: number) => request<{ game: ApiGame }>(`/games/${id}/finish-turn`, { method: 'POST', body: JSON.stringify({ player_id: playerId }) }),
  passSteal: (id: number, playerId: number) => request<{ game: ApiGame }>(`/games/${id}/pass-steal`, { method: 'POST', body: JSON.stringify({ player_id: playerId }) }),
};
