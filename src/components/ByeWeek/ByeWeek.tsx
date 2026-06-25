import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import type { RosterPlayer, EspnTeam } from '../../types';
import './ByeWeek.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const WEEKS = Array.from({ length: 14 }, (_, i) => i + 1);
const STARTER_NEEDS: Record<string, number> = { QB: 1, RB: 2, WR: 3, TE: 1, K: 1, DEF: 1 };

function loadCreds() {
  try {
    const raw = localStorage.getItem('draftlab_league');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.creds?.leagueId ? parsed.creds : null;
  } catch { return null; }
}

interface Props {
  user?: { id: number } | null;
}

export function ByeWeek({ user: _user }: Props) {
  const [creds] = useState(loadCreds);
  const [teams, setTeams] = useState<EspnTeam[]>([]);
  const [teamId, setTeamId] = useState<number>(() => {
    const saved = localStorage.getItem('draftlab_myteam_id');
    return saved ? Number(saved) : 0;
  });
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!creds) return;
    axios.post(`${API_URL}/api/league/teams`, creds)
      .then((res) => {
        const t = res.data.teams || [];
        setTeams(t);
        if (!teamId && t.length) setTeamId(t[0].teamId);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds]);

  const fetchRoster = useCallback(async (id: number) => {
    if (!creds || !id) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/league/my-team`, { ...creds, teamId: id });
      setRoster(res.data.roster || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [creds]);

  useEffect(() => {
    if (teamId) fetchRoster(teamId);
  }, [teamId, fetchRoster]);

  const byWeek = useMemo(() => {
    const map: Record<number, RosterPlayer[]> = {};
    for (const p of roster) {
      if (p.byeWeek) {
        if (!map[p.byeWeek]) map[p.byeWeek] = [];
        map[p.byeWeek].push(p);
      }
    }
    return map;
  }, [roster]);

  const dangerWeeks = useMemo(() => {
    const dangers: Record<number, string[]> = {};
    for (const [weekStr, players] of Object.entries(byWeek)) {
      const week = Number(weekStr);
      const starters = players.filter((p) => !p.onBench);
      const posCounts: Record<string, number> = {};
      for (const p of starters) {
        posCounts[p.position] = (posCounts[p.position] || 0) + 1;
      }
      const short: string[] = [];
      for (const [pos, need] of Object.entries(STARTER_NEEDS)) {
        const out = posCounts[pos] || 0;
        const total = roster.filter((r) => r.position === pos).length;
        if (out > 0 && total - out < need) {
          short.push(pos);
        }
      }
      if (short.length) dangers[week] = short;
    }
    return dangers;
  }, [byWeek, roster]);

  if (!creds) {
    return (
      <div className="card">
        <div className="bw-empty">
          <h3>Connect your league first</h3>
          <p>Head to <strong>My League</strong> to see your bye week schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Bye Week Planner</h2>
          <p className="card-sub">See which players are out each week and spot danger weeks.</p>
        </div>
        {teams.length > 0 && (
          <select className="bw-team-select" value={teamId} onChange={(e) => setTeamId(Number(e.target.value))}>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bw-body">
        {loading && <p className="bw-note">Loading…</p>}

        {!loading && (
          <div className="bw-grid">
            {WEEKS.map((week) => {
              const players = byWeek[week] || [];
              const danger = dangerWeeks[week];
              return (
                <div className={`bw-week ${danger ? 'danger' : ''} ${players.length ? '' : 'clear'}`} key={week}>
                  <div className="bw-week-head">
                    <span className="bw-week-num">Week {week}</span>
                    {danger && <span className="bw-danger-badge">Short: {danger.join(', ')}</span>}
                    {!players.length && <span className="bw-all-clear">All clear</span>}
                  </div>
                  {players.length > 0 && (
                    <div className="bw-players">
                      {players.map((p) => (
                        <div className="bw-player" key={p.playerId}>
                          <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
                          <span className="bw-player-name">{p.name}</span>
                          {p.onBench && <span className="bw-bench">bench</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
