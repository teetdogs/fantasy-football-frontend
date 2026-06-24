import { useState } from 'react';
import type { Player } from '../../types';
import { PlayerCard } from '../PlayerCard/PlayerCard';
import './DraftBoard.css';

interface DraftBoardProps {
  players: Player[];
}

export const DraftBoard: React.FC<DraftBoardProps> = ({ players }) => {
  const positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });

  const used = new Set<number>();

  const getTopPlayerByPosition = (pos: string) => {
    const searchPos = pos === 'FLEX' ? ['RB', 'WR', 'TE'] : [pos];
    const pick = players.find((p) => searchPos.includes(p.position) && !used.has(p.id));
    if (pick) used.add(pick.id);
    return pick;
  };

  const handleHover = (player: Player, e: React.MouseEvent) => {
    const cardWidth = 310;
    const cardHeight = 440;
    const x = (window.innerWidth - cardWidth) / 2;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    let y = rect.top - cardHeight - 16;
    if (y < 10) y = rect.bottom + 16;
    setHoveredPlayer(player);
    setCardPos({ x, y });
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Draft Board</h2>
        <span className="count">starter blueprint</span>
      </div>
      <div className="board">
        <p className="board-note">
          A typical 10-slot starting lineup, auto-filled with your top available player at each spot.
          Hover any player for details. Live, snake-style draft simulation is coming in a later phase.
        </p>
        <div className="roster">
          {positions.map((pos, idx) => {
            const player = getTopPlayerByPosition(pos);
            return (
              <div
                className="slot"
                key={idx}
                onMouseEnter={player ? (e) => handleHover(player, e) : undefined}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                <div className="slot-top">
                  <span className="pos-badge" data-pos={pos.toLowerCase()}>
                    {pos}
                  </span>
                  <span className="slot-no tnum">{idx + 1}</span>
                </div>
                {player ? (
                  <div className="slot-body">
                    <span className="slot-name">{player.name}</span>
                    <span className="slot-meta">
                      <span className="tnum">#{player.consensusRank || player.rank}</span>
                      <span className="slot-score tnum">{player.consensus?.toFixed(1) || player.score?.toFixed(1)}</span>
                    </span>
                  </div>
                ) : (
                  <div className="slot-body empty">Open</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {hoveredPlayer && <PlayerCard player={hoveredPlayer} position={cardPos} />}
    </div>
  );
};
