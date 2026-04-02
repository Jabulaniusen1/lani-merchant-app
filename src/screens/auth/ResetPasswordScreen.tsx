import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { resetPasswordApi } from '../../api/auth.api';
import { colors } from '../../theme/colors';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>({
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ResetPasswordFormData): Promise<void> => {
    if (!code || code.length < 6) {
      showToast({ type: 'error', message: 'Please enter the 6-digit code' });
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi(email ?? '', code, data.newPassword);
      showToast({ type: 'success', message: 'Password reset successfully' });
      router.replace('/(auth)/login');
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to reset password. Please try again.';
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
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Enter your reset code</Text>
        {email ? (
          <Text style={styles.emailText}>Code sent to {email}</Text>
        ) : null}

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          <TextInput
            style={styles.otpInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="numeric"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.lightGray}
          />
        </View>

        {/* Password visibility toggle */}
        <TouchableOpacity style={styles.eyeToggleRow} onPress={() => setShowPasswords((v) => !v)}>
          <Ionicons name={showPasswords ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
          <Text style={styles.eyeToggleText}>{showPasswords ? 'Hide' : 'Show'} passwords</Text>
        </TouchableOpacity>

        <Controller
          control={control}
          name="newPassword"
          rules={{ required: 'New password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="New Password"
              placeholder="••••••••"
              secureTextEntry={!showPasswords}
              value={value}
              onChangeText={onChange}
              error={errors.newPassword?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (v) => v === newPassword || 'Passwords do not match',
          }}
          render={({ field: { onChange, value } }) => (
            <Input
              label="Confirm Password"
              placeholder="••••••••"
              secureTextEntry={!showPasswords}
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        <Button
          label="Reset Password"
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
  content: { padding: 24, paddingTop: 32, flexGrow: 1 },
  heading: { fontFamily: 'Sora_700Bold', fontSize: 24, color: colors.navy, marginBottom: 6 },
  emailText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    marginBottom: 28,
  },
  otpContainer: { alignItems: 'center', marginBottom: 28 },
  otpInput: {
    fontSize: 36,
    fontFamily: 'Sora_700Bold',
    color: colors.navy,
    letterSpacing: 12,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 200,
  },
  eyeToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  eyeToggleText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted },
  submitBtn: { marginTop: 8 },
});
