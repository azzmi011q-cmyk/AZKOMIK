import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '../components/Icons';
import { COLORS } from '../constants/theme';
import { getChapterPages, isCached } from '../services/api';
import { saveHistory } from '../services/history';
import { ReaderSkeleton } from '../components/Skeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const heightCache = new Map();

const ReaderPageItem = memo(({ uri, onPress }) => {
  const [height, setHeight] = useState(() => heightCache.get(uri) || SCREEN_WIDTH * 1.4);

  const handleLoad = useCallback((e) => {
    if (e.source?.width && e.source?.height) {
      const calculatedHeight = (SCREEN_WIDTH / e.source.width) * e.source.height;
      heightCache.set(uri, calculatedHeight);
      setHeight(calculatedHeight);
    }
  }, [uri]);

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress}>
      <ExpoImage
        source={{ uri }}
        style={{
          width: SCREEN_WIDTH,
          height,
          backgroundColor: '#000000',
        }}
        contentFit="contain"
        cachePolicy="memory-disk"
        allowDownsampling={true}
        recyclingKey={uri}
        onLoad={handleLoad}
      />
    </TouchableOpacity>
  );
});

export default function ReaderScreen({ route, navigation }) {
  const { comicTitle, chapterId: initialChapterId, chapters, comicId, cover } = route.params;
  const flatListRef = useRef(null);
  const [currentChapterId, setCurrentChapterId] = useState(initialChapterId);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);

  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);
  const currentChapter = chapters[currentIndex];

  const prevChapter = chapters[currentIndex + 1];
  const nextChapter = chapters[currentIndex - 1];

  useEffect(() => {
    fetchPages();
  }, [currentChapterId]);

  const fetchPages = async () => {
    try {
      if (!isCached(`/read/${currentChapterId}`)) {
        setLoading(true);
      }
      const data = await getChapterPages(currentChapterId);
      setPages(Array.isArray(data) ? data : []);

      if (currentChapter) {
        saveHistory({
          comicId,
          comicTitle,
          cover,
          chapterId: currentChapterId,
          chapterNumber: currentChapter.chapter_number,
          chapters,
        });
      }
    } catch (err) {
      console.error(err);
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const goToChapter = useCallback((targetChapter) => {
    if (targetChapter) {
      setCurrentChapterId(targetChapter.id);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const renderItem = useCallback(({ item }) => {
    const uri = typeof item === 'string' ? item : item?.url;
    return <ReaderPageItem uri={uri} onPress={toggleControls} />;
  }, [toggleControls]);

  const keyExtractor = useCallback(
    (item, index) => `${currentChapterId}-page-${index}`,
    [currentChapterId]
  );

  if (loading) {
    return <ReaderSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={!showControls} backgroundColor={COLORS.background} barStyle="light-content" />

      {/* Top Controls Header */}
      {showControls && (
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.comicTitle} numberOfLines={1}>
              {comicTitle}
            </Text>
            <Text style={styles.chapterTitle}>
              Chapter {currentChapter?.chapter_number || ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="options-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* FlatList Virtualized Canvas Reader */}
      {Array.isArray(pages) && pages.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={pages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          removeClippedSubviews={false}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.accent} />
          <Text style={styles.errorText}>Gagal memuat gambar chapter.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPages}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Scroll Controls */}
      {showControls && Array.isArray(pages) && pages.length > 0 && (
        <View style={styles.floatingControls}>
          <TouchableOpacity style={styles.floatingBtn} activeOpacity={0.8} onPress={scrollToTop}>
            <Ionicons name="arrow-up" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn} activeOpacity={0.8} onPress={scrollToBottom}>
            <Ionicons name="arrow-down" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Controls Bar */}
      {showControls && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.navBtn, !prevChapter && styles.navBtnDisabled]}
            disabled={!prevChapter}
            onPress={() => goToChapter(prevChapter)}
          >
            <Ionicons name="chevron-back" size={16} color={COLORS.text} />
            <Text style={styles.navBtnText}>Prev</Text>
          </TouchableOpacity>

          <View style={styles.chapterIndicator}>
            <Text style={styles.indicatorText}>
              Ch. {currentChapter?.chapter_number || ''}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.navBtn, !nextChapter && styles.navBtnDisabled]}
            disabled={!nextChapter}
            onPress={() => goToChapter(nextChapter)}
          >
            <Text style={styles.navBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 12) + 6 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  comicTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  chapterTitle: {
    color: COLORS.accent,
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navBtnDisabled: {
    backgroundColor: COLORS.surfaceLight,
    opacity: 0.5,
  },
  navBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  chapterIndicator: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  indicatorText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  errorText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  floatingControls: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    zIndex: 20,
    flexDirection: 'column',
    gap: 10,
  },
  floatingBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(29, 23, 54, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
