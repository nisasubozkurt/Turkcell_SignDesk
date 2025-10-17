import React from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useBackendHealth } from '@/hooks/useBackendHealth';

export const BackendStatus: React.FC = () => {
  const { isHealthy, isChecking, error, checkHealth } = useBackendHealth();

  return (
    <div className="flex items-center space-x-2">
      {isChecking ? (
        <>
          <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Kontrol ediliyor...
          </span>
        </>
      ) : isHealthy ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">
            Backend Aktif
          </span>
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">
            Backend Bağlantısı Yok
          </span>
          <button
            onClick={checkHealth}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Yeniden Dene
          </button>
        </>
      )}
      
      {error && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({error})
        </span>
      )}
    </div>
  );
};