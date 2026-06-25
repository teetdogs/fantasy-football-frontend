import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import type { Player } from '../../types';
import './TradeAnalyzer.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TradeSuggestion {
  partner: { teamId: number; name: string };
  give: { name: string; position: string; team: string; consensusRank: number; value: number };
  get: { name: string; position: string; team: string; consensusRank: number; value: number };
  fairness: string;
  valueDiff: number;
  reason: string;
}

function loadCreds() {
  try {
    const raw = localStorage.getItem('draftlab_league');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.creds?.leagueId ? parsed.creds : null;
  } catch { return null; }
}

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
  const [suggestions, setSuggestions] = useState<TradeSuggestion[]>([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [creds] = useState(loadCreds);

  useEffect(() => {
    if (!creds) return;
    const savedTeamId = localStorage.getItem('draftlab_myteam_id');
    if (!savedTeamId) return;
    setSugLoading(true);
    axios.post(`${API_URL}/api/league/trade-suggestions`, { ...creds, teamId: Number(savedTeamId) })
      .then((res) => setSuggestions(res.data.suggestions || []))
      .catch(() => {})
      .finally(() => setSugLoading(false));
  }, [creds]);

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

        {creds && (
          <div className="ta-suggestions">
            <h3 className="ta-sug-title">Recommended Trades</h3>
            <p className="ta-sug-desc">Based on your roster's surplus and needs vs. other teams in your league.</p>

            {sugLoading && <p className="ta-note">Scanning league rosters…</p>}

            {!sugLoading && suggestions.length === 0 && (
              <p className="ta-note">No clear trade opportunities found — your roster is well-balanced.</p>
            )}

            {!sugLoading && suggestions.map((s, i) => (
              <div className="ta-sug" key={i}>
                <div className="ta-sug-header">
                  <span className="ta-sug-partner">Trade with {s.partner.name}</span>
                  <span className={`ta-sug-fairness ${s.valueDiff >= 0 ? 'good' : 'bad'}`}>{s.fairness}</span>
                </div>
                <div className="ta-sug-players">
                  <div className="ta-sug-give">
                    <span className="ta-sug-dir">You give</span>
                    <span className="pos-badge" data-pos={s.give.position.toLowerCase()}>{s.give.position}</span>
                    <span className="ta-sug-name">{s.give.name}</span>
                    <span className="ta-sug-rank tnum">#{s.give.consensusRank}</span>
                    <span className="ta-sug-val tnum">{s.give.value}</span>
                  </div>
                  <div className="ta-sug-get">
                    <span className="ta-sug-dir">You get</span>
                    <span className="pos-badge" data-pos={s.get.position.toLowerCase()}>{s.get.position}</span>
                    <span className="ta-sug-name">{s.get.name}</span>
                    <span className="ta-sug-rank tnum">#{s.get.consensusRank}</span>
                    <span className="ta-sug-val tnum">{s.get.value}</span>
                  </div>
                </div>
                <span className="ta-sug-reason">{s.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
