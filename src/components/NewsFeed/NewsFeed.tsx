import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './NewsFeed.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Article {
  id: string;
  headline: string;
  description: string;
  published: string;
  imageUrl: string | null;
  link: string | null;
  type: 'nfl' | 'fantasy';
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

export function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'nfl' | 'fantasy'>('all');

  useEffect(() => {
    axios.get(`${API_URL}/api/news`)
      .then((res) => setArticles(res.data.articles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return articles;
    return articles.filter((a) => a.type === filter);
  }, [articles, filter]);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>NFL News</h2>
          <p className="card-sub">Latest headlines from around the league.</p>
        </div>
        <div className="nf-filters">
          <button className={`nf-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          <button className={`nf-filter ${filter === 'nfl' ? 'active' : ''}`} onClick={() => setFilter('nfl')}>NFL</button>
          <button className={`nf-filter ${filter === 'fantasy' ? 'active' : ''}`} onClick={() => setFilter('fantasy')}>Fantasy</button>
        </div>
      </div>

      <div className="nf-body">
        {loading && <p className="nf-note">Loading news…</p>}

        {!loading && filtered.length === 0 && (
          <p className="nf-note">No articles found.</p>
        )}

        <div className="nf-grid">
          {filtered.map((a) => (
            <a
              className="nf-article"
              key={a.id}
              href={a.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
            >
              {a.imageUrl && (
                <div className="nf-img-wrap">
                  <img className="nf-img" src={a.imageUrl} alt="" loading="lazy" />
                </div>
              )}
              <div className="nf-content">
                <div className="nf-meta">
                  <span className={`nf-tag ${a.type}`}>{a.type === 'fantasy' ? 'Fantasy' : 'NFL'}</span>
                  <span className="nf-time">{timeAgo(a.published)}</span>
                </div>
                <h3 className="nf-headline">{a.headline}</h3>
                <p className="nf-desc">{a.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
