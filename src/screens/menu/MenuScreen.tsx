import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, RefreshControl,
  SectionList, Modal, TextInput, Alert, StyleSheet, FlatList, ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MenuItemCard from '../../components/menu/MenuItemCard';
import { MenuItemSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { getMenuApi, deleteMenuItemApi, toggleMenuItemAvailabilityApi, addCategoryApi } from '../../api/menu.api';
import useRestaurantStore from '../../store/restaurant.store';
import useMerchantType from '../../hooks/useMerchantType';
import { colors } from '../../theme/colors';
import type { MenuItem, MenuCategory } from '../../types';

interface MenuSection {
  title: string;
  id: string;
  data: MenuItem[];
}

interface ProductGridItem {
  item: MenuItem;
  categoryName: string;
}

type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';

export default function MenuScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurants, activeRestaurant, setActiveRestaurant } = useRestaurantStore();
  const { Item, Items, Menu, item, items, menu, store, Store, isRestaurant } = useMerchantType();
  const [menuData, setMenuData] = useState<MenuSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [addingCategory, setAddingCategory] = useState<boolean>(false);
  const [showRestaurantPicker, setShowRestaurantPicker] = useState<boolean>(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedAvailabilityFilter, setSelectedAvailabilityFilter] = useState<AvailabilityFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const restaurantId = activeRestaurant?.id;

  const groupByCategory = (items: MenuItem[]): MenuSection[] => {
    const map: Record<string, MenuSection> = {};
    items.forEach((item) => {
      const cat = item.category?.name ?? 'Uncategorized';
      if (!map[cat]) map[cat] = { title: cat, id: item.categoryId ?? cat, data: [] };
      map[cat].data.push(item);
    });
    return Object.values(map);
  };

  const loadMenu = useCallback(async (): Promise<void> => {
    if (!restaurantId) return;
    try {
      const res = await getMenuApi(restaurantId);
      const data = res.data.data ?? res.data;

      if (Array.isArray(data)) {
        const grouped = groupByCategory(data as MenuItem[]);
        setMenuData(grouped);
      } else if ((data as { categories?: MenuCategory[] }).categories) {
        const typedData = data as { categories: MenuCategory[] };
        const sections: MenuSection[] = typedData.categories.map((cat) => ({
          title: cat.name,
          id: cat.id,
          data: cat.items ?? cat.menuItems ?? [],
        }));
        setMenuData(sections);
      } else if ((data as { products?: MenuItem[] }).products) {
        const grouped = groupByCategory((data as { products: MenuItem[] }).products);
        setMenuData(grouped);
      } else if ((data as { menuItems?: MenuItem[] }).menuItems) {
        const grouped = groupByCategory((data as { menuItems: MenuItem[] }).menuItems);
        setMenuData(grouped);
      } else if ((data as { items?: MenuItem[] }).items) {
        const grouped = groupByCategory((data as { items: MenuItem[] }).items);
        setMenuData(grouped);
      } else {
        setMenuData([]);
      }
    } catch {
      showToast({ type: 'error', message: `Failed to load ${menu}` });
    } finally {
      setIsLoading(false);
    }
  }, [menu, restaurantId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadMenu();
    }, [loadMenu])
  );

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await loadMenu();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean): Promise<void> => {
    try {
      await toggleMenuItemAvailabilityApi(restaurantId!, itemId, isAvailable);
      // availability updated inline
      setMenuData((prev) =>
        prev.map((section) => ({
          ...section,
          data: section.data.map((item) =>
            item.id === itemId ? { ...item, isAvailable } : item
          ),
        }))
      );
    } catch {
      showToast({ type: 'error', message: `Failed to update ${item} availability` });
    }
  };

  const handleDelete = (itemId: string): void => {
    Alert.alert(`Delete ${Item}`, `Are you sure you want to delete this ${item}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMenuItemApi(restaurantId!, itemId);
            setMenuData((prev) =>
              prev
                .map((section) => ({
                  ...section,
                  data: section.data.filter((i) => i.id !== itemId),
                }))
                .filter((section) => section.data.length > 0)
            );
            showToast({ type: 'success', message: `${Item} deleted` });
          } catch {
            showToast({ type: 'error', message: `Failed to delete ${item}` });
          }
        },
      },
    ]);
  };

  const handleAddCategory = async (): Promise<void> => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      await addCategoryApi(restaurantId!, newCategoryName.trim());
      setMenuData((prev) => [...prev, { title: newCategoryName.trim(), id: newCategoryName.trim(), data: [] }]);
      showToast({ type: 'success', message: 'Category added' });
      setNewCategoryName('');
      setShowCategoryModal(false);
    } catch {
      showToast({ type: 'error', message: 'Failed to add category' });
    } finally {
      setAddingCategory(false);
    }
  };

  const allItems = useMemo(() => menuData.flatMap((s) => s.data), [menuData]);
  const categoryFilters = useMemo(
    () => ['ALL', ...new Set(menuData.map((section) => section.title).filter(Boolean))],
    [menuData]
  );
  const availabilityFilters: { label: string; value: AvailabilityFilter }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Available', value: 'AVAILABLE' },
    { label: 'Unavailable', value: 'UNAVAILABLE' },
  ];
  const gridItems = useMemo<ProductGridItem[]>(
    () =>
      menuData.flatMap((section) =>
        section.data.map((menuItem) => ({
          item: menuItem,
          categoryName: menuItem.category?.name ?? section.title,
        }))
      ),
    [menuData]
  );
  const filteredGridItems = useMemo(
    () =>
      gridItems.filter(({ item: gridItem, categoryName }) => {
        const matchesCategory =
          selectedCategoryFilter === 'ALL' || categoryName === selectedCategoryFilter;
        const matchesAvailability =
          selectedAvailabilityFilter === 'ALL'
            ? true
            : selectedAvailabilityFilter === 'AVAILABLE'
              ? gridItem.isAvailable !== false
              : gridItem.isAvailable === false;
        const matchesSearch =
          !searchQuery || gridItem.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesAvailability && matchesSearch;
      }),
    [gridItems, selectedCategoryFilter, selectedAvailabilityFilter, searchQuery]
  );

  const filteredSections = useMemo(
    () =>
      !searchQuery
        ? menuData
        : menuData
          .map((section) => ({
            ...section,
            data: section.data.filter((i) =>
              i.name.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter((section) => section.data.length > 0),
    [menuData, searchQuery]
  );

  useEffect(() => {
    if (selectedCategoryFilter !== 'ALL' && !categoryFilters.includes(selectedCategoryFilter)) {
      setSelectedCategoryFilter('ALL');
    }
  }, [categoryFilters, selectedCategoryFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isRestaurant ? 'Menu' : Items}</Text>
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
          <Text style={styles.addBtnText}>Add {Item}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${items}...`}
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {activeRestaurant && !activeRestaurant.isApproved && (
        <View style={styles.approvalBanner}>
          <Ionicons name="time-outline" size={18} color="#92400E" />
          <View style={styles.approvalBannerText}>
            <Text style={styles.approvalBannerTitle}>{Menu} not visible to customers yet</Text>
            <Text style={styles.approvalBannerBody}>
              Your {menu} will not show on the app until your {store} has been approved. We&apos;ll notify you once it is approved — it takes just 2–5 business days.
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
          icon={isRestaurant ? 'restaurant-outline' : 'cube-outline'}
          title={isRestaurant ? 'Your menu is empty' : `No ${items} yet`}
          subtitle={`Add your first ${item} to start receiving orders.`}
          actionLabel={`Add ${Item}`}
          onAction={() => router.push('/(main)/menu/add')}
        />
      ) : !isRestaurant ? (
        <>
          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
              >
                {categoryFilters.map((category) => {
                  const isActive = selectedCategoryFilter === category;
                  const label = category === 'ALL' ? 'All' : category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => setSelectedCategoryFilter(category)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterTitle}>Availability</Text>
              <View style={styles.chipsRow}>
                {availabilityFilters.map((filter) => {
                  const isActive = selectedAvailabilityFilter === filter.value;
                  return (
                    <TouchableOpacity
                      key={filter.value}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => setSelectedAvailabilityFilter(filter.value)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{filter.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {filteredGridItems.length === 0 ? (
            <View style={styles.emptyFilterState}>
              <Ionicons name="funnel-outline" size={26} color={colors.muted} />
              <Text style={styles.emptyFilterTitle}>No products match these filters</Text>
              <Text style={styles.emptyFilterHint}>Try a different category or availability option.</Text>
            </View>
          ) : (
            <FlatList<ProductGridItem>
              data={filteredGridItems}
              keyExtractor={({ item: gridItem }) => gridItem.id}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              renderItem={({ item: gridItem }) => (
                <MenuItemCard
                  item={gridItem.item}
                  categoryName={gridItem.categoryName}
                  variant="grid"
                  onEdit={(menuItem) => router.push(`/(main)/menu/edit/${menuItem.id}`)}
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
        </>
      ) : (
        <SectionList<MenuItem, MenuSection>
          sections={filteredSections}
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
                <Text style={styles.sectionAddText}>Add {Item}</Text>
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item }) => (
            <MenuItemCard
              item={item}
              onEdit={(menuItem) => router.push(`/(main)/menu/edit/${menuItem.id}`)}
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
            <Text style={styles.modalTitle}>Select {Store}</Text>
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
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  filterGroup: { gap: 8 },
  filterTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: colors.navy },
  chipsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.success,
  },
  chipText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.navy },
  chipTextActive: { color: '#065F46' },
  gridContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  gridRow: { justifyContent: 'space-between' },
  emptyFilterState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 6,
  },
  emptyFilterTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: colors.navy },
  emptyFilterHint: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, textAlign: 'center' },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.navy,
    paddingVertical: 0,
  },
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
