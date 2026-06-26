import { useState, useEffect } from 'react';
import axios from 'axios';
import './Ticker.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const POLL_MS = 10 * 60 * 1000; // 10 minutes

interface TickerItem {
  headline: string;
  type: 'nfl' | 'fantasy';
  source: string;
  link: string | null;
}

export function Ticker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const fetch = () => {
      axios.get(`${API_URL}/api/news/ticker`)
        .then((res) => setItems(res.data.ticker || []))
        .catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (!items.length) return null;

  return (
    <div className="ticker">
      <span className="ticker-label">NEWS</span>
      <div className="ticker-track">
        <div className="ticker-scroll">
          {items.map((item, i) => (
            <span className="ticker-item" key={i}>
              <span className={`ticker-tag ${item.type}`}>{item.type === 'fantasy' ? 'FF' : 'NFL'}</span>
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="ticker-link">{item.headline}</a>
              ) : (
                <span>{item.headline}</span>
              )}
              <span className="ticker-sep" />
            </span>
          ))}
          {items.map((item, i) => (
            <span className="ticker-item" key={`dup-${i}`} aria-hidden="true">
              <span className={`ticker-tag ${item.type}`}>{item.type === 'fantasy' ? 'FF' : 'NFL'}</span>
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="ticker-link" tabIndex={-1}>{item.headline}</a>
              ) : (
                <span>{item.headline}</span>
              )}
              <span className="ticker-sep" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
