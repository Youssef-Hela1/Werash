import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Modal,
  StatusBar,
  TouchableOpacity,
  Pressable,
  Dimensions,
  FlatList,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ZoomableImage({ uri, screenWidth, screenHeight, onZoomChange }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const currentTx = useRef(0);
  const currentTy = useRef(0);
  const isZoomedRef = useRef(false);

  const lastTapRef = useRef(0);
  const initialDistanceRef = useRef(null);
  const initialScaleRef = useRef(1);
  const initialCenterRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });

  const notifyZoom = (zoomed) => {
    if (isZoomedRef.current !== zoomed) {
      isZoomedRef.current = zoomed;
      if (onZoomChange) onZoomChange(zoomed);
    }
  };

  const resetZoom = (animated = true) => {
    currentScale.current = 1;
    currentTx.current = 0;
    currentTy.current = 0;
    notifyZoom(false);

    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const zoomTo = (targetScale, tapX, tapY) => {
    const maxTx = (screenWidth * (targetScale - 1)) / 2;
    const maxTy = (screenHeight * (targetScale - 1)) / 2;
    const targetTx = Math.max(-maxTx, Math.min(maxTx, (screenWidth / 2 - tapX) * (targetScale - 1) * 0.5));
    const targetTy = Math.max(-maxTy, Math.min(maxTy, (screenHeight / 2 - tapY) * (targetScale - 1) * 0.5));

    currentScale.current = targetScale;
    currentTx.current = targetTx;
    currentTy.current = targetTy;
    notifyZoom(true);

    Animated.parallel([
      Animated.spring(scale, { toValue: targetScale, friction: 7, tension: 70, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: targetTx, friction: 7, tension: 70, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: targetTy, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = (evt) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      if (isZoomedRef.current) {
        resetZoom(true);
      } else {
        const tapX = evt.nativeEvent.locationX || screenWidth / 2;
        const tapY = evt.nativeEvent.locationY || screenHeight / 2;
        zoomTo(2.5, tapX, tapY);
      }
    } else {
      lastTapRef.current = now;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length >= 2) return true;
        if (isZoomedRef.current) {
          return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
        }
        return false;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length >= 2) return true;
        if (isZoomedRef.current) {
          return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
        }
        return false;
      },

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length >= 2) {
          initialDistanceRef.current = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
          initialScaleRef.current = currentScale.current;
          initialCenterRef.current = {
            x: (touches[0].pageX + touches[1].pageX) / 2,
            y: (touches[0].pageY + touches[1].pageY) / 2,
          };
          startPanRef.current = {
            x: currentTx.current,
            y: currentTy.current,
          };
        } else if (touches.length === 1 && isZoomedRef.current) {
          startPanRef.current = {
            x: currentTx.current,
            y: currentTy.current,
          };
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          if (!initialDistanceRef.current) {
            initialDistanceRef.current = Math.hypot(
              touches[0].pageX - touches[1].pageX,
              touches[0].pageY - touches[1].pageY
            );
            initialScaleRef.current = currentScale.current;
            initialCenterRef.current = {
              x: (touches[0].pageX + touches[1].pageX) / 2,
              y: (touches[0].pageY + touches[1].pageY) / 2,
            };
            startPanRef.current = {
              x: currentTx.current,
              y: currentTy.current,
            };
            return;
          }

          const currentDistance = Math.hypot(
            touches[0].pageX - touches[1].pageX,
            touches[0].pageY - touches[1].pageY
          );
          const factor = currentDistance / initialDistanceRef.current;
          const targetScale = Math.max(0.75, Math.min(initialScaleRef.current * factor, 4.5));
          scale.setValue(targetScale);
          currentScale.current = targetScale;

          const currentCenter = {
            x: (touches[0].pageX + touches[1].pageX) / 2,
            y: (touches[0].pageY + touches[1].pageY) / 2,
          };
          const dCenterX = (currentCenter.x - initialCenterRef.current.x) * 0.7;
          const dCenterY = (currentCenter.y - initialCenterRef.current.y) * 0.7;

          const newTx = startPanRef.current.x + dCenterX;
          const newTy = startPanRef.current.y + dCenterY;
          translateX.setValue(newTx);
          translateY.setValue(newTy);
          currentTx.current = newTx;
          currentTy.current = newTy;

          if (targetScale > 1.05) {
            notifyZoom(true);
          }
        } else if (touches.length === 1 && isZoomedRef.current) {
          if (initialDistanceRef.current) {
            initialDistanceRef.current = null;
            startPanRef.current = {
              x: currentTx.current,
              y: currentTy.current,
            };
            return;
          }

          const maxTx = (screenWidth * (currentScale.current - 1)) / 2 + 25;
          const maxTy = (screenHeight * (currentScale.current - 1)) / 2 + 25;
          const newTx = Math.max(-maxTx, Math.min(maxTx, startPanRef.current.x + gestureState.dx));
          const newTy = Math.max(-maxTy, Math.min(maxTy, startPanRef.current.y + gestureState.dy));
          translateX.setValue(newTx);
          translateY.setValue(newTy);
          currentTx.current = newTx;
          currentTy.current = newTy;
        }
      },

      onPanResponderRelease: () => {
        initialDistanceRef.current = null;

        if (currentScale.current <= 1.05) {
          resetZoom(true);
        } else {
          const targetScale = Math.min(currentScale.current, 3.5);
          const maxTx = (screenWidth * (targetScale - 1)) / 2;
          const maxTy = (screenHeight * (targetScale - 1)) / 2;
          const boundedTx = Math.max(-maxTx, Math.min(maxTx, currentTx.current));
          const boundedTy = Math.max(-maxTy, Math.min(maxTy, currentTy.current));

          currentScale.current = targetScale;
          currentTx.current = boundedTx;
          currentTy.current = boundedTy;

          Animated.parallel([
            Animated.spring(scale, { toValue: targetScale, friction: 7, tension: 70, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: boundedTx, friction: 7, tension: 70, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: boundedTy, friction: 7, tension: 70, useNativeDriver: true }),
          ]).start();

          notifyZoom(true);
        }
      },

      onPanResponderTerminate: () => {
        initialDistanceRef.current = null;
        if (currentScale.current <= 1.05) {
          resetZoom(true);
        }
      },
    })
  ).current;

  return (
    <View style={[styles.slideContainer, { width: screenWidth, height: screenHeight }]}>
      <Pressable onPress={handlePress} style={styles.pressableContainer}>
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
      </Pressable>
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
  const [isZoomed, setIsZoomed] = useState(false);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const idx = Math.max(0, Math.min(initialIndex || 0, images.length - 1));
      setCurrentIndex(idx);
      setIsZoomed(false);
      headerOpacity.setValue(1);
      setTimeout(() => {
        if (flatListRef.current && idx > 0) {
          flatListRef.current.scrollToIndex({ index: idx, animated: false });
        }
      }, 60);
    }
  }, [visible, initialIndex, images.length]);

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: isZoomed ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isZoomed]);

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

        {/* Top Header Bar: Hides when zoomed in, shows when at default zoom level */}
        <Animated.View 
          style={[
            styles.headerBar, 
            { paddingTop: topSafe, opacity: headerOpacity }, 
            isRTL && styles.headerBarRtl
          ]}
          pointerEvents={isZoomed ? 'none' : 'box-none'}
        >
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
        </Animated.View>

        {/* Swipeable Paging Image Gallery: Paging disabled while zoomed to allow free panning */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          scrollEnabled={!isZoomed}
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
              setIsZoomed(false);
            }
          }}
          renderItem={({ item }) => (
            <ZoomableImage
              uri={item}
              screenWidth={SCREEN_WIDTH}
              screenHeight={SCREEN_HEIGHT}
              onZoomChange={setIsZoomed}
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
  pressableContainer: {
    width: '100%',
    height: '100%',
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
