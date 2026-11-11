import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  FlatList,
  Animated,
  PanResponder,
  Platform,
  BackHandler,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function getTouchesDistance(touches) {
  if (!touches || touches.length < 2) return 0;
  const t1 = touches[0];
  const t2 = touches[1];
  const dx = (t1.pageX ?? t1.locationX ?? 0) - (t2.pageX ?? t2.locationX ?? 0);
  const dy = (t1.pageY ?? t1.locationY ?? 0) - (t2.pageY ?? t2.locationY ?? 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchesCenter(touches) {
  if (!touches || touches.length < 2) return { x: 0, y: 0 };
  const t1 = touches[0];
  const t2 = touches[1];
  return {
    x: ((t1.pageX ?? t1.locationX ?? 0) + (t2.pageX ?? t2.locationX ?? 0)) / 2,
    y: ((t1.pageY ?? t1.locationY ?? 0) + (t2.pageY ?? t2.locationY ?? 0)) / 2,
  };
}

function ZoomableImage({ uri, screenWidth, screenHeight, onZoomChange, isActive }) {
  const [imageLoading, setImageLoading] = useState(false);
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
  const lastTouchPosRef = useRef(null);

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
    initialDistanceRef.current = null;
    lastTouchPosRef.current = null;
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

  useEffect(() => {
    if (!isActive) {
      resetZoom(false);
    }
  }, [isActive]);

  const zoomTo = (targetScale, tapX, tapY) => {
    const maxTx = Math.max(0, (screenWidth * (targetScale - 1)) / 2);
    const maxTy = Math.max(0, (screenHeight * (targetScale - 1)) / 2);
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

  const handleTap = (evt) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      if (isZoomedRef.current) {
        resetZoom(true);
      } else {
        const tapX = evt.nativeEvent?.locationX || screenWidth / 2;
        const tapY = evt.nativeEvent?.locationY || screenHeight / 2;
        zoomTo(2.5, tapX, tapY);
      }
    } else {
      lastTapRef.current = now;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return true;
        if (isZoomedRef.current) return true;
        return false;
      },
      onStartShouldSetPanResponder: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return true;
        if (isZoomedRef.current) return true;
        return false;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return true;
        if (isZoomedRef.current) {
          return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
        }
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return true;
        if (isZoomedRef.current) {
          return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
        }
        return false;
      },
      onPanResponderTerminationRequest: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return false;
        if (isZoomedRef.current) return false;
        return true;
      },

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches || [];
        if (touches.length >= 2) {
          initialDistanceRef.current = getTouchesDistance(touches);
          initialScaleRef.current = currentScale.current;
          initialCenterRef.current = getTouchesCenter(touches);
          startPanRef.current = {
            x: currentTx.current,
            y: currentTy.current,
          };
          lastTouchPosRef.current = null;
        } else if (touches.length === 1) {
          initialDistanceRef.current = null;
          lastTouchPosRef.current = {
            x: touches[0].pageX ?? touches[0].locationX ?? 0,
            y: touches[0].pageY ?? touches[0].locationY ?? 0,
          };
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches || [];

        if (touches.length >= 2) {
          const dist = getTouchesDistance(touches);
          if (!initialDistanceRef.current || initialDistanceRef.current <= 0) {
            initialDistanceRef.current = dist;
            initialScaleRef.current = currentScale.current;
            initialCenterRef.current = getTouchesCenter(touches);
            startPanRef.current = {
              x: currentTx.current,
              y: currentTy.current,
            };
            lastTouchPosRef.current = null;
            return;
          }

          if (dist > 0 && initialDistanceRef.current > 0) {
            const factor = dist / initialDistanceRef.current;
            const targetScale = Math.max(0.75, Math.min(initialScaleRef.current * factor, 4.5));
            scale.setValue(targetScale);
            currentScale.current = targetScale;

            const center = getTouchesCenter(touches);
            const dCenterX = (center.x - initialCenterRef.current.x) * 0.7;
            const dCenterY = (center.y - initialCenterRef.current.y) * 0.7;

            const newTx = startPanRef.current.x + dCenterX;
            const newTy = startPanRef.current.y + dCenterY;
            translateX.setValue(newTx);
            translateY.setValue(newTy);
            currentTx.current = newTx;
            currentTy.current = newTy;

            if (targetScale > 1.05) {
              notifyZoom(true);
            }
          }
        } else if (touches.length === 1 && isZoomedRef.current) {
          const curTouch = touches[0];
          const pageX = curTouch.pageX ?? curTouch.locationX ?? 0;
          const pageY = curTouch.pageY ?? curTouch.locationY ?? 0;

          if (initialDistanceRef.current) {
            initialDistanceRef.current = null;
            lastTouchPosRef.current = { x: pageX, y: pageY };
            return;
          }

          if (!lastTouchPosRef.current) {
            lastTouchPosRef.current = { x: pageX, y: pageY };
            return;
          }

          const dx = pageX - lastTouchPosRef.current.x;
          const dy = pageY - lastTouchPosRef.current.y;
          lastTouchPosRef.current = { x: pageX, y: pageY };

          const maxTx = Math.max(0, (screenWidth * (currentScale.current - 1)) / 2 + 25);
          const maxTy = Math.max(0, (screenHeight * (currentScale.current - 1)) / 2 + 25);

          const nextTx = Math.max(-maxTx, Math.min(maxTx, currentTx.current + dx));
          const nextTy = Math.max(-maxTy, Math.min(maxTy, currentTy.current + dy));

          translateX.setValue(nextTx);
          translateY.setValue(nextTy);
          currentTx.current = nextTx;
          currentTy.current = nextTy;
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        initialDistanceRef.current = null;
        lastTouchPosRef.current = null;

        // Double tap toggle when zoomed in
        const isTap = Math.abs(gestureState.dx) < 8 && Math.abs(gestureState.dy) < 8;
        if (isTap && isZoomedRef.current) {
          const now = Date.now();
          if (now - lastTapRef.current < 280) {
            lastTapRef.current = 0;
            resetZoom(true);
            return;
          }
          lastTapRef.current = now;
        }

        if (currentScale.current <= 1.05) {
          resetZoom(true);
        } else {
          const targetScale = Math.min(currentScale.current, 3.5);
          const maxTx = Math.max(0, (screenWidth * (targetScale - 1)) / 2);
          const maxTy = Math.max(0, (screenHeight * (targetScale - 1)) / 2);
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
        lastTouchPosRef.current = null;
        if (currentScale.current <= 1.05) {
          resetZoom(true);
        }
      },
    })
  ).current;

  return (
    <View
      style={[styles.slideContainer, { width: screenWidth, height: screenHeight }]}
      {...panResponder.panHandlers}
      collapsable={false}
    >
      <TouchableWithoutFeedback onPress={handleTap}>
        <Animated.View
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
          collapsable={false}
        >
          <Image
            source={typeof uri === 'string' ? { uri } : uri}
            style={styles.fullImage}
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
          {imageLoading && (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

export default function ImageViewerModal({
  visible,
  images = [],
  initialIndex = 0,
  onClose,
  isRTL = false,
  asModal = false,
}) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [isZoomed, setIsZoomed] = useState(false);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);

  // Handle hardware back press on Android
  useEffect(() => {
    if (!visible) return;
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose?.();
      return true;
    });
    return () => backSub.remove();
  }, [visible, onClose]);

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

  const content = (
    <View style={styles.modalOverlay}>
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
        renderItem={({ item, index }) => (
          <ZoomableImage
            uri={item}
            screenWidth={SCREEN_WIDTH}
            screenHeight={SCREEN_HEIGHT}
            onZoomChange={setIsZoomed}
            isActive={index === currentIndex}
          />
        )}
      />
    </View>
  );

  if (asModal) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        statusBarTranslucent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999999,
    elevation: 999999,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
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
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  slideContainer: {
    flex: 1,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
