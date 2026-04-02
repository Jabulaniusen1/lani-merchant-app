import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken, clearAuth } from '../utils/storage';
import { BASE_URL } from '../utils/constants';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let _onUnauthorized: (() => void) | null = null;
let _isRefreshing = false;
let _refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string): void {
  _refreshSubscribers.forEach((cb) => cb(token));
  _refreshSubscribers = [];
}

export const setUnauthorizedHandler = (handler: () => void): void => {
  _onUnauthorized = handler;
};

client.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: unknown) => {
    const axiosError = error as {
      response?: { status?: number };
      config?: InternalAxiosRequestConfig & { _retry?: boolean };
    };

    if (axiosError?.response?.status === 401 && !axiosError.config?._retry) {
      if (_isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          _refreshSubscribers.push((token: string) => {
            if (axiosError.config) {
              axiosError.config.headers = axiosError.config.headers ?? {};
              axiosError.config.headers.Authorization = `Bearer ${token}`;
              resolve(client(axiosError.config));
            }
          });
        });
      }

      if (axiosError.config) {
        axiosError.config._retry = true;
        _isRefreshing = true;
      }

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data.data ?? refreshResponse.data;

        await AsyncStorage.setItem('token', newToken);
        if (newRefreshToken) await AsyncStorage.setItem('refreshToken', newRefreshToken);

        onRefreshed(newToken);
        _isRefreshing = false;

        if (axiosError.config) {
          axiosError.config.headers = axiosError.config.headers ?? {};
          axiosError.config.headers.Authorization = `Bearer ${newToken}`;
          return client(axiosError.config);
        }
      } catch {
        _isRefreshing = false;
        _refreshSubscribers = [];
        await AsyncStorage.multiRemove(['token', 'refreshToken']);
        await clearAuth();
        if (_onUnauthorized) _onUnauthorized();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
