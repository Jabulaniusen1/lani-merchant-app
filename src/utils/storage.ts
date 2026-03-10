import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

export const saveAuth = async (token: string, user: User): Promise<void> => {
  await AsyncStorage.multiSet([
    ['token', token],
    ['user', JSON.stringify(user)],
  ]);
};

export const getToken = async (): Promise<string | null> => AsyncStorage.getItem('token');

export const getUser = async (): Promise<User | null> => {
  const user = await AsyncStorage.getItem('user');
  return user ? (JSON.parse(user) as User) : null;
};

export const clearAuth = async (): Promise<void> => {
  await AsyncStorage.multiRemove(['token', 'user']);
};

export const setItem = async (key: string, value: unknown): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getItem = async <T = unknown>(key: string): Promise<T | null> => {
  const value = await AsyncStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : null;
};

export const removeItem = async (key: string): Promise<void> => {
  await AsyncStorage.removeItem(key);
};
