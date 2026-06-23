import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Player } from '../../types';
import './TierVisualizer.css';

interface TierVisualizerProps {
  players: Player[];
  loading?: boolean;
}

const BRAND_SCALE: [number, string][] = [
  [0, '#13243a'],
  [0.4, '#155e52'],
  [0.7, '#10b981'],
  [1, '#5ef0b0'],
];

export const TierVisualizer: React.FC<TierVisualizerProps> = ({ players, loading }) => {
  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  const topN = 15;

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

  const zValues: number[][] = [];
  const textValues: string[][] = [];
  const positionLabels: string[] = [];

  positions.forEach((position) => {
    const posPlayers = chartData[position] || [];
    if (posPlayers.length === 0) return;
    zValues.push(posPlayers.map((p) => p.score || 0));
    textValues.push(posPlayers.map((p) => p.name));
    positionLabels.push(position);
  });

  if (!positionLabels.length) {
    return (
      <div className="card">
        <div className="card-head">
          <h2>Tier Heatmap</h2>
        </div>
        <div className="state">{loading ? 'Loading…' : 'No player data available'}</div>
      </div>
    );
  }

  const maxPlayers = Math.max(...zValues.map((row) => row.length));
  const xLabels = Array.from({ length: maxPlayers }, (_, i) => `${i + 1}`);

  const trace = {
    z: zValues,
    y: positionLabels,
    x: xLabels,
    text: textValues,
    hovertemplate: '<b>%{text}</b>   ·   %{y}%{x}<br>Score %{z:.1f}<extra></extra>',
    type: 'heatmap' as const,
    colorscale: BRAND_SCALE,
    xgap: 3,
    ygap: 3,
    colorbar: {
      title: { text: 'Score', font: { color: '#93a1b8', size: 11 } },
      tickfont: { color: '#93a1b8', size: 10 },
      outlinewidth: 0,
      thickness: 12,
      len: 0.9,
    },
  };

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter, sans-serif', color: '#93a1b8', size: 12 },
    xaxis: {
      title: { text: 'Rank within position', font: { size: 11, color: '#5e6b82' } },
      side: 'bottom' as const,
      gridcolor: 'rgba(255,255,255,0.03)',
      zeroline: false,
      tickfont: { size: 10 },
    },
    yaxis: {
      autorange: 'reversed' as const,
      gridcolor: 'rgba(255,255,255,0.03)',
      zeroline: false,
      tickfont: { size: 12, color: '#e8edf5' },
    },
    height: 420,
    margin: { l: 48, r: 20, t: 16, b: 48 },
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Tier Heatmap</h2>
        <span className="count">value by position</span>
      </div>
      <div className="plot-wrap">
        <Plot
          data={[trace]}
          layout={layout}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
      <p className="plot-note">
        Each cell is a player ranked left-to-right within their position. Brighter green = higher
        model score. Hover for names.
      </p>
    </div>
  );
};
