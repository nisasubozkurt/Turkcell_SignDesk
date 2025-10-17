import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { HealthCheckResponse } from '@/types';

interface UseBackendHealthReturn {
  isHealthy: boolean;
  isChecking: boolean;
  health: HealthCheckResponse | null;
  error: string | null;
  checkHealth: () => Promise<void>;
}

export const useBackendHealth = (autoCheck: boolean = true): UseBackendHealthReturn => {
  const [isHealthy, setIsHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check backend health
   */
  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await api.healthCheck();
      setHealth(response);
      setIsHealthy(response.status === 'healthy');
      
      if (response.status === 'healthy') {
        console.log('✅ Backend is healthy');
      } else {
        console.warn('⚠️ Backend is unhealthy:', response);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Backend bağlantı hatası';
      setError(errorMessage);
      setIsHealthy(false);
      console.error('❌ Backend health check failed:', err);
      
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Auto-check on mount if enabled
   */
  useEffect(() => {
    if (autoCheck) {
      checkHealth();
    }
  }, [autoCheck, checkHealth]);

  return {
    isHealthy,
    isChecking,
    health,
    error,
    checkHealth,
  };
};