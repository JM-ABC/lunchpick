export interface Restaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  price: string;
  distance: string;
  isSoloFriendly: boolean;
}

export interface TeamState {
  status: 'waiting' | 'voting' | 'done';
  candidates: Restaurant[];
  votes: Record<string, string>;
  userNames: Record<string, string>;
  winnerId?: string;
  userCount: number;
}

export type ServerMessage = 
  | { type: 'SYNC_STATE'; state: TeamState; userId: string; nickname?: string }
  | { type: 'STATE_UPDATED'; state: TeamState }
  | { type: 'ERROR'; message: string };
