import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/shadows';
import { showToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import { getOperatingHoursApi, setOperatingHoursApi, DayHours } from '../../api/operatingHours.api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_HOURS: DayHours[] = DAY_NAMES.map((_, day) => ({
  day,
  isOpen: day >= 1 && day <= 5, // Mon–Fri open by default
  openTime: '08:00',
  closeTime: '22:00',
}));

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isValidTime(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t) && timeToMinutes(t) <= 23 * 60 + 59;
}

function DayRow({
  entry,
  onChange,
}: {
  entry: DayHours;
  onChange: (updated: DayHours) => void;
}) {
  return (
    <View style={styles.dayRow}>
      <View style={styles.dayLeft}>
        <Text style={[styles.dayName, !entry.isOpen && styles.dayNameClosed]}>
          {DAY_NAMES[entry.day]}
        </Text>
        <Switch
          value={entry.isOpen}
          onValueChange={(v) => onChange({ ...entry, isOpen: v })}
          trackColor={{ false: colors.lightGray, true: colors.primary + '60' }}
          thumbColor={entry.isOpen ? colors.primary : colors.muted}
        />
      </View>
      {entry.isOpen ? (
        <View style={styles.timeRow}>
          <TextInput
            style={styles.timeInput}
            value={entry.openTime}
            onChangeText={(t) => onChange({ ...entry, openTime: t })}
            placeholder="08:00"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
          <Text style={styles.timeSep}>–</Text>
          <TextInput
            style={styles.timeInput}
            value={entry.closeTime}
            onChangeText={(t) => onChange({ ...entry, closeTime: t })}
            placeholder="22:00"
            placeholderTextColor={colors.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
      ) : (
        <Text style={styles.closedLabel}>Closed</Text>
      )}
    </View>
  );
}

export default function OperatingHoursScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: restaurantId } = useLocalSearchParams<{ id: string }>();

  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    getOperatingHoursApi(restaurantId)
      .then((res) => {
        const fetched = res.data?.data?.hours;
        if (fetched && fetched.length === 7) setHours(fetched);
      })
      .catch(() => {}) // no hours set yet — use defaults
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const updateDay = (updated: DayHours) => {
    setHours((prev) => prev.map((h) => (h.day === updated.day ? updated : h)));
  };

  const handleSave = async () => {
    for (const entry of hours) {
      if (entry.isOpen) {
        if (!isValidTime(entry.openTime) || !isValidTime(entry.closeTime)) {
          Alert.alert('Invalid time', `Enter times as HH:MM for ${DAY_NAMES[entry.day]}.`);
          return;
        }
        if (timeToMinutes(entry.openTime) >= timeToMinutes(entry.closeTime)) {
          Alert.alert('Invalid range', `Open time must be before close time for ${DAY_NAMES[entry.day]}.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await setOperatingHoursApi(restaurantId as string, hours);
      showToast({ type: 'success', message: 'Operating hours saved!' });
      router.back();
    } catch (err: any) {
      showToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save hours' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.title}>Operating Hours</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          Set your open hours for each day. Orders outside these hours will not be accepted.
        </Text>

        <View style={[styles.card, shadows.sm as object]}>
          {hours.map((entry) => (
            <View key={entry.day}>
              <DayRow entry={entry} onChange={updateDay} />
              {entry.day < 6 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label="Save Hours"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSave}
          loading={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.softWhite },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backBtn: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontFamily: 'Sora_700Bold', fontSize: 18, color: colors.navy, textAlign: 'center' },
  spacer: { width: 34 },
  content: { padding: 16, paddingBottom: 32 },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 19,
  },
  card: {
    backgroundColor: colors.cardWhite,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: colors.navy,
    width: 90,
  },
  dayNameClosed: { color: colors.muted },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 64,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.navy,
    textAlign: 'center',
  },
  timeSep: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.muted,
  },
  closedLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
  },
  divider: { height: 1, backgroundColor: colors.lightGray, marginHorizontal: 16 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.cardWhite,
  },
});
