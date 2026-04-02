import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import useAuthStore from '../../store/auth.store';
import { colors } from '../../theme/colors';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface PasswordStrengthResult {
  level: number;
  label: string;
  color: string;
  width: string;
}

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps): React.JSX.Element | null {
  const getStrength = (pwd: string): PasswordStrengthResult => {
    if (!pwd) return { level: 0, label: '', color: 'transparent', width: '0%' };
    if (pwd.length < 6) return { level: 1, label: 'Weak', color: colors.error, width: '25%' };
    if (pwd.length >= 6 && !/\d/.test(pwd)) return { level: 2, label: 'Fair', color: colors.warning, width: '50%' };
    if (pwd.length >= 8 && /\d/.test(pwd) && !/[^a-zA-Z0-9]/.test(pwd)) return { level: 3, label: 'Good', color: colors.primary, width: '75%' };
    if (pwd.length >= 8 && /\d/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) return { level: 4, label: 'Strong', color: colors.success, width: '100%' };
    return { level: 2, label: 'Fair', color: colors.warning, width: '50%' };
  };

  const { label, color, width } = getStrength(password);

  if (!password) return null;

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBar}>
        <View style={[styles.strengthFill, { width: width as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function RegisterScreen(): React.JSX.Element {
  const router = useRouter();
  const { merchantType } = useLocalSearchParams<{ merchantType: string }>();
  const { register } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');
  const [isBusinessRegistered, setIsBusinessRegistered] = useState<boolean>(false);
  const [cacDocumentUri, setCacDocumentUri] = useState<string | null>(null);
  const [cacDocumentName, setCacDocumentName] = useState<string | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const pickCacDocument = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast({ type: 'error', message: 'Permission required to pick a photo' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setCacDocumentUri(result.assets[0].uri);
      const filename = result.assets[0].uri.split('/').pop() ?? 'cac-document.jpg';
      setCacDocumentName(filename);
    }
  };

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setApiError('');
    if (isBusinessRegistered && !cacDocumentUri) {
      setApiError('Please upload your CAC registration document');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword: _, ...registerData } = data;
      await register({
        ...registerData,
        email: data.email.toLowerCase(),
        merchantType: (merchantType as 'RESTAURANT' | 'PHARMACY' | 'SUPERMARKET') ?? 'RESTAURANT',
        isBusinessRegistered,
        cacDocumentUri: isBusinessRegistered ? (cacDocumentUri ?? undefined) : undefined,
      });
      router.replace({ pathname: '/(auth)/create-restaurant', params: { merchantType: merchantType ?? 'RESTAURANT' } });
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = merchantType === 'PHARMACY' ? 'Pharmacy' : merchantType === 'SUPERMARKET' ? 'Supermarket' : 'Restaurant';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safeTop}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0D1B2A" />
        </TouchableOpacity>
      </SafeAreaView>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.typeBadge}>
          <Ionicons
            name={merchantType === 'PHARMACY' ? 'medical-outline' : merchantType === 'SUPERMARKET' ? 'cart-outline' : 'restaurant-outline'}
            size={14}
            color={merchantType === 'PHARMACY' ? '#10B981' : merchantType === 'SUPERMARKET' ? '#3B82F6' : '#FF6B00'}
          />
          <Text style={[styles.typeBadgeText, {
            color: merchantType === 'PHARMACY' ? '#10B981' : merchantType === 'SUPERMARKET' ? '#3B82F6' : '#FF6B00',
          }]}>{typeLabel}</Text>
        </View>
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subheading}>Join thousands of merchants on Lanieats</Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="firstName"
              rules={{ required: 'Required' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="First Name"
                  placeholder="Emeka"
                  value={value}
                  onChangeText={onChange}
                  error={errors.firstName?.message}
                />
              )}
            />
          </View>
          <View style={styles.halfField}>
            <Controller
              control={control}
              name="lastName"
              rules={{ required: 'Required' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Last Name"
                  placeholder="Okafor"
                  value={value}
                  onChangeText={onChange}
                  error={errors.lastName?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email Address"
              placeholder="you@example.com"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          rules={{
            required: 'Phone is required',
            pattern: { value: /^0[789][01]\d{8}$/, message: 'Enter a valid Nigerian phone (e.g. 08012345678)' },
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone Number"
              placeholder="08012345678"
              keyboardType="phone-pad"
              value={value}
              onChangeText={onChange}
              error={errors.phone?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: { value: 6, message: 'Min 6 characters' },
          }}
          render={({ field: { onChange, value } }) => (
            <View>
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
              />
              <PasswordStrength password={value} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (val) => val === password || 'Passwords do not match',
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Confirm Password"
              placeholder="••••••••"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {/* CAC Registration Toggle */}
        <View style={styles.cacToggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cacToggleLabel}>CAC Registered Business?</Text>
            <Text style={styles.cacToggleHint}>Toggle on if your business is officially registered</Text>
          </View>
          <Switch
            value={isBusinessRegistered}
            onValueChange={setIsBusinessRegistered}
            trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
            thumbColor={isBusinessRegistered ? colors.success : colors.muted}
          />
        </View>

        {isBusinessRegistered && (
          <TouchableOpacity style={styles.cacUploadBtn} onPress={pickCacDocument} activeOpacity={0.8}>
            <Ionicons
              name={cacDocumentUri ? 'document-text' : 'cloud-upload-outline'}
              size={20}
              color={cacDocumentUri ? colors.success : colors.primary}
            />
            <Text style={[styles.cacUploadText, cacDocumentUri && { color: colors.success }]}>
              {cacDocumentName ?? 'Upload CAC Document (photo)'}
            </Text>
          </TouchableOpacity>
        )}

        {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

        <Button
          label="Create Account"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  safeTop: { backgroundColor: '#fff' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 24,
    marginTop: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  typeBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  content: { padding: 24, paddingTop: 16, flexGrow: 1 },
  heading: { fontFamily: 'Sora_700Bold', fontSize: 28, color: colors.navy, marginBottom: 6 },
  subheading: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.muted, marginBottom: 28 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -10,
    marginBottom: 16,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, width: 50 },
  cacToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cacToggleLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy },
  cacToggleHint: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  cacUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  cacUploadText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.primary, flex: 1 },
  apiError: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: { marginTop: 8 },
  linkRow: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  linkText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  linkBold: { fontFamily: 'DMSans_600SemiBold', color: colors.primary },
});
