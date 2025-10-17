/**
 * Convert canvas to base64 data URL
 */
export const canvasToBase64 = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/jpeg', 0.8);
};

/**
 * Convert video frame to base64
 */
export const videoFrameToBase64 = (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string | null => {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Guard: ensure video has valid dimensions (metadata loaded)
    if (!video.videoWidth || !video.videoHeight) {
      console.log('[capture] video dimensions not ready', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      });
      return null;
    }

    // Draw at source/native video dimensions (previous behavior)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (error) {
    console.error('Error converting frame to base64:', error);
    return null;
  }
};

/**
 * Format confidence score as percentage
 */
export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

/**
 * Check if browser supports getUserMedia
 */
export const isCameraSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Format timestamp to readable string
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR');
  } catch {
    return timestamp;
  }
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Download text as file
 */
export const downloadTextFile = (text: string, filename: string = 'metin.txt'): void => {
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
  }
};

/**
 * Normalize Turkish letters to closest Latin equivalents
 * Maps: ç→c, Ç→C, ğ→g, Ğ→G, ö→o, Ö→O, ü→u, Ü→U
 */
export const normalizeTurkishLetters = (text: string): string => {
  return text
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U');
};

/**
 * Filter text to only include A-Z letters and spaces
 * Used for text-to-sign conversion
 */
export const filterTextForSigns = (text: string): string => {
  return normalizeTurkishLetters(text)
    .toUpperCase()
    .replace(/[^A-Z ]/g, '') // Only keep A-Z and spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Convert text to letter array for slideshow
 * Filters and processes text for sign language display
 */
export const textToLetterArray = (text: string): string[] => {
  const filtered = filterTextForSigns(text);
  return filtered.split('');
};

/**
 * Get sign image path for a letter
 */
export const getSignImagePath = (letter: string): string => {
  const upperLetter = letter.toUpperCase();
  const displayLetter = upperLetter === ' ' ? 'SPACE' : upperLetter;
  return `/signs/${displayLetter}.png`;
};

/**
 * Validate if text is suitable for sign conversion
 */
export const validateTextForSigns = (text: string): {
  isValid: boolean;
  error?: string;
  filteredText?: string;
} => {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      error: 'Metin boş olamaz',
    };
  }

  const filtered = filterTextForSigns(text);

  if (filtered.length === 0) {
    return {
      isValid: false,
      error: 'Metin sadece özel karakterler içeriyor. Lütfen A-Z harfleri kullanın.',
    };
  }

  if (filtered.length > 500) {
    return {
      isValid: false,
      error: 'Metin çok uzun (maksimum 500 karakter)',
    };
  }

  return {
    isValid: true,
    filteredText: filtered,
  };
};

/**
 * Format duration in seconds to readable string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds} saniye`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} dakika ${remainingSeconds} saniye`;
};

/**
 * Calculate estimated time for slideshow
 */
export const calculateSlideshowDuration = (
  letterCount: number,
  delayPerLetter: number
): number => {
  return Math.ceil((letterCount * delayPerLetter) / 1000); // Convert to seconds
};