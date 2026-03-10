import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { formatOrderNumber } from '../utils/formatters';
import type { NewOrderPayload } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const showNewOrderNotification = async (order: NewOrderPayload): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Order!',
        body: `Order ${formatOrderNumber(order.id || order.orderId)} — ₦${order.total}`,
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.log('Notification error:', e);
  }
};

type HapticType = 'light' | 'success' | 'error';

export const triggerHaptic = async (type: HapticType = 'light'): Promise<void> => {
  try {
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Haptics not available
  }
};
