import { useState } from 'react';
import type { RankingWeights, Player } from '../../types';
import { useFetchPlayers } from '../../hooks/useFetchPlayers';
import { PlayerCard } from '../PlayerCard/PlayerCard';
import './PlayerRanking.css';

interface PlayerRankingProps {
  weights?: RankingWeights;
  positionFilter?: string;
  search?: string;
}

type SortField = 'consensusRank' | 'adp' | 'projected_points' | 'consensus' | 'name';

const COLUMNS: {
  field: SortField | null;
  label: string;
  sortable: boolean;
  align?: 'right';
  tip?: string;
}[] = [
  { field: 'consensusRank', label: '#', sortable: true, tip: 'Consensus rank across all sources — lower is better' },
  { field: 'name', label: 'Player', sortable: true },
  { field: null, label: 'Pos', sortable: false },
  { field: null, label: 'Sources', sortable: false, tip: 'Which data sources contribute to this ranking' },
  {
    field: 'adp',
    label: 'Avg Draft Spot',
    sortable: true,
    align: 'right',
    tip: 'Where this player typically gets drafted (ESPN ADP)',
  },
  {
    field: 'projected_points',
    label: '2026 Pts',
    sortable: true,
    align: 'right',
    tip: 'Total fantasy points projected for this season (PPR)',
  },
  {
    field: 'consensus',
    label: 'Consensus',
    sortable: true,
    align: 'right',
    tip: 'Blended score from ESPN, FantasyPros experts, and Sleeper — higher is better',
  },
  { field: null, label: 'Bye', sortable: false, align: 'right', tip: 'Week off' },
];

const INJURY_BADGE: Record<string, { label: string; cls: string }> = {
  QUESTIONABLE: { label: 'Q', cls: 'inj-q' },
  DOUBTFUL: { label: 'D', cls: 'inj-d' },
  OUT: { label: 'O', cls: 'inj-o' },
  INJURY_RESERVE: { label: 'IR', cls: 'inj-ir' },
  SUSPENSION: { label: 'SUS', cls: 'inj-o' },
  PHYSICALLY_UNABLE_TO_PERFORM: { label: 'PUP', cls: 'inj-o' },
};

function SourceDots({ player }: { player: Player }) {
  const s = player.sources;
  if (!s) return null;
  return (
    <span className="source-dots">
      <span className="sdot sdot-espn" title={`ESPN rank: ${s.espn?.rank ?? '—'}`} />
      {s.fantasyPros && (
        <span
          className="sdot sdot-fp"
          title={`FantasyPros ECR: #${s.fantasyPros.ecr} (best ${s.fantasyPros.best}, worst ${s.fantasyPros.worst})`}
        />
      )}
      {s.sleeper && (
        <span className="sdot sdot-sl" title={`Sleeper ADP: ${s.sleeper.adp}`} />
      )}
    </span>
  );
}

export const PlayerRanking: React.FC<PlayerRankingProps> = ({ weights, positionFilter, search }) => {
  const { players, loading, error } = useFetchPlayers(weights);
  const [sortField, setSortField] = useState<SortField>('consensusRank');
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredPlayer, setHoveredPlayer] = useState<Player | null>(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });

  const query = (search || '').trim().toLowerCase();
  const filteredPlayers = players.filter(
    (p) =>
      (!positionFilter || p.position === positionFilter) &&
      (!query || p.name.toLowerCase().includes(query))
  );

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aVal = a[sortField as keyof Player] ?? (sortField === 'name' ? '' : 9999);
    const bVal = b[sortField as keyof Player] ?? (sortField === 'name' ? '' : 9999);
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const maxConsensus = Math.max(1, ...sortedPlayers.map((p) => p.consensus || 0));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name' || field === 'consensusRank' || field === 'adp');
    }
  };

  const handlePlayerHover = (player: Player, e: React.MouseEvent) => {
    const cardWidth = 280;
    const cardHeight = 440;
    const x = (window.innerWidth - cardWidth) / 2;
    const row = e.currentTarget as HTMLElement;
    const rowRect = row.getBoundingClientRect();
    let y = rowRect.top - cardHeight - 16;
    if (y < 10) y = rowRect.bottom + 16;
    setHoveredPlayer(player);
    setCardPos({ x, y });
  };

  if (loading)
    return (
      <div className="card state">
        <div className="spinner" />
        <span>Loading player pool…</span>
      </div>
    );
  if (error)
    return (
      <div className="card state error">
        <span>Couldn't load players: {error}</span>
      </div>
    );

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Who to Draft</h2>
          <p className="card-sub">
            Consensus ranking across ESPN, FantasyPros experts, and Sleeper — just draft from the top
            down. Hover any player for details.
          </p>
        </div>
        <span className="count tnum">
          {sortedPlayers.length} {positionFilter || 'players'}
        </span>
      </div>

      <div className="table-wrap">
        <table className="ranking-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  title={col.tip}
                  className={[col.sortable ? 'sortable' : '', col.align === 'right' ? 'right' : '']
                    .join(' ')
                    .trim()}
                  onClick={col.sortable && col.field ? () => handleSort(col.field as SortField) : undefined}
                >
                  {col.label}
                  {col.tip && <span className="th-info" aria-hidden="true">ⓘ</span>}
                  {col.field && sortField === col.field && (
                    <span className="sort-ind">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => {
              const inj = INJURY_BADGE[player.injuryStatus || ''];
              return (
                <tr
                  key={player.id}
                  onMouseEnter={(e) => handlePlayerHover(player, e)}
                  onMouseLeave={() => setHoveredPlayer(null)}
                >
                  <td className="rank tnum">{player.consensusRank ?? player.rank ?? '—'}</td>
                  <td className="name">
                    {player.name}
                    {inj && <span className={`inj-badge ${inj.cls}`}>{inj.label}</span>}
                  </td>
                  <td>
                    <span className="pos-badge" data-pos={player.position.toLowerCase()}>
                      {player.position}
                    </span>
                  </td>
                  <td>
                    <SourceDots player={player} />
                  </td>
                  <td className="right tnum">{player.adp ? player.adp.toFixed(1) : '—'}</td>
                  <td className="right tnum proj">{player.projected_points?.toFixed(1) ?? '—'}</td>
                  <td className="right score-cell">
                    <span className="score-val tnum">{player.consensus?.toFixed(1) ?? '—'}</span>
                    <span className="score-bar">
                      <span style={{ width: `${((player.consensus || 0) / maxConsensus) * 100}%` }} />
                    </span>
                  </td>
                  <td className="right bye tnum">{player.bye_week || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hoveredPlayer && <PlayerCard player={hoveredPlayer} position={cardPos} />}
    </div>
  );
};
