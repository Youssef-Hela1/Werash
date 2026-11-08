import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Modal,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ZoomableImage({ uri, screenWidth, screenHeight }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const currentTx = useRef(0);
  const currentTy = useRef(0);

  const lastTapRef = useRef(0);
  const initialDistanceRef = useRef(null);
  const initialScaleRef = useRef(1);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const resetZoom = (animated = true) => {
    currentScale.current = 1;
    currentTx.current = 0;
    currentTy.current = 0;
    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.numberActiveTouches === 2 || currentScale.current > 1.05;
      },
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          if (currentScale.current > 1.1) {
            resetZoom(true);
          } else {
            currentScale.current = 2.5;
            Animated.spring(scale, { toValue: 2.5, friction: 6, useNativeDriver: true }).start();
          }
          lastTapRef.current = 0;
          return;
        }
        lastTapRef.current = now;

        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          initialDistanceRef.current = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
          initialScaleRef.current = currentScale.current;
        } else if (touches.length === 1) {
          touchStartRef.current = { x: currentTx.current, y: currentTy.current };
        }
      },
      onPanResponderMove: (evt, gesture) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2 && initialDistanceRef.current) {
          const dist = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
          const factor = dist / initialDistanceRef.current;
          const target = Math.max(0.7, Math.min(initialScaleRef.current * factor, 4.5));
          scale.setValue(target);
          currentScale.current = target;
        } else if (touches.length === 1 && currentScale.current > 1.05) {
          const maxTx = (screenWidth * (currentScale.current - 1)) / 2;
          const maxTy = (screenHeight * (currentScale.current - 1)) / 2;
          const newX = Math.max(-maxTx, Math.min(maxTx, touchStartRef.current.x + gesture.dx));
          const newY = Math.max(-maxTy, Math.min(maxTy, touchStartRef.current.y + gesture.dy));
          translateX.setValue(newX);
          translateY.setValue(newY);
          currentTx.current = newX;
          currentTy.current = newY;
        }
      },
      onPanResponderRelease: () => {
        initialDistanceRef.current = null;
        if (currentScale.current < 1) {
          resetZoom(true);
        } else if (currentScale.current > 4) {
          currentScale.current = 3.5;
          Animated.spring(scale, { toValue: 3.5, friction: 6, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.slideContainer, { width: screenWidth, height: screenHeight }]}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.zoomWrapper,
          {
            transform: [
              { scale },
              { translateX },
              { translateY },
            ],
          },
        ]}
      >
        <Image
          source={typeof uri === 'string' ? { uri } : uri}
          style={styles.fullImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

export default function ImageViewerModal({
  visible,
  images = [],
  initialIndex = 0,
  onClose,
  isRTL = false,
}) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const idx = Math.max(0, Math.min(initialIndex || 0, images.length - 1));
      setCurrentIndex(idx);
      setTimeout(() => {
        if (flatListRef.current && idx > 0) {
          flatListRef.current.scrollToIndex({ index: idx, animated: false });
        }
      }, 60);
    }
  }, [visible, initialIndex, images.length]);

  if (!visible || !images || images.length === 0) return null;

  const topSafe = Math.max(
    insets.top || 0,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 20
  ) + 10;

  return (
    <Modal
      visible={visible}
      transparent={true}
      statusBarTranslucent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Top Header Bar */}
        <View style={[styles.headerBar, { paddingTop: topSafe }, isRTL && styles.headerBarRtl]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {images.length > 1 && (
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>
                {`${currentIndex + 1} / ${images.length}`}
              </Text>
            </View>
          )}

          {/* Placeholder for layout symmetry */}
          <View style={{ width: 44, height: 44 }} />
        </View>

        {/* Swipeable Paging Image Gallery */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => `img_view_${index}`}
          initialScrollIndex={Math.max(0, Math.min(initialIndex || 0, images.length - 1))}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const newIndex = Math.round(offsetX / SCREEN_WIDTH);
            if (newIndex >= 0 && newIndex < images.length) {
              setCurrentIndex(newIndex);
            }
          }}
          renderItem={({ item }) => (
            <ZoomableImage
              uri={item}
              screenWidth={SCREEN_WIDTH}
              screenHeight={SCREEN_HEIGHT}
            />
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 9999,
  },
  headerBarRtl: {
    flexDirection: 'row-reverse',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  slideContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
