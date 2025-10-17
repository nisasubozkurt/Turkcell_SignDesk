import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SignDisplayProps {
  letter: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-32',
  md: 'h-48',
  lg: 'h-64',
  xl: 'h-96',
};

export const SignDisplay: React.FC<SignDisplayProps> = ({
  letter,
  size = 'xl',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle space character
  const isSpace = letter === ' ';
  const displayLetter = isSpace ? 'SPACE' : letter.toUpperCase();
  
  // Image path - public klasöründeki dosyalar
  // Örnek: public/signs/A.png, public/signs/B.png, vb.
  const imagePath = isSpace ? '/signs/SPACE.png' : `/signs/${displayLetter}.png`;

  /**
   * Handle image load error
   */
  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  /**
   * Handle image load success
   */
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative">
      {/* Letter Label (Boşlukta gizle) */}
      {!isSpace && (
        <div className="text-center mb-4">
          <div className="inline-block bg-blue-500 text-white px-6 py-3 rounded-xl shadow-lg">
            <span className="text-4xl font-bold">
              {displayLetter}
            </span>
          </div>
        </div>
      )}

      {/* Image Display */}
      <div
        className={`
          relative bg-white rounded-2xl overflow-hidden shadow-xl
          ${sizeClasses[size]} w-full
          flex items-center justify-center
        `}
      >
        {/* Loading State */}
        {isLoading && !imageError && !isSpace && (
          <div className="absolute inset-0 flex items-center justify-center bg-white animate-pulse">
            <div className="text-gray-400 dark:text-gray-500">
              Yükleniyor...
            </div>
          </div>
        )}

        {/* Error State */}
        {!isSpace && imageError ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-gray-500 dark:text-gray-400 p-8">
            <ImageOff className="w-16 h-16" />
            <div className="text-center">
              <p className="font-medium text-lg mb-2">Resim Bulunamadı</p>
              <p className="text-sm">
                <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {imagePath}
                </code>
              </p>
              <p className="text-xs mt-2">
                Lütfen bu harf için işaret dili resmini ekleyin
              </p>
            </div>
          </div>
        ) : (
          !isSpace && (
            <img
              src={imagePath}
              alt={`${displayLetter} harfi işaret dili gösterimi`}
              className={`
                max-h-full max-w-full object-contain
                ${isLoading ? 'opacity-0' : 'opacity-100'}
                transition-opacity duration-300
              `}
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          )
        )}
      </div>

      {/* Description (Boşlukta gizle) */}
      {!isSpace && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <>
              <span className="font-semibold">{displayLetter}</span> harfi için Türk İşaret Dili gösterimi
            </>
          </p>
        </div>
      )}
    </div>
  );
};