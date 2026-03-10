import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

/** Parse "HH:MM" string → Date object (today's date with that time) */
function parseTime(hhmm) {
  const [hours, minutes] = (hhmm || '00:00').split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Format Date → "HH:MM" (24-hour) for storage */
function toHHMM(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Format "HH:MM" → "8:00 AM" for display */
function formatDisplay(hhmm) {
  if (!hhmm) return '--:--';
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export default function TimePicker({ label, value, onChange, error }) {
  const [show, setShow] = useState(false);
  const date = parseTime(value);

  const handleChange = (_, selected) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(toHHMM(selected));
  };

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.button, !!error && styles.buttonError]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="time-outline" size={18} color={colors.muted} />
        <Text style={styles.valueText}>{formatDisplay(value)}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/* Android: native dialog appears directly */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={false}
          onChange={handleChange}
        />
      )}

      {/* iOS: modal with inline spinner + Done button */}
      {Platform.OS === 'ios' && (
        <Modal transparent visible={show} animationType="slide" onRequestClose={() => setShow(false)}>
          <TouchableOpacity style={styles.overlay} onPress={() => setShow(false)} activeOpacity={1} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label || 'Select Time'}</Text>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.doneBtn}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={date}
              mode="time"
              display="spinner"
              is24Hour={false}
              onChange={handleChange}
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  buttonError: { borderColor: colors.error },
  valueText: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.navy,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetTitle: { fontFamily: 'Sora_600SemiBold', fontSize: 15, color: colors.navy },
  doneBtn: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: colors.primary },
  iosPicker: { width: '100%' },
});
