export interface PlayerInput {
  id?: number;
  name: string;
  color: string;
  isBot?: boolean;
}

export type LobbyView = 'WELCOME' | 'SETUP' | 'PUBLIC_GAMES' | 'ROOM_CREATED' | 'ROOM_JOINING' | 'ROOM_JOINED';
export type DeckType = string;

export interface GameSession {
  mode: 'SOLO' | 'MULTIPLAYER';
  players: PlayerInput[];
  targetScore: number;
  deckType: DeckType;
  gameId?: number;
  userId?: number;
  ownerId?: number;
}
