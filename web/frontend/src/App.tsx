import { useState, useEffect, useRef } from 'react';
import { AppMode } from './types';

// Hooks
import { useWebcam } from './hooks/useWebcam';
import { usePrediction } from './hooks/usePrediction';
import { useWordBuilder } from './hooks/useWordBuilder';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { useBackendHealth } from './hooks/useBackendHealth';

// Components
import { ModeSelector } from './components/ModeSelector';
import { CountdownTimer } from './components/CountdownTimer';
import { VideoStream } from './components/VideoStream';
import { PredictionDisplay } from './components/PredictionDisplay';
import { WordDisplay } from './components/WordDisplay';
// import { ControlPanel } from './components/ControlPanel';
import { Instructions } from './components/Instructions';
import { TextToSignConverter } from './components/TextToSignConverter';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingSpinner } from './components/LoadingSpinner';

// Pages
// import { Statistics } from './pages/Statistics';

// Constants
import { STARTUP_COUNTDOWN, FRAME_CAPTURE_INTERVAL, NO_HAND_CONSECUTIVE_FRAMES_TO_CLEAR, STABLE_LETTER_FRAMES, LETTER_STABILITY_THRESHOLD, MIN_CONFIDENCE_FOR_UI, HIGH_CONFIDENCE_THRESHOLD } from './utils/constants';

