import React, { useState, useEffect, memo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '../components/Icons';
import { COLORS } from '../constants/theme';
import { searchManga } from '../services/api';
import Skeleton from '../components/Skeleton';

const SearchResultCard = memo(({ item, onPress }) => (
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
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      {Boolean(item.alternative_title) && (
        <Text style={styles.author} numberOfLines={1}>
          {item.alternative_title}
        </Text>
      )}
      <View style={styles.metaRow}>
        <View style={styles.typeTag}>
          <Text style={styles.typeText}>{item.type || 'Manga'}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
));

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await searchManga(query);
        const list = res?.data ? res.data : Array.isArray(res) ? res : [];
        setResults(list);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handlePress = useCallback(
    (id) => {
      navigation.navigate('Detail', { comicId: id });
    },
    [navigation]
  );

  const renderComicItem = useCallback(
    ({ item }) => <SearchResultCard item={item} onPress={handlePress} />,
    [handlePress]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />

      {/* Top Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari komik..."
            placeholderTextColor={COLORS.textSubtle}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Body */}
      {isSearching ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.card}>
              <Skeleton width={70} height={95} borderRadius={8} />
              <View style={styles.info}>
                <Skeleton width={140} height={16} />
                <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
                <Skeleton width={100} height={16} style={{ marginTop: 8 }} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : query.trim() === '' ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={60} color={COLORS.surfaceLight} />
          <Text style={styles.emptyTitle}>Cari Komik Favoritmu</Text>
          <Text style={styles.emptySubtitle}>Ketik judul komik di atas</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sad-outline" size={60} color={COLORS.surfaceLight} />
          <Text style={styles.emptyTitle}>Komik Tidak Ditemukan</Text>
          <Text style={styles.emptySubtitle}>Coba kata kunci lain seperti "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderComicItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    marginRight: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cover: {
    width: 70,
    height: 95,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  author: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  typeTag: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.textSubtle,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
