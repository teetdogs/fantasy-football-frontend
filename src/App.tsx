import { useState } from 'react';
import type { CSSProperties } from 'react';
import { PlayerRanking, TierVisualizer, DraftBoard } from './components';
import { Projections } from './components/Projections/Projections';
import { useFetchPlayers, useMeta } from './hooks/useFetchPlayers';
import type { RankingWeights } from './types';
import './App.css';

const DEFAULT_WEIGHTS: RankingWeights = {
  adpWeight: 0.4,
  projectionWeight: 0.5,
  positionScarcityWeight: 0.1,
};

const WEIGHT_META: { key: keyof RankingWeights; label: string; hint: string; color: string }[] = [
  { key: 'adpWeight', label: 'Where others draft him', hint: 'Average draft position (ADP)', color: 'var(--pos-wr)' },
  { key: 'projectionWeight', label: 'Projected points', hint: 'Expected 2026 fantasy points', color: 'var(--accent)' },
  { key: 'positionScarcityWeight', label: 'Position scarcity', hint: 'How thin the talent is at the spot', color: 'var(--pos-te)' },
];

const TABS = [
  { id: 'table', label: 'Who to Draft' },
  { id: 'projections', label: 'Projections' },
  { id: 'tiers', label: 'Tiers' },
  { id: 'board', label: 'Draft Board' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('table');
  const [weights, setWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [positionFilter, setPositionFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { players, loading, error } = useFetchPlayers(weights);
  const meta = useMeta();

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
        <button className="brand" onClick={() => { setActiveTab('table'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <span className="brand-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="12" rx="10" ry="6.5" transform="rotate(-30 12 12)" fill="currentColor" opacity="0.25" />
              <ellipse cx="12" cy="12" rx="10" ry="6.5" transform="rotate(-30 12 12)" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 17L17 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M9.5 14.5l1.5-1.5M12 12l1.5-1.5M14.5 9.5l1-1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </span>
          <div className="brand-text">
            <span className="brand-name">Draft Lab</span>
            <span className="brand-sub">Fantasy Football</span>
          </div>
          <span className="tag">BETA</span>
        </button>

        <div className="topbar-meta">
          <span className="meta-item">
            <span className="dot" data-state={error ? 'error' : loading ? 'loading' : 'live'} />
            {error ? 'Offline' : loading ? 'Syncing' : 'Live'}
          </span>
          <span className="meta-sep" />
          <span className="meta-item tnum">{players.length} players</span>
          <span className="meta-sep" />
          <span className="meta-item">
            {meta?.sources
              ? meta.sources.map((s) => s === 'fantasyPros' ? 'FP' : s.charAt(0).toUpperCase() + s.slice(1)).join(' + ')
              : '2026 season'}
          </span>
        </div>
      </header>

      <div className="shell">
        <aside className="panel">
          <h3 className="panel-title">Find players</h3>
          <input
            className="search-input"
            type="search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

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

          <div className="scoring-note">
            <span className="scoring-dot" /> PPR scoring
          </div>

          <div className="panel-divider" />

          {/* Advanced: ranking model tuning, hidden by default */}
          <button
            className="advanced-toggle"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
          >
            <span className={advancedOpen ? 'caret open' : 'caret'}>▸</span>
            Advanced: customize ranking
          </button>

          {advancedOpen && (
            <div className="advanced-body">
              <p className="panel-desc">
                The list is already tuned for you. Adjust only if you want to weight things yourself.
              </p>
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
              {!isDefault && (
                <button className="link-btn reset-row" onClick={() => setWeights(DEFAULT_WEIGHTS)}>
                  Reset to recommended
                </button>
              )}
            </div>
          )}
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
            {activeTab === 'table' && (
              <PlayerRanking weights={weights} positionFilter={positionFilter} search={search} />
            )}
            {activeTab === 'projections' && (
              <Projections players={players} positionFilter={positionFilter} search={search} loading={loading} />
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
