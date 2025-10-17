import React, { useState } from 'react';
import { ArrowRight, Play, RotateCcw, Download } from 'lucide-react';
import { SignSlideshow } from './SignSlideshow';
import { downloadTextFile, normalizeTurkishLetters } from '@/utils/helpers';
import { AppMode } from '@/types';

interface TextToSignConverterProps {
  onModeChange?: (mode: AppMode) => void;
}

export const TextToSignConverter: React.FC<TextToSignConverterProps> = ({ onModeChange }) => {
  const [inputText, setInputText] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedText, setConvertedText] = useState<string[]>([]);

  /**
   * Convert text to sign language (prepare letter array)
   */
  const handleConvert = () => {
    if (!inputText.trim()) {
      return;
    }

    // Convert text to uppercase and split into characters
    const letters = normalizeTurkishLetters(inputText)
      .toUpperCase()
      .split('')
      .filter((char) => {
        // Only keep A-Z letters and spaces
        return /[A-Z ]/.test(char);
      });

    setConvertedText(letters);
    setIsConverting(true);
  };

  /**
   * Reset conversion
   */
  const handleReset = () => {
    setIsConverting(false);
    setConvertedText([]);
  };

  /**
   * Handle slideshow completion - switch to camera mode
   */
  const handleSlideshowComplete = () => {
    handleReset();
    if (onModeChange) {
      onModeChange('sign-to-text');
    }
  };

  /**
   * Download input text
   */
  const handleDownload = () => {
    if (inputText.trim()) {
      downloadTextFile(inputText, 'metin.txt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      {!isConverting && (
        <div className="card">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Metin Girişi
          </h3>
          
          <div className="space-y-4">
            {/* Text Input */}
            <div>
              <label
                htmlFor="text-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Metninizi girin (sadece A-Z harfleri)
              </label>
              <textarea
                id="text-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Örnek: MERHABA DUNYA"
                className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {inputText.length} / 500 karakter
                </span>
                {inputText.length > 50 && (
                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Uzun metinler daha fazla zaman alabilir
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleConvert}
                disabled={!inputText.trim()}
                className="btn btn-primary flex items-center space-x-2 flex-1"
              >
                <Play className="w-4 h-4" />
                <span>İşaret Diline Çevir</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                disabled={!inputText.trim()}
                className="btn btn-secondary flex items-center space-x-2"
                title="Metni indir"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>Not:</strong> Sadece İngilizce alfabedeki A-Z harfleri desteklenmektedir. 
                Özel karakterler ve rakamlar otomatik olarak filtrelenir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Slideshow Section */}
      {isConverting && convertedText.length > 0 && (
        <div className="space-y-4">
          {/* Original Text Display */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Girilen Metin:
                </h4>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {inputText}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yeni Metin</span>
              </button>
            </div>
          </div>

          {/* Sign Language Slideshow */}
          <SignSlideshow letters={convertedText} onComplete={handleSlideshowComplete} />
        </div>
      )}
    </div>
  );
};