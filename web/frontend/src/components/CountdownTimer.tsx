import React from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  countdown: number;
  total: number;
  message: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  countdown,
  total,
  message,
}) => {
  const progress = ((total - countdown) / total) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50">
      <div className="card max-w-md w-full mx-4 text-center space-y-6">
        {/* Timer Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Timer className="w-24 h-24 text-blue-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {countdown}
              </span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Başlıyor...
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Info Text */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          El işaretlerinizi hazırlayın
        </p>
      </div>
    </div>
  );
};