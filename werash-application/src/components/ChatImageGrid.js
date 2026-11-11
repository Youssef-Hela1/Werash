import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.70), 264);
const GAP = 4;
const RADIUS = 14;

export default function ChatImageGrid({
  images = [],
  onImagePress,
  onLongPress,
  isRTL = false,
  uploading = false,
  uploadProgress = 0,
  uploadError = false,
  onRetry,
  width,
  borderRadius,
}) {
  if (!images || images.length === 0) return null;

  const count = images.length;
  const gridW = width || GRID_WIDTH;
  const scale = width ? width / GRID_WIDTH : 1;
  const resolvedRadius = borderRadius !== undefined ? borderRadius : RADIUS;
  const h1 = width ? Math.round(195 * scale) : 195;
  const h2 = width ? Math.round(155 * scale) : 155;
  const h3 = width ? Math.round(190 * scale) : 190;
  const h4 = width ? Math.round(200 * scale) : 200;

  const renderThumbnail = (uri, index, thumbW, thumbH, isMoreOverlay = false, moreCount = 0) => {
    return (
      <TouchableOpacity
        key={`thumb_${index}`}
        activeOpacity={0.88}
        onPress={() => onImagePress && onImagePress(index)}
        onLongPress={onLongPress}
        delayLongPress={280}
        style={[styles.thumbTouchable, { width: thumbW, height: thumbH, borderRadius: resolvedRadius ? resolvedRadius : 0 }]}
      >
        <Image
          source={typeof uri === 'string' ? { uri } : uri}
          style={styles.imageFill}
          resizeMode="cover"
        />
        {isMoreOverlay && (
          <View style={styles.moreOverlay} pointerEvents="none">
            <Text style={styles.moreText}>
              {`+${moreCount}`}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    // 1 image: large thumbnail
    if (count === 1) {
      return (
        <View style={[styles.gridContainer, { width: gridW, height: h1, borderRadius: resolvedRadius }]}>
          {renderThumbnail(images[0], 0, '100%', '100%')}
        </View>
      );
    }

    // 2 images: two side by side
    if (count === 2) {
      const itemW = (gridW - GAP) / 2;
      return (
        <View style={[styles.gridContainer, styles.rowLayout, { width: gridW, height: h2, borderRadius: resolvedRadius }, isRTL && styles.rowReverse]}>
          {renderThumbnail(images[0], 0, itemW, '100%')}
          {renderThumbnail(images[1], 1, itemW, '100%')}
        </View>
      );
    }

    // 3 images: one larger image + two smaller images column
    if (count === 3) {
      const leftW = Math.round((gridW - GAP) * 0.62);
      const rightW = gridW - GAP - leftW;
      const smallH = (h3 - GAP) / 2;

      return (
        <View style={[styles.gridContainer, styles.rowLayout, { width: gridW, height: h3, borderRadius: resolvedRadius }, isRTL && styles.rowReverse]}>
          {renderThumbnail(images[0], 0, leftW, '100%')}
          <View style={[styles.columnLayout, { width: rightW, height: h3 }]}>
            {renderThumbnail(images[1], 1, '100%', smallH)}
            {renderThumbnail(images[2], 2, '100%', smallH)}
          </View>
        </View>
      );
    }

    // 4 or more images: 2 x 2 grid (if > 4, fourth thumbnail has darkened +N overlay)
    const itemW = (gridW - GAP) / 2;
    const itemH = (h4 - GAP) / 2;
    const hasMore = count > 4;
    const moreCount = count - 4;

    return (
      <View style={[styles.gridContainer, styles.columnLayout, { width: gridW, height: h4, borderRadius: resolvedRadius }]}>
        <View style={[styles.rowLayout, { width: '100%', height: itemH }, isRTL && styles.rowReverse]}>
          {renderThumbnail(images[0], 0, itemW, '100%')}
          {renderThumbnail(images[1], 1, itemW, '100%')}
        </View>
        <View style={[styles.rowLayout, { width: '100%', height: itemH }, isRTL && styles.rowReverse]}>
          {renderThumbnail(images[2], 2, itemW, '100%')}
          {renderThumbnail(images[3], 3, itemW, '100%', hasMore, moreCount)}
        </View>
      </View>
    );
  };

  return (
    <View style={{ position: 'relative', borderRadius: resolvedRadius, overflow: 'hidden', width: gridW }}>
      {renderContent()}

      {/* Uploading progress overlay */}
      {uploading && (
        <View style={styles.statusOverlay}>
          <View style={styles.statusBadge}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            {uploadProgress > 0 && (
              <Text style={styles.progressText}>{`${uploadProgress}%`}</Text>
            )}
          </View>
        </View>
      )}

      {/* Failed upload overlay with retry */}
      {uploadError && (
        <View style={styles.statusOverlay}>
          <View style={styles.errorBadge}>
            <Ionicons name="alert-circle" size={20} color="#FF5252" />
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.8}
              style={styles.retryBtn}
            >
              <Ionicons name="refresh" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.retryText}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  rowLayout: {
    flexDirection: 'row',
    gap: GAP,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  columnLayout: {
    flexDirection: 'column',
    gap: GAP,
  },
  thumbTouchable: {
    position: 'relative',
    overflow: 'hidden',
  },
  imageFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.46)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  moreText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
    includeFontPadding: false,
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  errorBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
});
