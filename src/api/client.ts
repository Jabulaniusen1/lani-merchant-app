import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { getToken, clearAuth } from '../utils/storage';
import { BASE_URL } from '../utils/constants';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let _onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void): void => {
  _onUnauthorized = handler;
};

client.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 401
    ) {
      await clearAuth();
      if (_onUnauthorized) _onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default client;
