import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, Alert, Modal, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { showToast } from '../../components/common/Toast';
import useAuthStore from '../../store/auth.store';
import { changePasswordApi, updateProfileApi } from '../../api/auth.api';
import useMerchantType from '../../hooks/useMerchantType';
import { colors } from '../../theme/colors';

const APP_VERSION = '1.0.0';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface EditProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface MenuItemProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon, label, onPress, danger, rightElement }: MenuItemProps): React.JSX.Element {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.navy} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {rightElement ?? <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuthStore();
  const { Store, merchantType } = useMerchantType();
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordFormData>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const {
    control: profileControl,
    handleSubmit: profileHandleSubmit,
    reset: profileReset,
    formState: { errors: profileErrors },
  } = useForm<EditProfileFormData>({
    defaultValues: {
      firstName: (user as { firstName?: string } | null)?.firstName ?? '',
      lastName: (user as { lastName?: string } | null)?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  });

  const userName = user
    ? `${(user as { firstName?: string }).firstName ?? ''} ${(user as { lastName?: string }).lastName ?? ''}`.trim()
    : 'Merchant';

  const handleLogout = (): void => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/splash');
        },
      },
    ]);
  };

  const onSaveProfile = async (data: EditProfileFormData): Promise<void> => {
    setSavingProfile(true);
    try {
      const res = await updateProfileApi({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
      });
      const updated = (res.data.data as { user?: typeof user })?.user ?? res.data.data as typeof user;
      if (updated) updateUser(updated);
      showToast({ type: 'success', message: 'Profile updated' });
      setShowEditProfile(false);
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to update profile';
      showToast({ type: 'error', message });
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData): Promise<void> => {
    if (data.newPassword !== data.confirmPassword) {
      showToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }
    setChangingPassword(true);
    try {
      await changePasswordApi(data.currentPassword, data.newPassword);
      showToast({ type: 'success', message: 'Password changed successfully' });
      setShowChangePassword(false);
      reset();
    } catch (error: unknown) {
      const message =
        error !== null &&
        typeof error === 'object' &&
        'response' in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : 'Failed to change password';
      showToast({ type: 'error', message });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <Avatar
              name={userName}
              imageUrl={(user as { avatarUrl?: string } | null)?.avatarUrl}
              size={72}
            />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{merchantType}</Text>
          </View>
        </View>

        {/* Account Info */}
        <Card style={styles.card} shadow="sm">
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <TouchableOpacity
              onPress={() => {
                profileReset({
                  firstName: (user as { firstName?: string } | null)?.firstName ?? '',
                  lastName: (user as { lastName?: string } | null)?.lastName ?? '',
                  phone: user?.phone ?? '',
                });
                setShowEditProfile(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.muted} />
            <Text style={styles.infoText}>{user?.email ?? '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={colors.muted} />
            <Text style={styles.infoText}>{user?.phone ?? '—'}</Text>
          </View>
          {user?.merchant?.businessName && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={16} color={colors.muted} />
              <Text style={styles.infoText}>{user.merchant.businessName}</Text>
            </View>
          )}
        </Card>

        {/* Menu items */}
        <Card style={styles.card} shadow="sm">
          <MenuItem
            icon="storefront-outline"
            label={`My ${Store}s`}
            onPress={() => router.push('/(main)/restaurant')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="receipt-outline"
            label="Order History"
            onPress={() => router.push('/(main)/orders')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="wallet-outline"
            label="Finance & Payouts"
            onPress={() => router.push('/(main)/finance')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="bar-chart-outline"
            label="Analytics"
            onPress={() => router.push('/(main)/analytics')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="card-outline"
            label="Bank Account"
            onPress={() => router.push('/(main)/finance/bank-account')}
          />
        </Card>

        <Card style={styles.card} shadow="sm">
          <MenuItem
            icon="lock-closed-outline"
            label="Change Password"
            onPress={() => setShowChangePassword(true)}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="headset-outline"
            label="Contact Support"
            onPress={() => Linking.openURL('mailto:support@lanieats.com')}
          />
        </Card>

        <Card style={styles.card} shadow="sm">
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </Card>

        <Text style={styles.version}>Lanieats for Merchants v{APP_VERSION}</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditProfile(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.editProfileRow}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={profileControl}
                  name="firstName"
                  rules={{ required: 'Required' }}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="First Name"
                      value={value}
                      onChangeText={onChange}
                      error={profileErrors.firstName?.message}
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={profileControl}
                  name="lastName"
                  rules={{ required: 'Required' }}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Last Name"
                      value={value}
                      onChangeText={onChange}
                      error={profileErrors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={profileControl}
              name="phone"
              rules={{
                required: 'Phone is required',
                pattern: { value: /^(\+234|0)[789][01]\d{8}$/, message: 'Enter a valid Nigerian phone' },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Phone Number"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  error={profileErrors.phone?.message}
                />
              )}
            />

            <Button
              label="Save Changes"
              onPress={profileHandleSubmit(onSaveProfile)}
              loading={savingProfile}
              fullWidth
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChangePassword(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <TouchableOpacity style={styles.eyeToggleRow} onPress={() => setShowPasswords((v) => !v)}>
              <Ionicons name={showPasswords ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.muted} />
              <Text style={styles.eyeToggleText}>{showPasswords ? 'Hide' : 'Show'} passwords</Text>
            </TouchableOpacity>

            <Controller
              control={control}
              name="currentPassword"
              rules={{ required: 'Current password is required' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Current Password"
                  secureTextEntry={!showPasswords}
                  value={value}
                  onChangeText={onChange}
                  error={errors.currentPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              rules={{ required: 'New password required', minLength: { value: 6, message: 'Min 6 characters' } }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="New Password"
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
              rules={{ required: 'Please confirm new password' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm New Password"
                  secureTextEntry={!showPasswords}
                  value={value}
                  onChangeText={onChange}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              label="Update Password"
              onPress={handleSubmit(onChangePassword)}
              loading={changingPassword}
              fullWidth
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: { fontFamily: 'Sora_700Bold', fontSize: 22, color: colors.navy },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: colors.primary,
    marginBottom: 12,
  },
  userName: { fontFamily: 'Sora_700Bold', fontSize: 20, color: colors.navy },
  userEmail: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, marginTop: 4 },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#FFF3E8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: { fontFamily: 'Sora_700Bold', fontSize: 11, color: colors.primary, letterSpacing: 1 },
  card: { marginBottom: 14 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  editLink: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.primary },
  editProfileRow: { flexDirection: 'row', gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#374151' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconDanger: { backgroundColor: '#FEE2E2' },
  menuLabel: { flex: 1, fontFamily: 'DMSans_500Medium', fontSize: 15, color: colors.navy },
  menuLabelDanger: { color: colors.error },
  divider: { height: 1, backgroundColor: colors.lightGray },
  version: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
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
  modalTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, marginBottom: 12 },
  eyeToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  eyeToggleText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: colors.muted },
});
