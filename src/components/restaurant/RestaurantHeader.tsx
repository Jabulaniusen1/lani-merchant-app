import React from 'react';
import { View, Text, Image, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { formatTime } from '../../utils/formatters';
import type { Restaurant } from '../../types';

interface RestaurantHeaderProps {
  restaurant: Restaurant;
  onToggleOpen?: (restaurant: Restaurant) => void;
}

export default function RestaurantHeader({
  restaurant,
  onToggleOpen,
}: RestaurantHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {restaurant.coverUrl ? (
        <Image source={{ uri: restaurant.coverUrl }} style={styles.cover} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="storefront-outline" size={40} color={colors.muted} />
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.name}>{restaurant.name}</Text>

        <Text style={styles.location}>
          {`${restaurant.city || ''}, ${restaurant.state || ''}`}
        </Text>

        <View style={styles.meta}>
          {!!restaurant.openingTime && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.muted} />
              <Text style={styles.metaText}>
                {`${formatTime(restaurant.openingTime)} – ${formatTime(restaurant.closingTime)}`}
              </Text>
            </View>
          )}
          {!!restaurant.rating && (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.metaText}>{`${restaurant.rating} (${restaurant.reviewCount ?? 0} reviews)`}</Text>
            </View>
          )}
        </View>

        <View style={[styles.statusRow, restaurant.isOpen ? styles.statusOpen : styles.statusClosed]}>
          <View style={styles.statusLeft}>
            <View style={[styles.dot, restaurant.isOpen ? styles.dotOpen : styles.dotClosed]} />
            <View>
              <Text style={[styles.statusLabel, { color: restaurant.isOpen ? colors.success : colors.error }]}>
                {restaurant.isOpen ? 'Open for orders' : 'Closed'}
              </Text>
              <Text style={styles.statusSub}>
                {restaurant.isOpen ? 'Customers can place orders now' : 'Toggle to start accepting orders'}
              </Text>
            </View>
          </View>
          <Switch
            value={!!restaurant.isOpen}
            onValueChange={() => onToggleOpen?.(restaurant)}
            trackColor={{ false: '#FCA5A5', true: '#86EFAC' }}
            thumbColor={restaurant.isOpen ? colors.success : colors.error}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cover: { width: '100%', height: 140, resizeMode: 'cover' },
  coverPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 16, gap: 4 },
  name: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy },
  location: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, marginBottom: 4 },
  meta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: '#6B7280' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  statusOpen: { backgroundColor: '#F0FDF4' },
  statusClosed: { backgroundColor: '#FFF1F2' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOpen: { backgroundColor: colors.success },
  dotClosed: { backgroundColor: colors.error },
  statusLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },
  statusSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 1 },
});
