export interface PlayerInput {
  id?: number;
  name: string;
  color: string;
  isBot?: boolean;
}

export type LobbyView = 'WELCOME' | 'SETUP' | 'PUBLIC_GAMES' | 'ROOM_CREATED' | 'ROOM_JOINING' | 'ROOM_JOINED';

export interface GameSession {
  mode: 'SOLO' | 'MULTIPLAYER';
  players: PlayerInput[];
  targetScore: number;
  deckType: 'NORMAL' | 'SPICY';
  gameId?: number;
  userId?: number;
  ownerId?: number;
}
