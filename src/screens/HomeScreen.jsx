import iconAsset from '../../assets/icon.png';
import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '../components/Icons';
import { COLORS } from '../constants/theme';
import { getHome, getSliders, isCached } from '../services/api';
import { HomeSkeleton } from '../components/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LATEST_CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const HeroSlider = memo(({ sliders, onPress }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slide !== activeIndex) {
      setActiveIndex(slide);
    }
  };

  if (!sliders || sliders.length === 0) return null;

  return (
    <View style={styles.heroContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {sliders.map((item) => {
          const mangaId = item.manga_id || item.mangas?.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={styles.heroSlide}
              onPress={() => mangaId && onPress(mangaId)}
            >
              {/* Background Image */}
              <ExpoImage
                source={{ uri: item.background_image || item.mangas?.cover }}
                style={styles.heroImage}
                contentFit="cover"
                cachePolicy="memory-disk"
              />

              {/* Gradient Overlay & Content Container */}
              <View style={styles.heroOverlay}>
                {/* Character Overlay Image on right */}
                {Boolean(item.chara_image) && (
                  <ExpoImage
                    source={{ uri: item.chara_image }}
                    style={styles.charaOverlayImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                )}

                <View style={styles.heroContent}>
                  {item.badges && item.badges.length > 0 && (
                    <View style={styles.badgeRow}>
                      {item.badges.map((b, idx) => (
                        <View
                          key={idx}
                          style={[styles.badgeItem, { backgroundColor: b.color || COLORS.primary }]}
                        >
                          <Text style={styles.badgeText}>{b.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {item.title || item.mangas?.title}
                  </Text>
                  <Text style={styles.heroDesc} numberOfLines={2}>
                    {item.description || item.mangas?.description}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.pagination}>
        {sliders.map((_, i) => (
          <View
            key={i}
            style={[styles.paginationDot, i === activeIndex && styles.paginationDotActive]}
          />
        ))}
      </View>
    </View>
  );
});

const PopularCard = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.popularCard}
    activeOpacity={0.8}
    onPress={() => onPress(item.id)}
  >
    <ExpoImage
      source={{ uri: item.cover }}
      style={styles.popularCover}
      contentFit="cover"
      cachePolicy="memory-disk"
      allowDownsampling={true}
      recyclingKey={item.cover}
    />
    {Boolean(item.rating) && (
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={12} color={COLORS.star} />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
    )}
    <Text style={styles.popularTitle} numberOfLines={1}>
      {item.title}
    </Text>
    <Text style={styles.popularGenre}>{item.type || 'Manga'}</Text>
  </TouchableOpacity>
));

const RecommendedCard = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.gridCard}
    activeOpacity={0.8}
    onPress={() => onPress(item.id)}
  >
    <ExpoImage
      source={{ uri: item.cover }}
      style={styles.gridCover}
      contentFit="cover"
      cachePolicy="memory-disk"
      allowDownsampling={true}
      recyclingKey={item.cover}
    />
    <Text style={styles.gridTitle} numberOfLines={2}>
      {item.title}
    </Text>
    <Text style={styles.gridMeta}>{item.type || 'Manga'}</Text>
  </TouchableOpacity>
));

const LatestCard = memo(({ comic, onPress }) => (
  <TouchableOpacity
    style={styles.gridLatestCard}
    activeOpacity={0.8}
    onPress={() => onPress(comic.id)}
  >
    <ExpoImage
      source={{ uri: comic.cover }}
      style={styles.gridLatestCover}
      contentFit="cover"
      cachePolicy="memory-disk"
      allowDownsampling={true}
      recyclingKey={comic.cover}
    />
    <Text style={styles.gridTitle} numberOfLines={2}>
      {comic.title}
    </Text>
    <Text style={styles.gridMeta}>{comic.type || 'Manga'}</Text>
  </TouchableOpacity>
));

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [sliders, setSliders] = useState([]);
  const [homeData, setHomeData] = useState({
    recommended: [],
    popular: [],
    latest: [],
  });

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      if (!isCached('/home') || !isCached('/slider')) {
        setLoading(true);
      }
      const [data, sliderData] = await Promise.all([getHome(), getSliders()]);
      setHomeData(data);
      setSliders(Array.isArray(sliderData) ? sliderData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComicPress = useCallback((id) => {
    navigation.navigate('Detail', { comicId: id });
  }, [navigation]);

  const handleSeeAll = useCallback(
    (type, title) => {
      navigation.navigate('ComicList', { type, title });
    },
    [navigation]
  );

  const renderPopularCard = useCallback(
    ({ item }) => <PopularCard item={item} onPress={handleComicPress} />,
    [handleComicPress]
  );

  const renderRecommendedCard = useCallback(
    ({ item }) => <RecommendedCard item={item} onPress={handleComicPress} />,
    [handleComicPress]
  );

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />

      {/* Styled Top Bar Header */}
      <View style={styles.topHeader}>
        <View style={styles.logoBadgeContainer}>
          <View style={styles.logoIconFrame}>
            <ExpoImage
              source={iconAsset}
              style={styles.logoIconImage}
              contentFit="cover"
            />
          </View>
          <View>
            <Text style={styles.logoText}>
              AZ<Text style={styles.logoAccent}>KOM</Text>
            </Text>
            <Text style={styles.subtitle}>Baca Komik Online</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="time-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={18} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Slider */}
        <HeroSlider sliders={sliders} onPress={handleComicPress} />

        {/* Popular Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flame" size={20} color="#EF4444" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Populer</Text>
          </View>
          <TouchableOpacity onPress={() => handleSeeAll('popular', 'Populer')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={homeData.popular}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderPopularCard}
          contentContainerStyle={styles.horizontalList}
        />

        {/* Recommended Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="sparkles" size={18} color="#F59E0B" style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Rekomendasi</Text>
          </View>
          <TouchableOpacity onPress={() => handleSeeAll('recommended', 'Rekomendasi')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={homeData.recommended}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `rec-${item.id}`}
          renderItem={renderRecommendedCard}
          contentContainerStyle={styles.horizontalList}
        />

        {/* Latest Release Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.accent} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Rilis Terbaru</Text>
          </View>
          <TouchableOpacity onPress={() => handleSeeAll('latest', 'Rilis Terbaru')}>
            <Text style={styles.seeAll}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.latestGrid}>
          {homeData.latest.map((comic) => (
            <LatestCard key={`latest-${comic.id}`} comic={comic} onPress={handleComicPress} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 12 : 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconFrame: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  logoIconImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 1.2,
  },
  logoAccent: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: -2,
    fontWeight: '500',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: 230,
    position: 'relative',
    marginBottom: 8,
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    height: 230,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 12, 27, 0.65)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  charaOverlayImage: {
    position: 'absolute',
    right: 8,
    bottom: 0,
    width: 170,
    height: 210,
    opacity: 0.95,
  },
  heroContent: {
    marginBottom: 8,
    maxWidth: '65%',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  badgeItem: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  popularCard: {
    width: 140,
    marginRight: 14,
  },
  popularCover: {
    width: 140,
    height: 200,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 12, 27, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 3,
  },
  popularTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 8,
  },
  popularGenre: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  gridCard: {
    width: 110,
    marginRight: 12,
  },
  gridCover: {
    width: 110,
    height: 150,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  gridTitle: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 6,
  },
  gridMeta: {
    color: COLORS.accent,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  latestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  gridLatestCard: {
    width: LATEST_CARD_WIDTH,
    marginBottom: 16,
  },
  gridLatestCover: {
    width: LATEST_CARD_WIDTH,
    height: LATEST_CARD_WIDTH * 1.4,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
});
