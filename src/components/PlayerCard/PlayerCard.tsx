import type { Player } from '../../types';
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

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, position }) => {
  const bgImage = player.imageUrl || `https://api.placeholder.com/120/160?text=${encodeURIComponent(player.name)}`;

  return (
    <div className="player-card" style={position ? { left: `${position.x}px`, top: `${position.y}px` } : {}}>
      {/* Photo */}
      <div className="card-photo">
        <img src={bgImage} alt={player.name} onError={(e) => {
          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"%3E%3Crect fill="%231c2638" width="120" height="160"/%3E%3Ccircle cx="60" cy="45" r="20" fill="%235e6b82"/%3E%3Cpath d="M30 80c0-17 13-30 30-30s30 13 30 30v35H30Z" fill="%235e6b82"/%3E%3C/svg%3E';
        }} />
      </div>

      {/* Info */}
      <div className="card-body">
        <div className="card-header">
          <div>
            <h4 className="card-name">{player.name}</h4>
            <span className="card-team" style={{ color: POSITION_COLORS[player.position] || '#93a1b8' }}>
              {player.nfl_team || player.team}
            </span>
          </div>
          <span className="card-pos" style={{ background: POSITION_COLORS[player.position] || '#5e6b82' }}>
            {player.position}
          </span>
        </div>

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
            <span className="stat-val score tnum">{player.score?.toFixed(2) || '—'}</span>
          </div>
        </div>

        {player.bye_week && (
          <div className="card-bye">
            <span className="bye-label">Bye week</span>
            <span className="bye-val tnum">{player.bye_week}</span>
          </div>
        )}
      </div>
    </div>
  );
};
