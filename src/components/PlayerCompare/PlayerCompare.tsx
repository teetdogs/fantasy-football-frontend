import { useState, useMemo } from 'react';
import type { Player } from '../../types';
import { PlayerCard } from '../PlayerCard/PlayerCard';
import './PlayerCompare.css';

function Search({ players, excludeId, onSelect, placeholder }: {
  players: Player[];
  excludeId: number | null;
  onSelect: (p: Player) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return players.filter((p) => p.id !== excludeId && p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [players, excludeId, query]);

  return (
    <div className="pc-search">
      <input className="pc-search-input" type="text" placeholder={placeholder} value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)} />
      {open && filtered.length > 0 && (
        <div className="pc-search-drop">
          {filtered.map((p) => (
            <button className="pc-search-opt" key={p.id} onMouseDown={() => { onSelect(p); setQuery(''); setOpen(false); }}>
              <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
              <span className="pc-opt-name">{p.name}</span>
              <span className="pc-opt-team">{p.team}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  players: Player[];
}

export function PlayerCompare({ players }: Props) {
  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Player Comparison</h2>
          <p className="card-sub">Side-by-side breakdown of any two players.</p>
        </div>
      </div>

      <div className="pc-body">
        <div className="pc-selectors">
          <div className="pc-slot">
            {playerA ? (
              <div className="pc-selected">
                <span className="pc-selected-name">{playerA.name}</span>
                <button className="pc-clear" onClick={() => setPlayerA(null)}>×</button>
              </div>
            ) : (
              <Search players={players} excludeId={playerB?.id || null} onSelect={setPlayerA} placeholder="Search player A…" />
            )}
          </div>
          <span className="pc-vs">VS</span>
          <div className="pc-slot">
            {playerB ? (
              <div className="pc-selected">
                <span className="pc-selected-name">{playerB.name}</span>
                <button className="pc-clear" onClick={() => setPlayerB(null)}>×</button>
              </div>
            ) : (
              <Search players={players} excludeId={playerA?.id || null} onSelect={setPlayerB} placeholder="Search player B…" />
            )}
          </div>
        </div>

        {playerA && playerB && (
          <div className="pc-cards">
            <div className="pc-card-wrap"><PlayerCard player={playerA} /></div>
            <div className="pc-card-wrap"><PlayerCard player={playerB} /></div>
          </div>
        )}

        {(!playerA || !playerB) && (
          <p className="pc-hint">Select two players to compare stats, projections, and rankings side by side.</p>
        )}
      </div>
    </div>
  );
}
