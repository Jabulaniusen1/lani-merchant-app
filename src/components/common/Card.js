import React from 'react';
import { View, StyleSheet } from 'react-native';
import { shadows } from '../../theme/shadows';

export default function Card({ children, style, shadow = 'sm' }) {
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
