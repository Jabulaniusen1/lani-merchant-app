import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import TimePicker from '../../components/common/TimePicker';
import { showToast } from '../../components/common/Toast';
import useRestaurantStore from '../../store/restaurant.store';
import { uploadRestaurantLogo, uploadRestaurantCover } from '../../api/upload.api';
import { colors } from '../../theme/colors';
import { NIGERIAN_CITIES, type NigerianCity } from '../../utils/constants';
import type { RestaurantType } from '../../types';

const RESTAURANT_TYPES: { label: string; value: RestaurantType }[] = [
  { label: 'Fast Food', value: 'FAST_FOOD' },
  { label: 'Local', value: 'LOCAL' },
  { label: 'Continental', value: 'CONTINENTAL' },
  { label: 'Pizza', value: 'PIZZA' },
  { label: 'Grill', value: 'GRILL' },
  { label: 'Bakery', value: 'BAKERY' },
  { label: 'Cafe', value: 'CAFE' },
  { label: 'Chinese', value: 'CHINESE' },
  { label: 'Seafood', value: 'SEAFOOD' },
  { label: 'Vegetarian', value: 'VEGETARIAN' },
];

interface EditRestaurantFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  openingTime: string;
  closingTime: string;
}

export default function EditRestaurantScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { restaurants, updateRestaurant } = useRestaurantStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [restaurantType, setRestaurantType] = useState<RestaurantType | null>(null);
  const [logoUploadLoading, setLogoUploadLoading] = useState<boolean>(false);
  const [coverUploadLoading, setCoverUploadLoading] = useState<boolean>(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);

  const restaurant = restaurants.find((r) => r.id === id);

  const { control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<EditRestaurantFormData>({
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      openingTime: '08:00',
      closingTime: '22:00',
    },
  });

  const selectedCity = watch('city');

  useEffect(() => {
    if (restaurant) {
      reset({
        name: restaurant.name ?? '',
        description: restaurant.description ?? '',
        address: restaurant.address ?? '',
        city: restaurant.city ?? '',
        state: restaurant.state ?? '',
        openingTime: restaurant.openingTime ?? '08:00',
        closingTime: restaurant.closingTime ?? '22:00',
      });
      if (restaurant.logoUrl) setLogoUri(restaurant.logoUrl);
      if (restaurant.coverUrl) setCoverUri(restaurant.coverUrl);
      if (restaurant.restaurantType) setRestaurantType(restaurant.restaurantType);
    }
  }, [restaurant, reset]);

  const pickImage = async (type: 'logo' | 'cover'): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Photo library access required' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      try {
        if (type === 'logo') {
          setLogoUploadLoading(true);
          setLogoUri(uri);
          const updated = await uploadRestaurantLogo(id, uri);
          if (updated?.logoUrl) setLogoUri(updated.logoUrl);
        } else {
          setCoverUploadLoading(true);
          setCoverUri(uri);
          const updated = await uploadRestaurantCover(id, uri);
          if (updated?.coverUrl) setCoverUri(updated.coverUrl);
        }
        showToast({ type: 'success', message: 'Image uploaded successfully' });
      } catch {
        showToast({ type: 'error', message: 'Image upload failed' });
      } finally {
        setLogoUploadLoading(false);
        setCoverUploadLoading(false);
      }
    }
  };

  const selectCity = (cityObj: NigerianCity): void => {
    setValue('city', cityObj.value);
    setValue('state', cityObj.state);
    setShowCityPicker(false);
  };

  const onSubmit = async (data: EditRestaurantFormData): Promise<void> => {
    setLoading(true);
    try {
      await updateRestaurant(id, { ...data, ...(restaurantType ? { restaurantType } : {}) });
      showToast({ type: 'success', message: 'Restaurant updated successfully' });
      router.back();
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to update restaurant';
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Restaurant</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo */}
        <Text style={styles.sectionLabel}>Cover Photo</Text>
        <TouchableOpacity
          style={styles.coverPicker}
          onPress={() => pickImage('cover')}
        >
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={32} color={colors.muted} />
              <Text style={styles.uploadText}>Tap to upload cover photo</Text>
            </View>
          )}
          {coverUploadLoading && (
            <View style={styles.uploadOverlay}>
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Logo */}
        <Text style={styles.sectionLabel}>Restaurant Logo</Text>
        <TouchableOpacity style={styles.logoPicker} onPress={() => pickImage('logo')}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="storefront-outline" size={24} color={colors.muted} />
            </View>
          )}
          <Text style={styles.logoUploadText}>
            {logoUploadLoading ? 'Uploading...' : 'Change Logo'}
          </Text>
        </TouchableOpacity>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Restaurant name is required' }}
          render={({ field: { onChange, value } }) => (
            <Input label="Restaurant Name" value={value} onChangeText={onChange} error={errors.name?.message} />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description"
              multiline
              numberOfLines={3}
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          rules={{ required: 'Address is required' }}
          render={({ field: { onChange, value } }) => (
            <Input label="Street Address" value={value} onChangeText={onChange} error={errors.address?.message} />
          )}
        />

        {/* City picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>City</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Text style={[styles.pickerText, !selectedCity && { color: colors.muted }]}>
              {selectedCity || 'Select city'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {showCityPicker && (
          <View style={styles.dropdown}>
            {NIGERIAN_CITIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={styles.dropdownItem}
                onPress={() => selectCity(c)}
              >
                <Text style={[styles.dropdownText, selectedCity === c.value && { color: colors.primary }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Controller
          control={control}
          name="state"
          render={({ field: { value } }) => (
            <Input label="State" value={value} editable={false} />
          )}
        />

        {/* Restaurant Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Restaurant Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typePills}>
            {RESTAURANT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typePill, restaurantType === t.value && styles.typePillActive]}
                onPress={() => setRestaurantType(restaurantType === t.value ? null : t.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typePillText, restaurantType === t.value && styles.typePillTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="openingTime"
              render={({ field: { onChange, value } }) => (
                <TimePicker label="Opening Time" value={value} onChange={onChange} />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="closingTime"
              render={({ field: { onChange, value } }) => (
                <TimePicker label="Closing Time" value={value} onChange={onChange} />
              )}
            />
          </View>
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
  sectionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  coverPicker: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.lightGray,
    marginBottom: 20,
  },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: { color: '#fff', fontFamily: 'DMSans_500Medium', fontSize: 14 },
  logoPicker: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  logoImage: { width: 64, height: 64, borderRadius: 12, resizeMode: 'cover' },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoUploadText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.primary },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: '#374151', marginBottom: 6 },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
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
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  submitBtn: { marginTop: 8 },
  typePills: { gap: 8, paddingBottom: 4 },
  typePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.lightGray, borderWidth: 1.5, borderColor: 'transparent',
  },
  typePillActive: { backgroundColor: '#FFF3E8', borderColor: colors.primary },
  typePillText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted },
  typePillTextActive: { color: colors.primary },
});
