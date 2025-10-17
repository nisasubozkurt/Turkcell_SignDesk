import React from 'react';
import { Hand, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { formatConfidence } from '@/utils/helpers';

interface PredictionDisplayProps {
  currentLetter: string | null;
  confidence: number;
  isProcessing: boolean;
  countdown: number;
  handDetected?: boolean;
}

export const PredictionDisplay: React.FC<PredictionDisplayProps> = ({
  currentLetter,
  confidence,
  isProcessing,
  countdown,
  handDetected = false,
}) => {
  const isWaiting = currentLetter && countdown > 0;
  const isConfirmed = currentLetter && countdown === 0;

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Anlık Tahmin
        </h3>
        {isProcessing && (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        )}
      </div>

      {/* Main Display */}
      <div className="space-y-4">
        {/* Letter Display */}
        <div className="relative">
          <div
            className={`
              h-40 rounded-2xl flex items-center justify-center
              transition-all duration-300 transform
              ${
                isConfirmed
                  ? 'bg-green-500 scale-105 shadow-lg shadow-green-500/50'
                  : isWaiting
                  ? 'bg-blue-500 scale-100'
                  : 'bg-gray-200 dark:bg-gray-700 scale-95'
              }
            `}
          >
            {currentLetter ? (
              <span
                className={`
                  text-7xl font-bold
                  ${isConfirmed || isWaiting ? 'text-white' : 'text-gray-400 dark:text-gray-500'}
                `}
              >
                {currentLetter}
              </span>
            ) : (
              <Hand className="w-16 h-16 text-gray-400 dark:text-gray-500" />
            )}
          </div>

          {/* Status Badge */}
          {isConfirmed && (
            <div className="absolute -top-2 -right-2">
              <div className="bg-green-600 text-white px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg animate-bounce">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Onaylandı!</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center">
          {!handDetected ? (
            <p className="text-gray-600 dark:text-gray-400">
              El algılanmadı. Lütfen elinizi kameranın önünde tutun.
            </p>
          ) : !currentLetter ? (
            <p className="text-gray-600 dark:text-gray-400">
              Harf bekleniyor...
            </p>
          ) : isWaiting ? (
            <div className="space-y-2">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                <Clock className="w-4 h-4 inline mr-1" />
                Harfi sabit tutun: {countdown} saniye
              </p>
              <ProgressBar
                progress={((1 - countdown) / 1) * 100}
                color="blue"
                animated
                height="md"
              />
            </div>
          ) : isConfirmed ? (
            <p className="text-green-700 dark:text-green-300 font-medium">
              ✓ Harf kelimeye eklendi
            </p>
          ) : null}
        </div>

        {/* Confidence Score */}
        {currentLetter && confidence > 0 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Güven Skoru:
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                {formatConfidence(confidence)}
              </span>
            </div>
            <ProgressBar
              progress={confidence * 100}
              color={confidence > 0.8 ? 'green' : confidence > 0.6 ? 'yellow' : 'red'}
              animated={false}
              height="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};