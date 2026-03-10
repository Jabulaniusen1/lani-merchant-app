import axios from 'axios';
import { getToken, clearAuth } from '../utils/storage';
import { BASE_URL } from '../utils/constants';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let _onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  _onUnauthorized = handler;
};

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuth();
      if (_onUnauthorized) _onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default client;
