export const formatCurrency = (amount: number | string): string => {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
};

export const formatOrderNumber = (id: string | undefined | null): string => {
  if (!id) return '#0000';
  return `#${id.slice(-4).toUpperCase()}`;
};

export const formatRelativeTime = (date: string | Date): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

export const formatTime = (time: string | undefined | null): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${minutes} ${ampm}`;
};

export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPriceInput = (value: string): string => {
  const num = value.replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString('en-NG') : '';
};

export const parsePriceInput = (value: string): number => {
  return Number(value.replace(/[^0-9]/g, ''));
};
