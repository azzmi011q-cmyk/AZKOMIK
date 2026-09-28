import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ScrollView, StatusBar, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native';
import { COLORS } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Skeleton({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width !== undefined ? width : '100%',
          height: height !== undefined ? height : '100%',
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function HomeSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Skeleton width={120} height={24} borderRadius={6} />
          <Skeleton width={140} height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionHeader}>
          <Skeleton width={100} height={20} />
          <Skeleton width={60} height={14} />
        </View>
        <View style={styles.horizontalRow}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ marginRight: 14 }}>
              <Skeleton width={140} height={200} borderRadius={12} />
              <Skeleton width={110} height={14} style={{ marginTop: 8 }} />
              <Skeleton width={60} height={12} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Skeleton width={120} height={20} />
          <Skeleton width={60} height={14} />
        </View>
        <View style={styles.horizontalRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ marginRight: 12 }}>
              <Skeleton width={110} height={150} borderRadius={10} />
              <Skeleton width={90} height={14} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Skeleton width={110} height={20} />
          <Skeleton width={60} height={14} />
        </View>
        <View style={styles.latestGridSkeleton}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ width: (SCREEN_WIDTH - 52) / 2, marginBottom: 16 }}>
              <Skeleton width={(SCREEN_WIDTH - 52) / 2} height={((SCREEN_WIDTH - 52) / 2) * 1.4} borderRadius={10} />
              <Skeleton width={100} height={14} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function DetailSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
      <View style={styles.header}>
        <Skeleton width={38} height={38} borderRadius={19} />
        <Skeleton width={150} height={18} />
        <Skeleton width={38} height={38} borderRadius={19} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View>
          <Skeleton width="100%" height={180} borderRadius={0} />
          <View style={styles.comicMetaRow}>
            <Skeleton width={110} height={160} borderRadius={10} style={styles.coverSkeletonBorder} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Skeleton width={150} height={20} />
              <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <Skeleton width={60} height={18} borderRadius={6} style={{ marginRight: 6 }} />
                <Skeleton width={50} height={18} borderRadius={6} />
              </View>
            </View>
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Skeleton width="100%" height={48} borderRadius={10} />
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Skeleton width={70} height={18} style={{ marginBottom: 10 }} />
          <View style={{ flexDirection: 'row' }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width={70} height={28} borderRadius={20} style={{ marginRight: 8 }} />
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Skeleton width={80} height={18} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="90%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="60%" height={14} />
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Skeleton width={120} height={18} style={{ marginBottom: 12 }} />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={48} borderRadius={10} style={{ marginBottom: 8 }} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ReaderSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />
      <View style={styles.header}>
        <Skeleton width={38} height={38} borderRadius={19} />
        <View style={{ alignItems: 'center' }}>
          <Skeleton width={120} height={14} />
          <Skeleton width={70} height={12} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={38} height={38} borderRadius={19} />
      </View>
      <ScrollView scrollEnabled={false} contentContainerStyle={{ paddingVertical: 10 }}>
        <Skeleton width={SCREEN_WIDTH} height={SCREEN_WIDTH * 1.4} borderRadius={0} style={{ marginBottom: 4 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#261F47',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 12 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  horizontalRow: {
    flexDirection: 'row',
    paddingLeft: 20,
  },
  latestGridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  comicMetaRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -60,
    alignItems: 'flex-end',
  },
  coverSkeletonBorder: {
    borderWidth: 3,
    borderColor: COLORS.background,
  },
});
