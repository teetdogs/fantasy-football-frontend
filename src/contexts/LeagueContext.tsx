import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { LeagueCredentials, LeagueSettings, LeagueTeam } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// localStorage keys. draftlab_league + draftlab_myteam_id are the LEGACY
// single-league keys — we keep them pointed at the active league so existing
// components that read them keep working without changes.
const LS_LEAGUES = 'draftlab_leagues';
const LS_ACTIVE = 'draftlab_active';
const LS_LEGACY = 'draftlab_league';
const LS_TEAM = 'draftlab_myteam_id';

export interface StoredLeague {
  creds: LeagueCredentials;
  settings?: LeagueSettings;
  teams?: LeagueTeam[];
  name?: string;
  teamId?: number;
}

interface LeagueContextValue {
  leagues: StoredLeague[];
  activeLeagueId: string | null;
  activeLeague: StoredLeague | null;
  switchLeague: (leagueId: string) => void;
  addOrUpdateLeague: (league: StoredLeague) => void;
  removeLeague: (leagueId: string) => void;
}

const LeagueContext = createContext<LeagueContextValue | null>(null);

function readLeagues(): StoredLeague[] {
  try {
    const raw = localStorage.getItem(LS_LEAGUES);
    if (raw) return JSON.parse(raw);
    // Migrate a legacy single-league record into the array.
    const legacy = localStorage.getItem(LS_LEGACY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (parsed?.creds?.leagueId) return [parsed];
    }
  } catch { /* ignore */ }
  return [];
}

function persist(leagues: StoredLeague[], activeId: string | null) {
  localStorage.setItem(LS_LEAGUES, JSON.stringify(leagues));
  if (activeId) localStorage.setItem(LS_ACTIVE, activeId);

  // Mirror the active league into the legacy keys for existing components.
  const active = leagues.find((l) => l.creds.leagueId === activeId) || null;
  if (active) {
    localStorage.setItem(LS_LEGACY, JSON.stringify({ creds: active.creds, settings: active.settings, teams: active.teams }));
    if (active.teamId != null) localStorage.setItem(LS_TEAM, String(active.teamId));
  } else {
    localStorage.removeItem(LS_LEGACY);
  }
}

export function LeagueProvider({ user, children }: { user: { id: number } | null | undefined; children: ReactNode }) {
  const [leagues, setLeagues] = useState<StoredLeague[]>(readLeagues);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(() => {
    return localStorage.getItem(LS_ACTIVE) || readLeagues()[0]?.creds.leagueId || null;
  });
  const syncedRef = useRef(false);

  // Keep localStorage (incl. legacy keys) in sync with state.
  useEffect(() => {
    persist(leagues, activeLeagueId);
  }, [leagues, activeLeagueId]);

  // On login, merge the server's league list in (cross-device). Local cached
  // creds/settings win when present; server fills in any leagues we don't have.
  useEffect(() => {
    if (!user || syncedRef.current) return;
    syncedRef.current = true;
    axios.get(`${API_URL}/api/auth/leagues`, { withCredentials: true })
      .then((res) => {
        const serverLeagues: { leagueId: string; name?: string; teamId?: number; swid?: string; espnS2?: string }[] = res.data.leagues || [];
        if (!serverLeagues.length) return;
        setLeagues((local) => {
          const byId = new Map(local.map((l) => [l.creds.leagueId, l]));
          for (const s of serverLeagues) {
            const existing = byId.get(s.leagueId);
            if (existing) {
              existing.name = existing.name || s.name;
              if (existing.teamId == null && s.teamId != null) existing.teamId = s.teamId;
            } else if (s.swid && s.espnS2) {
              byId.set(s.leagueId, { creds: { leagueId: s.leagueId, swid: s.swid, espnS2: s.espnS2 }, name: s.name, teamId: s.teamId });
            }
          }
          return Array.from(byId.values());
        });
        if (res.data.activeLeagueId) setActiveLeagueId((cur) => cur || res.data.activeLeagueId);
      })
      .catch(() => {});
  }, [user]);

  const switchLeague = useCallback((leagueId: string) => {
    setActiveLeagueId(leagueId);
    if (user) {
      axios.put(`${API_URL}/api/auth/leagues/active`, { espnLeagueId: leagueId }, { withCredentials: true }).catch(() => {});
    }
  }, [user]);

  const addOrUpdateLeague = useCallback((league: StoredLeague) => {
    setLeagues((prev) => {
      const idx = prev.findIndex((l) => l.creds.leagueId === league.creds.leagueId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...league };
        return next;
      }
      return [...prev, league];
    });
    setActiveLeagueId(league.creds.leagueId);
    if (user) {
      axios.post(`${API_URL}/api/auth/link-league`, {
        espnLeagueId: league.creds.leagueId,
        espnTeamId: league.teamId,
        espnSwid: league.creds.swid,
        espnS2: league.creds.espnS2,
        leagueName: league.name || league.settings?.name,
      }, { withCredentials: true }).catch(() => {});
    }
  }, [user]);

  const removeLeague = useCallback((leagueId: string) => {
    setLeagues((prev) => {
      const next = prev.filter((l) => l.creds.leagueId !== leagueId);
      setActiveLeagueId((cur) => (cur === leagueId ? (next[next.length - 1]?.creds.leagueId || null) : cur));
      return next;
    });
    if (user) {
      axios.delete(`${API_URL}/api/auth/leagues/${leagueId}`, { withCredentials: true }).catch(() => {});
    }
  }, [user]);

  const activeLeague = leagues.find((l) => l.creds.leagueId === activeLeagueId) || null;

  return (
    <LeagueContext.Provider value={{ leagues, activeLeagueId, activeLeague, switchLeague, addOrUpdateLeague, removeLeague }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeagues(): LeagueContextValue {
  const ctx = useContext(LeagueContext);
  if (!ctx) throw new Error('useLeagues must be used within LeagueProvider');
  return ctx;
}
