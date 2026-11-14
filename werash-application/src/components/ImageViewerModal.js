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
  useWindowDimensions,
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
import { useTheme } from '../styles/ThemeContext';

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

function ZoomableImage({
  uri,
  screenWidth,
  screenHeight,
  onZoomChange,
  isActive,
  onDismissMove,
  onDismissRelease,
}) {
  const { isDarkMode, colors } = useTheme();
  const [imageLoading, setImageLoading] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const currentTx = useRef(0);
  const currentTy = useRef(0);
  const isZoomedRef = useRef(false);

  const lastTapRef = useRef(0);
  const tapStartRef = useRef(null);
  const initialDistanceRef = useRef(null);
  const initialScaleRef = useRef(1);
  const initialCenterRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });
  const lastTouchPosRef = useRef(null);
  const prevTouchesCountRef = useRef(0);

  const getMaxTx = (s) => Math.max(0, (screenWidth * (s - 1)) / 2);
  const getMaxTy = (s) => Math.max(0, (screenHeight * (s - 1)) / 2);

  const handleLoadStart = () => {
    if (typeof uri === 'string' && (uri.startsWith('http') || uri.startsWith('file') || uri.startsWith('content') || uri.startsWith('data:'))) {
      setImageLoading(true);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = setTimeout(() => {
        setImageLoading(false);
      }, 3500);
    }
  };

  const handleLoadEnd = () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    setImageLoading(false);
  };

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

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
    prevTouchesCountRef.current = 0;
    notifyZoom(false);

    if (animated) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 85, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, friction: 8, tension: 85, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 85, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  useEffect(() => {
    resetZoom(false);
    handleLoadEnd();
  }, [isActive, uri]);

  const zoomTo = (targetScale, tapX, tapY) => {
    const maxTx = getMaxTx(targetScale);
    const maxTy = getMaxTy(targetScale);
    const targetTx = Math.max(-maxTx, Math.min(maxTx, (screenWidth / 2 - tapX) * (targetScale - 1)));
    const targetTy = Math.max(-maxTy, Math.min(maxTy, (screenHeight / 2 - tapY) * (targetScale - 1)));

    currentScale.current = targetScale;
    currentTx.current = targetTx;
    currentTy.current = targetTy;
    notifyZoom(true);

    Animated.parallel([
      Animated.spring(scale, { toValue: targetScale, friction: 8, tension: 85, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: targetTx, friction: 8, tension: 85, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: targetTy, friction: 8, tension: 85, useNativeDriver: true }),
    ]).start();
  };

  const handleTap = (evt) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      if (isZoomedRef.current || currentScale.current > 1.05) {
        resetZoom(true);
      } else {
        const tapX = evt.nativeEvent?.locationX ?? screenWidth / 2;
        const tapY = evt.nativeEvent?.locationY ?? screenHeight / 2;
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
        if (isZoomedRef.current || currentScale.current > 1.05) return true;
        return false;
      },
      onStartShouldSetPanResponder: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return true;
        if (isZoomedRef.current || currentScale.current > 1.05) return true;
        return false;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return true;
        if (isZoomedRef.current || currentScale.current > 1.05) {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        }
        // Capture downward swipe before FlatList steals it
        if (touches && touches.length === 1) {
          if (gestureState.dy > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.2) {
            return true;
          }
        }
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) return true;
        if (isZoomedRef.current || currentScale.current > 1.05) {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        }
        if (touches && touches.length === 1) {
          if (gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.1) {
            return true;
          }
        }
        return false;
      },
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches || [];
        prevTouchesCountRef.current = touches.length;
        tapStartRef.current = {
          time: Date.now(),
          x: touches[0]?.pageX ?? 0,
          y: touches[0]?.pageY ?? 0,
        };

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
          // If switched from 1 finger to 2 fingers, seamlessly re-anchor pinch
          if (prevTouchesCountRef.current !== 2) {
            initialDistanceRef.current = getTouchesDistance(touches);
            initialScaleRef.current = currentScale.current;
            initialCenterRef.current = getTouchesCenter(touches);
            startPanRef.current = {
              x: currentTx.current,
              y: currentTy.current,
            };
            lastTouchPosRef.current = null;
            prevTouchesCountRef.current = 2;
            return;
          }

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
            // Allow tactile shrink below 1 down to 0.75; cap zoom at 4.5
            const targetScale = Math.max(0.75, Math.min(initialScaleRef.current * factor, 4.5));
            scale.setValue(targetScale);
            currentScale.current = targetScale;

            const center = getTouchesCenter(touches);
            const dCenterX = center.x - initialCenterRef.current.x;
            const dCenterY = center.y - initialCenterRef.current.y;

            const maxTx = getMaxTx(targetScale);
            const maxTy = getMaxTy(targetScale);
            const newTx = Math.max(-maxTx - 30, Math.min(maxTx + 30, startPanRef.current.x + dCenterX));
            const newTy = Math.max(-maxTy - 30, Math.min(maxTy + 30, startPanRef.current.y + dCenterY));

            translateX.setValue(newTx);
            translateY.setValue(newTy);
            currentTx.current = newTx;
            currentTy.current = newTy;

            if (targetScale > 1.05) {
              notifyZoom(true);
            }
          }
        } else if (touches.length === 1 && (isZoomedRef.current || currentScale.current > 1.05)) {
          // If switched from 2 fingers to 1 finger, seamlessly re-anchor pan
          if (prevTouchesCountRef.current !== 1 || !lastTouchPosRef.current) {
            const curTouch = touches[0];
            lastTouchPosRef.current = {
              x: curTouch.pageX ?? curTouch.locationX ?? 0,
              y: curTouch.pageY ?? curTouch.locationY ?? 0,
            };
            prevTouchesCountRef.current = 1;
            return;
          }

          const curTouch = touches[0];
          const pageX = curTouch.pageX ?? curTouch.locationX ?? 0;
          const pageY = curTouch.pageY ?? curTouch.locationY ?? 0;

          const dx = pageX - lastTouchPosRef.current.x;
          const dy = pageY - lastTouchPosRef.current.y;
          lastTouchPosRef.current = { x: pageX, y: pageY };

          const maxTx = getMaxTx(currentScale.current);
          const maxTy = getMaxTy(currentScale.current);

          // 1:1 Natural panning with rubber-band resistance beyond bounds
          let nextTx = currentTx.current + dx;
          let nextTy = currentTy.current + dy;

          if (nextTx > maxTx) {
            nextTx = maxTx + (nextTx - maxTx) * 0.35;
          } else if (nextTx < -maxTx) {
            nextTx = -maxTx + (nextTx - (-maxTx)) * 0.35;
          }

          if (nextTy > maxTy) {
            nextTy = maxTy + (nextTy - maxTy) * 0.35;
          } else if (nextTy < -maxTy) {
            nextTy = -maxTy + (nextTy - (-maxTy)) * 0.35;
          }

          translateX.setValue(nextTx);
          translateY.setValue(nextTy);
          currentTx.current = nextTx;
          currentTy.current = nextTy;
        } else if (touches.length === 1 && !isZoomedRef.current && currentScale.current <= 1.05) {
          prevTouchesCountRef.current = 1;
          if (gestureState.dy > 0 && onDismissMove) {
            onDismissMove(gestureState.dy);
          }
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        initialDistanceRef.current = null;
        lastTouchPosRef.current = null;
        prevTouchesCountRef.current = 0;

        // Check if this gesture was a tap (double tap toggle)
        const elapsed = Date.now() - (tapStartRef.current?.time || 0);
        const distMoved = Math.hypot(
          (evt.nativeEvent.pageX || 0) - (tapStartRef.current?.x || 0),
          (evt.nativeEvent.pageY || 0) - (tapStartRef.current?.y || 0)
        );
        const isTap = distMoved < 10 && elapsed < 300;

        if (isTap) {
          const now = Date.now();
          if (now - lastTapRef.current < 280) {
            lastTapRef.current = 0;
            if (isZoomedRef.current || currentScale.current > 1.05) {
              resetZoom(true);
            } else {
              const tapX = evt.nativeEvent.locationX ?? screenWidth / 2;
              const tapY = evt.nativeEvent.locationY ?? screenHeight / 2;
              zoomTo(2.5, tapX, tapY);
            }
            return;
          }
          lastTapRef.current = now;
        }

        if (currentScale.current > 1.05) {
          // Cap zoom level to 3.5 on release
          const targetScale = Math.min(currentScale.current, 3.5);
          const maxTx = getMaxTx(targetScale);
          const maxTy = getMaxTy(targetScale);
          const boundedTx = Math.max(-maxTx, Math.min(maxTx, currentTx.current));
          const boundedTy = Math.max(-maxTy, Math.min(maxTy, currentTy.current));

          currentScale.current = targetScale;
          currentTx.current = boundedTx;
          currentTy.current = boundedTy;

          Animated.parallel([
            Animated.spring(scale, { toValue: targetScale, friction: 8, tension: 85, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: boundedTx, friction: 8, tension: 85, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: boundedTy, friction: 8, tension: 85, useNativeDriver: true }),
          ]).start();

          notifyZoom(true);
        } else if (currentScale.current <= 1.05 && !isZoomedRef.current && gestureState.dy > 0) {
          // Downward drag to dismiss at normal scale
          const shouldClose = gestureState.dy > 45 || gestureState.vy > 0.25;
          if (shouldClose && onDismissRelease) {
            onDismissRelease(gestureState);
          } else {
            resetZoom(true);
            if (onDismissRelease) {
              onDismissRelease({ dy: 0, vy: 0 });
            }
          }
        } else {
          // Pinched inward below normal scale -> smoothly snap back to 1.0 & center
          resetZoom(true);
          if (onDismissRelease) {
            onDismissRelease({ dy: 0, vy: 0 });
          }
        }
      },

      onPanResponderTerminate: () => {
        initialDistanceRef.current = null;
        lastTouchPosRef.current = null;
        prevTouchesCountRef.current = 0;
        if (currentScale.current <= 1.05) {
          resetZoom(true);
        } else {
          const maxTx = getMaxTx(currentScale.current);
          const maxTy = getMaxTy(currentScale.current);
          const boundedTx = Math.max(-maxTx, Math.min(maxTx, currentTx.current));
          const boundedTy = Math.max(-maxTy, Math.min(maxTy, currentTy.current));
          currentTx.current = boundedTx;
          currentTy.current = boundedTy;
          Animated.parallel([
            Animated.spring(translateX, { toValue: boundedTx, friction: 8, tension: 85, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: boundedTy, friction: 8, tension: 85, useNativeDriver: true }),
          ]).start();
        }
        if (onDismissRelease) {
          onDismissRelease({ dy: 0, vy: 0 });
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
                { translateX },
                { translateY },
                { scale },
              ],
            },
          ]}
          collapsable={false}
        >
          <Image
            source={typeof uri === 'string' ? { uri } : uri}
            style={styles.fullImage}
            resizeMode="contain"
            onLoadStart={handleLoadStart}
            onLoad={handleLoadEnd}
            onLoadEnd={handleLoadEnd}
            onError={handleLoadEnd}
          />
        </Animated.View>
      </TouchableWithoutFeedback>
      {imageLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={isDarkMode ? (colors?.loadingIndicator || '#4ADE80') : '#FFFFFF'} />
        </View>
      )}
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const screenWidth = windowWidth || SCREEN_WIDTH;
  const screenHeight = windowHeight || SCREEN_HEIGHT;

  const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [isZoomed, setIsZoomed] = useState(false);
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const dismissY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const handleDismissMove = (dy) => {
    if (dy > 0) {
      dismissY.setValue(dy);
    }
  };

  const handleDismissRelease = (gestureState) => {
    const dy = gestureState?.dy || 0;
    const vy = gestureState?.vy || 0;
    const shouldClose = dy > 45 || vy > 0.25;

    if (shouldClose) {
      Animated.timing(dismissY, {
        toValue: screenHeight,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        onClose?.();
      });
    } else {
      Animated.spring(dismissY, {
        toValue: 0,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }).start();
    }
  };

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
      dismissY.setValue(0);
      headerOpacity.setValue(1);
      const idx = Math.max(0, Math.min(initialIndex || 0, images.length - 1));
      setCurrentIndex(idx);
      setIsZoomed(false);
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
    <Animated.View
      style={[
        styles.modalOverlay,
        {
          transform: [{ translateY: dismissY }],
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Top Header Bar: Hides when zoomed in */}
      <Animated.View 
        style={[
          styles.headerBar, 
          {
            paddingTop: topSafe,
            opacity: headerOpacity,
          }, 
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

      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        scrollEnabled={!isZoomed}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
        keyExtractor={(_, index) => `img_view_${index}`}
        initialScrollIndex={Math.max(0, Math.min(initialIndex || 0, images.length - 1))}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const newIndex = Math.round(offsetX / screenWidth);
          if (newIndex >= 0 && newIndex < images.length) {
            setCurrentIndex(newIndex);
            setIsZoomed(false);
          }
        }}
        renderItem={({ item, index }) => (
          <ZoomableImage
            uri={item}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            onZoomChange={setIsZoomed}
            isActive={index === currentIndex}
            onDismissMove={handleDismissMove}
            onDismissRelease={handleDismissRelease}
          />
        )}
      />
    </Animated.View>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
    height: '100%',
    zIndex: 999999,
    elevation: 999999,
  },
  flatList: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    position: 'relative',
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
});
