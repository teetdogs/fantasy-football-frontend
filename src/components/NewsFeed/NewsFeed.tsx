import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './NewsFeed.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const NFL_TEAMS: { abbrev: string; name: string }[] = [
  { abbrev: 'ARI', name: 'Arizona Cardinals' }, { abbrev: 'ATL', name: 'Atlanta Falcons' },
  { abbrev: 'BAL', name: 'Baltimore Ravens' }, { abbrev: 'BUF', name: 'Buffalo Bills' },
  { abbrev: 'CAR', name: 'Carolina Panthers' }, { abbrev: 'CHI', name: 'Chicago Bears' },
  { abbrev: 'CIN', name: 'Cincinnati Bengals' }, { abbrev: 'CLE', name: 'Cleveland Browns' },
  { abbrev: 'DAL', name: 'Dallas Cowboys' }, { abbrev: 'DEN', name: 'Denver Broncos' },
  { abbrev: 'DET', name: 'Detroit Lions' }, { abbrev: 'GB', name: 'Green Bay Packers' },
  { abbrev: 'HOU', name: 'Houston Texans' }, { abbrev: 'IND', name: 'Indianapolis Colts' },
  { abbrev: 'JAX', name: 'Jacksonville Jaguars' }, { abbrev: 'KC', name: 'Kansas City Chiefs' },
  { abbrev: 'LAC', name: 'Los Angeles Chargers' }, { abbrev: 'LAR', name: 'Los Angeles Rams' },
  { abbrev: 'LV', name: 'Las Vegas Raiders' }, { abbrev: 'MIA', name: 'Miami Dolphins' },
  { abbrev: 'MIN', name: 'Minnesota Vikings' }, { abbrev: 'NE', name: 'New England Patriots' },
  { abbrev: 'NO', name: 'New Orleans Saints' }, { abbrev: 'NYG', name: 'New York Giants' },
  { abbrev: 'NYJ', name: 'New York Jets' }, { abbrev: 'PHI', name: 'Philadelphia Eagles' },
  { abbrev: 'PIT', name: 'Pittsburgh Steelers' }, { abbrev: 'SEA', name: 'Seattle Seahawks' },
  { abbrev: 'SF', name: 'San Francisco 49ers' }, { abbrev: 'TB', name: 'Tampa Bay Buccaneers' },
  { abbrev: 'TEN', name: 'Tennessee Titans' }, { abbrev: 'WSH', name: 'Washington Commanders' },
];

