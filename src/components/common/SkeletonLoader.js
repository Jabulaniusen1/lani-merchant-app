import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E5E7EB', opacity },
        style,
      ]}
    />
  );
}

export function OrderCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonBox width={60} height={16} borderRadius={4} />
        <SkeletonBox width={80} height={22} borderRadius={12} />
      </View>
      <View style={[styles.row, { marginTop: 12 }]}>
        <SkeletonBox width={120} height={14} borderRadius={4} />
        <SkeletonBox width={100} height={14} borderRadius={4} />
      </View>
      <SkeletonBox width="100%" height={14} borderRadius={4} style={{ marginTop: 10 }} />
      <SkeletonBox width="80%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      <View style={[styles.row, { marginTop: 12 }]}>
        <SkeletonBox width="45%" height={44} borderRadius={10} />
        <SkeletonBox width="45%" height={44} borderRadius={10} />
      </View>
    </View>
  );
}

export function MenuItemSkeleton() {
  return (
    <View style={styles.menuItem}>
      <SkeletonBox width={70} height={70} borderRadius={12} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <SkeletonBox width="60%" height={14} borderRadius={4} />
        <SkeletonBox width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
        <SkeletonBox width="30%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
});
