import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  full?: boolean;
}

export default function LoadingSpinner({
  size = 'large',
  color = colors.primary,
  full = false,
}: LoadingSpinnerProps): React.JSX.Element {
  if (full) {
    return (
      <View style={styles.full}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return <ActivityIndicator size={size} color={color} />;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
});
