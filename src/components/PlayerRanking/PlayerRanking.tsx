import { useState } from 'react';
import type { Player, RankingWeights } from '../../types';
import { useFetchPlayers } from '../../hooks/useFetchPlayers';
import './PlayerRanking.css';

interface PlayerRankingProps {
  weights?: RankingWeights;
  positionFilter?: string;
}

type SortField = 'rank' | 'adp' | 'projected_points' | 'score' | 'name';

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (loading) return <div className="player-ranking loading">Loading players...</div>;
  if (error) return <div className="player-ranking error">Error: {error}</div>;

  return (
    <div className="player-ranking">
      <h2>Player Rankings</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('rank')} className="sortable">
                Rank {sortField === 'rank' && (sortAsc ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {sortField === 'name' && (sortAsc ? '↑' : '↓')}
              </th>
              <th>Position</th>
              <th>Team</th>
              <th onClick={() => handleSort('adp')} className="sortable">
                ADP {sortField === 'adp' && (sortAsc ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('projected_points')} className="sortable">
                Proj. Pts {sortField === 'projected_points' && (sortAsc ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('score')} className="sortable">
                Score {sortField === 'score' && (sortAsc ? '↑' : '↓')}
              </th>
              <th>Bye</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player) => (
              <tr key={player.id} className={`pos-${player.position.toLowerCase()}`}>
                <td className="rank">{player.rank || '-'}</td>
                <td className="name">{player.name}</td>
                <td className="position">{player.position}</td>
                <td className="team">{player.team || '-'}</td>
                <td className="adp">
                  {player.adp ? player.adp.toFixed(1) : '-'}
                  {player.adp_floor && player.adp_ceiling && (
                    <div className="range">
                      {player.adp_floor.toFixed(0)}-{player.adp_ceiling.toFixed(0)}
                    </div>
                  )}
                </td>
                <td className="projection">{player.projected_points?.toFixed(1) || '-'}</td>
                <td className="score">{player.score?.toFixed(2) || '-'}</td>
                <td className="bye">{player.bye_week || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="summary">
        Showing {sortedPlayers.length} players
      </div>
    </div>
  );
};
