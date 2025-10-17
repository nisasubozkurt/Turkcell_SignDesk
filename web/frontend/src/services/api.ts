import axios, { AxiosInstance } from 'axios';
import { ApiResponse, HealthCheckResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getOrCreateSessionId = (): string => {
  try {
    const KEY = 'signdesk_session_id';
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    
    // crypto.randomUUID() kullan (modern browsers)
    const newId = crypto.randomUUID();
    localStorage.setItem(KEY, newId);
    return newId;
  } catch {
    // Fallback: eski yöntem
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }
};
const SESSION_ID = getOrCreateSessionId();

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 20s → 10s (backend daha hızlı olacak)
  headers: {
    'Content-Type': 'application/json',
    'X-Session-ID': SESSION_ID,
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  (config.headers as Record<string, string>)['X-Session-ID'] = SESSION_ID;
  return config;
});

export const api = {
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const response = await apiClient.get<HealthCheckResponse>('/api/health');
    return response.data;
  },
  getLabels: async (): Promise<Record<number, string>> => {
    const response = await apiClient.get('/api/labels');
    return response.data.labels;
  },
  predict: async (frameBase64: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/api/predict', { frame: frameBase64 });
    return response.data;
  },
  test: async (): Promise<{ message: string; timestamp: string }> => {
    const response = await apiClient.get('/api/test');
    return response.data;
  },
  getSession: async (): Promise<any> => {
    const response = await apiClient.get('/api/session');
    return response.data;
  },
};
export default api;