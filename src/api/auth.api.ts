import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse, User } from '../types';

export interface LoginResponseData {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
  merchantType?: 'RESTAURANT' | 'PHARMACY' | 'SUPERMARKET';
  isBusinessRegistered?: boolean;
  cacDocumentUri?: string;
}

export const loginApi = (
  email: string,
  password: string
): Promise<AxiosResponse<ApiResponse<LoginResponseData>>> =>
  client.post('/auth/login', { email, password });

export const registerApi = (
  data: RegisterData
): Promise<AxiosResponse<ApiResponse<LoginResponseData>>> => {
  if (data.isBusinessRegistered && data.cacDocumentUri) {
    const form = new FormData();
    form.append('firstName', data.firstName);
    form.append('lastName', data.lastName);
    form.append('email', data.email);
    form.append('phone', data.phone);
    form.append('password', data.password);
    form.append('role', data.role ?? 'MERCHANT');
    if (data.merchantType) form.append('merchantType', data.merchantType);
    form.append('isBusinessRegistered', 'true');
    const filename = data.cacDocumentUri.split('/').pop() ?? 'cac.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;
    form.append('cacDocument', { uri: data.cacDocumentUri, name: filename, type: mimeType } as unknown as Blob);
    return client.post('/auth/register', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return client.post('/auth/register', {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role: data.role ?? 'MERCHANT',
    merchantType: data.merchantType,
    isBusinessRegistered: false,
  });
};

export const getMeApi = (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
  client.get('/auth/me');

export const updateProfileApi = (data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
  client.patch('/auth/me', data);

export const logoutApi = (refreshToken: string): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  client.post('/auth/logout', { refreshToken });

export const changePasswordApi = (
  currentPassword: string,
  newPassword: string
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  client.patch('/auth/change-password', { currentPassword, newPassword });

export const forgotPasswordApi = (email: string): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  client.post('/auth/forgot-password', { email });

export const resetPasswordApi = (
  email: string,
  code: string,
  newPassword: string
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  client.post('/auth/reset-password', { email, code, newPassword });

export const savePushTokenApi = (
  pushToken: string
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  client.post('/auth/device-token', { token: pushToken });
