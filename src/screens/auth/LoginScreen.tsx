import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import useAuthStore from '../../store/auth.store';
import { colors } from '../../theme/colors';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setApiError('');
    setLoading(true);
    try {
      await login(data.email.toLowerCase(), data.password);
      router.replace('/(main)/orders');
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Invalid credentials. Please try again.';
      setApiError(message);
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
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>L</Text>
          </View>
          <Text style={styles.logoText}>Merchant Portal</Text>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in to manage your restaurant</Text>

        {/* Form */}
        <View style={styles.form}>
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
            name="password"
            rules={{
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.password?.message}
              />
            )}
          />

          {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

          <Button
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.submitBtn}
          />
        </View>

        {/* Register link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>
            Don&apos;t have an account?{' '}
            <Text style={styles.linkBold}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  content: {
    padding: 24,
    paddingTop: 60,
    flexGrow: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 40,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { fontFamily: 'Sora_700Bold', fontSize: 20, color: '#fff', lineHeight: 24 },
  logoText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: colors.navy },
  heading: {
    fontFamily: 'Sora_700Bold',
    fontSize: 28,
    color: colors.navy,
    marginBottom: 6,
  },
  subheading: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.muted,
    marginBottom: 32,
  },
  form: { gap: 0 },
  apiError: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitBtn: { marginTop: 8 },
  linkRow: { alignItems: 'center', marginTop: 24 },
  linkText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted },
  linkBold: { fontFamily: 'DMSans_600SemiBold', color: colors.primary },
});
