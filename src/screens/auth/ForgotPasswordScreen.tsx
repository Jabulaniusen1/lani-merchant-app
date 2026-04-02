import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { forgotPasswordApi } from '../../api/auth.api';
import { colors } from '../../theme/colors';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    setLoading(true);
    try {
      await forgotPasswordApi(data.email.toLowerCase().trim());
      showToast({ type: 'success', message: 'Reset code sent to your email' });
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: data.email.toLowerCase().trim() },
      });
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to send reset code. Please try again.';
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
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Reset your password</Text>
        <Text style={styles.subheading}>
          Enter the email address linked to your account and we&apos;ll send you a reset code.
        </Text>

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
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          label="Send Reset Code"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.submitBtn}
        />

        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Back to Sign In</Text>
        </TouchableOpacity>
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
  heading: { fontFamily: 'Sora_700Bold', fontSize: 24, color: colors.navy, marginBottom: 8 },
  subheading: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
    marginBottom: 32,
    lineHeight: 22,
  },
  submitBtn: { marginTop: 8 },
  backLink: { alignItems: 'center', marginTop: 20 },
  backLinkText: { fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.muted },
});
