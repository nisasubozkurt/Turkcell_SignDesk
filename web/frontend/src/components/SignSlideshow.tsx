import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { SignDisplay } from './SignDisplay';
import { ProgressBar } from './ProgressBar';

interface SignSlideshowProps {
  letters: string[];
  onComplete?: () => void;
  autoPlay?: boolean;
  slideDelay?: number; // milliseconds
}

export const SignSlideshow: React.FC<SignSlideshowProps> = ({
  letters,
  onComplete,
  autoPlay = true,
  slideDelay = 2000, // 2 seconds per letter
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const isAdvancingRef = useRef(false);

  const currentLetter = letters[currentIndex];
  const totalLetters = letters.length;
  const isLastLetter = currentIndex === totalLetters - 1;

  /**
   * Go to next letter
   */
  const goToNext = useCallback(() => {
    if (currentIndex < totalLetters - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Reached the end
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, totalLetters, onComplete]);

  /**
   * Go to previous letter
   */
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  /**
   * Reset slideshow
   */
  const reset = () => {
    setCurrentIndex(0);
    setProgress(0);
    setIsPlaying(false);
  };

  /**
   * Toggle play/pause
   */
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  /**
   * Auto-advance slideshow
   */
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (slideDelay / 100));
        
        if (newProgress >= 100) {
          if (isAdvancingRef.current) {
            return 0;
          }
          isAdvancingRef.current = true;
          goToNext();
          return 0;
        }
        
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, slideDelay, goToNext]);

  // Reset advancing guard when index changes or playback stops
  useEffect(() => {
    isAdvancingRef.current = false;
  }, [currentIndex, isPlaying]);

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            İşaret Dili Gösterimi
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentIndex + 1} / {totalLetters} - {currentLetter === ' ' ? '[BOŞLUK]' : currentLetter}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={reset}
            className="btn btn-secondary"
            title="Başa dön"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sign Display */}
      <SignDisplay letter={currentLetter} />

      {/* Progress Bar */}
      <div className="space-y-2">
        <ProgressBar
          progress={progress}
          color="blue"
          animated={isPlaying}
          height="md"
        />
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isPlaying ? 'Oynatılıyor...' : 'Durakladı'}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        {/* Previous Button */}
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="btn btn-secondary"
          title="Önceki"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={isLastLetter && progress >= 100}
          className="btn btn-primary px-8"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5 mr-2" />
              <span>Duraklat</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              <span>Oynat</span>
            </>
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={isLastLetter}
          className="btn btn-secondary"
          title="Sonraki"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Letter Grid Preview */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Tüm Harfler:
        </p>
        <div className="flex flex-wrap gap-2">
          {letters.map((letter, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setProgress(0);
                setIsPlaying(false);
              }}
              className={`
                w-10 h-10 rounded-lg font-bold text-sm transition-all
                ${
                  index === currentIndex
                    ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : index < currentIndex
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
                hover:scale-110
              `}
              title={`Harfi göster: ${letter === ' ' ? '[BOŞLUK]' : letter}`}
            >
              {letter === ' ' ? '␣' : letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};