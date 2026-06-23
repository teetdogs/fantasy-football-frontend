import { useState, useMemo } from 'react';
import { PlayerRanking, TierVisualizer, DraftBoard } from './components';
import { useFetchPlayers } from './hooks/useFetchPlayers';
import type { RankingWeights } from './types';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'table' | 'tiers' | 'board'>('table');
  const [weights, setWeights] = useState<RankingWeights>({
    adpWeight: 0.4,
    projectionWeight: 0.5,
    positionScarcityWeight: 0.1,
  });
  const [positionFilter, setPositionFilter] = useState<string>('');

  const { players, loading, error } = useFetchPlayers(weights);

  const handleWeightChange = (key: keyof RankingWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    const total = newWeights.adpWeight + newWeights.projectionWeight + newWeights.positionScarcityWeight;
    setWeights({
      adpWeight: newWeights.adpWeight / total,
      projectionWeight: newWeights.projectionWeight / total,
      positionScarcityWeight: newWeights.positionScarcityWeight / total,
    });
  };

  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Fantasy Football Draft Strategy</h1>
        <p className="subtitle">ESPN Fantasy Football Analysis & Ranking Tool</p>
      </header>

      <div className="app-container">
        {/* Algorithm Weight Controls */}
        <aside className="control-panel">
          <h3>Algorithm Weights</h3>
          <div className="weight-control">
            <label>
              <span>ADP Weight: {(weights.adpWeight * 100).toFixed(0)}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.adpWeight * 100}
                onChange={(e) => handleWeightChange('adpWeight', parseInt(e.target.value))}
              />
              <small>How much weight to give Average Draft Position</small>
            </label>
          </div>

          <div className="weight-control">
            <label>
              <span>Projection Weight: {(weights.projectionWeight * 100).toFixed(0)}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.projectionWeight * 100}
                onChange={(e) => handleWeightChange('projectionWeight', parseInt(e.target.value))}
              />
              <small>How much weight to give projected points</small>
            </label>
          </div>

          <div className="weight-control">
            <label>
              <span>Position Scarcity Weight: {(weights.positionScarcityWeight * 100).toFixed(0)}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.positionScarcityWeight * 100}
                onChange={(e) => handleWeightChange('positionScarcityWeight', parseInt(e.target.value))}
              />
              <small>How much weight to give position value tier</small>
            </label>
          </div>

          <div className="position-filter">
            <h4>Position Filter</h4>
            <div className="filter-buttons">
              <button
                className={!positionFilter ? 'active' : ''}
                onClick={() => setPositionFilter('')}
              >
                All
              </button>
              {positions.map((pos) => (
                <button
                  key={pos}
                  className={positionFilter === pos ? 'active' : ''}
                  onClick={() => setPositionFilter(pos)}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {error && (
            <div className="error-banner">
              ⚠️ Error loading data: {error}. Make sure the backend is running on port 3001.
            </div>
          )}

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={activeTab === 'table' ? 'active' : ''}
              onClick={() => setActiveTab('table')}
            >
              📊 Player Rankings
            </button>
            <button
              className={activeTab === 'tiers' ? 'active' : ''}
              onClick={() => setActiveTab('tiers')}
            >
              🎨 Tier Visualizer
            </button>
            <button
              className={activeTab === 'board' ? 'active' : ''}
              onClick={() => setActiveTab('board')}
            >
              🏈 Draft Board
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'table' && (
              <PlayerRanking weights={weights} positionFilter={positionFilter} />
            )}
            {activeTab === 'tiers' && <TierVisualizer players={players} loading={loading} />}
            {activeTab === 'board' && <DraftBoard players={players} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
