import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { MyTeamData, RosterPlayer, WaiverSuggestion, DropCandidate, EspnTeam, TeamGrade } from '../../types';
import './MyTeam.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Creds { leagueId: string; swid: string; espnS2: string }

function loadLocalCreds(): Creds | null {
  try {
    const raw = localStorage.getItem('draftlab_league');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.creds?.leagueId ? parsed.creds : null;
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

const DEPTH_LABEL: Record<string, string> = { deep: 'Deep', ok: 'OK', thin: 'Thin', empty: '—' };
const ROLE_LABEL: Record<string, string> = { starter: 'Starter', flex: 'FLEX', bench: 'Bench' };

function GradeCard({ grade }: { grade: TeamGrade }) {
  return (
    <div className="mt-grade">
      <div className="mt-grade-hero" style={{ borderColor: grade.overall.color }}>
        <span className="mt-grade-letter" style={{ color: grade.overall.color }}>{grade.overall.letter}</span>
        <div className="mt-grade-meta">
          <span className="mt-grade-score tnum">{grade.overall.score}/100</span>
          <span className="mt-grade-label">Team Grade</span>
        </div>
      </div>
      <p className="mt-grade-summary">{grade.summary}</p>

      <div className="mt-grade-positions">
        {['QB', 'RB', 'WR', 'TE', 'FLEX', 'K', 'DEF'].map((pos) => {
          const g = grade.positions[pos];
          if (!g || g.count === 0) return null;
          return (
            <div className="mt-grade-pos" key={pos}>
              <div className="mt-grade-pos-head">
                <span className="pos-badge" data-pos={pos.toLowerCase()}>{pos}</span>
                <span className="mt-grade-pos-letter" style={{ color: g.color }}>{g.letter}</span>
                <span className="mt-grade-pos-score tnum">{g.score}</span>
                <span className={`mt-grade-depth ${g.depth}`}>{DEPTH_LABEL[g.depth]}</span>
              </div>
              <div className="mt-grade-players">
                {g.players.map((p) => (
                  <div className={`mt-grade-player ${p.role}`} key={p.name}>
                    <span className="mt-grade-player-name">{p.name}</span>
                    <span className="mt-grade-player-role">{ROLE_LABEL[p.role]}</span>
                    <span className="mt-grade-player-rank tnum">{p.rank ? `#${p.rank}` : '—'}</span>
                    <span className="mt-grade-player-score tnum">{p.score}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  user?: { id: number } | null;
}

export function MyTeam({ user }: Props) {
  const [creds, setCreds] = useState<Creds | null>(loadLocalCreds);
  const [credsLoaded, setCredsLoaded] = useState(!user);
  const [teams, setTeams] = useState<EspnTeam[]>([]);
  const [teamId, setTeamId] = useState<number>(() => {
    const saved = localStorage.getItem(LS_TEAM_KEY);
    return saved ? Number(saved) : 0;
  });
  const [data, setData] = useState<MyTeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'grade' | 'roster' | 'waivers' | 'drops'>('grade');
  const [expired, setExpired] = useState(false);

  // For logged-in users, try to load server-side credentials first.
  // Falls back to localStorage if server has none.
  useEffect(() => {
    if (!user) { setCredsLoaded(true); return; }
    axios.get(`${API_URL}/api/auth/league-creds`, { withCredentials: true })
      .then((res) => {
        if (res.data.linked && res.data.swid && res.data.espnS2) {
          const serverCreds: Creds = { leagueId: res.data.leagueId, swid: res.data.swid, espnS2: res.data.espnS2 };
          setCreds(serverCreds);
        }
      })
      .catch(() => {})
      .finally(() => setCredsLoaded(true));
  }, [user]);

  // Load the league's teams so the user can pick which one is theirs.
  useEffect(() => {
    if (!creds || !credsLoaded) return;
    axios.post(`${API_URL}/api/league/teams`, creds)
      .then((res) => {
        const t: EspnTeam[] = res.data.teams || [];
        setTeams(t);
        if (!teamId && t.length) setTeamId(t[0].teamId);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creds, credsLoaded]);

  const fetchTeam = useCallback(async (id: number) => {
    if (!creds || !id) return;
    setLoading(true);
    setError(null);
    setExpired(false);
    try {
      const res = await axios.post(`${API_URL}/api/league/my-team`, { ...creds, teamId: id });
      setData(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setExpired(true);
        setError('Your ESPN cookies have expired.');
      } else if (axios.isAxiosError(err) && err.response?.data?.error) {
        const msg = err.response.data.error;
        setExpired(msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid'));
        setError(msg);
      } else {
        setError('Could not load your team.');
      }
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    if (teamId && credsLoaded) {
      localStorage.setItem(LS_TEAM_KEY, String(teamId));
      fetchTeam(teamId);
    }
  }, [teamId, credsLoaded, fetchTeam]);

  if (!credsLoaded) {
    return (
      <div className="card">
        <div className="mt-empty"><p className="mt-note">Loading…</p></div>
      </div>
    );
  }

  if (!creds) {
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
        <button className={`mt-tab ${tab === 'grade' ? 'active' : ''}`} onClick={() => setTab('grade')}>
          Team Grade {data?.grade ? data.grade.overall.letter : ''}
        </button>
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
        {error && (
          <div className="mt-error">
            {error}
            {expired && (
              <p className="mt-expired-hint">
                Go to <strong>My League</strong>, disconnect, and reconnect with fresh cookies from ESPN.
                {user && ' Your new cookies will be saved to your account so other devices pick them up automatically.'}
              </p>
            )}
          </div>
        )}

        {!loading && !error && data && tab === 'grade' && <GradeCard grade={data.grade} />}

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
