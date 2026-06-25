import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string | null;
  espn_league_id: string | null;
  espn_team_id: number | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
      setUser(res.data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check for auth callback params in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    if (authStatus) {
      window.history.replaceState({}, '', window.location.pathname);
      if (authStatus === 'success') checkAuth();
    }
  }, [checkAuth]);

  const login = useCallback(() => {
    window.location.href = `${API_URL}/api/auth/google`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch { /* ignore */ }
    setUser(null);
  }, []);

  const linkLeague = useCallback(async (espnLeagueId: string, espnTeamId?: number, espnSwid?: string, espnS2?: string) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/link-league`,
        { espnLeagueId, espnTeamId, espnSwid, espnS2 },
        { withCredentials: true }
      );
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to link league:', err);
    }
  }, []);

  return { user, loading, login, logout, linkLeague };
}
