import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, Switch, StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { addMenuItemApi, getCategoriesApi } from '../../api/menu.api';
import { uploadMenuItemImage } from '../../api/upload.api';
import useRestaurantStore from '../../store/restaurant.store';
import useMerchantType from '../../hooks/useMerchantType';
import { colors } from '../../theme/colors';
import { formatPriceInput, parsePriceInput } from '../../utils/formatters';
import type { MenuCategory } from '../../types';

interface AddMenuItemFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  stockQuantity: string;
  requiresPrescription: boolean;
}

export default function AddMenuItemScreen(): React.JSX.Element {
  const { categoryId, categoryName } = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeRestaurant } = useRestaurantStore();
  const { Item, item, Menu, merchantType } = useMerchantType();
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);

  const restaurantId = activeRestaurant?.id ?? '';

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<AddMenuItemFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      categoryId: categoryId ?? '',
      categoryName: categoryName ?? '',
      isAvailable: true,
      stockQuantity: '',
      requiresPrescription: false,
    },
  });

  const needsStock = merchantType === 'PHARMACY' || merchantType === 'SUPERMARKET';
  const isPharmacy = merchantType === 'PHARMACY';
  const isSupermarket = merchantType === 'SUPERMARKET';
  const namePlaceholder = isPharmacy
    ? 'e.g. Amoxicillin 500mg Capsules'
    : isSupermarket
      ? 'e.g. Golden Penny Spaghetti 500g'
      : 'e.g. Jollof Rice + Chicken';
  const descriptionPlaceholder = isPharmacy
    ? 'e.g. 500mg capsules, 10 per blister pack...'
    : isSupermarket
      ? 'e.g. Whole grain cereal, 500g family pack...'
      : 'Party jollof with smoky base...';
  const stockPlaceholder = isPharmacy ? 'e.g. 48' : 'e.g. 100';

  const selectedCategoryName = watch('categoryName');

  useEffect(() => {
    const loadCategories = async (): Promise<void> => {
      try {
        const res = await getCategoriesApi(restaurantId);
        setCategories(res.data.data?.categories ?? []);
      } catch {
        // ignore
      }
    };
    if (restaurantId) loadCategories();
  }, [restaurantId]);

  const pickImage = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Photo library access required' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: AddMenuItemFormData): Promise<void> => {
    setLoading(true);
    try {
      if (!data.categoryId) {
        showToast({ type: 'error', message: 'Please select a category' });
        setLoading(false);
        return;
      }

      const price = parsePriceInput(data.price);
      if (!price || price <= 0) {
        showToast({ type: 'error', message: 'Please enter a valid price' });
        setLoading(false);
        return;
      }

      const stockQty = data.stockQuantity ? parseInt(data.stockQuantity, 10) : undefined;
      if (needsStock && (!stockQty || stockQty < 0)) {
        showToast({ type: 'error', message: 'Stock quantity is required' });
        setLoading(false);
        return;
      }

      const res = await addMenuItemApi(restaurantId, {
        name: data.name,
        description: data.description,
        price,
        categoryId: data.categoryId || undefined,
        isAvailable: data.isAvailable,
        ...(needsStock && { stockQuantity: stockQty }),
        ...(isPharmacy && { requiresPrescription: data.requiresPrescription }),
      });

      const newItem =
        res.data.data?.menuItem ??
        (res.data.data as unknown as { product?: { id: string } })?.product ??
        (res.data.data as unknown as { id?: string });

      if (imageUri && newItem?.id) {
        try {
          await uploadMenuItemImage(restaurantId, newItem.id, imageUri);
        } catch {
          showToast({ type: 'warning', message: 'Item added but image upload failed' });
          router.back();
          return;
        }
      }

      showToast({ type: 'success', message: `${Item} added!` });
      router.back();
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : `Failed to add ${item}`;
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add {Item}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Category picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Category <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={[styles.pickerText, !selectedCategoryName && { color: colors.muted }]}>
              {selectedCategoryName || 'Select a category'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {showCategoryPicker && (
          <View style={styles.dropdown}>
            {categories.length === 0 ? (
              <View style={styles.emptyCategories}>
                <Text style={styles.emptyCategoriesText}>No categories yet. Add one from the {Menu.toLowerCase()} page.</Text>
              </View>
            ) : (
              categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setValue('categoryId', c.id);
                    setValue('categoryName', c.name);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{c.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Image picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.itemImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={colors.muted} />
              <Text style={styles.imageText}>Add {Item} Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Item name is required' }}
          render={({ field: { onChange, value } }) => (
            <Input
              label={`${Item} Name`}
              placeholder={namePlaceholder}
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description (optional)"
              placeholder={descriptionPlaceholder}
              multiline
              numberOfLines={2}
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="price"
          rules={{ required: 'Price is required' }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Price (₦)"
              placeholder="2,500"
              keyboardType="numeric"
              value={value}
              onChangeText={(text) => onChange(formatPriceInput(text))}
              error={errors.price?.message}
              rightIcon={<Text style={styles.naira}>₦</Text>}
            />
          )}
        />

        {needsStock && (
          <Controller
            control={control}
            name="stockQuantity"
            rules={{ required: 'Stock quantity is required' }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Stock Quantity"
                placeholder={stockPlaceholder}
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                error={errors.stockQuantity?.message}
              />
            )}
          />
        )}

        {isPharmacy && (
          <Controller
            control={control}
            name="requiresPrescription"
            render={({ field: { onChange, value } }) => (
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>Requires Prescription</Text>
                  <Text style={styles.toggleHint}>Customer must upload a valid prescription</Text>
                </View>
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                  thumbColor={value ? colors.success : colors.muted}
                />
              </View>
            )}
          />
        )}

        <Button
          label={`Add ${Item}`}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Sora_700Bold', fontSize: 17, color: colors.navy },
  content: { padding: 20, paddingBottom: 40 },
  imagePicker: { alignSelf: 'center', marginBottom: 24 },
  itemImage: { width: 140, height: 140, borderRadius: 16, resizeMode: 'cover' },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 16,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  naira: { fontFamily: 'Sora_700Bold', fontSize: 16, color: colors.muted },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#374151', marginBottom: 6 },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pickerText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.navy },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  dropdownText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.navy },
  emptyCategories: { padding: 16 },
  emptyCategoriesText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center' },
  submitBtn: { marginTop: 12 },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  toggleLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy },
  toggleHint: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
});
