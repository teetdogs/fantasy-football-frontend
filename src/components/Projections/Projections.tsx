import type { Player } from '../../types';
import './Projections.css';

interface ProjectionsProps {
  players: Player[];
  positionFilter?: string;
  search?: string;
  loading?: boolean;
}

const POSITION_COLORS: Record<string, string> = {
  QB: '#ef5d6f',
  RB: '#36c6a0',
  WR: '#57a6ff',
  TE: '#f6a23c',
  K: '#b387f4',
  DEF: '#8a97ad',
};

const FALLBACK_IMG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"%3E%3Crect fill="%231c2638" width="120" height="160"/%3E%3Ccircle cx="60" cy="45" r="20" fill="%235e6b82"/%3E%3Cpath d="M30 80c0-17 13-30 30-30s30 13 30 30v35H30Z" fill="%235e6b82"/%3E%3C/svg%3E';

// A row of normalized stats (works for both actual and projected lines).
interface StatRow {
  comp?: number;
  att?: number;
  passYds?: number;
  passTd?: number;
  int?: number;
  car?: number;
  rushYds?: number;
  rushTd?: number;
  rec?: number;
  tgt?: number;
  recYds?: number;
  recTd?: number;
  fpts?: number | null;
}

interface Column {
  label: string;
  get: (r: StatRow) => string;
}

const n = (v?: number | null) => (v == null ? '—' : Math.round(v).toLocaleString());
const avg = (num?: number, den?: number) =>
  num != null && den ? (num / den).toFixed(1) : '—';
const pts = (v?: number | null) => (v == null ? '—' : v.toFixed(1));

function columnsFor(pos: string): Column[] {
  switch (pos) {
    case 'QB':
      return [
        { label: 'C/A', get: (r) => (r.comp != null ? `${r.comp}/${r.att ?? 0}` : '—') },
        { label: 'Pass Yds', get: (r) => n(r.passYds) },
        { label: 'TD', get: (r) => n(r.passTd) },
        { label: 'Int', get: (r) => n(r.int) },
        { label: 'Rush Yds', get: (r) => n(r.rushYds) },
        { label: 'Rush TD', get: (r) => n(r.rushTd) },
        { label: 'FPTS', get: (r) => pts(r.fpts) },
      ];
    case 'RB':
      return [
        { label: 'Car', get: (r) => n(r.car) },
        { label: 'Yds', get: (r) => n(r.rushYds) },
        { label: 'Avg', get: (r) => avg(r.rushYds, r.car) },
        { label: 'TD', get: (r) => n(r.rushTd) },
        { label: 'Rec', get: (r) => n(r.rec) },
        { label: 'Yds', get: (r) => n(r.recYds) },
        { label: 'TD', get: (r) => n(r.recTd) },
        { label: 'FPTS', get: (r) => pts(r.fpts) },
      ];
    case 'WR':
    case 'TE':
      return [
        { label: 'Rec', get: (r) => n(r.rec) },
        { label: 'Tgt', get: (r) => n(r.tgt) },
        { label: 'Yds', get: (r) => n(r.recYds) },
        { label: 'Avg', get: (r) => avg(r.recYds, r.rec) },
        { label: 'TD', get: (r) => n(r.recTd) },
        { label: 'Rush Yds', get: (r) => n(r.rushYds) },
        { label: 'FPTS', get: (r) => pts(r.fpts) },
      ];
    default: // K / DEF — limited stat lines
      return [{ label: 'FPTS', get: (r) => pts(r.fpts) }];
  }
}

function takeaway(p: Player): string {
  const proj = p.projection?.fpts;
  const base = proj != null ? `Projected ${proj.toFixed(0)} fantasy points in 2026` : 'Projection unavailable';
  if (p.lastSeason) {
    return `${base} — coming off ${p.lastSeason.ppr.toFixed(0)} (${p.lastSeason.ppg}/g) over ${p.lastSeason.games} games in ${p.lastSeason.season}.`;
  }
  return `${base} — no prior NFL season on record (rookie or inactive).`;
}

export const Projections: React.FC<ProjectionsProps> = ({ players, positionFilter, search, loading }) => {
  const query = (search || '').trim().toLowerCase();
  const list = players.filter(
    (p) =>
      (!positionFilter || p.position === positionFilter) &&
      (!query || p.name.toLowerCase().includes(query))
  );

  if (loading && !players.length) {
    return (
      <div className="card state">
        <div className="spinner" />
        <span>Loading projections…</span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>2026 Projections</h2>
          <p className="card-sub">
            Last season's real numbers next to this season's projection for every player. PPR scoring.
          </p>
        </div>
        <span className="count tnum">{list.length} players</span>
      </div>

      <div className="proj-list">
        {list.length === 0 && <div className="proj-empty">No players match your search.</div>}

        {list.map((p) => {
          const color = POSITION_COLORS[p.position] || '#93a1b8';
          const cols = columnsFor(p.position);
          const statRow: StatRow | null = p.lastSeason
            ? { ...p.lastSeason, fpts: p.lastSeason.ppr }
            : null;
          const projRow: StatRow | null = p.projection || null;

          return (
            <div className="proj-row" key={p.id}>
              <div className="proj-player">
                <span className="proj-rank tnum">{p.rank}</span>
                <img
                  className="proj-img"
                  src={p.imageUrl || FALLBACK_IMG}
                  alt={p.name}
                  loading="lazy"
                  onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMG)}
                />
                <div>
                  <div className="proj-name">{p.name}</div>
                  <div className="proj-meta">
                    <span className="proj-pos" style={{ background: color }}>
                      {p.position}
                    </span>
                    {p.nfl_team || p.team}
                    {p.bye_week ? ` · Bye ${p.bye_week}` : ''}
                  </div>
                </div>
              </div>

              <div className="proj-table-wrap">
                <table className="proj-table">
                  <thead>
                    <tr>
                      <th className="rowlabel" />
                      {cols.map((c, i) => (
                        <th key={i} className="right">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="stat-row">
                      <td className="rowlabel">{p.lastSeason ? `${p.lastSeason.season} Stats` : 'Last Season'}</td>
                      {cols.map((c, i) => (
                        <td key={i} className="right tnum">
                          {statRow ? c.get(statRow) : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="proj-stat-row">
                      <td className="rowlabel">2026 Proj</td>
                      {cols.map((c, i) => (
                        <td key={i} className="right tnum">
                          {projRow ? c.get(projRow) : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
                <p className="proj-takeaway">{takeaway(p)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
