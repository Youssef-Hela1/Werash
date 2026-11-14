import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  TextInput,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeStyles } from '../styles/ThemeContext';
import { supabase } from '../services/supabase';
import {
  resolveUserAvatar,
  subscribeProfileUpdates,
} from '../services/userProfileCache';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.58);
const EXPANDED_COMMENTS_HEIGHT = Math.round(SCREEN_HEIGHT * 0.94);

function formatTimeAgo(dateString, isRtl) {
  if (!dateString) return isRtl ? 'الآن' : 'Just now';
  const parsed = new Date(dateString);
  const timeMs = parsed.getTime();
  if (isNaN(timeMs)) return isRtl ? 'الآن' : 'Just now';
  const diffMs = Date.now() - timeMs;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return isRtl ? 'الآن' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isRtl ? `منذ ${diffMin} د` : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return isRtl ? `منذ ${diffHr} س` : `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return isRtl ? 'أمس' : 'Yesterday';
  if (diffDay < 7) return isRtl ? `منذ ${diffDay} أيام` : `${diffDay}d ago`;
  try {
    return parsed.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch (_) {
    return isRtl ? 'الآن' : 'Just now';
  }
}

export default function PostCommentsModal({
  visible = false,
  post = null,
  currentUser = null,
  selectedLanguage = 'en',
  onClose,
  onOpenUserProfile,
  onCommentCountChange,
  asModal = true,
  requireAuth = () => true,
}) {
  const isRtl = selectedLanguage === 'ar' || selectedLanguage === 'Arabic';
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const styles = useThemeStyles(createStyles);

  const [commentsList, setCommentsList] = useState([]);
  const [commentInputText, setCommentInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, author }
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const commentsScrollRef = useRef(null);
  const commentInputRef = useRef(null);
  const isCommentsExpandedRef = useRef(false);
  const commentsHeightAnim = useRef(new Animated.Value(DEFAULT_COMMENTS_HEIGHT)).current;
  const commentsSlideAnim = useRef(new Animated.Value(0)).current;

  // Track the active post ID that is currently open to prevent animation reset loops
  const activePostIdRef = useRef(null);
  const onCommentCountChangeRef = useRef(onCommentCountChange);
  useEffect(() => {
    onCommentCountChangeRef.current = onCommentCountChange;
  }, [onCommentCountChange]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const postId = post?.id;
  const myAvatarUrl =
    currentUser?.avatarUrl ||
    (typeof currentUser?.avatar === 'string'
      ? currentUser.avatar
      : currentUser?.avatar?.uri);

  // Fetch comments for the given post
  const fetchPostComments = useCallback(
    async (targetPostId, notifyCount = false) => {
      if (!targetPostId) return;
      setIsLoadingComments(true);
      try {
        const { data, error } = await supabase
          .from('community_post_comments')
          .select('*')
          .eq('post_id', targetPostId)
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Error fetching comments:', error.message);
          return;
        }

        const commentMap = new Map();
        const topLevelList = [];

        (data || []).forEach((row) => {
          const isMyComment = Boolean(
            (currentUser?.id && row.user_id === currentUser.id) ||
            (currentUser?.fullName && row.author_name === currentUser.fullName)
          );
          const resolvedAvatarSrc =
            isMyComment && myAvatarUrl
              ? { uri: myAvatarUrl }
              : resolveUserAvatar(row.user_id, row.author_avatar, row.author_name);

          const item = {
            id: row.id,
            userId: row.user_id || null,
            author: row.author_name || (isRtl ? 'مستخدم' : 'User'),
            handle: row.author_handle || '@user',
            avatar: resolvedAvatarSrc || null,
            time: formatTimeAgo(row.created_at, isRtl),
            content: row.content,
            likes: 0,
            liked: false,
            replies: [],
            parentId: row.parent_id || null,
          };
          commentMap.set(row.id, item);
          if (!row.parent_id) {
            topLevelList.push(item);
          }
        });

        (data || []).forEach((row) => {
          if (row.parent_id && commentMap.has(row.parent_id)) {
            const parent = commentMap.get(row.parent_id);
            const reply = commentMap.get(row.id);
            if (parent && reply && !parent.replies.some((r) => r.id === reply.id)) {
              parent.replies.push(reply);
            }
          }
        });

        setCommentsList(topLevelList);

        const totalCount = (data || []).length;
        if (notifyCount && onCommentCountChangeRef.current) {
          onCommentCountChangeRef.current(targetPostId, totalCount);
        }
      } catch (err) {
        console.warn('fetchPostComments exception:', err);
      } finally {
        setIsLoadingComments(false);
      }
    },
    [currentUser?.id, currentUser?.fullName, myAvatarUrl, isRtl]
  );

  // Handle open / slide up animation ONLY when newly opened or switching post
  useEffect(() => {
    if (visible && postId) {
      if (activePostIdRef.current !== postId) {
        activePostIdRef.current = postId;
        isCommentsExpandedRef.current = false;
        commentsHeightAnim.setValue(DEFAULT_COMMENTS_HEIGHT);
        commentsSlideAnim.setValue(450);
        setCommentInputText('');
        setReplyingTo(null);

        Animated.spring(commentsSlideAnim, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
          tension: 50,
        }).start();

        fetchPostComments(postId, false);
      }
    } else if (!visible) {
      activePostIdRef.current = null;
    }
  }, [visible, postId, fetchPostComments]);

  // Realtime subscription for spontaneous comments updates
  useEffect(() => {
    if (!visible || !postId) return;

    const commentsChannel = supabase
      .channel(`post_comments_rt_${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_post_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          // Spontaneously refresh comments and sync count
          fetchPostComments(postId, true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [visible, postId, fetchPostComments]);

  // Subscribe to profile cache updates to dynamically update comment avatars
  useEffect(() => {
    const unsub = subscribeProfileUpdates((updatedId, updatedProf) => {
      if (!updatedId || !updatedProf) return;
      const newAvatarUrl = updatedProf.avatar_url;
      if (!newAvatarUrl) return;

      setCommentsList((prev) =>
        prev.map((c) => {
          let updated = { ...c };
          if (c.userId === updatedId) {
            updated.avatar = { uri: newAvatarUrl };
          }
          if (c.replies && c.replies.length > 0) {
            updated.replies = c.replies.map((r) =>
              r.userId === updatedId ? { ...r, avatar: { uri: newAvatarUrl } } : r
            );
          }
          return updated;
        })
      );
    });
    return () => unsub();
  }, []);

  // Smooth close action
  const handleClose = () => {
    Animated.timing(commentsSlideAnim, {
      toValue: 600,
      duration: 180,
      useNativeDriver: false,
    }).start(() => {
      activePostIdRef.current = null;
      onCloseRef.current?.();
    });
  };

  // Drag-to-expand / drag-to-dismiss gesture for comments bottom sheet
  const commentsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderGrant: () => {
        commentsHeightAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const baseHeight = isCommentsExpandedRef.current
          ? EXPANDED_COMMENTS_HEIGHT
          : DEFAULT_COMMENTS_HEIGHT;
        const targetHeight = baseHeight - gestureState.dy;
        const clampedHeight = Math.max(140, Math.min(EXPANDED_COMMENTS_HEIGHT, targetHeight));
        commentsHeightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dy) < 5 && Math.abs(gestureState.dx) < 5) {
          const nextExpanded = !isCommentsExpandedRef.current;
          isCommentsExpandedRef.current = nextExpanded;
          Animated.spring(commentsHeightAnim, {
            toValue: nextExpanded ? EXPANDED_COMMENTS_HEIGHT : DEFAULT_COMMENTS_HEIGHT,
            useNativeDriver: false,
            friction: 8,
            tension: 50,
          }).start();
          return;
        }

        const isExpanded = isCommentsExpandedRef.current;
        if (!isExpanded) {
          if (gestureState.dy < -45 || gestureState.vy < -0.35) {
            isCommentsExpandedRef.current = true;
            Animated.spring(commentsHeightAnim, {
              toValue: EXPANDED_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }).start();
          } else if (gestureState.dy > 80 || gestureState.vy > 0.6) {
            Animated.timing(commentsHeightAnim, {
              toValue: 0,
              duration: 180,
              useNativeDriver: false,
            }).start(() => {
              activePostIdRef.current = null;
              onCloseRef.current?.();
            });
          } else {
            Animated.spring(commentsHeightAnim, {
              toValue: DEFAULT_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
            }).start();
          }
        } else {
          if (gestureState.dy > 50 || gestureState.vy > 0.35) {
            isCommentsExpandedRef.current = false;
            Animated.spring(commentsHeightAnim, {
              toValue: DEFAULT_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
              tension: 50,
            }).start();
          } else {
            Animated.spring(commentsHeightAnim, {
              toValue: EXPANDED_COMMENTS_HEIGHT,
              useNativeDriver: false,
              friction: 8,
            }).start();
          }
        }
      },
    })
  ).current;

  // Start reply to a specific comment or reply
  const handleStartReply = (comment, specificAuthor) => {
    const authorToReply = specificAuthor || comment.author;
    setReplyingTo({
      commentId: comment.id,
      author: authorToReply,
    });
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    }, 100);
  };

  // Submit comment or nested reply
  const handleSubmitComment = async () => {
    if (!requireAuth()) return;
    if (!commentInputText.trim() || !postId) return;

    const currentAuthorName = currentUser?.fullName || (isRtl ? 'مستخدم' : 'Guest User');
    const currentHandle = currentUser?.fullName
      ? `@${currentUser.fullName.toLowerCase().replace(/[\s\W]+/g, '')}`
      : '@guest';
    const commentContent = commentInputText.trim();
    const parentCommentId = replyingTo ? replyingTo.commentId : null;

    setCommentInputText('');
    setReplyingTo(null);

    const tempId = `temp_${Date.now()}`;
    const newCommentItem = {
      id: tempId,
      userId: currentUser?.id || null,
      author: currentAuthorName,
      handle: currentHandle,
      avatar: myAvatarUrl ? { uri: myAvatarUrl } : null,
      time: isRtl ? 'الآن' : 'Just now',
      content: commentContent,
      likes: 0,
      liked: false,
      replies: [],
      parentId: parentCommentId,
    };

    // Optimistic UI update
    setCommentsList((prev) => {
      if (parentCommentId) {
        return prev.map((c) => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newCommentItem],
            };
          }
          return c;
        });
      }
      return [...prev, newCommentItem];
    });

    setTimeout(() => {
      if (commentsScrollRef.current) {
        commentsScrollRef.current.scrollToEnd({ animated: true });
      }
    }, 120);

    // Save to Supabase
    if (currentUser?.id) {
      try {
        const payload = {
          post_id: postId,
          user_id: currentUser.id,
          author_name: currentAuthorName,
          author_handle: currentHandle,
          author_avatar: myAvatarUrl || null,
          content: commentContent,
        };
        if (parentCommentId) {
          payload.parent_id = parentCommentId;
        }

        const { data: insertedComment, error: insertErr } = await supabase
          .from('community_post_comments')
          .insert(payload)
          .select()
          .single();

        if (!insertErr && insertedComment) {
          // Replace tempId with actual inserted ID
          setCommentsList((prev) => {
            const replaceId = (list) =>
              list.map((c) => {
                if (c.id === tempId) return { ...c, id: insertedComment.id };
                if (c.replies?.length > 0) return { ...c, replies: replaceId(c.replies) };
                return c;
              });
            return replaceId(prev);
          });

          // Fetch exact fresh count
          const { count: freshCount } = await supabase
            .from('community_post_comments')
            .select('id', { count: 'exact', head: true })
            .eq('post_id', postId);

          const finalCommentsCount =
            typeof freshCount === 'number' ? freshCount : (post?.comments || 0) + 1;

          onCommentCountChangeRef.current?.(postId, finalCommentsCount);

          // Update community_posts table
          supabase
            .from('community_posts')
            .update({ comments_count: finalCommentsCount })
            .eq('id', postId)
            .then(() => {})
            .catch(() => {});
        } else if (insertErr) {
          console.warn('Error saving comment to Supabase:', insertErr.message);
        }
      } catch (err) {
        console.warn('handleSubmitComment exception:', err);
      }
    }
  };

  // Toggle like on a top-level comment
  const handleToggleCommentLike = (commentId) => {
    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.liked;
          return {
            ...c,
            liked: isLiked,
            likes: isLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 1) - 1),
          };
        }
        return c;
      })
    );
  };

  // Toggle like on a nested reply
  const handleToggleReplyLike = (commentId, replyId) => {
    setCommentsList((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const updatedReplies = (c.replies || []).map((r) => {
            if (r.id === replyId) {
              const isLiked = !r.liked;
              return {
                ...r,
                liked: isLiked,
                likes: isLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 1) - 1),
              };
            }
            return r;
          });
          return { ...c, replies: updatedReplies };
        }
        return c;
      })
    );
  };

  // Delete comment permission and handler
  const handleDeleteComment = (commentItem) => {
    const isCommentAuthor = Boolean(
      (currentUser?.id && commentItem.userId === currentUser.id) ||
      (currentUser?.fullName && commentItem.author === currentUser.fullName)
    );
    const isPostAuthor = Boolean(
      (currentUser?.id && post?.userId === currentUser.id) ||
      (currentUser?.fullName && post?.author === currentUser.fullName)
    );

    if (!isCommentAuthor && !isPostAuthor) return;

    Alert.alert(
      isRtl ? 'حذف التعليق' : 'Delete Comment',
      isRtl ? 'هل أنت متأكد من رغبتك في حذف هذا التعليق؟' : 'Are you sure you want to delete this comment?',
      [
        { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRtl ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic removal
            setCommentsList((prev) => {
              if (commentItem.parentId) {
                return prev.map((c) => {
                  if (c.id === commentItem.parentId) {
                    return {
                      ...c,
                      replies: (c.replies || []).filter((r) => r.id !== commentItem.id),
                    };
                  }
                  return c;
                });
              }
              return prev.filter((c) => c.id !== commentItem.id);
            });

            try {
              // Delete from Supabase
              await supabase
                .from('community_post_comments')
                .delete()
                .or(`id.eq.${commentItem.id},parent_id.eq.${commentItem.id}`);

              // Query fresh count
              const { count: freshCount } = await supabase
                .from('community_post_comments')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', postId);

              const finalCount =
                typeof freshCount === 'number'
                  ? freshCount
                  : Math.max(0, (post?.comments || 1) - 1);

              onCommentCountChangeRef.current?.(postId, finalCount);

              supabase
                .from('community_posts')
                .update({ comments_count: finalCount })
                .eq('id', postId)
                .then(() => {})
                .catch(() => {});
            } catch (delErr) {
              console.warn('Error deleting comment:', delErr);
            }
          },
        },
      ]
    );
  };

  // Compute total count of comments and replies
  const totalCommentsCount = commentsList.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  const displayCount =
    totalCommentsCount > 0
      ? totalCommentsCount
      : post?.comments || post?.commentsCount || 0;

  if (!visible && !post) return null;

  const sheetContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.commentsBackdrop}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
      />

      <Animated.View
        style={[
          styles.commentsSheetContainer,
          {
            height: commentsHeightAnim,
            transform: [{ translateY: commentsSlideAnim }],
          },
        ]}
      >
        {/* Draggable Handle Bar Area */}
        <View style={styles.commentsHandleArea} {...commentsPanResponder.panHandlers}>
          <View style={styles.commentsHandleBar} />
        </View>

        {/* Header */}
        <View style={[styles.commentsHeader, isRtl && styles.commentsHeaderRtl]}>
          <View style={[styles.commentsHeaderTitleGroup, isRtl && styles.commentsHeaderTitleGroupRtl]}>
            <Text style={styles.commentsHeaderTitle}>
              {isRtl ? 'التعليقات' : 'Comments'}
            </Text>
            <View style={[styles.commentsCountBadge, isRtl && styles.commentsCountBadgeRtl]}>
              <Text style={styles.commentsCountBadgeText}>{displayCount}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.commentsCloseBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        {/* Comments List Scroll */}
        <ScrollView
          ref={commentsScrollRef}
          style={styles.commentsListScroll}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoadingComments && commentsList.length === 0 ? (
            <View style={styles.emptyCommentsBox}>
              <ActivityIndicator size="small" color={colors.activeHighlight} />
              <Text style={[styles.emptyCommentsSubtitle, { marginTop: 12 }]}>
                {isRtl ? 'جاري تحميل التعليقات...' : 'Loading comments...'}
              </Text>
            </View>
          ) : commentsList.length === 0 ? (
            <View style={styles.emptyCommentsBox}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.mutedDecor} />
              <Text style={styles.emptyCommentsTitle}>
                {isRtl ? 'لا توجد تعليقات بعد' : 'No comments yet'}
              </Text>
              <Text style={styles.emptyCommentsSubtitle}>
                {isRtl
                  ? 'كن أول من يشارك برأيه حول هذا المنشور!'
                  : 'Be the first to share your thoughts on this post!'}
              </Text>
            </View>
          ) : (
            commentsList.map((c) => {
              const canDeleteComment = Boolean(
                (currentUser?.id && c.userId === currentUser.id) ||
                (currentUser?.fullName && c.author === currentUser.fullName) ||
                (currentUser?.id && post?.userId === currentUser.id)
              );

              return (
                <View key={c.id} style={[styles.commentItemRow, isRtl && styles.commentItemRowRtl]}>
                  {/* Comment Avatar */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      onOpenUserProfile &&
                      onOpenUserProfile({
                        userId: c.userId,
                        author: c.author,
                        avatar: c.avatar,
                      })
                    }
                  >
                    {c.avatar ? (
                      <Image source={c.avatar} style={styles.commentAvatar} />
                    ) : (
                      <View style={styles.commentAvatarIcon}>
                        <Ionicons name="person" size={15} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Comment Bubble & Meta */}
                  <View
                    style={[
                      styles.commentBubbleContainer,
                      isRtl ? { marginRight: 10, alignItems: 'flex-end' } : { marginLeft: 10 },
                    ]}
                  >
                    <TouchableOpacity
                      activeOpacity={canDeleteComment ? 0.85 : 1}
                      onLongPress={() => canDeleteComment && handleDeleteComment(c)}
                      delayLongPress={450}
                      style={styles.commentBubble}
                    >
                      <View style={[styles.commentAuthorRow, isRtl && styles.commentAuthorRowRtl]}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() =>
                            onOpenUserProfile &&
                            onOpenUserProfile({
                              userId: c.userId,
                              author: c.author,
                              avatar: c.avatar,
                            })
                          }
                        >
                          <Text style={[styles.commentAuthorName, isRtl && { textAlign: 'right' }]}>
                            {c.author}
                          </Text>
                        </TouchableOpacity>

                        {canDeleteComment && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(c)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            style={styles.commentDeleteIconBtn}
                          >
                            <Ionicons name="trash-outline" size={13} color={colors.secondaryText} />
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={[styles.commentBodyText, isRtl && { textAlign: 'right' }]}>
                        {c.content}
                      </Text>
                    </TouchableOpacity>

                    {/* Time, Reply & Like */}
                    <View style={[styles.commentMetaRow, isRtl && styles.commentMetaRowRtl]}>
                      <Text style={styles.commentTimeText}>{c.time}</Text>
                      <TouchableOpacity
                        style={styles.commentReplyBtn}
                        activeOpacity={0.7}
                        onPress={() => handleStartReply(c)}
                      >
                        <Text style={styles.commentReplyBtnText}>
                          {isRtl ? 'رد' : 'Reply'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.commentLikeBtn, isRtl && styles.commentLikeBtnRtl]}
                        activeOpacity={0.7}
                        onPress={() => handleToggleCommentLike(c.id)}
                      >
                        <Ionicons
                          name={c.liked ? 'heart' : 'heart-outline'}
                          size={13}
                          color={c.liked ? '#E0245E' : colors.mutedDecor}
                        />
                        {c.likes > 0 && (
                          <Text
                            style={[
                              styles.commentLikeCount,
                              c.liked && { color: '#E0245E' },
                            ]}
                          >
                            {c.likes}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Nested Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <View
                        style={[
                          styles.repliesListContainer,
                          isRtl && styles.repliesListContainerRtl,
                        ]}
                      >
                        {c.replies.map((reply) => {
                          const canDeleteReply = Boolean(
                            (currentUser?.id && reply.userId === currentUser.id) ||
                            (currentUser?.fullName && reply.author === currentUser.fullName) ||
                            (currentUser?.id && post?.userId === currentUser.id)
                          );

                          return (
                            <View
                              key={reply.id}
                              style={[styles.replyItemRow, isRtl && styles.replyItemRowRtl]}
                            >
                              <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() =>
                                  onOpenUserProfile &&
                                  onOpenUserProfile({
                                    userId: reply.userId,
                                    author: reply.author,
                                    avatar: reply.avatar,
                                  })
                                }
                              >
                                {reply.avatar ? (
                                  <Image source={reply.avatar} style={styles.replyAvatar} />
                                ) : (
                                  <View style={styles.replyAvatarIcon}>
                                    <Ionicons name="person" size={12} color="#FFFFFF" />
                                  </View>
                                )}
                              </TouchableOpacity>

                              <View
                                style={[
                                  styles.replyBubbleContainer,
                                  isRtl
                                    ? { marginRight: 8, alignItems: 'flex-end' }
                                    : { marginLeft: 8 },
                                ]}
                              >
                                <TouchableOpacity
                                  activeOpacity={canDeleteReply ? 0.85 : 1}
                                  onLongPress={() => canDeleteReply && handleDeleteComment(reply)}
                                  delayLongPress={450}
                                  style={styles.replyBubble}
                                >
                                  <View
                                    style={[
                                      styles.commentAuthorRow,
                                      isRtl && styles.commentAuthorRowRtl,
                                    ]}
                                  >
                                    <TouchableOpacity
                                      activeOpacity={0.8}
                                      onPress={() =>
                                        onOpenUserProfile &&
                                        onOpenUserProfile({
                                          userId: reply.userId,
                                          author: reply.author,
                                          avatar: reply.avatar,
                                        })
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.replyAuthorName,
                                          isRtl && { textAlign: 'right' },
                                        ]}
                                      >
                                        {reply.author}
                                      </Text>
                                    </TouchableOpacity>

                                    {canDeleteReply && (
                                      <TouchableOpacity
                                        onPress={() => handleDeleteComment(reply)}
                                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                        style={styles.commentDeleteIconBtn}
                                      >
                                        <Ionicons
                                          name="trash-outline"
                                          size={12}
                                          color={colors.secondaryText}
                                        />
                                      </TouchableOpacity>
                                    )}
                                  </View>

                                  <Text
                                    style={[
                                      styles.replyBodyText,
                                      isRtl && { textAlign: 'right' },
                                    ]}
                                  >
                                    {reply.content}
                                  </Text>
                                </TouchableOpacity>

                                <View
                                  style={[
                                    styles.commentMetaRow,
                                    isRtl && styles.commentMetaRowRtl,
                                  ]}
                                >
                                  <Text style={styles.commentTimeText}>{reply.time}</Text>
                                  <TouchableOpacity
                                    style={styles.commentReplyBtn}
                                    activeOpacity={0.7}
                                    onPress={() => handleStartReply(c, reply.author)}
                                  >
                                    <Text style={styles.commentReplyBtnText}>
                                      {isRtl ? 'رد' : 'Reply'}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.commentLikeBtn,
                                      isRtl && styles.commentLikeBtnRtl,
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => handleToggleReplyLike(c.id, reply.id)}
                                  >
                                    <Ionicons
                                      name={reply.liked ? 'heart' : 'heart-outline'}
                                      size={12}
                                      color={reply.liked ? '#E0245E' : colors.mutedDecor}
                                    />
                                    {reply.likes > 0 && (
                                      <Text
                                        style={[
                                          styles.commentLikeCount,
                                          reply.liked && { color: '#E0245E' },
                                        ]}
                                      >
                                        {reply.likes}
                                      </Text>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Replying To Banner */}
        {replyingTo && (
          <View style={[styles.replyingToBanner, isRtl && styles.replyingToBannerRtl]}>
            <View style={[styles.replyingToLeft, isRtl && styles.replyingToLeftRtl]}>
              <Ionicons
                name="arrow-undo-outline"
                size={14}
                color={colors.activeHighlight}
                style={isRtl ? { marginLeft: 5 } : { marginRight: 5 }}
              />
              <Text style={styles.replyingToText}>
                {isRtl ? `الرد على ${replyingTo.author}` : `Replying to ${replyingTo.author}`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setReplyingTo(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.cancelReplyBtn}
            >
              <Ionicons name="close-circle" size={17} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Comment Input Footer */}
        <View
          style={[
            styles.commentInputContainer,
            { paddingBottom: Math.max(insets?.bottom || 0, Platform.OS === 'ios' ? 16 : 10) },
            isRtl && styles.commentInputContainerRtl,
          ]}
        >
          {/* Current User Avatar */}
          {myAvatarUrl ? (
            <Image
              source={{ uri: myAvatarUrl }}
              style={styles.commentInputUserAvatarImage}
            />
          ) : (
            <View style={styles.commentInputUserAvatar}>
              <Ionicons name="person" size={14} color="#FFFFFF" />
            </View>
          )}

          <View style={[styles.commentInputWrapper, isRtl && styles.commentInputWrapperRtl]}>
            <TextInput
              ref={commentInputRef}
              style={[styles.commentTextInput, isRtl && { textAlign: 'right' }]}
              placeholder={
                replyingTo
                  ? isRtl
                    ? `رد على ${replyingTo.author}...`
                    : `Reply to ${replyingTo.author}...`
                  : isRtl
                  ? 'اكتب تعليقاً...'
                  : 'Add a comment...'
              }
              placeholderTextColor={colors.secondaryText}
              value={commentInputText}
              onChangeText={setCommentInputText}
              multiline={true}
              maxLength={400}
            />

            <TouchableOpacity
              style={[
                styles.commentSendBtn,
                !commentInputText.trim() && styles.commentSendBtnDisabled,
                isRtl && { marginLeft: 0, marginRight: 6 },
              ]}
              disabled={!commentInputText.trim()}
              activeOpacity={0.8}
              onPress={handleSubmitComment}
            >
              <Ionicons
                name="send"
                size={14}
                color={commentInputText.trim() ? '#FFFFFF' : colors.mutedDecor}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );

  if (asModal) {
    return (
      <Modal
        visible={Boolean(visible && post)}
        animationType="none"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        {sheetContent}
      </Modal>
    );
  }

  return Boolean(visible && post) ? (
    <View style={styles.nonModalContainer} pointerEvents="box-none">
      {sheetContent}
    </View>
  ) : null;
}

const createStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    nonModalContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      elevation: 9999,
    },
    commentsBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    commentsSheetContainer: {
      width: '100%',
      backgroundColor: colors.elevatedBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1.5,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.cardBorder,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: isDarkMode ? 0.35 : 0.12,
      shadowRadius: 14,
      elevation: 20,
      overflow: 'hidden',
    },
    commentsHandleArea: {
      width: '100%',
      paddingTop: 12,
      paddingBottom: 10,
      minHeight: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentsHandleBar: {
      width: 48,
      height: 5,
      borderRadius: 3,
      backgroundColor: isDarkMode ? 'rgba(242, 245, 242, 0.35)' : 'rgba(0, 0, 0, 0.22)',
    },
    commentsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    commentsHeaderRtl: {
      flexDirection: 'row-reverse',
    },
    commentsHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    commentsHeaderTitleGroupRtl: {
      flexDirection: 'row-reverse',
    },
    commentsHeaderTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primaryText,
    },
    commentsCountBadge: {
      backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.35)' : 'rgba(55, 99, 59, 0.10)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    commentsCountBadgeRtl: {
      marginLeft: 0,
      marginRight: 8,
    },
    commentsCountBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.activeHighlight,
    },
    commentsCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentsListScroll: {
      flex: 1,
    },
    emptyCommentsBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      paddingHorizontal: 24,
    },
    emptyCommentsTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      marginTop: 14,
    },
    emptyCommentsSubtitle: {
      fontSize: 12.5,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 5,
      maxWidth: 240,
      lineHeight: 18,
    },
    commentItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 14,
    },
    commentItemRowRtl: {
      flexDirection: 'row-reverse',
    },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    commentAvatarIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentBubbleContainer: {
      flex: 1,
    },
    commentBubble: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxWidth: '95%',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    commentAuthorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    commentAuthorRowRtl: {
      flexDirection: 'row-reverse',
    },
    commentAuthorName: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.primaryText,
    },
    commentDeleteIconBtn: {
      padding: 2,
      opacity: 0.7,
    },
    commentBodyText: {
      fontSize: 13,
      color: colors.primaryText,
      lineHeight: 18,
    },
    commentMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 5,
      paddingHorizontal: 6,
      gap: 14,
    },
    commentMetaRowRtl: {
      flexDirection: 'row-reverse',
    },
    commentTimeText: {
      fontSize: 11,
      color: colors.secondaryText,
    },
    commentLikeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    commentLikeBtnRtl: {
      flexDirection: 'row-reverse',
    },
    commentLikeCount: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.secondaryText,
    },
    commentReplyBtn: {
      paddingVertical: 1,
      paddingHorizontal: 2,
    },
    commentReplyBtnText: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.activeHighlight,
    },
    repliesListContainer: {
      marginTop: 10,
      marginLeft: 8,
      paddingLeft: 12,
      borderLeftWidth: 1.5,
      borderLeftColor: colors.cardBorder,
    },
    repliesListContainerRtl: {
      borderLeftWidth: 0,
      borderRightWidth: 1.5,
      paddingLeft: 0,
      paddingRight: 12,
      marginLeft: 0,
      marginRight: 8,
    },
    replyItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 10,
    },
    replyItemRowRtl: {
      flexDirection: 'row-reverse',
    },
    replyAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    replyAvatarIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    replyBubbleContainer: {
      flex: 1,
    },
    replyBubble: {
      backgroundColor: isDarkMode ? '#171E1A' : '#E8ECE9',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      maxWidth: '96%',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    replyAuthorName: {
      fontSize: 11.5,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 2,
    },
    replyBodyText: {
      fontSize: 12.5,
      color: colors.primaryText,
      lineHeight: 17,
    },
    replyingToBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.25)' : 'rgba(55, 99, 59, 0.08)',
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    replyingToBannerRtl: {
      flexDirection: 'row-reverse',
    },
    replyingToLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    replyingToLeftRtl: {
      flexDirection: 'row-reverse',
    },
    replyingToText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.activeHighlight,
    },
    cancelReplyBtn: {
      padding: 3,
    },
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      backgroundColor: colors.elevatedBg,
    },
    commentInputContainerRtl: {
      flexDirection: 'row-reverse',
    },
    commentInputUserAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentInputUserAvatarImage: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    commentInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 8 : 4,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginLeft: 10,
    },
    commentInputWrapperRtl: {
      flexDirection: 'row-reverse',
      marginLeft: 0,
      marginRight: 10,
    },
    commentTextInput: {
      flex: 1,
      fontSize: 13.5,
      color: colors.primaryText,
      maxHeight: 80,
      paddingVertical: 2,
    },
    commentSendBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.forestGreen,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    commentSendBtnDisabled: {
      backgroundColor: isDarkMode ? 'rgba(48, 87, 52, 0.35)' : 'rgba(55, 99, 59, 0.20)',
    },
  });
