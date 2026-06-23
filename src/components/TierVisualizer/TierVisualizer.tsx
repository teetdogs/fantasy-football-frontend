import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Player } from '../../types';
import './TierVisualizer.css';

interface TierVisualizerProps {
  players: Player[];
  loading?: boolean;
}

export const TierVisualizer: React.FC<TierVisualizerProps> = ({ players, loading }) => {
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  const topN = 15; // Show top 15 players per position

  const chartData = useMemo(() => {
    const data: Record<string, Player[]> = {};
    positions.forEach((pos) => {
      data[pos] = players
        .filter((p) => p.position === pos)
        .sort((a, b) => (a.rank || 999) - (b.rank || 999))
        .slice(0, topN);
    });
    return data;
  }, [players]);

  // Prepare data for heatmap
  const zValues: number[][] = [];
  const textValues: string[][] = [];
  const playerNames: string[] = [];
  const positionLabels: string[] = [];

  positions.forEach((position) => {
    const posPlayers = chartData[position] || [];
    if (posPlayers.length === 0) return;

    const scores = posPlayers.map((p) => p.score || 0);
    const names = posPlayers.map((p) => p.name);

    zValues.push(scores);
    textValues.push(names);
    positionLabels.push(position);
    playerNames.push(...names);
  });

  if (!positionLabels.length) {
    return (
      <div className="tier-visualizer">
        <h2>Tier Visualizer</h2>
        <div className="placeholder">
          {loading ? 'Loading...' : 'No player data available'}
        </div>
      </div>
    );
  }

  // Create heatmap with player names as x-axis
  const maxPlayers = Math.max(...zValues.map((row) => row.length));
  const xLabels = Array.from({ length: maxPlayers }, (_, i) => `#${i + 1}`);

  const trace = {
    z: zValues,
    y: positionLabels,
    x: xLabels,
    text: textValues,
    hovertemplate: '<b>%{text}</b><br>Rank: %{x}<br>Score: %{z:.2f}<extra></extra>',
    type: 'heatmap' as const,
    colorscale: 'Viridis' as const,
    colorbar: {
      title: 'Score',
    },
  };

  const layout = {
    title: 'Player Value by Position Tier',
    xaxis: {
      title: 'Rank within Position',
      side: 'bottom' as const,
    },
    yaxis: {
      title: 'Position',
    },
    height: 400,
    margin: { l: 50, r: 50, t: 60, b: 50 },
  };

  return (
    <div className="tier-visualizer">
      <h2>Tier Visualizer</h2>
      <div className="plot-container">
        <Plot
          data={[trace]}
          layout={layout}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true }}
        />
      </div>
      <div className="legend">
        <p>Brighter colors = Higher value scores. Hover over tiles for player names.</p>
      </div>
    </div>
  );
};
