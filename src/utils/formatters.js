export const formatCurrency = (amount) => {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
};

export const formatOrderNumber = (id) => {
  if (!id) return '#0000';
  return `#${id.slice(-4).toUpperCase()}`;
};

export const formatRelativeTime = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
};

export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${minutes} ${ampm}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPriceInput = (value) => {
  const num = value.replace(/[^0-9]/g, '');
  return num ? Number(num).toLocaleString('en-NG') : '';
};

export const parsePriceInput = (value) => {
  return Number(value.replace(/[^0-9]/g, ''));
};
