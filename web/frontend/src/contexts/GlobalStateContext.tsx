import { createContext, useContext, useReducer, ReactNode } from 'react';

// Global State Types
export interface GlobalState {
  // App State
  appMode: 'sign-to-text' | 'text-to-sign';
  isAppStarted: boolean;
  countdown: number;
  error: string | null;
  
  // Session State
  sessionId: string;
  clientInfo: {
    ip: string;
    userAgent: string;
    timestamp: string;
  } | null;
  
  // Performance State
  performance: {
    requestCount: number;
    averageResponseTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
  
  // UI State
  ui: {
    currentLetter: string | null;
    letterCountdown: number;
    isLoading: boolean;
    isHealthy: boolean;
  };
}

// Action Types
export type GlobalAction =
  | { type: 'SET_APP_MODE'; payload: 'sign-to-text' | 'text-to-sign' }
  | { type: 'SET_APP_STARTED'; payload: boolean }
  | { type: 'SET_COUNTDOWN'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_CLIENT_INFO'; payload: { ip: string; userAgent: string; timestamp: string } }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<GlobalState['performance']> }
  | { type: 'UPDATE_UI'; payload: Partial<GlobalState['ui']> }
  | { type: 'RESET_STATE' };

// Initial State
const initialState: GlobalState = {
  appMode: 'sign-to-text',
  isAppStarted: false,
  countdown: 3,
  error: null,
  sessionId: '',
  clientInfo: null,
  performance: {
    requestCount: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    errorRate: 0,
  },
  ui: {
    currentLetter: null,
    letterCountdown: 0,
    isLoading: false,
    isHealthy: false,
  },
};

// Reducer
function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_APP_MODE':
      return { ...state, appMode: action.payload };
    case 'SET_APP_STARTED':
      return { ...state, isAppStarted: action.payload };
    case 'SET_COUNTDOWN':
      return { ...state, countdown: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_CLIENT_INFO':
      return { ...state, clientInfo: action.payload };
    case 'UPDATE_PERFORMANCE':
      return { 
        ...state, 
        performance: { ...state.performance, ...action.payload } 
      };
    case 'UPDATE_UI':
      return { 
        ...state, 
        ui: { ...state.ui, ...action.payload } 
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Context
const GlobalStateContext = createContext<{
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
} | null>(null);

// Provider Component
export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Hook to use global state
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}

// Selector hooks for specific state slices
export function useAppState() {
  const { state, dispatch } = useGlobalState();
  return {
    appMode: state.appMode,
    isAppStarted: state.isAppStarted,
    countdown: state.countdown,
    error: state.error,
    setAppMode: (mode: 'sign-to-text' | 'text-to-sign') => 
      dispatch({ type: 'SET_APP_MODE', payload: mode }),
    setAppStarted: (started: boolean) => 
      dispatch({ type: 'SET_APP_STARTED', payload: started }),
    setCountdown: (countdown: number) => 
      dispatch({ type: 'SET_COUNTDOWN', payload: countdown }),
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),
  };
}

export function useSessionState() {
  const { state, dispatch } = useGlobalState();
  return {
    sessionId: state.sessionId,
    clientInfo: state.clientInfo,
    setSessionId: (sessionId: string) => 
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId }),
    setClientInfo: (clientInfo: { ip: string; userAgent: string; timestamp: string }) => 
      dispatch({ type: 'SET_CLIENT_INFO', payload: clientInfo }),
  };
}

export function usePerformanceState() {
  const { state, dispatch } = useGlobalState();
  return {
    performance: state.performance,
    updatePerformance: (updates: Partial<GlobalState['performance']>) => 
      dispatch({ type: 'UPDATE_PERFORMANCE', payload: updates }),
  };
}

export function useUIState() {
  const { state, dispatch } = useGlobalState();
  return {
    ui: state.ui,
    updateUI: (updates: Partial<GlobalState['ui']>) => 
      dispatch({ type: 'UPDATE_UI', payload: updates }),
  };
}
