import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { MyTeamData, RosterPlayer, WaiverSuggestion, DropCandidate, EspnTeam } from '../../types';
import './MyTeam.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

interface SavedLeague {
  creds: { leagueId: string; swid: string; espnS2: string };
  settings?: { name?: string };
}

function loadLeague(): SavedLeague | null {
  try {
    const raw = localStorage.getItem('draftlab_league');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.creds?.leagueId ? parsed : null;
  } catch { return null; }
}

const LS_TEAM_KEY = 'draftlab_myteam_id';

function PlayerRow({ p }: { p: RosterPlayer }) {
  return (
    <div className={`mt-row ${p.onBench ? 'bench' : ''}`}>
      <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
      <span className="mt-name">{p.name}</span>
      <span className="mt-team">{p.team}</span>
      {p.byeWeek && <span className="mt-bye">BYE {p.byeWeek}</span>}
      {p.injuryStatus && p.injuryStatus !== 'ACTIVE' && (
        <span className="mt-injury">{p.injuryStatus.slice(0, 3)}</span>
      )}
      <span className="mt-rank tnum">{p.consensusRank ? `#${p.consensusRank}` : '—'}</span>
      <span className="mt-pts tnum">{p.projectedPoints != null ? `${p.projectedPoints.toFixed(0)} pts` : '—'}</span>
    </div>
  );
}

interface Props {
  user?: { id: number } | null;
}

export function MyTeam({ user: _user }: Props) {
  const league = loadLeague();
  const [teams, setTeams] = useState<EspnTeam[]>([]);
  const [teamId, setTeamId] = useState<number>(() => {
    const saved = localStorage.getItem(LS_TEAM_KEY);
    return saved ? Number(saved) : 0;
  });
  const [data, setData] = useState<MyTeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'roster' | 'waivers' | 'drops'>('roster');

  // Load the league's teams so the user can pick which one is theirs.
  useEffect(() => {
    if (!league) return;
    axios.post(`${API_URL}/api/league/teams`, league.creds)
      .then((res) => {
        const t: EspnTeam[] = res.data.teams || [];
        setTeams(t);
        if (!teamId && t.length) setTeamId(t[0].teamId);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTeam = useCallback(async (id: number) => {
    if (!league || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/api/league/my-team`, { ...league.creds, teamId: id });
      setData(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) setError(err.response.data.error);
      else setError('Could not load your team.');
    } finally {
      setLoading(false);
    }
  }, [league]);

  useEffect(() => {
    if (teamId) {
      localStorage.setItem(LS_TEAM_KEY, String(teamId));
      fetchTeam(teamId);
    }
  }, [teamId, fetchTeam]);

  if (!league) {
    return (
      <div className="card">
        <div className="mt-empty">
          <h3>Connect your league first</h3>
          <p>Head to <strong>My League</strong> and connect your ESPN league. Then your roster, waiver targets, and drop candidates will show up here.</p>
        </div>
      </div>
    );
  }

  const starters = data?.roster.filter((p) => !p.onBench) || [];
  const bench = data?.roster.filter((p) => p.onBench) || [];

  return (
    <div className="card mt">
      <div className="card-head">
        <div>
          <h2>My Team</h2>
          <p className="card-sub">Manage your roster, find waiver upgrades, and spot drop candidates.</p>
        </div>
        {teams.length > 0 && (
          <select className="mt-team-select" value={teamId} onChange={(e) => setTeamId(Number(e.target.value))}>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-tabs">
        <button className={`mt-tab ${tab === 'roster' ? 'active' : ''}`} onClick={() => setTab('roster')}>
          Roster
        </button>
        <button className={`mt-tab ${tab === 'waivers' ? 'active' : ''}`} onClick={() => setTab('waivers')}>
          Waiver Targets {data?.waivers.length ? `(${data.waivers.length})` : ''}
        </button>
        <button className={`mt-tab ${tab === 'drops' ? 'active' : ''}`} onClick={() => setTab('drops')}>
          Drop Candidates
        </button>
      </div>

      <div className="mt-body">
        {loading && <p className="mt-note">Loading your team…</p>}
        {error && <div className="mt-error">{error}</div>}

        {!loading && !error && data && tab === 'roster' && (
          <>
            <h4 className="mt-section">Starters</h4>
            <div className="mt-list">
              {starters.map((p) => <PlayerRow key={p.playerId} p={p} />)}
              {!starters.length && <p className="mt-note">No starters set.</p>}
            </div>
            <h4 className="mt-section">Bench</h4>
            <div className="mt-list">
              {bench.map((p) => <PlayerRow key={p.playerId} p={p} />)}
              {!bench.length && <p className="mt-note">Empty bench.</p>}
            </div>
          </>
        )}

        {!loading && !error && data && tab === 'waivers' && (
          <div className="mt-list">
            {data.waivers.map((w: WaiverSuggestion) => (
              <div className="mt-waiver" key={w.playerId}>
                <div className="mt-waiver-top">
                  <span className="pos-badge" data-pos={w.position.toLowerCase()}>{w.position}</span>
                  <span className="mt-name">{w.name}</span>
                  <span className="mt-team">{w.team}</span>
                  <span className="mt-owned tnum">{w.percentOwned}% rostered</span>
                  <span className="mt-rank tnum">#{w.consensusRank ?? '—'}</span>
                </div>
                <div className="mt-waiver-reason">{w.reason}</div>
              </div>
            ))}
            {!data.waivers.length && <p className="mt-note">No clear waiver upgrades right now — your roster is solid.</p>}
          </div>
        )}

        {!loading && !error && data && tab === 'drops' && (
          <div className="mt-list">
            <p className="mt-note mt-drops-hint">Your lowest-ranked players. Surplus = you have starter depth at this position.</p>
            {data.drops.map((d: DropCandidate) => (
              <div className="mt-row" key={d.playerId}>
                <span className="pos-badge" data-pos={d.position.toLowerCase()}>{d.position}</span>
                <span className="mt-name">{d.name}</span>
                <span className="mt-team">{d.team}</span>
                {d.surplus && <span className="mt-surplus">surplus</span>}
                <span className="mt-rank tnum">{d.consensusRank ? `#${d.consensusRank}` : 'unranked'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
