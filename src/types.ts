export interface Player {
  id: number;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  nfl_team?: string;
  bye_week?: number;
  adp?: number;
  adp_floor?: number;
  adp_ceiling?: number;
  projected_points?: number;
  score?: number;
  rank?: number;
}

export interface RankingWeights {
  adpWeight: number;
  projectionWeight: number;
  positionScarcityWeight: number;
}

export interface RankingStrategy {
  name: string;
  weights: RankingWeights;
  description?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
