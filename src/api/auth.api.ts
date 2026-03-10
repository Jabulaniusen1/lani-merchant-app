import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse, User } from '../types';

export interface LoginResponseData {
  token: string;
  user: User;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: string;
}

export const loginApi = (
  email: string,
  password: string
): Promise<AxiosResponse<ApiResponse<LoginResponseData>>> =>
  client.post('/auth/login', { email, password });

export const registerApi = (
  data: RegisterData
): Promise<AxiosResponse<ApiResponse<LoginResponseData>>> =>
  client.post('/auth/register', data);

export const getMeApi = (): Promise<AxiosResponse<ApiResponse<{ user: User }>>> =>
  client.get('/auth/me');

export const changePasswordApi = (
  currentPassword: string,
  newPassword: string
): Promise<AxiosResponse<ApiResponse<unknown>>> =>
  client.patch('/auth/change-password', { currentPassword, newPassword });
