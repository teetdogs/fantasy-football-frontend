import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './NewsFeed.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const NFL_TEAMS = [
  'ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE',
  'DAL','DEN','DET','GB','HOU','IND','JAX','KC',
  'LAC','LAR','LV','MIA','MIN','NE','NO','NYG',
  'NYJ','PHI','PIT','SEA','SF','TB','TEN','WSH',
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'nfl' | 'fantasy'>('all');

  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamArticles, setTeamArticles] = useState<Article[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/news`)
      .then((res) => setArticles(res.data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeam) { setTeamArticles([]); return; }
    setTeamLoading(true);
    axios.get(`${API_URL}/api/news/team/${selectedTeam}`)
      .then((res) => setTeamArticles(res.data.articles || []))
      .catch(() => setTeamArticles([]))
      .finally(() => setTeamLoading(false));
  }, [selectedTeam]);

  const filtered = useMemo(() => {
    if (filter === 'all') return articles;
    return articles.filter((a) => a.type === filter);
  }, [articles, filter]);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>NFL News</h2>
          <p className="card-sub">Latest headlines from ESPN, NFL.com, and Yahoo Sports.</p>
        </div>
        <div className="nf-filters">
          <button className={`nf-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`nf-filter ${filter === 'nfl' ? 'active' : ''}`} onClick={() => setFilter('nfl')}>NFL</button>
          <button className={`nf-filter ${filter === 'fantasy' ? 'active' : ''}`} onClick={() => setFilter('fantasy')}>Fantasy</button>
        </div>
      </div>

      <div className="nf-body">
        {loading && <p className="nf-note">Loading news…</p>}

        {!loading && filtered.length === 0 && <p className="nf-note">No articles found.</p>}

        <div className="nf-grid">
          {filtered.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>

        {/* Team-specific news section */}
        <div className="nf-team-section">
          <div className="nf-team-header">
            <h3 className="nf-team-title">Team News</h3>
            <select className="nf-team-select" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
              <option value="">Select a team…</option>
              {NFL_TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {teamLoading && <p className="nf-note">Loading team news…</p>}

          {!teamLoading && selectedTeam && teamArticles.length === 0 && (
            <p className="nf-note">No news found for {selectedTeam}.</p>
          )}

          {!teamLoading && teamArticles.length > 0 && (
            <div className="nf-grid">
              {teamArticles.map((a) => <ArticleCard key={a.id} a={a} />)}
            </div>
          )}

          {!selectedTeam && <p className="nf-note">Pick a team above to see their latest news.</p>}
        </div>
      </div>
    </div>
  );
}
