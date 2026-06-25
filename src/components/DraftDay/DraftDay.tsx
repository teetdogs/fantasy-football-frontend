import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import type { Player } from '../../types';
import './DraftDay.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DraftPick {
  overall: number;
  round: number;
  teamSlot: number;
  playerId: number;
  playerName: string;
  position: string;
  team: string;
}

interface Recommendation {
  playerId: number;
  name: string;
  position: string;
  team: string;
  consensusRank: number;
  projectedPoints: number | null;
  score: number;
  reasons: string[];
  posRank: number;
  posAvailable: number;
}

interface PositionNeed {
  position: string;
  need: number;
  have: number;
  filled: boolean;
}

interface DraftDayProps {
  players: Player[];
}

function getTeamSlot(overall: number, numTeams: number): number {
  const round = Math.ceil(overall / numTeams);
  const pickInRound = overall - (round - 1) * numTeams;
  return round % 2 === 0 ? numTeams - pickInRound + 1 : pickInRound;
}

function getRound(overall: number, numTeams: number): number {
  return Math.ceil(overall / numTeams);
}

const POS_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

interface LeagueInfo {
  size: number;
  rounds: number;
  creds: { leagueId: string; swid: string; espnS2: string } | null;
}

function loadLeague(): LeagueInfo | null {
  try {
    const raw = localStorage.getItem('draftlab_league');
    if (!raw) return null;
    const { settings, creds } = JSON.parse(raw);
    if (!settings?.size) return null;
    return {
      size: settings.size,
      rounds: settings.draft?.rounds || 15,
      creds: creds?.leagueId ? creds : null,
    };
  } catch { return null; }
}

interface EspnTeam {
  teamId: number;
  name: string;
  abbrev: string;
  owner: string;
}

interface SetupProps {
  onStart: (slot: number, teams: number, rounds: number) => void;
  onStartSync: (teamId: number, teams: EspnTeam[], numTeams: number, rounds: number) => void;
}

