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
import { changePasswordApi } from '../../api/auth.api';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';

const APP_VERSION = '1.0.0';

function MenuItem({ icon, label, onPress, danger, rightElement }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.error : colors.navy} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {rightElement || <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : 'Merchant';

  const handleLogout = () => {
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

  const onChangePassword = async (data) => {
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
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
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
            <Avatar name={userName} imageUrl={user?.avatarUrl} size={72} />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>MERCHANT</Text>
          </View>
        </View>

        {/* Account Info */}
        <Card style={styles.card} shadow="sm">
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.muted} />
            <Text style={styles.infoText}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={colors.muted} />
            <Text style={styles.infoText}>{user?.phone || '—'}</Text>
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
            label="My Restaurants"
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
            icon="notifications-outline"
            label="Notification Settings"
            onPress={() => showToast({ type: 'info', message: 'Notification settings coming soon' })}
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
          <View style={styles.divider} />
          <MenuItem
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => showToast({ type: 'info', message: 'Terms of service coming soon' })}
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

            <Controller
              control={control}
              name="currentPassword"
              rules={{ required: 'Current password is required' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Current Password"
                  secureTextEntry
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
                  secureTextEntry
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
                  secureTextEntry
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
  cardTitle: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
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
  modalTitle: { fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, marginBottom: 20 },
});
