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
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { showToast } from '../../components/common/Toast';
import { getMenuApi, updateMenuItemApi } from '../../api/menu.api';
import { uploadMenuItemImage } from '../../api/upload.api';
import useRestaurantStore from '../../store/restaurant.store';
import { colors } from '../../theme/colors';
import { formatPriceInput, parsePriceInput } from '../../utils/formatters';
import type { MenuCategory, MenuItem } from '../../types';

interface EditMenuItemFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
}

export default function EditMenuItemScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeRestaurant } = useRestaurantStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(true);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState<boolean>(false);

  const restaurantId = activeRestaurant?.id ?? '';

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditMenuItemFormData>({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      categoryId: '',
      categoryName: '',
      isAvailable: true,
    },
  });

  const selectedCategoryName = watch('categoryName');
  const isAvailable = watch('isAvailable');

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const res = await getMenuApi(restaurantId);
        const data = res.data.data;

        let item: MenuItem | null = null;
        if (Array.isArray(data)) {
          item = (data as MenuItem[]).find((i) => i.id === id) ?? null;
        } else if (data && (data as { categories?: MenuCategory[] }).categories) {
          const typedData = data as { categories: MenuCategory[] };
          setCategories(typedData.categories);
          typedData.categories.forEach((cat) => {
            const found = (cat.items ?? cat.menuItems ?? []).find((i) => i.id === id);
            if (found) item = found;
          });
        }

        if (item) {
          reset({
            name: item.name ?? '',
            description: item.description ?? '',
            price: item.price ? formatPriceInput(String(item.price)) : '',
            categoryId: item.categoryId ?? item.category?.id ?? '',
            categoryName: item.category?.name ?? '',
            isAvailable: item.isAvailable !== false,
          });
          if (item.imageUrl) setImageUri(item.imageUrl);
        }
      } catch {
        showToast({ type: 'error', message: 'Failed to load item' });
      } finally {
        setFetchLoading(false);
      }
    };
    if (restaurantId) loadData();
  }, [restaurantId, id, reset]);

  const pickImage = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setImageUploading(true);
      try {
        const updated = await uploadMenuItemImage(restaurantId, id, uri);
        if (updated?.imageUrl) setImageUri(updated.imageUrl);
        showToast({ type: 'success', message: 'Image uploaded successfully' });
      } catch {
        showToast({ type: 'error', message: 'Image upload failed' });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const onSubmit = async (data: EditMenuItemFormData): Promise<void> => {
    setLoading(true);
    try {
      const price = parsePriceInput(data.price);
      await updateMenuItemApi(restaurantId, id, {
        name: data.name,
        description: data.description,
        price,
        categoryId: data.categoryId || undefined,
        isAvailable: data.isAvailable,
      });
      showToast({ type: 'success', message: 'Item updated!' });
      router.back();
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to update item';
      showToast({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <LoadingSpinner full />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={styles.itemImage} />
              {imageUploading && (
                <View style={styles.uploadOverlay}>
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={32} color={colors.muted} />
              <Text style={styles.imageText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, value } }) => (
            <Input label="Item Name" value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input label="Description" multiline numberOfLines={2} value={value} onChangeText={onChange} />
          )}
        />

        <Controller
          control={control}
          name="price"
          rules={{ required: 'Price is required' }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Price (₦)"
              keyboardType="numeric"
              value={value}
              onChangeText={(text) => onChange(formatPriceInput(text))}
              error={errors.price?.message}
            />
          )}
        />

        {categories.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
              <Text style={[styles.pickerText, !selectedCategoryName && { color: colors.muted }]}>
                {selectedCategoryName || 'Select category'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {showCategoryPicker && (
          <View style={styles.dropdown}>
            {categories.map((c) => (
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
            ))}
          </View>
        )}

        {/* Availability toggle */}
        <View style={styles.availabilityRow}>
          <View>
            <Text style={styles.availabilityTitle}>Available</Text>
            <Text style={styles.availabilitySubtitle}>
              {isAvailable ? 'Customers can order this item' : 'Item is hidden from customers'}
            </Text>
          </View>
          <Controller
            control={control}
            name="isAvailable"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                thumbColor={value ? colors.success : colors.muted}
              />
            )}
          />
        </View>

        <Button
          label="Save Changes"
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
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: { color: '#fff', fontFamily: 'DMSans_500Medium', fontSize: 13 },
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
  dropdownItem: { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  dropdownText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.navy },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  availabilityTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: colors.navy },
  availabilitySubtitle: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  submitBtn: { marginTop: 8 },
});
