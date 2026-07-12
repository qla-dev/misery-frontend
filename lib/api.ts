export const API_TARGET: 'local' | 'production' = 'local';

const API_URLS = {
  local: 'http://192.168.0.30:8000/api',
  production: 'http://misery.qla.dev/api',
} as const;

export const API_BASE_URL = API_URLS[API_TARGET];

export interface ApiUser { id: number; name: string; email: string | null }
export interface ApiCard { id: number; title: string; score: number | string; image: string; deck: string }
export interface ApiMove { id: number; player_id: number; correct: boolean; player: ApiUser; card: ApiCard | null; created_at: string }
export interface ApiGame { id: number; code: string; owner_id: number; started: boolean; members: ApiUser[]; hands: Record<string, ApiCard[]>; current_card: ApiCard | null; moves: ApiMove[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'API request failed');
  return (body.data ?? body) as T;
}

export const api = {
  createGame: (name: string) => request<{ game: ApiGame; user: ApiUser }>('/games', { method: 'POST', body: JSON.stringify({ name }) }),
  joinGame: (code: string, name: string) => {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) throw new Error('Enter a room code.');
    return request<{ game: ApiGame; user: ApiUser }>(`/games/code/${encodeURIComponent(normalizedCode)}/join`, { method: 'POST', body: JSON.stringify({ name }) });
  },
  getGame: (id: number) => request<ApiGame>(`/games/${id}`),
  startGame: (id: number, userId: number) => request<ApiGame>(`/games/${id}/start`, { method: 'POST', body: JSON.stringify({ user_id: userId }) }),
  submitMove: (id: number, playerId: number, correct: boolean) => request<{ game: ApiGame }>(`/games/${id}/moves`, { method: 'POST', body: JSON.stringify({ player_id: playerId, correct }) }),
};
