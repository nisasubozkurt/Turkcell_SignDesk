import { useState, useEffect, useCallback, useRef } from 'react';
import { LETTER_CONFIRMATION_DELAY, REQUIRED_CONSECUTIVE_FRAMES } from '@/utils/constants';

interface UseWordBuilderReturn {
  word: string[];
  lastLetter: string | null;
  pendingLetter: string | null;
  countdown: number;
  isActive: boolean;
  addLetter: (letter: string) => void;
  addStableLetter: (letter: string) => void;
  addSpace: () => void;
  deleteLast: () => void;
  clearAll: () => void;
  completeWord: () => void;
  resumeWordBuilding: () => void;
  clearPendingLetter: () => void;
  getText: () => string;
}

export const useWordBuilder = (
  confirmationDelay: number = LETTER_CONFIRMATION_DELAY
): UseWordBuilderReturn => {
  const [word, setWord] = useState<string[]>([]);
  const [lastLetter, setLastLetter] = useState<string | null>(null);
  const [pendingLetter, setPendingLetter] = useState<string | null>(null);
  const [letterStartTime, setLetterStartTime] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const recentLettersRef = useRef<string[]>([]);
  const consecutiveRef = useRef<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Process letter confirmation countdown
   */
  useEffect(() => {
    if (!pendingLetter || !letterStartTime || isConfirmed || !isActive) {
      setCountdown(0);
      return;
    }

    // Update countdown every 100ms
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - letterStartTime;
      const remaining = Math.max(0, confirmationDelay - elapsed);
      const countdownSeconds = Math.ceil(remaining / 1000);
      
      setCountdown(countdownSeconds);

      // Check if confirmation time reached with stability using consecutive count
      if (elapsed >= confirmationDelay) {
        const stable = consecutiveRef.current >= REQUIRED_CONSECUTIVE_FRAMES;
        if (stable) {
          // Confirm the letter
          setWord((prev) => [...prev, pendingLetter]);
          setLastLetter(pendingLetter);
          setIsConfirmed(true);
          console.log(`✅ Letter confirmed: ${pendingLetter}`);
          console.log(`📝 Current word: ${[...word, pendingLetter].join('')}`);
          // Reset for next letter
          setPendingLetter(null);
          setLetterStartTime(null);
          setIsConfirmed(false);
          recentLettersRef.current = [];
          consecutiveRef.current = 0;
        } else {
          // Not stable yet, extend timer slightly
          setLetterStartTime(Date.now() - Math.floor(confirmationDelay * 0.7));
        }
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pendingLetter, letterStartTime, isConfirmed, isActive, confirmationDelay, word]);

  /**
   * Add a new letter (or update pending letter)
   */
  const addLetter = useCallback((letter: string) => {
    if (!isActive) return;

    // If same letter as pending, just continue (don't reset timer)
    if (letter === pendingLetter) {
      consecutiveRef.current += 1;
      return;
    }

    // Only log and reset for truly new letters
    console.log(`🔤 New letter detected: ${letter} - waiting ${confirmationDelay}ms`);
    setPendingLetter(letter);
    setLetterStartTime(Date.now());
    setIsConfirmed(false);
    setCountdown(Math.ceil(confirmationDelay / 1000));
    consecutiveRef.current = 1;
    recentLettersRef.current = [letter];
  }, [pendingLetter, isActive, confirmationDelay]);

  /**
   * Add a letter immediately (used when upstream stability is already ensured)
   */
  const addStableLetter = useCallback((letter: string) => {
    if (!isActive) return;

    setWord((prev) => [...prev, letter]);
    setLastLetter(letter);
    setPendingLetter(null);
    setLetterStartTime(null);
    setIsConfirmed(false);
    setCountdown(0);
    consecutiveRef.current = 0;
    recentLettersRef.current = [];
    console.log(`✅ Letter directly added (stable): ${letter}`);
  }, [isActive]);

  /**
   * Add space between words
   */
  const addSpace = useCallback(() => {
    if (word.length === 0) {
      console.warn('⚠️ Cannot add space - word is empty');
      return;
    }

    setWord((prev) => [...prev, ' ']);
    setLastLetter(' ');
    setIsActive(true);
    setPendingLetter(null);
    setLetterStartTime(null);
    setIsConfirmed(false);
    
    console.log('➕ Space added');
  }, [word.length]);

  /**
   * Delete last character
   */
  const deleteLast = useCallback(() => {
    if (word.length === 0) {
      console.warn('⚠️ Cannot delete - word is empty');
      return;
    }

    const removed = word[word.length - 1];
    setWord((prev) => prev.slice(0, -1));
    
    // Update last letter
    if (word.length > 1) {
      setLastLetter(word[word.length - 2]);
    } else {
      setLastLetter(null);
    }

    // Clear pending letter
    setPendingLetter(null);
    setLetterStartTime(null);
    setIsConfirmed(false);
    
    // Reactivate if it was deactivated
    setIsActive(true);
    
    console.log(`🗑️ Deleted: ${removed}`);
  }, [word]);

  /**
   * Clear entire word
   */
  const clearAll = useCallback(() => {
    setWord([]);
    setLastLetter(null);
    setPendingLetter(null);
    setLetterStartTime(null);
    setIsConfirmed(false);
    setIsActive(true);
    
    console.log('🧹 Word cleared');
  }, []);

  /**
   * Complete word (stop accepting new letters)
   */
  const completeWord = useCallback(() => {
    if (word.length === 0) {
      console.warn('⚠️ Cannot complete - word is empty');
      return;
    }

    setIsActive(false);
    setPendingLetter(null);
    setLetterStartTime(null);
    setIsConfirmed(false);
    
    console.log(`✅ Word completed: ${word.join('')}`);
  }, [word]);

  /**
   * Resume word building (after completion)
   */
  const resumeWordBuilding = useCallback(() => {
    setIsActive(true);
    setPendingLetter(null);
    setLetterStartTime(null);
    setIsConfirmed(false);
    
    console.log('▶️ Word building resumed');
  }, []);

  /**
   * Clear pending letter (when hand is not detected)
   */
  const clearPendingLetter = useCallback(() => {
    setPendingLetter(null);
    setLetterStartTime(null);
    setIsConfirmed(false);
    setCountdown(0);
    consecutiveRef.current = 0;
    recentLettersRef.current = [];
  }, []);

  /**
   * Get current text as string
   */
  const getText = useCallback((): string => {
    return word.join('');
  }, [word]);

  return {
    word,
    lastLetter,
    pendingLetter,
    countdown,
    isActive,
    addLetter,
    addStableLetter,
    addSpace,
    deleteLast,
    clearAll,
    completeWord,
    resumeWordBuilding,
    clearPendingLetter,
    getText,
  };
};