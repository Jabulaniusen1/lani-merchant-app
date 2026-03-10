import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveAuth = async (token, user) => {
  await AsyncStorage.multiSet([
    ['token', token],
    ['user', JSON.stringify(user)],
  ]);
};

export const getToken = async () => AsyncStorage.getItem('token');

export const getUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuth = async () => {
  await AsyncStorage.multiRemove(['token', 'user']);
};

export const setItem = async (key, value) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getItem = async (key) => {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

export const removeItem = async (key) => {
  await AsyncStorage.removeItem(key);
};
