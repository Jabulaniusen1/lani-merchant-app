import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import TimePicker from '../../components/common/TimePicker';
import { showToast } from '../../components/common/Toast';
import useRestaurantStore from '../../store/restaurant.store';
import { colors } from '../../theme/colors';
import { NIGERIAN_CITIES, type NigerianCity } from '../../utils/constants';
import { Ionicons } from '@expo/vector-icons';
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

interface CreateRestaurantFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  openingTime: string;
  closingTime: string;
}

interface CreateRestaurantScreenProps {
  isFirstTime?: boolean;
}

const MERCHANT_LABELS: Record<string, { noun: string; heading: string; subheading: string }> = {
  PHARMACY: {
    noun: 'Pharmacy',
    heading: 'Set Up Your Pharmacy',
    subheading: 'One more step — add your pharmacy details to start fulfilling orders.',
  },
  SUPERMARKET: {
    noun: 'Supermarket',
    heading: 'Set Up Your Supermarket',
    subheading: 'One more step — add your supermarket details to start fulfilling orders.',
  },
  RESTAURANT: {
    noun: 'Restaurant',
    heading: 'Set Up Your Restaurant',
    subheading: 'One more step — set up your first restaurant to start receiving orders.',
  },
};

export default function CreateRestaurantScreen({ isFirstTime = true }: CreateRestaurantScreenProps): React.JSX.Element {
  const router = useRouter();
  const { merchantType } = useLocalSearchParams<{ merchantType: string }>();
  const labels = MERCHANT_LABELS[merchantType ?? 'RESTAURANT'] ?? MERCHANT_LABELS.RESTAURANT;
  const { createRestaurant } = useRestaurantStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [restaurantType, setRestaurantType] = useState<RestaurantType | null>(null);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateRestaurantFormData>({
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

  const selectCity = (cityObj: NigerianCity): void => {
    setValue('city', cityObj.value);
    setValue('state', cityObj.state);
    setShowCityPicker(false);
  };

  const onSubmit = async (data: CreateRestaurantFormData): Promise<void> => {
    setLoading(true);
    try {
      await createRestaurant({ ...data, ...(restaurantType ? { restaurantType } : {}) });
      showToast({ type: 'success', message: `${labels.noun} created! Pending admin approval.` });
      router.replace('/(main)/orders');
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to create restaurant';
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
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>
          {isFirstTime ? labels.heading : `Add ${labels.noun}`}
        </Text>
        <Text style={styles.subheading}>
          {isFirstTime
            ? labels.subheading
            : `Add another ${labels.noun.toLowerCase()} to your account.`}
        </Text>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={colors.blue} />
          <Text style={styles.infoText}>
            Your restaurant will be reviewed by our team before going live.
          </Text>
        </View>

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Restaurant name is required' }}
          render={({ field: { onChange, value } }) => (
            <Input
              label={`${labels.noun} Name`}
              placeholder={`e.g. Mama Emeka ${labels.noun}`}
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
            <View>
              <Input
                label="Description (optional)"
                placeholder="Tell customers what makes your restaurant special..."
                multiline
                numberOfLines={3}
                value={value}
                onChangeText={onChange}
                error={errors.description?.message}
              />
              <Text style={styles.charCount}>{(value || '').length}/200</Text>
            </View>
          )}
        />

        <Controller
          control={control}
          name="address"
          rules={{ required: 'Address is required' }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Street Address"
              placeholder="15 Admiralty Way, Lekki"
              value={value}
              onChangeText={onChange}
              error={errors.address?.message}
            />
          )}
        />

        {/* City picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>City</Text>
          <TouchableOpacity
            style={[styles.picker, errors.city && styles.pickerError]}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Text style={[styles.pickerText, !selectedCity && { color: colors.muted }]}>
              {selectedCity || 'Select city'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          </TouchableOpacity>
          {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}
        </View>

        {showCityPicker && (
          <View style={styles.dropdown}>
            {NIGERIAN_CITIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={styles.dropdownItem}
                onPress={() => selectCity(c)}
              >
                <Text style={[styles.dropdownText, selectedCity === c.value && { color: colors.primary, fontFamily: 'DMSans_600SemiBold' }]}>
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
            <Input
              label="State"
              placeholder="Auto-filled from city"
              value={value}
              editable={false}
            />
          )}
        />

        {/* Restaurant Type — only for restaurants */}
        {(!merchantType || merchantType === 'RESTAURANT') && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Restaurant Type <Text style={{ color: colors.muted, fontFamily: 'DMSans_400Regular' }}>(optional)</Text></Text>
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
        )}

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="openingTime"
              rules={{ required: 'Required' }}
              render={({ field: { onChange, value } }) => (
                <TimePicker label="Opening Time" value={value} onChange={onChange} error={errors.openingTime?.message} />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="closingTime"
              rules={{ required: 'Required' }}
              render={({ field: { onChange, value } }) => (
                <TimePicker label="Closing Time" value={value} onChange={onChange} error={errors.closingTime?.message} />
              )}
            />
          </View>
        </View>

        <Button
          label={loading ? '' : `Create ${labels.noun}`}
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
  content: { padding: 24, paddingTop: 60, flexGrow: 1 },
  heading: { fontFamily: 'Sora_700Bold', fontSize: 26, color: colors.navy, marginBottom: 6 },
  subheading: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginBottom: 20, lineHeight: 22 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 20,
  },
  infoText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.blue, flex: 1, lineHeight: 20 },
  charCount: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: -12, marginBottom: 16 },
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
  pickerError: { borderColor: colors.error },
  pickerText: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.navy },
  errorText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 2 },
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
  submitBtn: { marginTop: 8, marginBottom: 32 },
  typePills: { gap: 8, paddingBottom: 4 },
  typePill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.lightGray, borderWidth: 1.5, borderColor: 'transparent',
  },
  typePillActive: { backgroundColor: '#FFF3E8', borderColor: colors.primary },
  typePillText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted },
  typePillTextActive: { color: colors.primary },
});
