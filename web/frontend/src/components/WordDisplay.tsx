import React from 'react';
import { FileText, CheckCircle2, Space, Delete, Trash2, CheckCircle } from 'lucide-react';

interface WordDisplayProps {
  word: string[];
  lastLetter: string | null;
  isActive: boolean;
  // Optional inline controls
  onAddSpace?: () => void;
  onDeleteLast?: () => void;
  onClearAll?: () => void;
  onCompleteWord?: () => void;
  onCompleteWordAndSwitch?: () => void;
  disabled?: boolean;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({
  word,
  lastLetter,
  isActive,
  onAddSpace,
  onDeleteLast,
  onClearAll,
  onCompleteWord,
  onCompleteWordAndSwitch,
  disabled = false,
}) => {
  const wordText = word.join('');
  const characterCount = word.length;
  const wordCount = wordText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Oluşturulan Metin</span>
        </h3>
        
        {!isActive && word.length > 0 && (
          <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Tamamlandı</span>
          </div>
        )}
      </div>

      {/* Word Display */}
      <div
        className={`
          min-h-[120px] p-6 rounded-xl border-2 transition-all
          ${
            isActive
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
              : 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
          }
        `}
      >
        {word.length > 0 ? (
          <div className="space-y-3">
            {/* Main Text */}
            <p className="text-2xl font-semibold text-gray-800 dark:text-white break-words leading-relaxed">
              {word.map((char, index) => (
                <span
                  key={index}
                  className={`
                    ${char === lastLetter && index === word.length - 1 ? 'text-blue-600 dark:text-blue-400 animate-pulse' : ''}
                    ${char === ' ' ? 'inline-block w-3' : ''}
                  `}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </p>

            {/* Last Character Indicator */}
            {lastLetter && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Son Karakter:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {lastLetter === ' ' ? '[BOŞLUK]' : lastLetter}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 dark:text-gray-500 text-center">
              Henüz harf eklenmedi.<br />
              <span className="text-sm">El işaretlerinizi gösterin.</span>
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {word.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Karakter:</span>
              <span className="ml-1 font-semibold text-gray-800 dark:text-white">
                {characterCount}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Kelime:</span>
              <span className="ml-1 font-semibold text-gray-800 dark:text-white">
                {wordCount}
              </span>
            </div>
          </div>
          
          {!isActive && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Devam etmek için SPACE tuşuna basın
            </div>
          )}
        </div>
      )}


            {/* Inline Controls for Word */}
            {
              <div className="pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {onAddSpace && (
                    <button
                      onClick={onAddSpace}
                      disabled={disabled || word.length === 0}
                      className="btn btn-secondary flex items-center justify-center space-x-1 py-2 text-sm"
                      title="Boşluk ekle (Space)"
                    >
                      <Space className="w-4 h-4" />
                      <span>Boşluk</span>
                    </button>
                  )}

                  {onDeleteLast && (
                    <button
                      onClick={onDeleteLast}
                      disabled={disabled || word.length === 0}
                      className="btn btn-secondary flex items-center justify-center space-x-1 py-2 text-sm"
                      title="Son karakteri sil (Backspace)"
                    >
                      <Delete className="w-4 h-4" />
                      <span>Geri Al</span>
                    </button>
                  )}

                  {(onCompleteWord || onCompleteWordAndSwitch) && (
                    <button
                      onClick={onCompleteWordAndSwitch || onCompleteWord}
                      disabled={disabled || word.length === 0}
                      className="btn btn-primary flex items-center justify-center space-x-1 py-2 text-sm"
                      title={onCompleteWordAndSwitch ? 'Metni tamamla ve metin-sign moduna geç (Enter)' : 'Metni tamamla (Enter)'}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{onCompleteWordAndSwitch ? 'Tamam' : 'Tamamla'}</span>
                    </button>
                  )}

                  {onClearAll && (
                    <button
                      onClick={onClearAll}
                      disabled={disabled || word.length === 0}
                      className="btn btn-danger flex items-center justify-center space-x-1 py-2 text-sm"
                      title="Tümünü temizle (C)"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Temizle</span>
                    </button>
                  )}
                </div>
              </div>
            }

    </div>
  );
};