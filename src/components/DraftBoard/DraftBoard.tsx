import { useState, useMemo } from 'react';
import axios from 'axios';
import type { Player } from '../../types';
import { PlayerCard } from '../PlayerCard/PlayerCard';
import './DraftBoard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DraftBoardProps {
  players: Player[];
}

type Mode = 'starters' | 'rankings' | 'mock';

interface GradeResult {
  overall: { score: number; letter: string; color: string };
  positions: Record<string, { score: number; letter: string; color: string; count: number }>;
  picks: { pickNum: number; name: string; position: string; team: string; consensusRank: number; score: number; delta: number; tag: string }[];
  summary: string;
}

const ROSTER_SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'starters', label: 'Pick Starters', desc: 'Choose a player for each roster slot and get a team grade' },
  { id: 'rankings', label: 'My Rankings', desc: 'Drag to build your personal top-50 and see how it compares to consensus' },
  { id: 'mock', label: 'Mock Draft', desc: 'Simulate a snake draft — you pick, AI fills other teams' },
];

// --- Grade Report Card ---
function GradeCard({ grade }: { grade: GradeResult }) {
  return (
    <div className="grade-card">
      <div className="grade-hero" style={{ borderColor: grade.overall.color }}>
        <span className="grade-letter" style={{ color: grade.overall.color }}>{grade.overall.letter}</span>
        <span className="grade-score tnum">{grade.overall.score}/100</span>
      </div>
      <p className="grade-summary">{grade.summary}</p>
      <div className="grade-positions">
        {Object.entries(grade.positions).map(([pos, g]) => (
          <div className="grade-pos" key={pos}>
            <span className="pos-badge" data-pos={pos.toLowerCase()}>{pos}</span>
            <span className="grade-pos-letter" style={{ color: g.color }}>{g.letter}</span>
          </div>
        ))}
      </div>
      <div className="grade-picks">
        {grade.picks.map((p) => (
          <div className={'grade-pick ' + (p.delta >= 5 ? 'steal' : p.delta <= -5 ? 'reach' : '')} key={p.pickNum}>
            <span className="gp-num tnum">#{p.pickNum}</span>
            <span className="gp-name">{p.name}</span>
            <span className="gp-pos">{p.position}</span>
            <span className={'gp-tag ' + (p.delta >= 5 ? 'tag-steal' : p.delta <= -5 ? 'tag-reach' : 'tag-fair')}>{p.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Player Picker Dropdown ---
function PlayerPicker({
  players,
  usedIds,
  filterPos,
  onPick,
  placeholder,
}: {
  players: Player[];
  usedIds: Set<number>;
  filterPos: string[];
  onPick: (p: Player) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return players
      .filter(
        (p) =>
          filterPos.includes(p.position) &&
          !usedIds.has(p.id) &&
          (!q || p.name.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [players, usedIds, filterPos, query]);

  return (
    <div className="picker">
      <input
        className="picker-input"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && filtered.length > 0 && (
        <div className="picker-drop">
          {filtered.map((p) => (
            <button
              className="picker-opt"
              key={p.id}
              onMouseDown={() => {
                onPick(p);
                setQuery('');
                setOpen(false);
              }}
            >
              <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
              <span className="picker-name">{p.name}</span>
              <span className="picker-team">{p.team}</span>
              <span className="picker-rank tnum">#{p.consensusRank || p.rank}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Mode: Pick Starters ---
function StartersMode({ players }: { players: Player[] }) {
  const [picks, setPicks] = useState<(Player | null)[]>(Array(ROSTER_SLOTS.length).fill(null));
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });

  const usedIds = useMemo(() => new Set(picks.filter(Boolean).map((p) => p!.id)), [picks]);

  const handlePick = (idx: number, player: Player) => {
    const next = [...picks];
    next[idx] = player;
    setPicks(next);
    setGrade(null);
  };

  const handleClear = (idx: number) => {
    const next = [...picks];
    next[idx] = null;
    setPicks(next);
    setGrade(null);
  };

  const handleGrade = async () => {
    const ids = picks.filter(Boolean).map((p) => p!.id);
    if (!ids.length) return;
    setGrading(true);
    try {
      const res = await axios.post(`${API_URL}/api/draft/grade`, { picks: ids });
      setGrade(res.data);
    } catch {
      /* ignore */
    } finally {
      setGrading(false);
    }
  };

  const handleHover = (player: Player, e: React.MouseEvent) => {
    const x = (window.innerWidth - 310) / 2;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let y = rect.top - 440 - 16;
    if (y < 10) y = rect.bottom + 16;
    setHoveredPlayer(player);
    setCardPos({ x, y });
  };

  const filledCount = picks.filter(Boolean).length;

  return (
    <div>
      <div className="roster">
        {ROSTER_SLOTS.map((pos, idx) => {
          const player = picks[idx];
          const filterPos = pos === 'FLEX' ? ['RB', 'WR', 'TE'] : [pos];
          return (
            <div
              className={'slot' + (player ? ' filled' : '')}
              key={idx}
              onMouseEnter={player ? (e) => handleHover(player, e) : undefined}
              onMouseLeave={() => setHoveredPlayer(null)}
            >
              <div className="slot-top">
                <span className="pos-badge" data-pos={pos.toLowerCase()}>{pos}</span>
                <span className="slot-no tnum">{idx + 1}</span>
              </div>
              {player ? (
                <div className="slot-body">
                  <span className="slot-name">{player.name}</span>
                  <span className="slot-meta">
                    <span className="tnum">#{player.consensusRank || player.rank}</span>
                    <button className="slot-clear" onClick={() => handleClear(idx)}>x</button>
                  </span>
                </div>
              ) : (
                <PlayerPicker
                  players={players}
                  usedIds={usedIds}
                  filterPos={filterPos}
                  onPick={(p) => handlePick(idx, p)}
                  placeholder={`Add ${pos}…`}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="grade-actions">
        <button
          className="grade-btn"
          disabled={filledCount < 3 || grading}
          onClick={handleGrade}
        >
          {grading ? 'Grading…' : `Grade My Team (${filledCount}/${ROSTER_SLOTS.length})`}
        </button>
        {filledCount > 0 && (
          <button className="link-btn" onClick={() => { setPicks(Array(ROSTER_SLOTS.length).fill(null)); setGrade(null); }}>
            Clear all
          </button>
        )}
      </div>

      {grade && <GradeCard grade={grade} />}
      {hoveredPlayer && <PlayerCard player={hoveredPlayer} position={cardPos} />}
    </div>
  );
}

// --- Mode: My Rankings (drag reorder) ---
function RankingsMode({ players }: { players: Player[] }) {
  const [myList, setMyList] = useState<Player[]>([]);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });

  const usedIds = useMemo(() => new Set(myList.map((p) => p.id)), [myList]);

  const handleAdd = (p: Player) => {
    if (myList.length >= 50) return;
    setMyList([...myList, p]);
    setGrade(null);
  };

  const handleRemove = (idx: number) => {
    setMyList(myList.filter((_, i) => i !== idx));
    setGrade(null);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...myList];
    const [item] = next.splice(dragIdx, 1);
    next.splice(idx, 0, item);
    setMyList(next);
    setDragIdx(idx);
    setGrade(null);
  };
  const handleDragEnd = () => setDragIdx(null);

  const handleGrade = async () => {
    if (!myList.length) return;
    setGrading(true);
    try {
      const res = await axios.post(`${API_URL}/api/draft/grade`, { picks: myList.map((p) => p.id) });
      setGrade(res.data);
    } catch {
      /* ignore */
    } finally {
      setGrading(false);
    }
  };

  const handleHover = (player: Player, e: React.MouseEvent) => {
    const x = (window.innerWidth - 310) / 2;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let y = rect.top - 440 - 16;
    if (y < 10) y = rect.bottom + 16;
    setHoveredPlayer(player);
    setCardPos({ x, y });
  };

  return (
    <div>
      <div className="rank-add-row">
        <PlayerPicker
          players={players}
          usedIds={usedIds}
          filterPos={['QB', 'RB', 'WR', 'TE', 'K', 'DEF']}
          onPick={handleAdd}
          placeholder={myList.length >= 50 ? 'Max 50 reached' : 'Add a player to your board…'}
        />
        <span className="rank-count tnum">{myList.length}/50</span>
      </div>

      {myList.length === 0 ? (
        <p className="board-note">Search and add players in the order you would draft them. Drag to reorder.</p>
      ) : (
        <div className="rank-list">
          {myList.map((p, idx) => {
            const diff = (p.consensusRank || 999) - (idx + 1);
            return (
              <div
                className={'rank-row' + (dragIdx === idx ? ' dragging' : '')}
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onMouseEnter={(e) => handleHover(p, e)}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                <span className="rank-grip">⠿</span>
                <span className="rank-num tnum">{idx + 1}</span>
                <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
                <span className="rank-name">{p.name}</span>
                <span className="rank-team">{p.team}</span>
                <span className={'rank-diff tnum ' + (diff > 0 ? 'val-up' : diff < 0 ? 'val-down' : '')}>
                  {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '='}
                </span>
                <button className="rank-rm" onClick={() => handleRemove(idx)}>x</button>
              </div>
            );
          })}
        </div>
      )}

      <div className="grade-actions">
        <button className="grade-btn" disabled={myList.length < 3 || grading} onClick={handleGrade}>
          {grading ? 'Grading…' : `Grade My Board (${myList.length} players)`}
        </button>
        {myList.length > 0 && (
          <button className="link-btn" onClick={() => { setMyList([]); setGrade(null); }}>Clear all</button>
        )}
      </div>

      {grade && <GradeCard grade={grade} />}
      {hoveredPlayer && <PlayerCard player={hoveredPlayer} position={cardPos} />}
    </div>
  );
}

// --- Mode: Mock Draft ---
function MockMode({ players }: { players: Player[] }) {
  const [yourSlot, setYourSlot] = useState(1);
  const [numTeams, setNumTeams] = useState(12);
  const [yourPicks, setYourPicks] = useState<Player[]>([]);
  const [round, setRound] = useState(1);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
  const [started, setStarted] = useState(false);

  const usedIds = useMemo(() => new Set(yourPicks.map((p) => p.id)), [yourPicks]);

  // Simulate taken players (other teams pick by consensus before and after you)
  const takenByOthers = useMemo(() => {
    const taken = new Set<number>();
    let avail = players.filter((p) => !usedIds.has(p.id));
    let avIdx = 0;

    for (let r = 1; r <= round; r++) {
      const isReverse = r % 2 === 0;
      for (let s = 1; s <= numTeams; s++) {
        const actual = isReverse ? numTeams - s + 1 : s;
        if (actual === yourSlot) continue;
        while (avIdx < avail.length && taken.has(avail[avIdx].id)) avIdx++;
        if (avIdx < avail.length) {
          taken.add(avail[avIdx].id);
          avIdx++;
        }
      }
    }
    return taken;
  }, [players, usedIds, round, numTeams, yourSlot]);

  const available = useMemo(() => {
    return players.filter((p) => !usedIds.has(p.id) && !takenByOthers.has(p.id));
  }, [players, usedIds, takenByOthers]);

  const pickOverall = useMemo(() => {
    const r = yourPicks.length + 1;
    const isReverse = r % 2 === 0;
    return ((r - 1) * numTeams) + (isReverse ? numTeams - yourSlot + 1 : yourSlot);
  }, [yourPicks.length, numTeams, yourSlot]);

  const handlePick = async (p: Player) => {
    const next = [...yourPicks, p];
    setYourPicks(next);
    setRound(next.length + 1);

    // Auto-grade after each pick
    try {
      const res = await axios.post(`${API_URL}/api/draft/grade`, { picks: next.map((x) => x.id) });
      setGrade(res.data);
    } catch {
      /* ignore */
    }
  };

  const handleHover = (player: Player, e: React.MouseEvent) => {
    const x = (window.innerWidth - 310) / 2;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let y = rect.top - 440 - 16;
    if (y < 10) y = rect.bottom + 16;
    setHoveredPlayer(player);
    setCardPos({ x, y });
  };

  if (!started) {
    return (
      <div className="mock-setup">
        <h3 className="mock-setup-title">Mock Draft Setup</h3>
        <div className="mock-fields">
          <label>
            <span>Your draft position</span>
            <select value={yourSlot} onChange={(e) => setYourSlot(parseInt(e.target.value))}>
              {Array.from({ length: 14 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Pick #{i + 1}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Teams in league</span>
            <select value={numTeams} onChange={(e) => setNumTeams(parseInt(e.target.value))}>
              {[8, 10, 12, 14].map((n) => (
                <option key={n} value={n}>{n} teams</option>
              ))}
            </select>
          </label>
        </div>
        <button className="grade-btn" onClick={() => setStarted(true)}>Start Mock Draft</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mock-header">
        <div className="mock-info">
          <span className="mock-round">Round {yourPicks.length + 1}</span>
          <span className="mock-pick">Overall pick #{pickOverall}</span>
          <span className="mock-slot">You are pick #{yourSlot} of {numTeams}</span>
        </div>
        <button className="link-btn" onClick={() => { setStarted(false); setYourPicks([]); setRound(1); setGrade(null); }}>
          Restart
        </button>
      </div>

      <div className="mock-board">
        <div className="mock-your-picks">
          <h4>Your Picks</h4>
          {yourPicks.length === 0 && <p className="board-note">Make your first pick below.</p>}
          {yourPicks.map((p, i) => (
            <div
              className="mock-pick-row"
              key={p.id}
              onMouseEnter={(e) => handleHover(p, e)}
              onMouseLeave={() => setHoveredPlayer(null)}
            >
              <span className="gp-num tnum">Rd {i + 1}</span>
              <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
              <span className="gp-name">{p.name}</span>
              <span className="picker-team">{p.team}</span>
            </div>
          ))}
        </div>

        <div className="mock-available">
          <h4>Best Available ({available.length})</h4>
          <div className="mock-avail-list">
            {available.slice(0, 25).map((p) => (
              <button
                className="mock-avail-row"
                key={p.id}
                onClick={() => handlePick(p)}
                onMouseEnter={(e) => handleHover(p, e)}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                <span className="picker-rank tnum">#{p.consensusRank || p.rank}</span>
                <span className="pos-badge" data-pos={p.position.toLowerCase()}>{p.position}</span>
                <span className="picker-name">{p.name}</span>
                <span className="picker-team">{p.team}</span>
                <span className="mock-pts tnum">{p.projected_points?.toFixed(0) || '—'} pts</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {grade && <GradeCard grade={grade} />}
      {hoveredPlayer && <PlayerCard player={hoveredPlayer} position={cardPos} />}
    </div>
  );
}

// --- Main Component ---
export const DraftBoard: React.FC<DraftBoardProps> = ({ players }) => {
  const [mode, setMode] = useState<Mode>('starters');

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Draft Board</h2>
          <p className="card-sub">Build your own draft board and get it graded against expert consensus.</p>
        </div>
      </div>

      <div className="board">
        <div className="mode-tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={'mode-tab' + (mode === m.id ? ' active' : '')}
              onClick={() => setMode(m.id)}
            >
              <span className="mode-tab-label">{m.label}</span>
              <span className="mode-tab-desc">{m.desc}</span>
            </button>
          ))}
        </div>

        <div className="mode-body">
          {mode === 'starters' && <StartersMode players={players} />}
          {mode === 'rankings' && <RankingsMode players={players} />}
          {mode === 'mock' && <MockMode players={players} />}
        </div>
      </div>
    </div>
  );
};
