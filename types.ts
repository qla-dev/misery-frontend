export interface Card {
  id: string;
  titleEn: string;
  titleBs: string;
  index: number;
  image?: string;
  illustrationType: 'car' | 'tire' | 'pepper' | 'fart' | 'burger' | 'house' | 'bear' | 'lego' | 'toilet' | 'phone' | 'lightning' | 'heart' | 'goose' | 'wifi' | 'tooth' | 'coffee' | 'passport' | 'spider' | 'wasp' | 'money' | 'clippy' | 'general_misery';
  descriptionEn?: string;
  descriptionBs?: string;
  isSpicy?: boolean;
}

export type GameMode = 'SOLO' | 'MULTIPLAYER';

export interface Player {
  id: string;
  name: string;
  lane: Card[];
  color: string;
  lives?: number;
  score: number;
  isBot?: boolean;
}

export type Language = 'en' | 'bs';

export interface GameState {
  mode: GameMode;
  players: Player[];
  currentPlayerIndex: number;
  drawnCard: Card | null;
  deck: Card[];
  discardPile: Card[];
  phase: 'LOBBY' | 'PLAYING' | 'CORRECT_REVEAL' | 'WRONG_REVEAL' | 'STEAL_DECISION' | 'GAME_OVER' | 'VICTORY';
  targetScore: number;
  activeStealerIndex?: number;
  guessHistory: {
    playerName: string;
    cardTitle: string;
    guessIndex: number;
    correctIndex: number;
    success: boolean;
  }[];
}
