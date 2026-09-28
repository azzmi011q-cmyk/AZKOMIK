import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from './Icons';
import { COLORS } from '../constants/theme';

export default function LoadingScreen({ message = 'Memuat AZKOM...' }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Spin animation for outer ring
    const spinAnim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    // Pulse animation for logo & text
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(pulseValue, {
          toValue: 0.8,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    );

    spinAnim.start();
    pulseAnim.start();

    return () => {
      spinAnim.stop();
      pulseAnim.stop();
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {/* Rotating outer spinner ring */}
        <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
        
        {/* Pulsing center comic icon */}
        <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
          <MaterialCommunityIcons name="book-open-page-variant" size={38} color={COLORS.primary} />
        </Animated.View>
      </View>

      <Text style={styles.brandText}>
        <Text>AZK<Text style={styles.brandAccent}>OM</Text></Text>
      </Text>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  spinnerRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.accent,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1.5,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  messageText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
});
