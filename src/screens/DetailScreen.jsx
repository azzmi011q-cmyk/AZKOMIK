import React, { useState, useEffect, memo } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import ExpoImage from '../components/ExpoImage';
import { SafeAreaView } from 'react-native';
import { Ionicons } from '../components/Icons';
import { COLORS } from '../constants/theme';
import { getMangaDetail, getMangaChapters, isCached } from '../services/api';
import { isComicBookmarked, toggleBookmark } from '../services/bookmark';
import { DetailSkeleton } from '../components/Skeleton';
import { getComments, addComment, getComicVotes, voteComic } from '../services/community';

export default function DetailScreen({ route, navigation }) {
  const { comicId } = route.params;
  const [loading, setLoading] = useState(true);
  const [comic, setComic] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1 });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [votes, setVotes] = useState({ up: 0, middle: 0, down: 0 });
  const [myVote, setMyVote] = useState(null);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetchDetailAndChapters(1);
    checkBookmark();
    loadCommunity();
    checkLogin();
  }, [comicId]);

  const checkLogin = async () => {
    try { const res = await fetch('/api/auth/me', { credentials: 'include' }); setLoggedIn(Boolean(res.ok && (await res.json()).user)); } catch { setLoggedIn(false); }
  };

  const checkBookmark = async () => {
    try { const bookmarked = await isComicBookmarked(comicId); setIsBookmarked(bookmarked); } catch { setIsBookmarked(false); }
  };

  const handleToggleBookmark = async () => {
    if (comic) {
      try { const status = await toggleBookmark(comic); setIsBookmarked(status); } catch (e) { Alert.alert('Login diperlukan', e.message); navigation.navigate('Auth'); }
    }
  };

  const loadCommunity = async () => {
    const [commentData, voteData] = await Promise.all([
      getComments(comicId),
      getComicVotes(comicId),
    ]);
    setComments(commentData);
    setVotes(voteData.totals);
    setMyVote(voteData.myVote);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || communityBusy) return;
    setCommunityBusy(true);
    let comment;
    try { comment = await addComment({ comicId, text: commentText }); } catch (e) { Alert.alert('Login diperlukan', e.message); navigation.navigate('Auth'); }
    if (comment) {
      setComments((current) => [comment, ...current]);
      setCommentText('');
    }
    setCommunityBusy(false);
  };

  const handleVote = async (type) => {
    if (communityBusy) return;
    setCommunityBusy(true);
    try { const result = await voteComic(comicId, type); setVotes(result.totals); setMyVote(result.myVote); } catch (e) { Alert.alert('Login diperlukan', e.message); navigation.navigate('Auth'); } finally { setCommunityBusy(false); }
  };

  const fetchDetailAndChapters = async (targetPage = 1) => {
    try {
      const detailKey = `/manga/${comicId}`;
      const chaptersKey = `/chapters/${comicId}?page=${targetPage}`;
      if (!isCached(detailKey) || !isCached(chaptersKey)) {
        setLoading(true);
      }
      const [detailData, chaptersRes] = await Promise.all([
        getMangaDetail(comicId),
        getMangaChapters(comicId, targetPage),
      ]);
      setComic(detailData);
      if (chaptersRes && chaptersRes.data) {
        setChapters(chaptersRes.data);
        setPagination(chaptersRes.pagination || { current_page: targetPage, total_pages: 1 });
      } else if (Array.isArray(chaptersRes)) {
        setChapters(chaptersRes);
      }
      setPage(targetPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages && newPage !== page) {
      fetchDetailAndChapters(newPage);
    }
  };

  const genres = comic?.manga_genres?.map((g) => g.genres?.name).filter(Boolean) || [];
  const authors = comic?.manga_authors?.map((a) => a.authors?.name).filter(Boolean).join(', ') || 'Unknown';

  if (loading) {
    return <DetailSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="light-content" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {comic?.title || 'Detail Komik'}
        </Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleToggleBookmark}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isBookmarked ? COLORS.primary : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {comic ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Banner & Cover Section */}
          <View style={styles.heroSection}>
            <ExpoImage
              source={{ uri: comic.banner || comic.cover }}
              style={styles.bannerImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              allowDownsampling={true}
            />
            <View style={styles.bannerOverlay} />
            <View style={styles.comicMetaRow}>
              <ExpoImage
                source={{ uri: comic.cover }}
                style={styles.coverImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                allowDownsampling={true}
                recyclingKey={comic.cover}
              />
              <View style={styles.metaInfo}>
                <Text style={styles.title}>{comic.title}</Text>
                <Text style={styles.author}>Penulis: {authors}</Text>
                
                <View style={styles.badgeRow}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{comic.status || 'Ongoing'}</Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{comic.type || 'Manga'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Action Button */}
          {chapters.length > 0 && (
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('Reader', {
                    comicId: comic.id,
                    comicTitle: comic.title,
                    cover: comic.cover,
                    chapterId: chapters[chapters.length - 1].id,
                    chapters,
                  })
                }
              >
                <Ionicons name="book-outline" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>
                  Baca Dari Awal (Ch. {chapters[chapters.length - 1].chapter_number})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Genres */}
          {genres.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genre</Text>
              <View style={styles.genreRow}>
                {genres.map((genre, idx) => (
                  <View key={idx} style={styles.genreTag}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Synopsis */}
          {Boolean(comic.description) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sinopsis</Text>
              <Text style={styles.synopsisText}>{comic.description}</Text>
            </View>
          )}

          {/* Public Community: votes + comments are separated per comic */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dukung Komik</Text>
            <View style={styles.voteRow}>
              <TouchableOpacity
                style={[styles.voteButton, myVote === 'up' && styles.voteButtonActive]}
                onPress={() => handleVote('up')}
                activeOpacity={0.8}
              >
                <Ionicons name="thumbs-up" size={18} color={COLORS.text} />
                <Text style={styles.voteLabel}>UP</Text>
                <Text style={styles.voteCount}>{votes.up}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.voteButton, myVote === 'middle' && styles.voteButtonActive]}
                onPress={() => handleVote('middle')}
                activeOpacity={0.8}
              >
                <Ionicons name="remove-circle" size={18} color={COLORS.text} />
                <Text style={styles.voteLabel}>Middling</Text>
                <Text style={styles.voteCount}>{votes.middle}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.voteButton, myVote === 'down' && styles.voteButtonActive]}
                onPress={() => handleVote('down')}
                activeOpacity={0.8}
              >
                <Ionicons name="thumbs-down" size={18} color={COLORS.text} />
                <Text style={styles.voteLabel}>DOWN</Text>
                <Text style={styles.voteCount}>{votes.down}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.communityHint}>
              Total vote komik ini: {votes.up + votes.middle + votes.down}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Komentar (PUBLIC)</Text>
            <View style={styles.rulesBox}>
              <Text style={styles.rulesTitle}>⚠️ Rules Komentar Web AZKOM</Text>
              <Text style={styles.rulesText}>🚫 Dilarang toxic, rasis, atau menimbulkan kerusuhan. Laporkan, jangan ikut kerusuhan.</Text>
              <Text style={styles.rulesText}>🙈 Dilarang foto profil cabul/tidak senonoh.</Text>
              <Text style={styles.rulesText}>📵 Dilarang mengirim foto atau GIF cabul/tidak senonoh.</Text>
              <Text style={styles.rulesText}>🏛️ DILARANG komentar soal politik.</Text>
              <Text style={styles.rulesText}>📚 Gunakan spoiler sesuai tutorial.</Text>
              <Text style={styles.rulesText}>🤫 DILARANG spoiler ending. Maksimal 1–2 chapter ke depan.</Text>
              <Text style={styles.rulesText}>💬 Dilarang spam komentar untuk leveling. Spam/emot berulang dapat dibanned.</Text>
              <Text style={styles.rulesText}>🔒 Pelanggaran dapat menyebabkan ban permanen tanpa peringatan.</Text>
            </View>
            {!loggedIn && <TouchableOpacity onPress={() => navigation.navigate('Auth')}><Text style={styles.loginPrompt}>Login untuk berkomentar dan vote</Text></TouchableOpacity>}
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Tulis komentar tentang komik ini..."
              placeholderTextColor={COLORS.textMuted}
              style={[styles.commentInput, styles.commentBox]}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.commentButton, (!commentText.trim() || communityBusy) && styles.commentButtonDisabled]}
              disabled={!commentText.trim() || communityBusy}
              onPress={handleAddComment}
            >
              <Ionicons name="send" size={16} color={COLORS.text} />
              <Text style={styles.commentButtonText}>Kirim Komentar</Text>
            </TouchableOpacity>

            {comments.length === 0 ? (
              <Text style={styles.emptyComment}>Belum ada komentar untuk komik ini.</Text>
            ) : (
              comments.map((item) => (
                <View key={item.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentName}>{item.username}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              ))
            )}
          </View>

          {/* Chapter List */}
          <View style={styles.section}>
            <View style={styles.chapterHeaderRow}>
              <Text style={styles.sectionTitle}>Daftar Chapter</Text>
              <Text style={styles.chapterCount}>Halaman {page} dari {pagination.total_pages}</Text>
            </View>

            {chapters.map((ch) => (
              <TouchableOpacity
                key={ch.id}
                style={styles.chapterCard}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Reader', {
                    comicId: comic.id,
                    comicTitle: comic.title,
                    cover: comic.cover,
                    chapterId: ch.id,
                    chapters,
                  })
                }
              >
                <View>
                  <Text style={styles.chapterTitle}>Chapter {ch.chapter_number}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
              </TouchableOpacity>
            ))}

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  disabled={page === 1}
                  onPress={() => handlePageChange(page - 1)}
                >
                  <Ionicons name="chevron-back" size={16} color={COLORS.text} />
                  <Text style={styles.pageBtnText}>Prev</Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  {page} / {pagination.total_pages}
                </Text>

                <TouchableOpacity
                  style={[styles.pageBtn, page === pagination.total_pages && styles.pageBtnDisabled]}
                  disabled={page === pagination.total_pages}
                  onPress={() => handlePageChange(page + 1)}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      ) : null}
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
  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
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
  scrollContent: {
    paddingBottom: 30,
  },
  heroSection: {
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 12, 27, 0.65)',
  },
  comicMetaRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -60,
    alignItems: 'flex-end',
  },
  coverImage: {
    width: 110,
    height: 160,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: COLORS.background,
    backgroundColor: COLORS.surface,
  },
  metaInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'flex-end',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  author: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  statusText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genreText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  synopsisText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  rulesBox: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  rulesTitle: { color: COLORS.text, fontWeight: '900', marginBottom: 8 },
  rulesText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 4 },
  loginPrompt: { color: '#B38CFF', fontWeight: '800', marginBottom: 10 },
  voteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    flex: 1,
    minHeight: 78,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  voteButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  voteLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  voteCount: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  communityHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 8,
  },
  commentBox: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  commentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentButtonDisabled: {
    opacity: 0.5,
  },
  commentButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 7,
  },
  emptyComment: {
    color: COLORS.textMuted,
    fontSize: 12,
    paddingVertical: 8,
  },
  commentCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  commentDate: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  commentText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  chapterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chapterCount: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  chapterCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chapterTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageBtnDisabled: {
    backgroundColor: COLORS.surfaceLight,
    opacity: 0.5,
  },
  pageBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  pageIndicator: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
