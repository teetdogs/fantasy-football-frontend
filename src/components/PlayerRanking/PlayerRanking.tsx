import { useState } from 'react';
import type { RankingWeights } from '../../types';
import { useFetchPlayers } from '../../hooks/useFetchPlayers';
import './PlayerRanking.css';

interface PlayerRankingProps {
  weights?: RankingWeights;
  positionFilter?: string;
}

type SortField = 'rank' | 'adp' | 'projected_points' | 'score' | 'name';

const COLUMNS: { field: SortField | null; label: string; sortable: boolean; align?: 'right' }[] = [
  { field: 'rank', label: 'Rk', sortable: true },
  { field: 'name', label: 'Player', sortable: true },
  { field: null, label: 'Pos', sortable: false },
  { field: null, label: 'Team', sortable: false },
  { field: 'adp', label: 'ADP', sortable: true, align: 'right' },
  { field: 'projected_points', label: 'Proj', sortable: true, align: 'right' },
  { field: 'score', label: 'Score', sortable: true, align: 'right' },
  { field: null, label: 'Bye', sortable: false, align: 'right' },
];

export const PlayerRanking: React.FC<PlayerRankingProps> = ({ weights, positionFilter }) => {
  const { players, loading, error } = useFetchPlayers(weights);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredPlayers = positionFilter
    ? players.filter((p) => p.position === positionFilter)
    : players;

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aVal = a[sortField] || 0;
    const bVal = b[sortField] || 0;
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const maxScore = Math.max(1, ...sortedPlayers.map((p) => p.score || 0));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name' || field === 'rank' || field === 'adp');
    }
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
        <h2>Player Rankings</h2>
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
                  className={[col.sortable ? 'sortable' : '', col.align === 'right' ? 'right' : '']
                    .join(' ')
                    .trim()}
                  onClick={col.sortable && col.field ? () => handleSort(col.field as SortField) : undefined}
                >
                  {col.label}
                  {col.field && sortField === col.field && (
                    <span className="sort-ind">{sortAsc ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id}>
                <td className="rank tnum">{player.rank ?? '—'}</td>
                <td className="name">{player.name}</td>
                <td>
                  <span className="pos-badge" data-pos={player.position.toLowerCase()}>
                    {player.position}
                  </span>
                </td>
                <td className="team">{player.team || '—'}</td>
                <td className="right tnum">
                  {player.adp ? player.adp.toFixed(1) : '—'}
                  {player.adp_floor && player.adp_ceiling && (
                    <span className="sub tnum">
                      {player.adp_floor.toFixed(0)}–{player.adp_ceiling.toFixed(0)}
                    </span>
                  )}
                </td>
                <td className="right tnum proj">{player.projected_points?.toFixed(1) ?? '—'}</td>
                <td className="right score-cell">
                  <span className="score-val tnum">{player.score?.toFixed(1) ?? '—'}</span>
                  <span className="score-bar">
                    <span style={{ width: `${((player.score || 0) / maxScore) * 100}%` }} />
                  </span>
                </td>
                <td className="right bye tnum">{player.bye_week || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
