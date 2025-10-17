import React from 'react';
import { Space, Delete, Trash2, CheckCircle } from 'lucide-react';

interface ControlPanelProps {
  onAddSpace: () => void;
  onDeleteLast: () => void;
  onClearAll: () => void;
  onCompleteWord: () => void;
  onCompleteWordAndSwitch?: () => void;
  currentText: string;
  disabled?: boolean;
  onConfirmLetter?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onAddSpace,
  onDeleteLast,
  onClearAll,
  onCompleteWord,
  onCompleteWordAndSwitch,
  currentText,
  disabled = false,
  onConfirmLetter,
}) => {
  const hasText = currentText.length > 0;

  return (
    <div className="card space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">
          Kontroller
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">Hızlı işlemler</span>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Confirm Letter */}
        {onConfirmLetter && (
          <button
            onClick={onConfirmLetter}
            disabled={disabled}
            className="btn btn-primary flex items-center justify-center space-x-1 py-2 text-sm"
            title="Görünen harfi hemen ekle"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Harfi Onayla</span>
          </button>
        )}
        {/* Add Space */}
        <button
          onClick={onAddSpace}
          disabled={disabled || !hasText}
          className="btn btn-secondary flex items-center justify-center space-x-1 py-2 text-sm"
          title="Boşluk ekle (Space)"
        >
          <Space className="w-4 h-4" />
          <span>Boşluk</span>
        </button>

        {/* Delete Last */}
        <button
          onClick={onDeleteLast}
          disabled={disabled || !hasText}
          className="btn btn-secondary flex items-center justify-center space-x-1 py-2 text-sm"
          title="Son karakteri sil (Backspace)"
        >
          <Delete className="w-4 h-4" />
          <span>Geri Al</span>
        </button>

        {/* Complete Word */}
        <button
          onClick={onCompleteWordAndSwitch || onCompleteWord}
          disabled={disabled || !hasText}
          className="btn btn-primary flex items-center justify-center space-x-1 py-2 text-sm"
          title={onCompleteWordAndSwitch ? "Metni tamamla ve metin-sign moduna geç (Enter)" : "Metni tamamla (Enter)"}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{onCompleteWordAndSwitch ? "Tamam" : "Tamamla"}</span>
        </button>

        {/* Clear All */}
        <button
          onClick={onClearAll}
          disabled={disabled || !hasText}
          className="btn btn-danger flex items-center justify-center space-x-1 py-2 text-sm"
          title="Tümünü temizle (C)"
        >
          <Trash2 className="w-4 h-4" />
          <span>Temizle</span>
        </button>
      </div>
    </div>
  );
};