function Setup({ onStart, onStartSync }: SetupProps) {
  const league = loadLeague();
  const canSync = !!league?.creds;
  const [mode, setMode] = useState<'manual' | 'sync'>(canSync ? 'sync' : 'manual');
  const [slot, setSlot] = useState(1);
  const [teams, setTeams] = useState(league?.size || 12);
  const [rounds, setRounds] = useState(league?.rounds || 15);
  const [espnTeams, setEspnTeams] = useState<EspnTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number>(0);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    if (mode === 'sync' && canSync && espnTeams.length === 0) {
      setLoadingTeams(true);
      axios.post(`${API_URL}/api/league/teams`, league!.creds)
        .then((res) => {
          const t = res.data.teams || [];
          setEspnTeams(t);
          if (t.length > 0) setSelectedTeam(t[0].teamId);
        })
        .catch(() => {})
        .finally(() => setLoadingTeams(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="dd-setup">
      <div className="dd-setup-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h3 className="dd-setup-title">Draft Day Companion</h3>
      <p className="dd-setup-desc">
        Run this alongside your live ESPN draft. Enter picks as they happen and get
        AI-powered recommendations for every one of your picks.
      </p>

      {canSync && (
        <div className="dd-mode-toggle">
          <button className={`dd-mode-opt ${mode === 'sync' ? 'active' : ''}`} onClick={() => setMode('sync')}>
            ESPN Live Sync
          </button>
          <button className={`dd-mode-opt ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
            Manual Entry
          </button>
        </div>
      )}

      {mode === 'sync' ? (
        <>
          <div className="dd-league-detected">
            Picks auto-sync from your ESPN league — no manual entry needed
          </div>
          <div className="dd-setup-fields">
            <label>
              <span>Your team</span>
              {loadingTeams ? (
                <select disabled><option>Loading teams…</option></select>
              ) : (
                <select value={selectedTeam} onChange={(e) => setSelectedTeam(+e.target.value)}>
                  {espnTeams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>{t.name} ({t.owner})</option>
                  ))}
                </select>
              )}
            </label>
          </div>
          <button
            className="dd-start-btn"
            disabled={!selectedTeam || loadingTeams}
            onClick={() => onStartSync(selectedTeam, espnTeams, teams, rounds)}
          >
            Start Live Sync
          </button>
        </>
      ) : (
        <>
          {league && !canSync && (
            <div className="dd-league-detected">
              Pre-filled from your connected league ({league.size} teams, {league.rounds} rounds)
            </div>
          )}
          <div className="dd-setup-fields">
            <label>
              <span>Your draft position</span>
              <select value={slot} onChange={(e) => setSlot(+e.target.value)}>
                {Array.from({ length: teams }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Pick #{i + 1}</option>
                ))}
              </select>
            </label>
            <label>
              <span>League size</span>
              <select value={teams} onChange={(e) => setTeams(+e.target.value)}>
                {[8, 10, 12, 14].map((n) => (
                  <option key={n} value={n}>{n} teams</option>
                ))}
              </select>
            </label>
            <label>
              <span>Rounds</span>
              <select value={rounds} onChange={(e) => setRounds(+e.target.value)}>
                {[13, 14, 15, 16, 17, 18].map((n) => (
                  <option key={n} value={n}>{n} rounds</option>
                ))}
              </select>
            </label>
          </div>
          <button className="dd-start-btn" onClick={() => onStart(slot, teams, rounds)}>
            Start Draft Companion
          </button>
        </>
      )}
    </div>
  );
}

// ——— Player Search (for marking picks) ———
function PickSearch({
  players,
  takenIds,
  onPick,
  isYourTurn,
  placeholder,
}: {
  players: Player[];
  takenIds: Set<number>;
  onPick: (p: Player) => void;
  isYourTurn: boolean;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return players
      .filter((p) => !takenIds.has(p.id) && p.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [players, takenIds, query]);

  return (
    <div className="dd-search">
      <input
        ref={inputRef}
        className={`dd-search-input ${isYourTurn ? 'your-turn' : ''}`}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && filtered.length > 0 && (
        <div className="dd-search-drop">
          {filtered.map((p) => (
            <button
              className="dd-search-opt"
              key={p.id}
              onMouseDown={() => {
                onPick(p);
                setQuery('');
                setOpen(false);
              }}
            >
              <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
              <span className="dd-opt-name">{p.name}</span>
              <span className="dd-opt-team">{p.team}</span>
              <span className="dd-opt-rank tnum">#{p.consensusRank || p.rank}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ——— Recommendation Card ———
function RecCard({
  rec,
  rank,
  onPick,
}: {
  rec: Recommendation;
  rank: number;
  onPick: (id: number) => void;
}) {
  const barWidth = Math.min(100, Math.max(10, rec.score));
  return (
    <button className="dd-rec" onClick={() => onPick(rec.playerId)}>
      <div className="dd-rec-top">
        <span className="dd-rec-rank tnum">#{rank}</span>
        <span className="pos-badge" data-pos={rec.position.toLowerCase()}>{rec.position}</span>
        <span className="dd-rec-name">{rec.name}</span>
        <span className="dd-rec-team">{rec.team}</span>
        <span className="dd-rec-score tnum">{rec.score}</span>
      </div>
      <div className="dd-rec-bar-track">
        <div className="dd-rec-bar" style={{ width: `${barWidth}%` }} />
      </div>
      {rec.reasons.length > 0 && (
        <div className="dd-rec-reasons">
          {rec.reasons.map((r, i) => (
            <span className="dd-rec-reason" key={i}>{r}</span>
          ))}
        </div>
      )}
      <div className="dd-rec-meta">
        <span>Consensus #{rec.consensusRank}</span>
        <span className="dd-rec-sep" />
        <span>{rec.projectedPoints?.toFixed(0) || '—'} pts</span>
        <span className="dd-rec-sep" />
        <span>{rec.position} #{rec.posRank} of {rec.posAvailable} left</span>
      </div>
    </button>
  );
}

// ——— Main Component ———
export function DraftDay({ players }: DraftDayProps) {
  const [started, setStarted] = useState(false);
  const [yourSlot, setYourSlot] = useState(1);
  const [numTeams, setNumTeams] = useState(12);
  const [numRounds, setNumRounds] = useState(15);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [needs, setNeeds] = useState<PositionNeed[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [posFilter, setPosFilter] = useState('');

  // Sync mode state
  const [syncMode, setSyncMode] = useState(false);
  const [syncTeamId, setSyncTeamId] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<'polling' | 'error' | 'done'>('polling');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentOverall = picks.length + 1;
  const currentRound = getRound(currentOverall, numTeams);
  const currentTeamSlot = getTeamSlot(currentOverall, numTeams);
  const isYourTurn = currentTeamSlot === yourSlot;
  const isDraftOver = picks.length > 0 && currentRound > numRounds;
  const waitingForDraft = syncMode && picks.length === 0;

  const takenIds = useMemo(() => new Set(picks.map((p) => p.playerId)), [picks]);

  const yourRoster = useMemo(() => {
    const yours = picks.filter((p) => p.teamSlot === yourSlot);
    const grouped: Record<string, DraftPick[]> = {};
    for (const pick of yours) {
      if (!grouped[pick.position]) grouped[pick.position] = [];
      grouped[pick.position].push(pick);
    }
    return grouped;
  }, [picks, yourSlot]);

  const yourPickCount = picks.filter((p) => p.teamSlot === yourSlot).length;

  const filteredRecs = useMemo(() => {
    if (!posFilter) return recommendations;
    return recommendations.filter((r) => r.position === posFilter);
  }, [recommendations, posFilter]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/api/draft/recommend`, {
        yourSlot,
        numTeams,
        picks: picks.map((p) => ({ playerId: p.playerId, teamSlot: p.teamSlot })),
      });
      setRecommendations(res.data.recommendations || []);
      setNeeds(res.data.needs || []);
    } catch {
      /* silent */
    }
  }, [yourSlot, numTeams, picks]);

  useEffect(() => {
    if (started && !isDraftOver) fetchRecommendations();
  }, [started, isDraftOver, fetchRecommendations]);

  const makePick = useCallback((player: Player) => {
    const pick: DraftPick = {
      overall: currentOverall,
      round: currentRound,
      teamSlot: currentTeamSlot,
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      team: player.team,
    };
    setPicks((prev) => [...prev, pick]);
  }, [currentOverall, currentRound, currentTeamSlot]);

  const makePickById = useCallback((id: number) => {
    const player = players.find((p) => p.id === id);
    if (player) makePick(player);
  }, [players, makePick]);

  const undoLastPick = () => {
    setPicks((prev) => prev.slice(0, -1));
  };

  // ESPN live sync polling
  useEffect(() => {
    if (!started || !syncMode) return;

    const league = loadLeague();
    if (!league?.creds) return;

    const poll = async () => {
      try {
        const res = await axios.post(`${API_URL}/api/league/draft-live`, league.creds);
        const { picks: espnPicks, drafted } = res.data;

        if (drafted) setSyncStatus('done');
        else setSyncStatus('polling');

        if (!espnPicks?.length) return;

        // Build teamId → slot mapping from round 1 picks
        const slotMap = new Map<number, number>();
        for (const p of espnPicks) {
          if (p.round === 1) {
            slotMap.set(p.teamId, p.pick);
          }
        }

        // Derive user's slot from their teamId
        const userSlot = slotMap.get(syncTeamId);
        if (userSlot && userSlot !== yourSlot) {
          setYourSlot(userSlot);
        }

        // Convert ESPN picks to our format
        const converted: DraftPick[] = espnPicks.map((p: { overall: number; round: number; teamId: number; playerId: number; playerName: string; position: string; team: string }) => ({
          overall: p.overall,
          round: p.round,
          teamSlot: slotMap.get(p.teamId) || p.teamId,
          playerId: p.playerId,
          playerName: p.playerName,
          position: p.position,
          team: p.team,
        }));

        setPicks(converted);
      } catch {
        setSyncStatus('error');
      }
    };

    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [started, syncMode, syncTeamId, yourSlot]);

  const handleStart = (slot: number, teams: number, rounds: number) => {
    setYourSlot(slot);
    setNumTeams(teams);
    setNumRounds(rounds);
    setSyncMode(false);
    setPicks([]);
    setRecommendations([]);
    setNeeds([]);
    setStarted(true);
  };

  const handleStartSync = (teamId: number, _teams: EspnTeam[], leagueSize: number, rounds: number) => {
    setSyncTeamId(teamId);
    setNumTeams(leagueSize);
    setNumRounds(rounds);
    setSyncMode(true);
    setPicks([]);
    setRecommendations([]);
    setNeeds([]);
    setSyncStatus('polling');
    setStarted(true);
  };

  const handleRestart = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setSyncMode(false);
    setStarted(false);
  };

  if (!started) {
    return (
      <div className="card">
        <Setup onStart={handleStart} onStartSync={handleStartSync} />
      </div>
    );
  }

  if (waitingForDraft) {
    return (
      <div className="card">
        <div className="dd-waiting-room">
          <div className="dd-setup-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3>Waiting for Draft to Start</h3>
          <p>Connected to ESPN and polling every 5 seconds. Picks will appear automatically once the draft begins.</p>
          <span className={`dd-sync-badge ${syncStatus}`}>
            {syncStatus === 'polling' ? 'Listening…' : syncStatus === 'error' ? 'Connection error — retrying' : 'Connected'}
          </span>
          <button className="dd-restart" onClick={handleRestart} style={{ marginTop: 20 }}>
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  if (isDraftOver) {
    return (
      <div className="card">
        <div className="dd-over">
          <h3>Draft Complete</h3>
          <p>You drafted {yourPickCount} players across {numRounds} rounds.</p>
          <div className="dd-final-roster">
            {POS_ORDER.map((pos) => (
              <div key={pos} className="dd-final-group">
                <span className="pos-badge" data-pos={pos.toLowerCase()}>{pos}</span>
                <div className="dd-final-names">
                  {(yourRoster[pos] || []).map((p) => (
                    <span key={p.playerId}>{p.playerName}</span>
                  ))}
                  {!(yourRoster[pos]?.length) && <span className="dd-empty">—</span>}
                </div>
              </div>
            ))}
          </div>
          <button className="dd-start-btn" onClick={() => setStarted(false)} style={{ marginTop: 20 }}>
            New Draft
          </button>
        </div>
      </div>
    );
  }

  const recentPicks = [...picks].reverse().slice(0, 20);

  return (
    <div className="card dd">
      {/* Header bar */}
      <div className={`dd-header ${isYourTurn ? 'dd-your-turn' : ''}`}>
        <div className="dd-header-left">
          <span className="dd-round">Round {currentRound}</span>
          <span className="dd-pick-num">Pick #{currentOverall}</span>
          {isYourTurn ? (
            <span className="dd-turn-badge">YOUR PICK</span>
          ) : syncMode ? (
            <span className="dd-turn-other">Auto-syncing from ESPN</span>
          ) : (
            <span className="dd-turn-other">Team {currentTeamSlot}'s pick</span>
          )}
        </div>
        <div className="dd-header-right">
          {syncMode && (
            <span className={`dd-sync-badge ${syncStatus}`}>
              {syncStatus === 'polling' ? 'Syncing' : syncStatus === 'error' ? 'Sync error' : 'Complete'}
            </span>
          )}
          {!syncMode && (
            <button className="dd-undo" onClick={undoLastPick} disabled={picks.length === 0} title="Undo last pick">
              Undo
            </button>
          )}
          <button className="dd-log-toggle" onClick={() => setShowLog((v) => !v)}>
            {showLog ? 'Hide Log' : `Log (${picks.length})`}
          </button>
          <button className="dd-restart" onClick={handleRestart}>
            Restart
          </button>
        </div>
      </div>

      <div className="dd-body">
        {/* Left: Your Roster */}
        <aside className="dd-roster">
          <h4 className="dd-section-title">Your Roster ({yourPickCount})</h4>
          <div className="dd-needs">
            {needs.map((n) => (
              <div className={`dd-need ${n.filled ? 'filled' : ''}`} key={n.position}>
                <span className="pos-badge" data-pos={n.position.toLowerCase()}>{n.position}</span>
                <span className="dd-need-count tnum">{n.have}/{n.need}</span>
              </div>
            ))}
          </div>
          <div className="dd-roster-groups">
            {POS_ORDER.map((pos) => {
              const group = yourRoster[pos] || [];
              if (!group.length) return null;
              return (
                <div className="dd-roster-group" key={pos}>
                  {group.map((p) => (
                    <div className="dd-roster-player" key={p.playerId}>
                      <span className="pos-badge sm" data-pos={pos.toLowerCase()}>{pos}</span>
                      <span className="dd-roster-name">{p.playerName}</span>
                      <span className="dd-roster-rd tnum">Rd {p.round}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            {yourPickCount === 0 && <p className="dd-empty-note">No picks yet</p>}
          </div>
        </aside>

        {/* Center: Pick area + Recommendations */}
        <div className="dd-main">
          {!syncMode && (
            <div className="dd-pick-area">
              <PickSearch
                players={players}
                takenIds={takenIds}
                onPick={makePick}
                isYourTurn={isYourTurn}
                placeholder={isYourTurn ? 'Search to make your pick…' : `Search — who did Team ${currentTeamSlot} draft?`}
              />
            </div>
          )}

          {isYourTurn && recommendations.length > 0 && (
            <div className="dd-recs">
              <div className="dd-recs-header">
                <h4 className="dd-section-title">Recommended Picks</h4>
                <div className="dd-pos-filters">
                  <button className={`dd-pos-filter ${!posFilter ? 'active' : ''}`} onClick={() => setPosFilter('')}>All</button>
                  {POS_ORDER.filter((p) => p !== 'K' && p !== 'DEF').map((pos) => (
                    <button
                      key={pos}
                      className={`dd-pos-filter ${posFilter === pos ? 'active' : ''}`}
                      data-pos={pos.toLowerCase()}
                      onClick={() => setPosFilter(posFilter === pos ? '' : pos)}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
              <div className="dd-rec-list">
                {filteredRecs.map((rec, i) => (
                  <RecCard key={rec.playerId} rec={rec} rank={i + 1} onPick={makePickById} />
                ))}
                {filteredRecs.length === 0 && <p className="dd-empty-note">No {posFilter} recommendations</p>}
              </div>
            </div>
          )}

          {!isYourTurn && (
            <div className="dd-waiting">
              <div className="dd-waiting-msg">
                {syncMode
                  ? `Waiting for picks… (auto-syncing every 5s)`
                  : `Waiting for Team ${currentTeamSlot} to pick…`}
              </div>
              {!syncMode && (
                <p className="dd-waiting-hint">
                  Search above and select the player they drafted to advance.
                </p>
              )}
              {recommendations.length > 0 && (
                <div className="dd-preview">
                  <h4 className="dd-section-title">Preview: Your Next Pick</h4>
                  <p className="dd-preview-sub">
                    Based on current board — will update as picks come in.
                  </p>
                  <div className="dd-rec-list compact">
                    {recommendations.slice(0, 5).map((rec, i) => (
                      <RecCard key={rec.playerId} rec={rec} rank={i + 1} onPick={() => {}} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Draft Log */}
      {showLog && (
        <div className="dd-log">
          <h4 className="dd-section-title">Draft Log</h4>
          <div className="dd-log-list">
            {recentPicks.map((p) => (
              <div className={`dd-log-row ${p.teamSlot === yourSlot ? 'yours' : ''}`} key={p.overall}>
                <span className="dd-log-pick tnum">#{p.overall}</span>
                <span className="dd-log-rd tnum">Rd {p.round}</span>
                <span className="dd-log-team">Team {p.teamSlot}{p.teamSlot === yourSlot ? ' (you)' : ''}</span>
                <span className="pos-badge sm" data-pos={p.position.toLowerCase()}>{p.position}</span>
                <span className="dd-log-name">{p.playerName}</span>
              </div>
            ))}
            {picks.length === 0 && <p className="dd-empty-note">No picks yet</p>}
          </div>
        </div>
      )}
    </div>
  );
}
