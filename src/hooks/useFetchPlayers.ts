import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Player, RankingWeights } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useFetchPlayers = (weights?: RankingWeights) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = weights
          ? `${API_URL}/api/players?weights=${JSON.stringify(weights)}`
          : `${API_URL}/api/players`;

        const response = await axios.get(endpoint);
        setPlayers(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch players';
        setError(message);
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [weights]);

  return { players, loading, error };
};

export const useFetchRankings = (strategyName?: string) => {
  const [rankings, setRankings] = useState<Record<string, Player[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = strategyName
          ? `${API_URL}/api/rankings?strategy=${strategyName}`
          : `${API_URL}/api/rankings`;

        const response = await axios.get(endpoint);
        setRankings(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch rankings';
        setError(message);
        console.error('Error fetching rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [strategyName]);

  return { rankings, loading, error };
};
