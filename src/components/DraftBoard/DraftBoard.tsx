import type { Player } from '../../types';
import './DraftBoard.css';

interface DraftBoardProps {
  players: Player[];
}

export const DraftBoard: React.FC<DraftBoardProps> = ({ players }) => {
  const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

  const getTopPlayerByPosition = (pos: string) => {
    const searchPos = pos === 'FLEX' ? ['RB', 'WR', 'TE'] : [pos];
    return players.find((p) => searchPos.includes(p.position) && (p.rank || 999) <= 50);
  };

  return (
    <div className="draft-board">
      <h2>Draft Board (Strategy Mockup)</h2>
      <div className="board-container">
        <div className="board-legend">
          <p>This mockup shows typical roster construction. Full draft simulation coming in Phase 2.</p>
        </div>
        <div className="roster">
          {positions.map((pos, idx) => {
            const player = getTopPlayerByPosition(pos);
            return (
              <div key={idx} className={`roster-slot pos-${pos.toLowerCase()}`}>
                <div className="position-label">{pos}</div>
                {player ? (
                  <div className="player-slot">
                    <div className="player-name">{player.name}</div>
                    <div className="player-details">
                      <span className="rank">#{player.rank}</span>
                      <span className="score">{player.score?.toFixed(1)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="player-slot empty">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
