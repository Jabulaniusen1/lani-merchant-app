import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

type MerchantType = 'RESTAURANT' | 'PHARMACY' | 'SUPERMARKET';

interface TypeOption {
  type: MerchantType;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  accent: string;
  bg: string;
}

const OPTIONS: TypeOption[] = [
  {
    type: 'RESTAURANT',
    icon: 'restaurant-outline',
    label: 'Restaurant',
    description: 'Food delivery, takeaways & dining experiences',
    accent: colors.primary,
    bg: '#FFF3E8',
  },
  {
    type: 'PHARMACY',
    icon: 'medical-outline',
    label: 'Pharmacy',
    description: 'Medicines, health products & wellness items',
    accent: '#10B981',
    bg: '#ECFDF5',
  },
  {
    type: 'SUPERMARKET',
    icon: 'cart-outline',
    label: 'Supermarket',
    description: 'Groceries, daily essentials & household items',
    accent: '#3B82F6',
    bg: '#EFF6FF',
  },
];

export default function MerchantTypeScreen(): React.JSX.Element {
  const router = useRouter();
  const [selected, setSelected] = useState<MerchantType | null>(null);

  const handleContinue = (): void => {
    if (!selected) return;
    router.push({ pathname: '/(auth)/register', params: { merchantType: selected } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </TouchableOpacity>

        <Text style={styles.heading}>What type of{'\n'}business do you run?</Text>
        <Text style={styles.subheading}>
          Choose your business type to get started. This helps us personalise your experience.
        </Text>

        {/* Cards */}
        <View style={styles.cards}>
          {OPTIONS.map((opt) => {
            const isActive = selected === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                style={[
                  styles.card,
                  isActive && { borderColor: opt.accent, borderWidth: 2 },
                ]}
                onPress={() => setSelected(opt.type)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: opt.bg }]}>
                  <Ionicons name={opt.icon} size={28} color={opt.accent} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardLabel, isActive && { color: opt.accent }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.cardDesc}>{opt.description}</Text>
                </View>
                <View style={[
                  styles.radio,
                  isActive && { backgroundColor: opt.accent, borderColor: opt.accent },
                ]}>
                  {isActive && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={selected ? 0.85 : 1}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Sign in link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.signInRow}
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  heading: {
    fontFamily: 'Sora_700Bold',
    fontSize: 28,
    color: colors.navy,
    lineHeight: 38,
    marginBottom: 10,
  },
  subheading: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 32,
  },
  cards: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 16,
    color: colors.navy,
    marginBottom: 3,
  },
  cardDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 17,
    marginTop: 32,
  },
  continueBtnDisabled: { backgroundColor: '#FFC19A' },
  continueBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  signInRow: { alignItems: 'center', marginTop: 20 },
  signInText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
  },
  signInBold: {
    fontFamily: 'DMSans_600SemiBold',
    color: colors.primary,
  },
});
