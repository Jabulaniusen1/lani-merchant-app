import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Dimensions, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  bg: string;
  textColor: string;
  isLast?: boolean;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'restaurant-outline',
    title: 'Manage Your Restaurant',
    subtitle: 'Accept orders, update your menu, and track deliveries — all in one place.',
    bg: colors.primary,
    textColor: '#fff',
  },
  {
    id: '2',
    icon: 'cube-outline',
    title: 'Real-Time Orders',
    subtitle: 'Get notified the moment a customer places an order. Never miss a beat.',
    bg: colors.navy,
    textColor: '#fff',
  },
  {
    id: '3',
    icon: 'bar-chart-outline',
    title: 'Grow Your Business',
    subtitle: 'Track your performance, manage multiple restaurants, and serve Lagos better.',
    bg: '#fff',
    textColor: colors.navy,
    isLast: true,
  },
];

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoTimer.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev < slides.length - 1 ? prev + 1 : prev;
        if (next !== prev) {
          flatListRef.current?.scrollToIndex({ index: next, animated: true });
        }
        return next;
      });
    }, 4000);
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const slide = slides[currentIndex];

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={80} color={item.textColor} />
            <Text style={[styles.title, { color: item.textColor }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: item.id === '3' ? colors.muted : 'rgba(255,255,255,0.85)' }]}>
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: currentIndex === i
                  ? (slide.bg === '#fff' ? colors.primary : '#fff')
                  : (slide.bg === '#fff' ? colors.lightGray : 'rgba(255,255,255,0.35)'),
                width: currentIndex === i ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom CTA (last slide) */}
      {currentIndex === slides.length - 1 && (
        <View style={styles.cta}>
          <TouchableOpacity
            style={styles.getStartedBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.signInLink}
          >
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skip (non-last slides) */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skip}
          onPress={() => {
            flatListRef.current?.scrollToIndex({ index: slides.length - 1, animated: true });
            setCurrentIndex(slides.length - 1);
          }}
        >
          <Text style={[styles.skipText, { color: slide.bg === '#fff' ? colors.muted : 'rgba(255,255,255,0.7)' }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 180,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  cta: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    right: 24,
  },
  getStartedBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 16,
  },
  getStartedText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  signInLink: { alignItems: 'center' },
  signInText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.muted,
  },
  signInBold: {
    fontFamily: 'DMSans_600SemiBold',
    color: colors.primary,
  },
  skip: {
    position: 'absolute',
    top: 56,
    right: 24,
  },
  skipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },
});
