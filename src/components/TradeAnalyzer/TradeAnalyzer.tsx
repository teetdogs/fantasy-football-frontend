import { useState, useMemo } from 'react';
import axios from 'axios';
import type { Player } from '../../types';
import './TradeAnalyzer.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ValuedPlayer {
  player: { id: number; name: string; position: string; team: string; consensusRank: number; projectedPoints: number };
  value: number;
  rankScore: number;
  ptsScore: number;
}

interface TradeResult {
  giving: { players: ValuedPlayer[]; totalValue: number };
  getting: { players: ValuedPlayer[]; totalValue: number };
  differential: number;
  verdict: string;
}

function PlayerSearch({ players, usedIds, onAdd, placeholder }: {
  players: Player[];
  usedIds: Set<number>;
  onAdd: (p: Player) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return players.filter((p) => !usedIds.has(p.id) && p.name.toLowerCase().includes(q)).slice(0, 10);
  }, [players, usedIds, query]);

  return (
    <div className="ta-search">
      <input
        className="ta-search-input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && filtered.length > 0 && (
        <div className="ta-search-drop">
          {filtered.map((p) => (
            <button className="ta-search-opt" key={p.id} onMouseDown={() => { onAdd(p); setQuery(''); setOpen(false); }}>
              <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
              <span className="ta-opt-name">{p.name}</span>
              <span className="ta-opt-team">{p.team}</span>
              <span className="ta-opt-rank tnum">#{p.consensusRank || p.rank}</span>
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

export function TradeAnalyzer({ players }: Props) {
  const [giving, setGiving] = useState<Player[]>([]);
  const [getting, setGetting] = useState<Player[]>([]);
  const [result, setResult] = useState<TradeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const usedIds = useMemo(() => {
    const ids = new Set<number>();
    giving.forEach((p) => ids.add(p.id));
    getting.forEach((p) => ids.add(p.id));
    return ids;
  }, [giving, getting]);

  const analyze = async () => {
    if (!giving.length || !getting.length) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/draft/trade`, {
        giving: giving.map((p) => p.id),
        getting: getting.map((p) => p.id),
      });
      setResult(res.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setGiving([]);
    setGetting([]);
    setResult(null);
  };

  const verdictColor = result
    ? result.differential > 5 ? 'var(--accent)' : result.differential < -5 ? 'var(--danger)' : 'var(--text-dim)'
    : undefined;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Trade Analyzer</h2>
          <p className="card-sub">Compare the value of players on each side of a trade.</p>
        </div>
      </div>

      <div className="ta-body">
        <div className="ta-sides">
          <div className="ta-side giving">
            <h4 className="ta-side-title">You Give</h4>
            <PlayerSearch players={players} usedIds={usedIds} onAdd={(p) => setGiving([...giving, p])} placeholder="Add a player to give…" />
            <div className="ta-player-list">
              {giving.map((p) => (
                <div className="ta-player" key={p.id}>
                  <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
                  <span className="ta-player-name">{p.name}</span>
                  <span className="ta-player-rank tnum">#{p.consensusRank || p.rank}</span>
                  <button className="ta-remove" onClick={() => { setGiving(giving.filter((g) => g.id !== p.id)); setResult(null); }}>×</button>
                </div>
              ))}
            </div>
            {result && (
              <div className="ta-total">
                <span>Total Value</span>
                <span className="ta-total-val tnum">{result.giving.totalValue}</span>
              </div>
            )}
          </div>

          <div className="ta-divider">
            <span className="ta-swap">⇄</span>
          </div>

          <div className="ta-side getting">
            <h4 className="ta-side-title">You Get</h4>
            <PlayerSearch players={players} usedIds={usedIds} onAdd={(p) => setGetting([...getting, p])} placeholder="Add a player to get…" />
            <div className="ta-player-list">
              {getting.map((p) => (
                <div className="ta-player" key={p.id}>
                  <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
                  <span className="ta-player-name">{p.name}</span>
                  <span className="ta-player-rank tnum">#{p.consensusRank || p.rank}</span>
                  <button className="ta-remove" onClick={() => { setGetting(getting.filter((g) => g.id !== p.id)); setResult(null); }}>×</button>
                </div>
              ))}
            </div>
            {result && (
              <div className="ta-total">
                <span>Total Value</span>
                <span className="ta-total-val tnum">{result.getting.totalValue}</span>
              </div>
            )}
          </div>
        </div>

        <div className="ta-actions">
          <button className="ta-analyze-btn" onClick={analyze} disabled={!giving.length || !getting.length || loading}>
            {loading ? 'Analyzing…' : 'Analyze Trade'}
          </button>
          {(giving.length > 0 || getting.length > 0) && (
            <button className="link-btn" onClick={clear}>Clear all</button>
          )}
        </div>

        {result && (
          <div className="ta-result">
            <div className="ta-verdict" style={{ borderColor: verdictColor }}>
              <span className="ta-verdict-text" style={{ color: verdictColor }}>{result.verdict}</span>
              <span className="ta-diff tnum" style={{ color: verdictColor }}>
                {result.differential > 0 ? '+' : ''}{result.differential} value
              </span>
            </div>
            <div className="ta-breakdown">
              {[...result.giving.players, ...result.getting.players].map((vp) => {
                if (!vp.player) return null;
                const isGiving = result.giving.players.includes(vp);
                return (
                  <div className={`ta-valued ${isGiving ? 'give' : 'get'}`} key={vp.player.id}>
                    <span className="pos-badge" data-pos={vp.player.position.toLowerCase()}>{vp.player.position}</span>
                    <span className="ta-vp-name">{vp.player.name}</span>
                    <span className="ta-vp-label">{isGiving ? 'Give' : 'Get'}</span>
                    <span className="ta-vp-val tnum">{vp.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
