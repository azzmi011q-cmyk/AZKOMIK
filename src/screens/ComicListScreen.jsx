import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '../components/Icons';
import { COLORS } from '../constants/theme';
import { getPopular, getLatest, getRecommended, isCached } from '../services/api';
import Skeleton from '../components/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const GridComicCard = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
    onPress={() => onPress(item.id)}
  >
    <ExpoImage
      source={{ uri: item.cover }}
      style={styles.cover}
      contentFit="cover"
      cachePolicy="memory-disk"
      allowDownsampling={true}
      recyclingKey={item.cover}
    />
    {Boolean(item.rating) && (
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={10} color={COLORS.star} />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
    )}
    <Text style={styles.title} numberOfLines={2}>
      {item.title}
    </Text>
    <Text style={styles.meta}>{item.type || 'Manga'}</Text>
  </TouchableOpacity>
));

export default function ComicListScreen({ route, navigation }) {
  const { type, title } = route.params;
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchApi = type === 'popular' ? getPopular : type === 'recommended' ? getRecommended : getLatest;

  useEffect(() => {
    loadInitial();
  }, [type]);

  const loadInitial = async () => {
    try {
      const endpoint = type === 'popular' ? '/popular?page=1' : type === 'recommended' ? '/recommended?page=1' : '/latest?page=1';
      if (!isCached(endpoint)) {
        setLoading(true);
      }
      const res = await fetchApi(1);
      const items = Array.isArray(res) ? res : res?.data || [];
      setData(items);
      setHasMore(items.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetchApi(nextPage);
      const items = Array.isArray(res) ? res : res?.data || [];
      if (items.length === 0) {
        setHasMore(false);
      } else {
        setData((prev) => [...prev, ...items]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePress = useCallback(
    (id) => {
      navigation.navigate('Detail', { comicId: id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => <GridComicCard item={item} onPress={handlePress} />,
    [handlePress]
  );

  const keyExtractor = useCallback((item, index) => `${item.id}-${index}`, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Daftar Komik'}</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.gridList}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.card}>
              <Skeleton width={CARD_WIDTH} height={CARD_WIDTH * 1.4} borderRadius={10} />
              <Skeleton width={CARD_WIDTH * 0.8} height={14} style={{ marginTop: 6 }} />
              <Skeleton width={CARD_WIDTH * 0.4} height={12} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          numColumns={2}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridList}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 12 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  gridList: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
  },
  cover: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 12, 27, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  title: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 6,
  },
  meta: {
    color: COLORS.accent,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
