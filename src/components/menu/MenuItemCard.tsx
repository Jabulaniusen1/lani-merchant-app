import React from 'react';
import { View, Text, Image, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { formatCurrency } from '../../utils/formatters';
import type { MenuItem } from '../../types';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: (item: MenuItem) => void;
  onToggleAvailability?: (itemId: string, isAvailable: boolean) => void;
  onDelete?: (itemId: string) => void;
}

export default function MenuItemCard({
  item,
  onEdit,
  onToggleAvailability,
  onDelete,
}: MenuItemCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={24} color={colors.muted} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {item.description && (
          <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
        )}
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>

      <View style={styles.actions}>
        <Switch
          value={item.isAvailable !== false}
          onValueChange={(val) => onToggleAvailability?.(item.id, val)}
          trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
          thumbColor={item.isAvailable !== false ? colors.success : colors.muted}
          ios_backgroundColor="#E5E7EB"
        />
        <TouchableOpacity onPress={() => onEdit?.(item)} style={styles.editBtn}>
          <Ionicons name="pencil-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete?.(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: 64, height: 64, borderRadius: 10, resizeMode: 'cover' },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, marginHorizontal: 12 },
  name: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, color: colors.navy },
  desc: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  price: { fontFamily: 'Sora_700Bold', fontSize: 14, color: colors.primary, marginTop: 4 },
  actions: { alignItems: 'center', gap: 8 },
  editBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
});
