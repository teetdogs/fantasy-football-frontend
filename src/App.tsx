import { useState } from 'react';
import type { CSSProperties } from 'react';
import { PlayerRanking, TierVisualizer, DraftBoard } from './components';
import { useFetchPlayers } from './hooks/useFetchPlayers';
import type { RankingWeights } from './types';
import './App.css';

const DEFAULT_WEIGHTS: RankingWeights = {
  adpWeight: 0.4,
  projectionWeight: 0.5,
  positionScarcityWeight: 0.1,
};

const WEIGHT_META: { key: keyof RankingWeights; label: string; hint: string; color: string }[] = [
  { key: 'adpWeight', label: 'ADP', hint: 'Market consensus draft position', color: 'var(--pos-wr)' },
  { key: 'projectionWeight', label: 'Projection', hint: 'Projected fantasy points', color: 'var(--accent)' },
  { key: 'positionScarcityWeight', label: 'Scarcity', hint: 'Value depth at the position', color: 'var(--pos-te)' },
];

const TABS = [
  { id: 'table', label: 'Rankings' },
  { id: 'tiers', label: 'Tiers' },
  { id: 'board', label: 'Draft Board' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('table');
  const [weights, setWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [positionFilter, setPositionFilter] = useState<string>('');

  const { players, loading, error } = useFetchPlayers(weights);

  const handleWeightChange = (key: keyof RankingWeights, value: number) => {
    const next = { ...weights, [key]: value / 100 };
    const total = next.adpWeight + next.projectionWeight + next.positionScarcityWeight || 1;
    setWeights({
      adpWeight: next.adpWeight / total,
      projectionWeight: next.projectionWeight / total,
      positionScarcityWeight: next.positionScarcityWeight / total,
    });
  };

  const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
  const isDefault =
    Math.abs(weights.adpWeight - DEFAULT_WEIGHTS.adpWeight) < 0.001 &&
    Math.abs(weights.projectionWeight - DEFAULT_WEIGHTS.projectionWeight) < 0.001;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12c0-3.5 3-6.5 7-6.5s7 3 7 6.5-3 6.5-7 6.5-7-3-7-6.5Z"
                fill="currentColor"
                opacity="0.25"
              />
              <path
                d="M5 12c0-3.5 3-6.5 7-6.5s7 3 7 6.5-3 6.5-7 6.5-7-3-7-6.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M9.5 12h5M12 10v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="brand-text">
            <span className="brand-name">Draft Lab</span>
            <span className="brand-sub">Fantasy Football</span>
          </div>
          <span className="tag">BETA</span>
        </div>

        <div className="topbar-meta">
          <span className="meta-item">
            <span className="dot" data-state={error ? 'error' : loading ? 'loading' : 'live'} />
            {error ? 'Offline' : loading ? 'Syncing' : 'Live'}
          </span>
          <span className="meta-sep" />
          <span className="meta-item tnum">{players.length} players</span>
          <span className="meta-sep" />
          <span className="meta-item">2024 season · mock data</span>
        </div>
      </header>

      <div className="shell">
        <aside className="panel">
          <div className="panel-head">
            <h3>Ranking Model</h3>
            {!isDefault && (
              <button className="link-btn" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
                Reset
              </button>
            )}
          </div>
          <p className="panel-desc">Blend the inputs that drive each player's score.</p>

          {WEIGHT_META.map(({ key, label, hint, color }) => (
            <div className="weight" key={key}>
              <div className="weight-top">
                <span className="weight-label">{label}</span>
                <span className="weight-val tnum">{Math.round(weights[key] * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(weights[key] * 100)}
                style={{ '--track': color } as CSSProperties}
                onChange={(e) => handleWeightChange(key, parseInt(e.target.value))}
              />
              <span className="weight-hint">{hint}</span>
            </div>
          ))}

          <div className="mix-bar" aria-hidden="true">
            {WEIGHT_META.map(({ key, color }) => (
              <span key={key} style={{ width: `${weights[key] * 100}%`, background: color }} />
            ))}
          </div>

          <div className="panel-divider" />

          <h4 className="panel-subhead">Position</h4>
          <div className="chips">
            <button className={!positionFilter ? 'chip active' : 'chip'} onClick={() => setPositionFilter('')}>
              All
            </button>
            {positions.map((pos) => (
              <button
                key={pos}
                className={positionFilter === pos ? 'chip active' : 'chip'}
                data-pos={pos.toLowerCase()}
                onClick={() => setPositionFilter(pos)}
              >
                {pos}
              </button>
            ))}
          </div>
        </aside>

        <main className="content">
          {error && (
            <div className="banner">
              <strong>Can't reach the ranking service.</strong> {error}
            </div>
          )}

          <nav className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'tab active' : 'tab'}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="tab-panel">
            {activeTab === 'table' && <PlayerRanking weights={weights} positionFilter={positionFilter} />}
            {activeTab === 'tiers' && <TierVisualizer players={players} loading={loading} />}
            {activeTab === 'board' && <DraftBoard players={players} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
