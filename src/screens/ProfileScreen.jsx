import iconAsset from '../../assets/icon.png';
import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { SafeAreaView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '../components/Icons';

import { COLORS } from '../constants/theme';
import { getBookmarks, toggleBookmark } from '../services/bookmark';
import { getMe, getProfile, logout } from '../services/auth';

export default function ProfileScreen({ navigation }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => { fetchAccount(); }, []);

  const fetchAccount = async () => {
    try {
      const me = await getMe();
      setUser(me.user);
      if (me.user) {
        const profile = await getProfile();
        setStats(profile.stats);
        setUser(profile.user);
        setBookmarks(await getBookmarks());
      } else { setBookmarks([]); setStats(null); }
    } catch (e) { console.error(e); }
  };

  const handleRemoveBookmark = async (comic) => {
    await toggleBookmark(comic);
    fetchAccount();
  };

  const renderBookmarkItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Detail', { comicId: item.comic_id || item.id })}
      >
        <ExpoImage
          source={{ uri: item.cover }}
          style={styles.cover}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.type || 'Manga'}</Text>
            </View>
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.badgeText}>{item.status || 'Ongoing'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleRemoveBookmark(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />

      {/* Header Profile */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <ExpoImage source={iconAsset} style={styles.avatarImage} contentFit="cover" />
        </View>
        {user ? (
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.username}</Text>
            <Text style={styles.userStatus}>{user.rank} • {user.xp} XP</Text>
            {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>Belum Login</Text>
            <Text style={styles.userStatus}>Login untuk menyimpan akun, history & bookmark</Text>
          </View>
        )}
      </View>
      {user ? (
        <TouchableOpacity style={styles.authButton} onPress={async () => { await logout(); fetchAccount(); }}>
          <Text style={styles.authButtonText}>LOGOUT</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.authButton} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.authButtonText}>LOGIN / DAFTAR</Text>
        </TouchableOpacity>
      )}
      {user && stats ? (
        <View style={styles.statsRow}>
          <Text style={styles.stat}>💬 {stats.comments}</Text><Text style={styles.stat}>👍 {stats.votes}</Text><Text style={styles.stat}>🔖 {stats.bookmarks}</Text><Text style={styles.stat}>📖 {stats.history}</Text>
        </View>
      ) : null}

      {/* Bookmark Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="bookmark" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>Favorit & Bookmark</Text>
        </View>
        <Text style={styles.bookmarkCount}>{bookmarks.length} Komik</Text>
      </View>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={56} color={COLORS.surfaceLight} />
          <Text style={styles.emptyTitle}>Belum Ada Bookmark</Text>
          <Text style={styles.emptySubtitle}>Simpan komik favoritmu untuk dibaca nanti</Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={renderBookmarkItem}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    marginLeft: 14,
  },
  userName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  userStatus: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  email: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  authButton: { marginHorizontal: 16, marginTop: 12, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  authButtonText: { color: '#fff', fontWeight: '900' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginTop: 10, paddingVertical: 12, backgroundColor: COLORS.surface, borderRadius: 12 },
  stat: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  bookmarkCount: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cover: {
    width: 55,
    height: 75,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadge: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
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
    marginTop: 14,
  },
  emptySubtitle: {
    color: COLORS.textSubtle,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
