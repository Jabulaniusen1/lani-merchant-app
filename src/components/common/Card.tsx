import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { shadows } from '../../theme/shadows';

type ShadowKey = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: ShadowKey;
}

export default function Card({ children, style, shadow = 'sm' }: CardProps): React.JSX.Element {
  return (
    <View style={[styles.card, shadows[shadow], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
});
