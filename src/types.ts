export interface LastSeasonStats {
  season: number;
  games: number;
  comp: number;
  att: number;
  passYds: number;
  passTd: number;
  int: number;
  car: number;
  rushYds: number;
  rushTd: number;
  rec: number;
  tgt: number;
  recYds: number;
  recTd: number;
  ppr: number;
  ppg: number;
}

export interface ProjectedStats {
  fpts: number | null;
  comp?: number;
  att?: number;
  passYds?: number;
  passTd?: number;
  int?: number;
  car?: number;
  rushYds?: number;
  rushTd?: number;
  rec?: number;
  tgt?: number;
  recYds?: number;
  recTd?: number;
}

export interface SourceEspn {
  adp: number | null;
  rank: number | null;
  projPts: number | null;
}

export interface SourceSleeper {
  adp: number | null;
  projPts: number | null;
}

export interface SourceFantasyPros {
  ecr: number;
  best: number;
  worst: number;
  avg: number | null;
  tier: number;
  posRank: string;
}

export interface PlayerSources {
  espn: SourceEspn | null;
  sleeper: SourceSleeper | null;
  fantasyPros: SourceFantasyPros | null;
}

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
  imageUrl?: string;
  lastSeason?: LastSeasonStats | null;
  projection?: ProjectedStats | null;
  sources?: PlayerSources;
  consensus?: number | null;
  consensusRank?: number;
  signalCount?: number;
  injuryStatus?: string;
  seasonOutlook?: string | null;
  espnRank?: number | null;
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

export interface LeagueRosterSlot {
  position: string;
  count: number;
}

export interface LeagueScoring {
  passYds?: number;
  passTd?: number;
  int?: number;
  rushYds?: number;
  rushTd?: number;
  recYds?: number;
  recTd?: number;
  rec?: number;
}

export interface LeagueDraft {
  type: string;
  date: string | null;
  rounds: number;
}

export interface LeagueSettings {
  leagueId: number;
  name: string;
  size: number;
  season: number;
  isPublic: boolean;
  rosterSlots: LeagueRosterSlot[];
  scoring: LeagueScoring;
  scoringFormat: string;
  draft: LeagueDraft;
}

export interface LeagueTeam {
  teamId: number;
  name: string;
  abbrev: string;
  owner: string;
  record: { wins: number; losses: number; ties: number } | null;
  draftPosition: number | null;
}

export interface LeagueCredentials {
  leagueId: string;
  swid: string;
  espnS2: string;
}
