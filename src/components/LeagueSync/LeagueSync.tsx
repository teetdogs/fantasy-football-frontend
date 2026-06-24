import { useState, useEffect } from 'react';
import axios from 'axios';
import type { LeagueSettings, LeagueTeam, LeagueCredentials } from '../../types';
import './LeagueSync.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const LS_KEY = 'draftlab_league';

function loadSaved(): { creds: LeagueCredentials; settings: LeagueSettings; teams: LeagueTeam[] } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

interface Props {
  onConnected?: (settings: LeagueSettings, teams: LeagueTeam[], creds: LeagueCredentials) => void;
}

type Step = 'form' | 'connected';

export function LeagueSync({ onConnected }: Props) {
  const saved = loadSaved();
  const [leagueId, setLeagueId] = useState(saved?.creds.leagueId || '');
  const [swid, setSwid] = useState(saved?.creds.swid || '');
  const [espnS2, setEspnS2] = useState(saved?.creds.espnS2 || '');
  const [step, setStep] = useState<Step>(saved ? 'connected' : 'form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<LeagueSettings | null>(saved?.settings || null);
  const [teams, setTeams] = useState<LeagueTeam[]>(saved?.teams || []);
  const [showGuide, setShowGuide] = useState(true);
  const [showS2, setShowS2] = useState(false);

  useEffect(() => {
    if (saved && settings) onConnected?.(settings, teams, saved.creds);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanSwid = (v: string) => {
    let s = v.trim();
    if (!s.startsWith('{')) s = '{' + s;
    if (!s.endsWith('}')) s = s + '}';
    return s;
  };

  const connect = async () => {
    if (!leagueId || !swid || !espnS2) {
      setError('All three fields are required.');
      return;
    }

    setLoading(true);
    setError(null);

    const creds: LeagueCredentials = {
      leagueId: leagueId.trim(),
      swid: cleanSwid(swid),
      espnS2: espnS2.trim(),
    };

    try {
      const [settingsRes, teamsRes] = await Promise.all([
        axios.post(`${API_URL}/api/league/settings`, creds),
        axios.post(`${API_URL}/api/league/teams`, creds),
      ]);

      setSettings(settingsRes.data);
      setTeams(teamsRes.data.teams || []);
      setStep('connected');
      localStorage.setItem(LS_KEY, JSON.stringify({ creds, settings: settingsRes.data, teams: teamsRes.data.teams || [] }));
      onConnected?.(settingsRes.data, teamsRes.data.teams || [], creds);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setStep('form');
    setSettings(null);
    setTeams([]);
    setError(null);
    setLeagueId('');
    setSwid('');
    setEspnS2('');
    localStorage.removeItem(LS_KEY);
  };

  if (step === 'connected' && settings) {
    return (
      <div className="card ls">
        <div className="card-head">
          <div>
            <h2>Your League</h2>
            <p className="card-sub">Connected to ESPN Fantasy Football</p>
          </div>
          <button className="ls-disconnect" onClick={disconnect}>Disconnect</button>
        </div>

        <div className="ls-connected">
          <div className="ls-league-hero">
            <div className="ls-league-name">{settings.name}</div>
            <div className="ls-league-meta">
              <span>{settings.size} teams</span>
              <span className="ls-sep" />
              <span>{settings.scoringFormat}</span>
              <span className="ls-sep" />
              <span>{settings.season} season</span>
            </div>
          </div>

          <div className="ls-sections">
            <div className="ls-section">
              <h4>Roster Slots</h4>
              <div className="ls-roster-slots">
                {settings.rosterSlots.map((s) => (
                  <div className="ls-slot" key={s.position}>
                    <span className="ls-slot-pos">{s.position}</span>
                    <span className="ls-slot-count">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ls-section">
              <h4>Scoring</h4>
              <div className="ls-scoring">
                {Object.entries(settings.scoring).map(([key, val]) => (
                  <div className="ls-score-rule" key={key}>
                    <span className="ls-score-label">{formatScoringLabel(key)}</span>
                    <span className="ls-score-val">{typeof val === 'number' ? val : String(val)} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="ls-section">
              <h4>Draft</h4>
              <div className="ls-draft-info">
                <span>{settings.draft.type} draft</span>
                {settings.draft.date && (
                  <>
                    <span className="ls-sep" />
                    <span>{new Date(settings.draft.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                  </>
                )}
                <span className="ls-sep" />
                <span>{settings.draft.rounds} rounds</span>
              </div>
            </div>

            {teams.length > 0 && (
              <div className="ls-section">
                <h4>Teams ({teams.length})</h4>
                <div className="ls-teams">
                  {teams.map((t) => (
                    <div className="ls-team-row" key={t.teamId}>
                      <span className="ls-team-name">{t.name}</span>
                      <span className="ls-team-owner">{t.owner}</span>
                      {t.record && (
                        <span className="ls-team-record">{t.record.wins}-{t.record.losses}{t.record.ties ? `-${t.record.ties}` : ''}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card ls">
      <div className="card-head">
        <div>
          <h2>Connect Your League</h2>
          <p className="card-sub">Import your ESPN league settings so Draft Lab can tailor recommendations to your league's scoring and roster rules.</p>
        </div>
      </div>

      <div className="ls-body">
        <button
          className="ls-guide-toggle"
          onClick={() => setShowGuide((v) => !v)}
          aria-expanded={showGuide}
        >
          <span className={showGuide ? 'caret open' : 'caret'}>&#9654;</span>
          How to find your League ID &amp; cookies
        </button>

        {showGuide && (
          <div className="ls-guide">
            <div className="ls-step">
              <div className="ls-step-num">1</div>
              <div className="ls-step-content">
                <h4>Find your League ID</h4>
                <p>Go to your ESPN Fantasy Football league page. Look at the URL — it will look like:</p>
                <code className="ls-url">fantasy.espn.com/football/league?leagueId=<strong>12345678</strong></code>
                <p>The number after <code>leagueId=</code> is your League ID.</p>
              </div>
            </div>

            <div className="ls-step">
              <div className="ls-step-num">2</div>
              <div className="ls-step-content">
                <h4>Find your SWID cookie</h4>
                <div className="ls-tip" style={{ marginBottom: '8px' }}>
                  <strong>Heads up:</strong> You'll need a desktop or laptop browser for this step — cookies aren't accessible on mobile.
                </div>
                <p>While on espn.com, open your browser's Developer Tools:</p>
                <ul>
                  <li><strong>Chrome / Edge:</strong> Press <kbd>F12</kbd> or <kbd>Cmd+Opt+I</kbd> (Mac) / <kbd>Ctrl+Shift+I</kbd> (Windows) → <strong>Application</strong> tab</li>
                  <li><strong>Safari:</strong> Enable Develop menu in Preferences → Advanced, then <kbd>Cmd+Opt+I</kbd> → <strong>Storage</strong> tab</li>
                  <li><strong>Firefox:</strong> Press <kbd>F12</kbd> → <strong>Storage</strong> tab</li>
                  <li>Expand <strong>Cookies</strong> → click <strong>https://www.espn.com</strong></li>
                  <li>Find the cookie named <strong>SWID</strong> — copy its value (looks like <code>{"{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"}</code>)</li>
                </ul>
              </div>
            </div>

            <div className="ls-step">
              <div className="ls-step-num">3</div>
              <div className="ls-step-content">
                <h4>Find your espn_s2 cookie</h4>
                <p>In the same cookies list, find the cookie named <strong>espn_s2</strong>.</p>
                <p>It's a long string of characters. Copy the entire value.</p>
                <div className="ls-tip">
                  <strong>Tip:</strong> Double-click the value to select it, then right-click → Copy. These cookies expire periodically — if you get an auth error later, come back and re-copy fresh values.
                </div>
              </div>
            </div>

            <div className="ls-step">
              <div className="ls-step-num">4</div>
              <div className="ls-step-content">
                <h4>Paste below and connect</h4>
                <p>Your credentials stay in your browser — they're sent directly to ESPN's servers to fetch your league data and are never stored on our end.</p>
              </div>
            </div>
          </div>
        )}

        <div className="ls-form">
          <div className="ls-field">
            <label htmlFor="ls-league-id">League ID</label>
            <input
              id="ls-league-id"
              type="text"
              placeholder="e.g. 12345678"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
            />
          </div>

          <div className="ls-field">
            <label htmlFor="ls-swid">SWID</label>
            <input
              id="ls-swid"
              type="text"
              placeholder="{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}"
              value={swid}
              onChange={(e) => setSwid(e.target.value)}
            />
          </div>

          <div className="ls-field">
            <label htmlFor="ls-espn-s2">espn_s2</label>
            <div className="ls-s2-row">
              <input
                id="ls-espn-s2"
                type={showS2 ? 'text' : 'password'}
                placeholder="Long cookie string…"
                value={espnS2}
                onChange={(e) => setEspnS2(e.target.value)}
              />
              <button className="ls-eye" type="button" onClick={() => setShowS2((v) => !v)} title={showS2 ? 'Hide' : 'Show'}>
                {showS2 ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <span className="ls-field-hint">This is a long string — paste the whole thing</span>
          </div>

          {error && <div className="ls-error">{error}</div>}

          <button className="ls-connect-btn" onClick={connect} disabled={loading}>
            {loading ? 'Connecting…' : 'Connect League'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatScoringLabel(key: string): string {
  const labels: Record<string, string> = {
    passYds: 'Passing Yards',
    passTd: 'Passing TD',
    int: 'Interception',
    rushYds: 'Rushing Yards',
    rushTd: 'Rushing TD',
    recYds: 'Receiving Yards',
    recTd: 'Receiving TD',
    rec: 'Reception (PPR)',
  };
  return labels[key] || key;
}
