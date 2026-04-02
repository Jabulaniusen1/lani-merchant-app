import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveAuth, clearAuth, getToken, getUser } from '../utils/storage';
import { loginApi, registerApi, logoutApi, getMeApi, savePushTokenApi, type RegisterData } from '../api/auth.api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { getExpoPushToken } from '../services/notifications';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (data: Omit<RegisterData, 'role'>) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async (): Promise<void> => {
    try {
      const token = await getToken();
      const user = await getUser();
      if (token && user) {
        try {
          const res = await getMeApi();
          const payload = res.data.data || (res.data as unknown as { user?: User });
          const freshUser: User =
            (payload as { user?: User }).user ?? (payload as unknown as User) ?? user;
          set({ user: freshUser, token, isAuthenticated: true });
          connectSocket(token);
        } catch {
          await clearAuth();
          set({ user: null, token: null, isAuthenticated: false });
        }
      }
    } catch {
      // ignore init errors
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await loginApi(email, password);
    const payload = res.data.data || (res.data as unknown as { token: string; refreshToken?: string; user: User });
    const token: string = payload.token;
    const refreshToken: string | undefined = payload.refreshToken;
    const user: User = payload.user ?? (payload as unknown as User);
    await saveAuth(token, user, refreshToken);
    set({ user, token, isAuthenticated: true });
    connectSocket(token);
    // Send push token to backend (best-effort, non-blocking)
    void getExpoPushToken().then((pushToken) => {
      if (pushToken) void savePushTokenApi(pushToken).catch(() => {});
    });
    return { user, token };
  },

  register: async (
    data: Omit<RegisterData, 'role'>
  ): Promise<{ user: User; token: string }> => {
    const res = await registerApi({ ...data, role: 'MERCHANT' });
    const payload = res.data.data || (res.data as unknown as { token: string; refreshToken?: string; user: User });
    const token: string = payload.token;
    const refreshToken: string | undefined = payload.refreshToken;
    const user: User = payload.user ?? (payload as unknown as User);
    await saveAuth(token, user, refreshToken);
    set({ user, token, isAuthenticated: true });
    connectSocket(token);
    // Send push token to backend (best-effort, non-blocking)
    void getExpoPushToken().then((pushToken) => {
      if (pushToken) void savePushTokenApi(pushToken).catch(() => {});
    });
    return { user, token };
  },

  logout: async (): Promise<void> => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) await logoutApi(refreshToken);
    } catch {
      // best-effort — still clear local state
    }
    await clearAuth();
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user: User): void => set({ user }),
}));

export default useAuthStore;
