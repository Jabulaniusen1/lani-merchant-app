import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/auth.store';
import { colors } from '../../theme/colors';

function PasswordStrength({ password }) {
  const getStrength = (pwd) => {
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
        <View style={[styles.strengthFill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, watch, formState: { errors } } = useForm({
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

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await register({ ...registerData, email: data.email.toLowerCase() });
      router.replace('/(auth)/create-restaurant');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
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
  content: { padding: 24, paddingTop: 60, flexGrow: 1 },
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
