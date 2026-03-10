import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RestaurantHeader from '../../components/restaurant/RestaurantHeader';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { showToast } from '../../components/common/Toast';
import useRestaurantStore from '../../store/restaurant.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

export default function RestaurantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurants, isLoading, fetchRestaurants, toggleOpen } = useRestaurantStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRestaurants();
    setRefreshing(false);
  };

  const handleToggleOpen = async (restaurant) => {
    try {
      await toggleOpen(restaurant.id, !restaurant.isOpen);
    } catch {
      showToast({ type: 'error', message: 'Failed to update restaurant status' });
    }
  };

  if (isLoading && !refreshing) return <LoadingSpinner full />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Restaurants</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {restaurants.length === 0 ? (
          <EmptyState
            icon="🏪"
            title="No restaurants yet"
            subtitle="Add your first restaurant to start receiving orders from customers."
            actionLabel="Add Restaurant"
            onAction={() => router.push('/(main)/restaurant/create')}
          />
        ) : (
          <>
            {restaurants.map((item) => (
              <View key={item.id} style={styles.restaurantItem}>
              {!item.isApproved && (
                <View style={styles.pendingBanner}>
                  <Ionicons name="time-outline" size={15} color={colors.warning} />
                  <Text style={styles.pendingText}>
                    {'⏳ Pending admin approval. Your restaurant will go live once approved.'}
                  </Text>
                </View>
              )}

              {item.isApproved && !item.isOpen && (
                <View style={styles.infoBanner}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
                  <Text style={styles.infoText}>Your restaurant is currently closed.</Text>
                </View>
              )}

              <RestaurantHeader
                restaurant={item}
                onToggleOpen={handleToggleOpen}
              />

              <View style={styles.restaurantActions}>
                <Button
                  label="Edit Restaurant"
                  variant="outline"
                  size="sm"
                  onPress={() => router.push(`/(main)/restaurant/edit/${item.id}`)}
                  style={styles.actionBtn}
                />
                <Button
                  label="Manage Menu →"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/(main)/menu')}
                  style={styles.actionBtn}
                />
              </View>
            </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, shadows.lg]}
        onPress={() => router.push('/(main)/restaurant/create')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 22, color: colors.navy },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  restaurantItem: { marginBottom: 20 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pendingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.warning,
    flex: 1,
    lineHeight: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  infoText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, flex: 1 },
  restaurantActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionBtn: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
