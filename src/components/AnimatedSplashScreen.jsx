import iconAsset from '../../assets/icon.png';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SplashScreenComponent({ onFinish }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const containerOpacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Zoom in and Fade in Logo
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // 2. Fade in Brand Text
      Animated.timing(textOpacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // 3. Pause briefly
      Animated.delay(500),
      // 4. Fade out entire Splash
      Animated.timing(containerOpacityAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onFinish) {
        onFinish();
      }
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacityAnim }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <ExpoImage
          source={iconAsset}
          style={styles.logoImage}
          contentFit="cover"
        />
      </Animated.View>

      <Animated.Text style={[styles.brandText, { opacity: textOpacityAnim }]}>
        AZ<Animated.Text style={styles.brandAccent}>KOM</Animated.Text>
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 2,
  },
  brandAccent: {
    color: COLORS.primary,
  },
});
