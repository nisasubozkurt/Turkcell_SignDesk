import { useState, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { ApiResponse, PredictionResult } from '@/types';
import { CONFIDENCE_THRESHOLD } from '@/utils/constants';

interface UsePredictionReturn {
  sendFrame: (frame: string) => Promise<ApiResponse | null>;
  isLoading: boolean;
  error: string | null;
  lastPrediction: PredictionResult | null;
  lastResponse: ApiResponse | null;
}

// Request throttling - optimized for performance (10 FPS)
const MIN_REQUEST_INTERVAL = 100; // milisaniye (50ms → 100ms)
const MAX_CONCURRENT_REQUESTS = 1; // Tek seferde sadece 1 istek

export const usePrediction = (): UsePredictionReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(null);
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null);
  
  // Track request count for debugging
  const requestCountRef = useRef(0);
  const recentLettersRef = useRef<string[]>([]);
  const stableLetterRef = useRef<{ letter: string | null; count: number }>({ letter: null, count: 0 });
  
  // Error recovery state
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const lastErrorTimeRef = useRef<number>(0);
  
  // Request throttling state
  const lastRequestTimeRef = useRef<number>(0);
  const pendingRequestsRef = useRef<number>(0);

  /**
   * Send frame to backend for prediction with optimized throttling
   */
  const sendFrame = useCallback(async (frame: string): Promise<ApiResponse | null> => {
    const now = Date.now();

    // Throttling: Check minimum interval
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL) {
      return null; // Skip frame - backend'i boşa yormayalım
    }

    // Throttling: Check concurrent requests (strict - sadece 1)
    if (pendingRequestsRef.current >= MAX_CONCURRENT_REQUESTS) {
      return null; // Skip frame - zaten bir istek bekliyor
    }

    // Eğer loading state aktifse, skip et (double check)
    if (isLoading) {
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      requestCountRef.current += 1;
      lastRequestTimeRef.current = now;
      pendingRequestsRef.current += 1;

      // Send to API
      const response = await api.predict(frame);

      // Update state
      setLastResponse(response);
      
      // Reset error count on successful request
      setConsecutiveErrors(0);
      
      if (response.success && response.prediction) {
        setLastPrediction(response.prediction);

        // Smoothing: keep last 5 predictions (only above threshold)
        const letter = response.prediction.letter;
        const conf = response.prediction.confidence ?? 0;
        if (letter && conf >= CONFIDENCE_THRESHOLD) {
          // Consecutive-frame stabilizer
          const current = stableLetterRef.current;
          if (current.letter === letter) {
            current.count += 1;
          } else {
            stableLetterRef.current = { letter, count: 1 };
          }
          // Sliding window list for debugging/compat
          recentLettersRef.current.push(letter);
          if (recentLettersRef.current.length > 8) recentLettersRef.current.shift();
        } else {
          // Reset if confidence drops
          stableLetterRef.current = { letter: null, count: 0 };
          recentLettersRef.current = [];
        }
      }

      // Log for debugging (only occasionally to avoid spam)
      if (requestCountRef.current % 10 === 0) {
        console.log(`📊 Prediction #${requestCountRef.current}:`, {
          handDetected: response.hand_detected,
          letter: response.prediction?.letter,
          confidence: response.prediction?.confidence,
        });
      }

      return response;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tahmin hatası';
      setError(errorMessage);
      
      // Error recovery logic
      const now = Date.now();
      const newErrorCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrorCount);
      lastErrorTimeRef.current = now;
      
      // If multiple consecutive errors, trigger recovery
      if (newErrorCount >= 3) {
        console.log("🔄 Multiple errors detected, triggering recovery...");
        
        // Wait a bit before attempting recovery
        setTimeout(() => {
          console.log("🔄 Attempting backend health check...");
          // Trigger a health check to reset backend connection
          api.healthCheck().then(() => {
            console.log("✅ Backend health check successful, resetting error count");
            setConsecutiveErrors(0);
          }).catch(() => {
            console.log("❌ Backend health check failed, may need manual restart");
          });
        }, 2000);
      }
      
      console.error('❌ Prediction error:', err);
      return null;
      
    } finally {
      setIsLoading(false);
      pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1);
    }
  }, [isLoading, consecutiveErrors]);

  return {
    sendFrame,
    isLoading,
    error,
    lastPrediction,
    lastResponse,
  };
};