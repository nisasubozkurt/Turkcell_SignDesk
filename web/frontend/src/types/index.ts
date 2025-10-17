// API Related Types
export interface PredictionResult {
  letter: string | null;
  confidence: number;
  label_index: number | null;
}

export interface Landmark {
  x: number;
  y: number;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ApiResponse {
  success: boolean;
  hand_detected: boolean;
  prediction: PredictionResult;
  landmarks?: Landmark[];
  bounding_box?: BoundingBox;
  timestamp: string;
  error?: string | null;
  session_id?: string;
  cached?: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  model_loaded: boolean;
  mediapipe_ready: boolean;
  timestamp: string;
  config?: {
    min_detection_confidence: number;
    letter_confirmation_delay: number;
  };
}

export interface LabelsResponse {
  success: boolean;
  labels: Record<number, string>;
}

export interface SessionInfo {
  session_id: string;
  client_ip: string;
  timestamp: string;
  user_agent: string;
}

// Word Builder Types
export interface WordState {
  currentWord: string[];
  lastLetter: string | null;
  pendingLetter: string | null;
  letterStartTime: number | null;
  isConfirmed: boolean;
  wordFormationActive: boolean;
}

// Camera Types
export interface CameraState {
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
}

// App State Types
export interface AppState {
  isStarted: boolean;
  countdown: number;
  isProcessing: boolean;
  error: string | null;
}

// App Mode Types
export type AppMode = 'sign-to-text' | 'text-to-sign';