import { create } from 'zustand';
import {
  getEarningsSummaryApi,
  getTransactionsApi,
  getPayoutHistoryApi,
  getMyBankAccountApi,
} from '../api/finance.api';
import type { EarningsSummary, Transaction, Payout, BankAccount } from '../types';

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

interface FinanceState {
  earnings: EarningsSummary | null;
  transactions: Transaction[];
  pagination: Pagination | null;
  payouts: Payout[];
  bankAccount: BankAccount | null;
  isLoading: boolean;
  isLoadingTransactions: boolean;
  fetchEarnings: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<Pagination | null>;
  fetchPayouts: () => Promise<void>;
  fetchBankAccount: () => Promise<void>;
  setBankAccount: (account: BankAccount | null) => void;
  refreshAll: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEarnings(raw: any): EarningsSummary {
  return {
    availableBalance: raw.balance?.available ?? raw.availableBalance ?? 0,
    totalEarned: raw.balance?.totalEarned ?? raw.totalEarned ?? 0,
    totalPaidOut: raw.balance?.totalPaidOut ?? raw.totalPaidOut ?? 0,
    today: {
      revenue: raw.today?.earnings ?? raw.today?.revenue ?? 0,
      orders: raw.today?.orders ?? 0,
    },
    thisWeek: {
      revenue: raw.thisWeek?.earnings ?? raw.thisWeek?.revenue ?? 0,
      orders: raw.thisWeek?.orders ?? 0,
    },
    thisMonth: {
      revenue: raw.thisMonth?.earnings ?? raw.thisMonth?.revenue ?? 0,
      orders: raw.thisMonth?.orders ?? 0,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTransaction(tx: any, commissionRate?: number): Transaction {
  const firstName = tx.user?.firstName ?? tx.customer?.firstName ?? '';
  const lastName = tx.user?.lastName ?? tx.customer?.lastName ?? '';
  return {
    id: tx.id,
    orderId: tx.orderId ?? tx.id,
    customerName: firstName ? `${firstName} ${lastName}`.trim() : undefined,
    restaurantName: tx.restaurant?.name ?? tx.restaurantName,
    items: tx.items,
    orderTotal: tx.total ?? tx.orderTotal ?? tx.subtotal ?? 0,
    merchantEarning: tx.merchantEarning ?? 0,
    platformFee: tx.platformFee ?? 0,
    commissionRate: tx.commissionRate ?? commissionRate ?? 20,
    createdAt: tx.createdAt,
  };
}

const useFinanceStore = create<FinanceState>((set, get) => ({
  earnings: null,
  transactions: [],
  pagination: null,
  payouts: [],
  bankAccount: null,
  isLoading: false,
  isLoadingTransactions: false,

  fetchEarnings: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      const res = await getEarningsSummaryApi();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set({ earnings: normalizeEarnings(res.data.data as any) });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async (page = 1): Promise<Pagination | null> => {
    set({ isLoadingTransactions: true });
    try {
      const res = await getTransactionsApi(page);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = res.data.data as any;
      const rawTxs: unknown[] = raw.transactions ?? [];
      const rawPagination = raw.pagination ?? {};
      const commissionRate = raw.commissionRate;

      const transactions: Transaction[] = rawTxs.map((tx) =>
        normalizeTransaction(tx, commissionRate)
      );
      const pagination: Pagination = {
        page: rawPagination.page ?? 1,
        totalPages: rawPagination.totalPages ?? rawPagination.pages ?? 1,
        total: rawPagination.total ?? 0,
      };

      set((state) => ({
        transactions: page === 1 ? transactions : [...state.transactions, ...transactions],
        pagination,
      }));
      return pagination;
    } catch {
      return null;
    } finally {
      set({ isLoadingTransactions: false });
    }
  },

  fetchPayouts: async (): Promise<void> => {
    const res = await getPayoutHistoryApi();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = res.data.data as any;
    set({ payouts: raw.payouts ?? raw ?? [] });
  },

  fetchBankAccount: async (): Promise<void> => {
    const res = await getMyBankAccountApi();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = res.data.data as any;
    set({ bankAccount: raw.bankAccount ?? raw ?? null });
  },

  setBankAccount: (account: BankAccount | null): void => set({ bankAccount: account }),

  refreshAll: async (): Promise<void> => {
    await Promise.all([
      get().fetchEarnings(),
      get().fetchBankAccount(),
    ]);
  },
}));

export default useFinanceStore;
