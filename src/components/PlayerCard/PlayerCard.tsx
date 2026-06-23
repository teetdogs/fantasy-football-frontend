import type { Player, LastSeasonStats } from '../../types';
import './PlayerCard.css';

interface PlayerCardProps {
  player: Player;
  position?: { x: number; y: number };
}

const POSITION_COLORS: Record<string, string> = {
  QB: '#ef5d6f',
  RB: '#36c6a0',
  WR: '#57a6ff',
  TE: '#f6a23c',
  K: '#b387f4',
  DEF: '#8a97ad',
};

const FALLBACK_IMG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"%3E%3Crect fill="%231c2638" width="120" height="160"/%3E%3Ccircle cx="60" cy="45" r="20" fill="%235e6b82"/%3E%3Cpath d="M30 80c0-17 13-30 30-30s30 13 30 30v35H30Z" fill="%235e6b82"/%3E%3C/svg%3E';

// Position-aware stat lines pulled from the real last-season totals.
function statLines(pos: string, s: LastSeasonStats): { label: string; value: string }[] {
  switch (pos) {
    case 'QB':
      return [
        { label: 'Pass Yds', value: s.passYds.toLocaleString() },
        { label: 'Pass TD', value: `${s.passTd}` },
        { label: 'INT', value: `${s.int}` },
        { label: 'Rush Yds', value: `${s.rushYds}` },
        { label: 'Rush TD', value: `${s.rushTd}` },
        { label: 'Comp', value: `${s.comp}/${s.att}` },
      ];
    case 'RB':
      return [
        { label: 'Rush Yds', value: s.rushYds.toLocaleString() },
        { label: 'Rush TD', value: `${s.rushTd}` },
        { label: 'Carries', value: `${s.car}` },
        { label: 'Rec', value: `${s.rec}` },
        { label: 'Rec Yds', value: `${s.recYds}` },
        { label: 'Rec TD', value: `${s.recTd}` },
      ];
    default: // WR / TE
      return [
        { label: 'Rec', value: `${s.rec}` },
        { label: 'Targets', value: `${s.tgt}` },
        { label: 'Rec Yds', value: s.recYds.toLocaleString() },
        { label: 'Rec TD', value: `${s.recTd}` },
        { label: 'Rush Yds', value: `${s.rushYds}` },
        { label: 'Rush TD', value: `${s.rushTd}` },
      ];
  }
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, position }) => {
  const color = POSITION_COLORS[player.position] || '#93a1b8';
  const ls = player.lastSeason;

  return (
    <div
      className="player-card"
      style={position ? { left: `${position.x}px`, top: `${position.y}px` } : {}}
    >
      <div className="card-photo">
        <img
          src={player.imageUrl || FALLBACK_IMG}
          alt={player.name}
          onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMG)}
        />
      </div>

      <div className="card-body">
        <div className="card-header">
          <div>
            <h4 className="card-name">{player.name}</h4>
            <span className="card-team" style={{ color }}>
              {player.nfl_team || player.team}
              {player.bye_week ? ` · Bye ${player.bye_week}` : ''}
            </span>
          </div>
          <span className="card-pos" style={{ background: color }}>
            {player.position}
          </span>
        </div>

        {/* Draft inputs */}
        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">Rank</span>
            <span className="stat-val tnum">#{player.rank || '—'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">ADP</span>
            <span className="stat-val tnum">{player.adp?.toFixed(1) || '—'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Proj</span>
            <span className="stat-val tnum">{player.projected_points?.toFixed(1) || '—'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Score</span>
            <span className="stat-val score tnum">{player.score?.toFixed(1) || '—'}</span>
          </div>
        </div>

        {/* Real last-season production */}
        {ls ? (
          <div className="card-season">
            <div className="season-head">
              <span className="season-title">{ls.season} Season</span>
              <span className="season-summary tnum">
                {ls.games} G · <strong>{ls.ppg}</strong> PPR/g
              </span>
            </div>
            <div className="season-grid">
              {statLines(player.position, ls).map((line) => (
                <div className="season-stat" key={line.label}>
                  <span className="season-val tnum">{line.value}</span>
                  <span className="season-label">{line.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card-season empty">No prior-season NFL stats (rookie or inactive)</div>
        )}
      </div>
    </div>
  );
};