function App() {
  // Mode state
  const [appMode, setAppMode] = useState<AppMode>('sign-to-text');

  // Sign-to-Text state
  const [appStarted, setAppStarted] = useState(false);
  const [countdown, setCountdown] = useState(STARTUP_COUNTDOWN);
  const [error, setError] = useState<string | null>(null);
  // UI state for live prediction display
  const [currentUiLetter, setCurrentUiLetter] = useState<string | null>(null);
  const [currentUiCountdown, setCurrentUiCountdown] = useState<number>(0);

  // Hooks
  const { isHealthy, isChecking } = useBackendHealth();
  const webcam = useWebcam();
  const prediction = usePrediction();
  const wordBuilder = useWordBuilder();

  // Refs
  const frameCaptureIntervalRef = useRef<number | null>(null);
  const frameCaptureTimeoutRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const noHandFramesRef = useRef<number>(0);
  const isRequestPendingRef = useRef<boolean>(false); // Prevent request queue buildup
  const lastProcessingMsRef = useRef<number>(FRAME_CAPTURE_INTERVAL);
  const skipLogCounterRef = useRef<number>(0);

  // New stable letter algorithm state
  const stableLetterRef = useRef<{
    letter: string | null;
    count: number;
    lastAddedLetter: string | null;
  }>({ letter: null, count: 0, lastAddedLetter: null });

  // Keyboard controls (only for sign-to-text mode)
  useKeyboardControls({
    onSpace: wordBuilder.addSpace,
    onBackspace: wordBuilder.deleteLast,
    onClear: wordBuilder.clearAll,
    onEnter: wordBuilder.completeWord,
    enabled: appStarted && appMode === 'sign-to-text',
  });

  // Keep isActive in a ref to avoid stale closure inside setInterval
  useEffect(() => {
    isActiveRef.current = webcam.isActive;
  }, [webcam.isActive]);

  /**
   * Handle mode change
   */
  const handleModeChange = (mode: AppMode) => {
    // Stop camera if switching modes
    if (appStarted && mode !== appMode) {
      stopSignToTextMode();
    }
    setAppMode(mode);
    setError(null);
  };

  /**
   * Start Sign-to-Text mode
   */
  const startSignToTextMode = async () => {
    try {
      setError(null);

      // Check backend health first
      if (!isHealthy) {
        setError('Backend bağlantısı kurulamadı. Lütfen backend\'in çalıştığından emin olun.');
        return;
      }

      // Start camera
      await webcam.startCamera();

      if (webcam.error) {
        setError(webcam.error);
        return;
      }

      // Wait until camera becomes active (safety)
      let waitMs = 0;
      while (!webcam.isActive && waitMs < 2000) {
        await new Promise((r) => setTimeout(r, 100));
        waitMs += 100;
      }

      // Start immediately for reliability; countdown sadece görsel amaçlı
      if (!appStarted) {
        setAppStarted(true);
      }
      // Wait until VideoStream mounts and refs are available
      let waitedMs = 0;
      while ((!webcam.videoRef.current || !webcam.canvasRef.current) && waitedMs < 2000) {
        await new Promise((r) => setTimeout(r, 50));
        waitedMs += 50;
      }
      if (!frameCaptureIntervalRef.current) {
        startFrameCaptureLoop();
      }

      // Görsel geri sayım (UI)
      setCountdown(STARTUP_COUNTDOWN);
      let remainingTime = STARTUP_COUNTDOWN;
      const countdownInterval = setInterval(() => {
        remainingTime -= 1;
        setCountdown(remainingTime);
        if (remainingTime <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bir hata oluştu';
      setError(errorMessage);
      console.error('Error starting sign-to-text mode:', err);
    }
  };

  /**
   * Stop Sign-to-Text mode
   */
  const stopSignToTextMode = () => {
    // Stop camera
    webcam.stopCamera();

    // Stop frame capture
    if (frameCaptureIntervalRef.current) {
      clearInterval(frameCaptureIntervalRef.current);
      frameCaptureIntervalRef.current = null;
    }
    if (frameCaptureTimeoutRef.current) {
      clearTimeout(frameCaptureTimeoutRef.current);
      frameCaptureTimeoutRef.current = null;
    }

    // Reset state
    setAppStarted(false);
    setCountdown(STARTUP_COUNTDOWN);
    wordBuilder.clearAll();
  };

  /**
   * Start frame capture loop
   */
  const startFrameCaptureLoop = () => {
    if (frameCaptureTimeoutRef.current || frameCaptureIntervalRef.current) {
      return;
    }
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const scheduleNext = (delay: number) => {
      if (frameCaptureTimeoutRef.current) {
        clearTimeout(frameCaptureTimeoutRef.current);
      }
      frameCaptureTimeoutRef.current = window.setTimeout(tick, delay);
    };
    const tick = async () => {
      // Skip if camera not active yet
      if (!isActiveRef.current) {
        scheduleNext(FRAME_CAPTURE_INTERVAL);
        return;
      }

      // CRITICAL: Skip if previous request is still pending (prevent queue buildup)
      if (isRequestPendingRef.current) {
        skipLogCounterRef.current += 1;
        if (skipLogCounterRef.current % 10 === 0) {
          console.log('⚠️ Skipping frame - previous request still pending');
        }
        scheduleNext(lastProcessingMsRef.current || FRAME_CAPTURE_INTERVAL);
        return;
      }

      // Capture frame
      const frameBase64 = webcam.captureFrame();

      if (!frameBase64) {
        scheduleNext(FRAME_CAPTURE_INTERVAL);
        return;
      }

      // Mark request as pending
      isRequestPendingRef.current = true;

      try {
        // Send to backend for prediction
        const response = await prediction.sendFrame(frameBase64);

        if (!response) {
          return;
        }

        // Enhanced Stable Letter Algorithm
        const predictedLetter = response.prediction?.letter;
        const predictedConfidence = response.prediction?.confidence ?? 0;

        if (response.hand_detected && predictedLetter) {
          const stable = stableLetterRef.current;

          // Show letter in UI if confidence is above minimum threshold
          if (predictedConfidence >= MIN_CONFIDENCE_FOR_UI) {
            setCurrentUiLetter(predictedLetter);

            // Calculate countdown based on stability progress
            const framesRemaining = Math.max(0, STABLE_LETTER_FRAMES - stable.count);
            const secondsRemaining = Math.ceil((framesRemaining * FRAME_CAPTURE_INTERVAL) / 1000);
            setCurrentUiCountdown(secondsRemaining);
          }

          // Process letter for addition if confidence meets stability threshold
          if (predictedConfidence >= LETTER_STABILITY_THRESHOLD) {
            if (stable.letter === predictedLetter) {
              // Same letter as before, increment count
              stable.count += 1;

              // Determine required frames based on confidence
              const requiredFrames = predictedConfidence >= HIGH_CONFIDENCE_THRESHOLD ? 3 : STABLE_LETTER_FRAMES;

              // Check if we have enough consecutive frames
              if (stable.count >= requiredFrames && stable.lastAddedLetter !== predictedLetter) {
                // Add letter directly (already stable)
                wordBuilder.addStableLetter(predictedLetter);
                stable.lastAddedLetter = predictedLetter;
                console.log(`✅ Stable letter added: ${predictedLetter} (${stable.count} frames, conf: ${predictedConfidence.toFixed(3)})`);
                // Reflect confirmation on UI (countdown 0 shows onaylandı)
                setCurrentUiLetter(predictedLetter);
                setCurrentUiCountdown(0);
              }
            } else {
              // Different letter, reset counter
              stable.letter = predictedLetter;
              stable.count = 1;
              stable.lastAddedLetter = null;
              console.log(`🔄 New letter detected: ${predictedLetter} (confidence: ${predictedConfidence.toFixed(3)})`);
            }
          } else {
            // Low confidence, reset tracking but keep UI if above minimum
            stable.letter = null;
            stable.count = 0;
            stable.lastAddedLetter = null;
          }

          // Reset no-hand counter
          noHandFramesRef.current = 0;

        } else if (!response.hand_detected) {
          // Increment consecutive no-hand frames and clear after threshold
          noHandFramesRef.current += 1;
          if (noHandFramesRef.current >= NO_HAND_CONSECUTIVE_FRAMES_TO_CLEAR) {
            // Reset stable letter tracking
            stableLetterRef.current = { letter: null, count: 0, lastAddedLetter: null };
            wordBuilder.clearPendingLetter();
            noHandFramesRef.current = 0;
            console.log('🧹 Hand lost, cleared pending letter');
          }
          // Clear UI when hand is not detected
          setCurrentUiLetter(null);
          setCurrentUiCountdown(0);
        } else {
          // Hand detected but no letter or very low confidence
          stableLetterRef.current = { letter: null, count: 0, lastAddedLetter: null };
          noHandFramesRef.current = 0;
          // Clear UI for very low confidence
          setCurrentUiLetter(null);
          setCurrentUiCountdown(0);
        }
      } catch (error) {
        console.error('❌ Prediction error:', error);
      } finally {
        // CRITICAL: Always unmark request as pending (even if error)
        isRequestPendingRef.current = false;
      }

      // Adaptive scheduling based on last processing time
      const procMs = (prediction.lastResponse as any)?.processing_time_ms;
      if (typeof procMs === 'number' && !Number.isNaN(procMs)) {
        lastProcessingMsRef.current = clamp(Math.round(procMs + 10), 33, 250);
      }
      scheduleNext(lastProcessingMsRef.current || FRAME_CAPTURE_INTERVAL);
    };
    // Run an immediate tick once (sets next schedule inside)
    tick();
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (frameCaptureIntervalRef.current) {
        window.clearInterval(frameCaptureIntervalRef.current);
        frameCaptureIntervalRef.current = null;
      }
      if (frameCaptureTimeoutRef.current) {
        window.clearTimeout(frameCaptureTimeoutRef.current);
        frameCaptureTimeoutRef.current = null;
      }
      webcam.stopCamera();
    };
  }, []);

  /**
   * Auto-start countdown when switching to sign-to-text mode
   */
  useEffect(() => {
    console.log('useEffect triggered:', { appMode, appStarted, isHealthy, isChecking });
    if (appMode === 'sign-to-text' && !appStarted) {
      console.log('Starting countdown...');
      // Her zaman geri sayımı başlat
      setCountdown(STARTUP_COUNTDOWN);
      let remainingTime = STARTUP_COUNTDOWN;
      const countdownInterval = setInterval(() => {
        remainingTime -= 1;
        console.log('Countdown:', remainingTime);
        setCountdown(remainingTime);
        if (remainingTime <= 0) {
          clearInterval(countdownInterval);
          console.log('Countdown finished, isHealthy:', isHealthy);
          // Geri sayım bittiğinde backend durumuna göre işlem yap
          if (isHealthy) {
            startSignToTextMode();
          }
        }
      }, 1000);
      
      // Cleanup function
      return () => {
        console.log('Cleaning up countdown interval');
        clearInterval(countdownInterval);
      };
    }
  }, [appMode, isHealthy]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.png" alt="Turkcell SignDesk" className="w-25 h-12 mr-6" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                  Turkcell SignDesk
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  İşaret Dili - İki Yönlü Çeviri
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isHealthy && (
                <ModeSelector currentMode={appMode} onModeChange={handleModeChange} />
              )}
              {/* <BackendStatus /> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 flex-1">
        {/* Backend Loading */}
        {isChecking && (
          <LoadingSpinner size="lg" text="Backend bağlantısı kontrol ediliyor..." fullScreen />
        )}

        {/* Backend Error */}
        {!isChecking && !isHealthy && (
          <div className="max-w-2xl mx-auto">
            <ErrorMessage
              message="Backend bağlantısı kurulamadı. Lütfen backend sunucusunun çalıştığından emin olun (python app.py)"
              type="error"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-4xl mx-auto">
            <ErrorMessage message={error} onClose={() => setError(null)} type="error" />
          </div>
        )}

        {/* Sign-to-Text Mode */}
        {appMode === 'sign-to-text' && (
          <>
            {/* Countdown Timer */}
            {!appStarted && countdown > 0 && (
              <CountdownTimer
                countdown={countdown}
                total={STARTUP_COUNTDOWN}
                message={isHealthy ? "Kamera hazırlanıyor..." : "Backend bağlantısı bekleniyor..."}
              />
            )}

            {/* Main Interface */}
            {appStarted && isHealthy && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column - Video */}
                <div className="xl:col-span-2 space-y-6">


                  <VideoStream
                    videoRef={webcam.videoRef}
                    canvasRef={webcam.canvasRef}
                    isActive={webcam.isActive}
                    landmarks={prediction.lastResponse?.landmarks}
                    boundingBox={prediction.lastResponse?.bounding_box}
                    handDetected={Boolean(prediction.lastResponse?.hand_detected)}
                  />

                  {/* Instructions */}
                  <Instructions />
                </div>

                {/* Right Column - Controls */}
                <div className="space-y-4 xl:sticky xl:top-24">
                  <PredictionDisplay
                    currentLetter={currentUiLetter}
                    confidence={prediction.lastPrediction?.confidence || 0}
                    isProcessing={prediction.isLoading}
                    countdown={currentUiCountdown}
                    handDetected={prediction.lastResponse?.hand_detected}
                  />

                  <WordDisplay
                    word={wordBuilder.word}
                    lastLetter={wordBuilder.lastLetter}
                    isActive={wordBuilder.isActive}
                    onAddSpace={wordBuilder.addSpace}
                    onDeleteLast={wordBuilder.deleteLast}
                    onClearAll={wordBuilder.clearAll}
                    onCompleteWord={wordBuilder.completeWord}
                    onCompleteWordAndSwitch={() => {
                      wordBuilder.completeWord();
                      handleModeChange('text-to-sign');
                    }}
                    disabled={!wordBuilder.isActive}
                  />
                </div>
              </div>
            )}
          </>
        )}



        {/* Text-to-Sign Mode */}
        {appMode === 'text-to-sign' && isHealthy && (
          <div className="max-w-4xl mx-auto">
            <TextToSignConverter onModeChange={handleModeChange} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© 2025 Turkcell SignDesk - Türk İşaret Dili Uygulaması</p>
            <p className="mt-1">İşitme engelli bireylerin iletişimini kolaylaştırmak için geliştirilmiştir.</p>
            <p className="mt-1"><strong>Nisasu Bozkurt | Rukiye Uçar | Özge Solmaz</strong></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;