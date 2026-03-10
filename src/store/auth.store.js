import { create } from 'zustand';
import { saveAuth, clearAuth, getToken, getUser } from '../utils/storage';
import { loginApi, registerApi, getMeApi } from '../api/auth.api';
import { connectSocket, joinMerchantRooms, disconnectSocket } from '../services/socket';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await getToken();
      const user = await getUser();
      if (token && user) {
        // Validate token with server
        try {
          const res = await getMeApi();
          const payload = res.data.data || res.data;
          const freshUser = payload?.user || payload || user;
          set({ user: freshUser, token, isAuthenticated: true });
          connectSocket(token);
        } catch {
          await clearAuth();
          set({ user: null, token: null, isAuthenticated: false });
        }
      }
    } catch (e) {
      console.log('Init error', e);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await loginApi(email, password);
    const payload = res.data.data || res.data;
    const token = payload.token;
    const user = payload.user || payload;
    await saveAuth(token, user);
    set({ user, token, isAuthenticated: true });
    connectSocket(token);
    return { user, token };
  },

  register: async (data) => {
    const res = await registerApi({ ...data, role: 'MERCHANT' });
    const payload = res.data.data || res.data;
    const token = payload.token;
    const user = payload.user || payload;
    await saveAuth(token, user);
    set({ user, token, isAuthenticated: true });
    connectSocket(token);
    return { user, token };
  },

  logout: async () => {
    await clearAuth();
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => set({ user }),
}));

export default useAuthStore;
