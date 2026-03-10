import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { formatOrderNumber } from '../utils/formatters';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const showNewOrderNotification = async (order) => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🍽️ New Order!',
        body: `Order ${formatOrderNumber(order.id || order.orderId)} — ₦${order.total}`,
        sound: true,
      },
      trigger: null,
    });
  } catch (e) {
    console.log('Notification error:', e);
  }
};

export const triggerHaptic = async (type = 'light') => {
  try {
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (e) {
    // Haptics not available
  }
};
