import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  md: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  lg: { paddingVertical: 17, paddingHorizontal: 24, borderRadius: 16 },
};

const textSizes: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 16,
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: ButtonSize;
  style?: ViewStyle;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  style,
}: ButtonProps): React.JSX.Element {
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
