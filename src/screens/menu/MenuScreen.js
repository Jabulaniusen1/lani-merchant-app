import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  SectionList, Modal, TextInput, Alert, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MenuItemCard from '../../components/menu/MenuItemCard';
import { MenuItemSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { getMenuApi, deleteMenuItemApi, toggleMenuItemAvailabilityApi, addCategoryApi } from '../../api/menu.api';
import useRestaurantStore from '../../store/restaurant.store';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurantStore();
  const [menuData, setMenuData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [showRestaurantPicker, setShowRestaurantPicker] = useState(false);

  const restaurantId = activeRestaurant?.id;

  const loadMenu = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await getMenuApi(restaurantId);

      const data = res.data.data ?? res.data;

      if (Array.isArray(data)) {
        const grouped = groupByCategory(data);
        setMenuData(grouped);
        setCategories([...new Set(data.map((i) => i.category?.name || 'Uncategorized').filter(Boolean))]);
      } else if (data?.categories) {
        const sections = data.categories.map((cat) => ({
          title: cat.name,
          id: cat.id,
          data: cat.items || cat.menuItems || [],
        }));
        setMenuData(sections);
        setCategories(data.categories);
      } else if (data?.menuItems) {
        const grouped = groupByCategory(data.menuItems);
        setMenuData(grouped);
      } else if (data?.items) {
        const grouped = groupByCategory(data.items);
        setMenuData(grouped);
      } else {
        setMenuData([]);
      }
    } catch {
      showToast({ type: 'error', message: 'Failed to load menu' });
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  const groupByCategory = (items) => {
    const map = {};
    items.forEach((item) => {
      const cat = item.category?.name || 'Uncategorized';
      if (!map[cat]) map[cat] = { title: cat, id: item.categoryId || cat, data: [] };
      map[cat].data.push(item);
    });
    return Object.values(map);
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadMenu();
    }, [loadMenu])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (itemId, isAvailable) => {
    try {
      await toggleMenuItemAvailabilityApi(restaurantId, itemId, isAvailable);
      setMenuData((prev) =>
        prev.map((section) => ({
          ...section,
          data: section.data.map((item) =>
            item.id === itemId ? { ...item, isAvailable } : item
          ),
        }))
      );
    } catch {
      showToast({ type: 'error', message: 'Failed to update item availability' });
    }
  };

  const handleDelete = (itemId) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this menu item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMenuItemApi(restaurantId, itemId);
            setMenuData((prev) =>
              prev.map((section) => ({
                ...section,
                data: section.data.filter((item) => item.id !== itemId),
              })).filter((section) => section.data.length > 0)
            );
            showToast({ type: 'success', message: 'Item deleted' });
          } catch {
            showToast({ type: 'error', message: 'Failed to delete item' });
          }
        },
      },
    ]);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      await addCategoryApi(restaurantId, newCategoryName.trim());
      setMenuData((prev) => [...prev, { title: newCategoryName.trim(), data: [] }]);
      showToast({ type: 'success', message: 'Category added' });
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch {
      showToast({ type: 'error', message: 'Failed to add category' });
    } finally {
      setAddingCategory(false);
    }
  };

  const allItems = menuData.flatMap((s) => s.data);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Menu</Text>
          {activeRestaurant && (
            <TouchableOpacity
              onPress={() => restaurants.length > 1 && setShowRestaurantPicker(true)}
              style={styles.restaurantSelector}
            >
              <Text style={styles.restaurantName}>{activeRestaurant.name}</Text>
              {restaurants.length > 1 && (
                <Ionicons name="chevron-down" size={14} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(main)/menu/add')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {activeRestaurant && !activeRestaurant.isApproved && (
        <View style={styles.approvalBanner}>
          <Ionicons name="time-outline" size={18} color="#92400E" />
          <View style={styles.approvalBannerText}>
            <Text style={styles.approvalBannerTitle}>Menu not visible to customers yet</Text>
            <Text style={styles.approvalBannerBody}>
              Your menu list will not show on the app until your restaurant has been approved. We'll notify you once it is approved — it takes just 2–5 business days.
            </Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.content}>
          {[1, 2, 3].map((i) => <MenuItemSkeleton key={i} />)}
        </View>
      ) : allItems.length === 0 && menuData.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="Your menu is empty"
          subtitle="Add your first item to start receiving orders."
          actionLabel="Add Menu Item"
          onAction={() => router.push('/(main)/menu/add')}
        />
      ) : (
        <SectionList
          sections={menuData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <TouchableOpacity
                onPress={() => router.push({
                  pathname: '/(main)/menu/add',
                  params: { categoryId: section.id, categoryName: section.title },
                })}
                style={styles.sectionAddBtn}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.sectionAddText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item }) => (
            <MenuItemCard
              item={item}
              onEdit={(item) => router.push(`/(main)/menu/edit/${item.id}`)}
              onToggleAvailability={handleToggleAvailability}
              onDelete={handleDelete}
            />
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addCategoryBtn}
              onPress={() => setShowCategoryModal(true)}
            >
              <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
              <Text style={styles.addCategoryText}>Add Category</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Rice Dishes, Drinks, Sides..."
              placeholderTextColor={colors.muted}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            <Button
              label="Add Category"
              onPress={handleAddCategory}
              loading={addingCategory}
              fullWidth
              style={{ marginTop: 8 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Restaurant picker modal */}
      <Modal
        visible={showRestaurantPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRestaurantPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRestaurantPicker(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Restaurant</Text>
            {restaurants.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.restaurantOption, activeRestaurant?.id === r.id && styles.restaurantOptionActive]}
                onPress={() => {
                  setActiveRestaurant(r);
                  setShowRestaurantPicker(false);
                }}
              >
                <Text style={[styles.restaurantOptionText, activeRestaurant?.id === r.id && { color: colors.primary }]}>
                  {r.name}
                </Text>
                {activeRestaurant?.id === r.id && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 22, color: colors.navy },
  restaurantSelector: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  restaurantName: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.primary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: '#fff' },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 14, color: colors.navy },
  sectionAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionAddText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.primary },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addCategoryText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.primary },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  approvalBannerText: { flex: 1 },
  approvalBannerTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#92400E',
    marginBottom: 3,
  },
  approvalBannerBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, marginBottom: 16 },
  modalInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.navy,
    marginBottom: 8,
  },
  restaurantOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  restaurantOptionActive: {},
  restaurantOptionText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.navy },
});
