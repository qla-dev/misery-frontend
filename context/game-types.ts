export interface PlayerInput {
  name: string;
  color: string;
  isBot?: boolean;
}

export type LobbyView = 'WELCOME' | 'SETUP' | 'ROOM_CREATED' | 'ROOM_JOINING' | 'ROOM_JOINED';

export interface GameSession {
  mode: 'SOLO' | 'MULTIPLAYER';
  players: PlayerInput[];
  targetScore: number;
  deckType: 'NORMAL' | 'SPICY';
}