interface Article {
  id: string;
  headline: string;
  description: string;
  published: string;
  imageUrl: string | null;
  link: string | null;
  type: 'nfl' | 'fantasy';
  source: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ArticleCard({ a }: { a: Article }) {
  return (
    <a className="nf-article" href={a.link || '#'} target="_blank" rel="noopener noreferrer">
      {a.imageUrl && (
        <div className="nf-img-wrap">
          <img className="nf-img" src={a.imageUrl} alt="" loading="lazy" />
          <span className="nf-source-badge">{a.source}</span>
        </div>
      )}
      {!a.imageUrl && <div className="nf-no-img"><span className="nf-source-badge static">{a.source}</span></div>}
      <div className="nf-content">
        <div className="nf-meta">
          <span className={`nf-tag ${a.type}`}>{a.type === 'fantasy' ? 'Fantasy' : 'NFL'}</span>
          <span className="nf-time">{timeAgo(a.published)}</span>
        </div>
        <h3 className="nf-headline">{a.headline}</h3>
        <p className="nf-desc">{a.description}</p>
      </div>
    </a>
  );
}

export function NewsFeed() {
  const [section, setSection] = useState<'headlines' | 'team'>('headlines');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'nfl' | 'fantasy'>('all');

  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamArticles, setTeamArticles] = useState<Article[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  const PAGE = 12;
  const [headlineVisible, setHeadlineVisible] = useState(PAGE);
  const [teamVisible, setTeamVisible] = useState(PAGE);

  useEffect(() => {
    axios.get(`${API_URL}/api/news`)
      .then((res) => setArticles(res.data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeam) { setTeamArticles([]); return; }
    setTeamLoading(true);
    setTeamVisible(PAGE);
    axios.get(`${API_URL}/api/news/team/${selectedTeam}`)
      .then((res) => setTeamArticles(res.data.articles || []))
      .catch(() => setTeamArticles([]))
      .finally(() => setTeamLoading(false));
  }, [selectedTeam]);

  // Reset the headline page count when the filter changes.
  useEffect(() => { setHeadlineVisible(PAGE); }, [filter]);

  const filtered = useMemo(() => {
    if (filter === 'all') return articles;
    return articles.filter((a) => a.type === filter);
  }, [articles, filter]);

  const selectedTeamName = NFL_TEAMS.find((t) => t.abbrev === selectedTeam)?.name;

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>NFL News</h2>
          <p className="card-sub">Latest headlines from ESPN, NFL.com, and Yahoo Sports.</p>
        </div>
      </div>

      <div className="nf-section-tabs">
        <button className={`nf-section-tab ${section === 'headlines' ? 'active' : ''}`} onClick={() => setSection('headlines')}>
          Headlines
        </button>
        <button className={`nf-section-tab ${section === 'team' ? 'active' : ''}`} onClick={() => setSection('team')}>
          Team News
        </button>
      </div>

      <div className="nf-body">
        {section === 'headlines' && (
          <>
            <div className="nf-filter-bar">
              <div className="nf-filters">
                <button className={`nf-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
                <button className={`nf-filter ${filter === 'nfl' ? 'active' : ''}`} onClick={() => setFilter('nfl')}>NFL</button>
                <button className={`nf-filter ${filter === 'fantasy' ? 'active' : ''}`} onClick={() => setFilter('fantasy')}>Fantasy</button>
              </div>
              <span className="nf-count tnum">{filtered.length} articles</span>
            </div>

            {loading && <p className="nf-note">Loading news…</p>}
            {!loading && filtered.length === 0 && <p className="nf-note">No articles found.</p>}

            <div className="nf-grid">
              {filtered.slice(0, headlineVisible).map((a) => <ArticleCard key={a.id} a={a} />)}
            </div>

            {headlineVisible < filtered.length && (
              <button className="nf-more" onClick={() => setHeadlineVisible((v) => v + PAGE)}>
                Load More ({filtered.length - headlineVisible} more)
              </button>
            )}
          </>
        )}

        {section === 'team' && (
          <>
            <div className="nf-team-picker">
              <p className="nf-team-prompt">Select a team to see their latest news</p>
              <div className="nf-team-grid">
                {NFL_TEAMS.map((t) => (
                  <button
                    key={t.abbrev}
                    className={`nf-team-btn ${selectedTeam === t.abbrev ? 'active' : ''}`}
                    onClick={() => setSelectedTeam(t.abbrev)}
                  >
                    <span className="nf-team-abbrev">{t.abbrev}</span>
                    <span className="nf-team-name">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {teamLoading && <p className="nf-note">Loading {selectedTeamName} news…</p>}

            {!teamLoading && selectedTeam && teamArticles.length === 0 && (
              <p className="nf-note">No news found for the {selectedTeamName}.</p>
            )}

            {!teamLoading && teamArticles.length > 0 && (
              <>
                <h3 className="nf-team-results-title">{selectedTeamName} News</h3>
                <div className="nf-grid">
                  {teamArticles.slice(0, teamVisible).map((a) => <ArticleCard key={a.id} a={a} />)}
                </div>
                {teamVisible < teamArticles.length && (
                  <button className="nf-more" onClick={() => setTeamVisible((v) => v + PAGE)}>
                    Load More ({teamArticles.length - teamVisible} more)
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
