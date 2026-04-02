import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../store/auth.store';
import { colors } from '../../theme/colors';

export default function SplashScreen(): React.JSX.Element {
  const router = useRouter();
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(main)/orders');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }, 300);
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.Image
          source={require('../../../assets/images/dark_on_orange.png')}
          style={[styles.logoMark, { transform: [{ scale: pulseAnim }] }]}
        />
        <Text style={styles.wordmark}>lanieats</Text>
        <Text style={styles.tagline}>for merchants</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: { alignItems: 'center' },
  logoMark: {
    width: 110,
    height: 110,
    borderRadius: 28,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  wordmark: {
    fontFamily: 'Sora_700Bold',
    fontSize: 32,
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 6,
  },
});
