import type { AxiosResponse } from 'axios';
import client from './client';
import type { ApiResponse, BankAccount, Bank, EarningsSummary, Transaction, Payout } from '../types';

export const getBanksApi = (): Promise<AxiosResponse<ApiResponse<{ banks: Bank[] }>>> =>
  client.get('/bank-account/banks');

export const verifyAccountApi = (
  accountNumber: string,
  bankCode: string
): Promise<AxiosResponse<ApiResponse<{ accountName: string; accountNumber: string; bankCode: string }>>> =>
  client.post('/bank-account/verify', { accountNumber, bankCode });

export const saveBankAccountApi = (data: {
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
}): Promise<AxiosResponse<ApiResponse<{ bankAccount: BankAccount }>>> =>
  client.post('/bank-account', data);

export const getMyBankAccountApi = (): Promise<AxiosResponse<ApiResponse<{ bankAccount: BankAccount | null }>>> =>
  client.get('/bank-account');

export const getEarningsSummaryApi = (): Promise<AxiosResponse<ApiResponse<EarningsSummary>>> =>
  client.get('/payouts/earnings');

export const getTransactionsApi = (
  page = 1
): Promise<AxiosResponse<ApiResponse<{ transactions: Transaction[]; pagination: { page: number; totalPages: number; total: number } }>>> =>
  client.get(`/payouts/transactions?page=${page}&limit=20`);

export const requestPayoutApi = (
  amount: number
): Promise<AxiosResponse<ApiResponse<{ payout: Payout }>>> =>
  client.post('/payouts/request', { amount });

export const getPayoutHistoryApi = (): Promise<AxiosResponse<ApiResponse<{ payouts: Payout[] }>>> =>
  client.get('/payouts/history');
