import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { colors } from '../../theme/colors';

export default function EmptyState({ icon = '📭', title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.btn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 18,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: { paddingHorizontal: 32 },
});
