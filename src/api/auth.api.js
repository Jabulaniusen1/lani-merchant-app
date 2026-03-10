import client from './client';

export const loginApi = (email, password) =>
  client.post('/auth/login', { email, password });

export const registerApi = (data) =>
  client.post('/auth/register', data);

export const getMeApi = () =>
  client.get('/auth/me');

export const changePasswordApi = (currentPassword, newPassword) =>
  client.patch('/auth/change-password', { currentPassword, newPassword });
