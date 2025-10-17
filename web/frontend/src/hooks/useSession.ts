import { useState, useEffect } from 'react';
import { api } from '@/services/api';

interface SessionInfo {
  session_id: string;
  client_ip: string;
  timestamp: string;
  user_agent: string;
}

export const useSession = () => {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.getSession();
      setSessionInfo(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session bilgisi alınamadı';
      setError(errorMessage);
      console.error('Session info error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionInfo();
  }, []);

  return {
    sessionInfo,
    isLoading,
    error,
    refetch: fetchSessionInfo
  };
};
