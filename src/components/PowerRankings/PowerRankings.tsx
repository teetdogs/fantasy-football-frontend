import { useState, useEffect } from 'react';
import axios from 'axios';
import './PowerRankings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RankedTeam {
  rank: number;
  teamId: number;
  teamName: string;
  owner: string;
  overall: { score: number; letter: string; color: string };
  rosterSize: number;
  positions: Record<string, { score: number; letter: string; color: string }>;
}

function loadCreds() {
  try {
    const raw = localStorage.getItem('draftlab_league');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.creds?.leagueId ? parsed.creds : null;
  } catch { return null; }
}

export function PowerRankings() {
  const [creds] = useState(loadCreds);
  const [rankings, setRankings] = useState<RankedTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creds) return;
    setLoading(true);
    axios.post(`${API_URL}/api/league/power-rankings`, creds)
      .then((res) => setRankings(res.data.rankings || []))
      .catch((err) => setError(axios.isAxiosError(err) && err.response?.data?.error ? err.response.data.error : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [creds]);

  if (!creds) {
    return (
      <div className="card">
        <div className="pr-empty">
          <h3>Connect your league first</h3>
          <p>Head to <strong>My League</strong> to see power rankings for every team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Power Rankings</h2>
          <p className="card-sub">Every team graded and ranked by roster strength.</p>
        </div>
      </div>

      <div className="pr-body">
        {loading && <p className="pr-note">Grading all teams…</p>}
        {error && <div className="pr-error">{error}</div>}

        {!loading && !error && rankings.length > 0 && (
          <div className="pr-list">
            {rankings.map((t) => (
              <div className="pr-team" key={t.teamId}>
                <span className="pr-rank tnum">#{t.rank}</span>
                <span className="pr-grade" style={{ color: t.overall.color }}>{t.overall.letter}</span>
                <div className="pr-info">
                  <span className="pr-name">{t.teamName}</span>
                  <span className="pr-owner">{t.owner}</span>
                </div>
                <span className="pr-score tnum">{t.overall.score}</span>
                <div className="pr-pos-grades">
                  {['QB', 'RB', 'WR', 'TE'].map((pos) => {
                    const g = t.positions[pos];
                    if (!g) return null;
                    return (
                      <span className="pr-pos-grade" style={{ color: g.color }} key={pos}>
                        <span className="pr-pos-label">{pos}</span>{g.letter}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
