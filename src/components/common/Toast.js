import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const typeConfig = {
  success: { bg: colors.success, icon: 'checkmark-circle', iconColor: '#fff' },
  error: { bg: colors.error, icon: 'close-circle', iconColor: '#fff' },
  info: { bg: colors.blue, icon: 'information-circle', iconColor: '#fff' },
  warning: { bg: colors.warning, icon: 'warning', iconColor: '#fff' },
};

let _showToast = null;

export const showToast = (options) => {
  if (_showToast) _showToast(options);
};

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();
  const timerRef = useRef(null);

  const show = useCallback(({ type = 'info', message }) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ type, message });
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    timerRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3000);
  }, [slideAnim]);

  useEffect(() => {
    _showToast = show;
    return () => { _showToast = null; };
  }, [show]);

  const config = toast ? typeConfig[toast.type] || typeConfig.info : null;

  return (
    <>
      {children}
      {toast && config && (
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: config.bg, top: insets.top + 12 },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Ionicons name={config.icon} size={20} color={config.iconColor} />
          <Text style={styles.message}>{toast.message}</Text>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
});
