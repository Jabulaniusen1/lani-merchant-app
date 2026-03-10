import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';

const sizeStyles = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  md: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  lg: { paddingVertical: 17, paddingHorizontal: 24, borderRadius: 16 },
};

const textSizes = {
  sm: 13,
  md: 15,
  lg: 16,
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  style,
}) {
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    sizeStyles[size],
    variant === 'primary' && styles.primary,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    { fontSize: textSizes[size] },
    variant === 'primary' && styles.textPrimary,
    variant === 'outline' && styles.textOutline,
    variant === 'ghost' && styles.textGhost,
    variant === 'danger' && styles.textDanger,
  ];

  const spinnerColor =
    variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 44,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontFamily: 'DMSans_600SemiBold',
    letterSpacing: 0.2,
  },
  textPrimary: { color: '#fff' },
  textOutline: { color: colors.primary },
  textGhost: { color: colors.primary },
  textDanger: { color: '#fff' },
});
