import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { SafeAreaView } from 'react-native';

import { Ionicons } from '../components/Icons';
import { COLORS } from '../constants/theme';
import { getHistory, clearHistory } from '../services/history';
import { getMangaChapters } from '../services/api';

const HistoryItem = memo(({ item, onPress }) => {
  const formattedDate = new Date(item.updatedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
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
          {item.comicTitle}
        </Text>
        <View style={styles.chapterBadge}>
          <Text style={styles.chapterText}>Terakhir Baca: Chapter {item.chapterNumber}</Text>
        </View>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.accent} />
    </TouchableOpacity>
  );
});

export default function HistoryScreen({ navigation }) {
  const [historyList, setHistoryList] = useState([]);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    const list = await getHistory();
    setHistoryList(list);
  };

  const handleClear = () => {
    Alert.alert('Hapus Riwayat', 'Apakah kamu yakin ingin menghapus seluruh riwayat bacaan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistoryList([]);
        },
      },
    ]);
  };

  const handleComicPress = useCallback(
    async (item) => {
      let chapters = item.chapters;
      if (!chapters || chapters.length === 0) {
        try {
          chapters = await getMangaChapters(item.comicId);
        } catch (err) {
          console.error(err);
          chapters = [];
        }
      }
      navigation.navigate('Reader', {
        comicId: item.comicId,
        comicTitle: item.comicTitle,
        cover: item.cover,
        chapterId: item.chapterId,
        chapters,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => <HistoryItem item={item} onPress={handleComicPress} />,
    [handleComicPress]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Bacaan</Text>
        {historyList.length > 0 ? (
          <TouchableOpacity style={styles.iconBtn} onPress={handleClear}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* List / Empty State */}
      {historyList.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={COLORS.surfaceLight} />
          <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
          <Text style={styles.emptySubtitle}>Komik yang kamu baca akan muncul di sini</Text>
        </View>
      ) : (
        <FlatList
          data={historyList}
          keyExtractor={(item) => item.comicId}
          renderItem={renderItem}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cover: {
    width: 60,
    height: 85,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  chapterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  chapterText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
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
