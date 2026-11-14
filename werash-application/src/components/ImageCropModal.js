import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../styles/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Displayed Banner aspect ratio matching CommunityScreen & OtherUserProfileModal
// Banner width: SCREEN_WIDTH - 40, height: 120
const BANNER_DISPLAY_ASPECT = (SCREEN_WIDTH - 40) / 120;

export default function ImageCropModal({
  visible,
  imageUri,
  cropType = 'avatar', // 'avatar' | 'banner'
  onSave,
  onCancel,
  isRtl = false,
}) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [origSize, setOrigSize] = useState({ width: 0, height: 0 });
  const [canvasLayout, setCanvasLayout] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.55 });
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Refs for tracking interactive gestures
  const currentScale = useRef(1);
  const currentTranslate = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, initTx: 0, initTy: 0 });
  const initialPinchDist = useRef(1);
  const initialPinchScale = useRef(1);
  const pinchStartCenter = useRef({ x: 0, y: 0, initTx: 0, initTy: 0 });

  // Compute fixed crop frame dimensions
  const isAvatar = cropType === 'avatar';

  // Avatar: Fixed circular 1:1 frame (comfortable size for touch manipulation)
  const avatarFrameSize = Math.min(Math.round(SCREEN_WIDTH - 64), 280);

  // Banner: Fixed rectangular frame matching exactly the banner's displayed aspect ratio
  const bannerFrameWidth = Math.round(SCREEN_WIDTH - 36);
  const bannerFrameHeight = Math.round(bannerFrameWidth / BANNER_DISPLAY_ASPECT);

  const frameWidth = isAvatar ? avatarFrameSize : bannerFrameWidth;
  const frameHeight = isAvatar ? avatarFrameSize : bannerFrameHeight;
  const frameBorderRadius = isAvatar ? Math.round(frameWidth / 2) : 14;

  const canvasW = canvasLayout.width || SCREEN_WIDTH;
  const canvasH = canvasLayout.height || (SCREEN_HEIGHT * 0.55);
  const frameLeft = Math.round((canvasW - frameWidth) / 2);
  const frameTop = Math.round((canvasH - frameHeight) / 2);

  // Load image original dimensions when imageUri changes
  useEffect(() => {
    if (!visible || !imageUri) {
      setLoading(true);
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      currentScale.current = 1;
      currentTranslate.current = { x: 0, y: 0 };
      return;
    }

    setLoading(true);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    currentScale.current = 1;
    currentTranslate.current = { x: 0, y: 0 };

    Image.getSize(
      imageUri,
      (w, h) => {
        setOrigSize({ width: w, height: h });
        setLoading(false);
      },
      (err) => {
        console.warn('Image.getSize failed in ImageCropModal:', err);
        setOrigSize({ width: 1200, height: 800 });
        setLoading(false);
      }
    );
  }, [visible, imageUri]);

  // Base rendered image dimensions (covering the entire frame at scale = 1)
  const baseScale = Math.max(
    frameWidth / (origSize.width || 1),
    frameHeight / (origSize.height || 1)
  );
  const baseWidth = (origSize.width || frameWidth) * baseScale;
  const baseHeight = (origSize.height || frameHeight) * baseScale;

  const renderedWidth = baseWidth * scale;
  const renderedHeight = baseHeight * scale;

  // Clamp translation so the image always completely covers the crop frame
  const clampTranslation = (tx, ty, s) => {
    const rw = baseWidth * s;
    const rh = baseHeight * s;
    const maxTx = Math.max(0, (rw - frameWidth) / 2);
    const maxTy = Math.max(0, (rh - frameHeight) / 2);

    return {
      x: Math.max(-maxTx, Math.min(maxTx, tx)),
      y: Math.max(-maxTy, Math.min(maxTy, ty)),
    };
  };

  const updatePosition = (tx, ty, s) => {
    const clamped = clampTranslation(tx, ty, s);
    currentTranslate.current = clamped;
    currentScale.current = s;
    setTranslate(clamped);
    setScale(s);
  };

  // PanResponder for drag and two-finger pinch-to-zoom
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1) {
          isDragging.current = true;
          dragStart.current = {
            x: touches[0].pageX,
            y: touches[0].pageY,
            initTx: currentTranslate.current.x,
            initTy: currentTranslate.current.y,
          };
        } else if (touches.length >= 2) {
          isDragging.current = false;
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          initialPinchDist.current = Math.hypot(dx, dy) || 1;
          initialPinchScale.current = currentScale.current;
          pinchStartCenter.current = {
            x: (touches[0].pageX + touches[1].pageX) / 2,
            y: (touches[0].pageY + touches[1].pageY) / 2,
            initTx: currentTranslate.current.x,
            initTy: currentTranslate.current.y,
          };
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 1 && isDragging.current) {
          const dx = touches[0].pageX - dragStart.current.x;
          const dy = touches[0].pageY - dragStart.current.y;
          updatePosition(
            dragStart.current.initTx + dx,
            dragStart.current.initTy + dy,
            currentScale.current
          );
        } else if (touches.length >= 2) {
          const dx = touches[1].pageX - touches[0].pageX;
          const dy = touches[1].pageY - touches[0].pageY;
          const dist = Math.hypot(dx, dy) || 1;
          const factor = dist / initialPinchDist.current;
          const newScale = Math.min(3.5, Math.max(1.0, initialPinchScale.current * factor));

          const currentCenterX = (touches[0].pageX + touches[1].pageX) / 2;
          const currentCenterY = (touches[0].pageY + touches[1].pageY) / 2;
          const centerDx = currentCenterX - pinchStartCenter.current.x;
          const centerDy = currentCenterY - pinchStartCenter.current.y;

          updatePosition(
            pinchStartCenter.current.initTx + centerDx,
            pinchStartCenter.current.initTy + centerDy,
            newScale
          );
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      },
    })
  ).current;

  // Zoom control buttons
  const handleZoomChange = (delta) => {
    const nextScale = Math.min(3.5, Math.max(1.0, currentScale.current + delta));
    updatePosition(currentTranslate.current.x, currentTranslate.current.y, nextScale);
  };

  const handleZoomReset = () => {
    updatePosition(0, 0, 1.0);
  };

  // Perform accurate crop using expo-image-manipulator
  const handleSaveCrop = async () => {
    if (!imageUri || isSaving) return;
    setIsSaving(true);

    try {
      const rw = baseWidth * currentScale.current;
      const rh = baseHeight * currentScale.current;
      const tx = currentTranslate.current.x;
      const ty = currentTranslate.current.y;

      // Frame position relative to rendered image
      const cropLeftInRendered = (rw - frameWidth) / 2 - tx;
      const cropTopInRendered = (rh - frameHeight) / 2 - ty;

      // Convert rendered crop box to original image coordinates
      const factor = (origSize.width || rw) / rw;
      let originX = Math.round(cropLeftInRendered * factor);
      let originY = Math.round(cropTopInRendered * factor);
      let width = Math.round(frameWidth * factor);
      let height = Math.round(frameHeight * factor);

      // Clamp within natural bounds
      const ow = origSize.width || width;
      const oh = origSize.height || height;
      originX = Math.max(0, Math.min(ow - 1, originX));
      originY = Math.max(0, Math.min(oh - 1, originY));
      width = Math.max(1, Math.min(ow - originX, width));
      height = Math.max(1, Math.min(oh - originY, height));

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX,
              originY,
              width,
              height,
            },
          },
        ],
        {
          compress: 0.88,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (typeof onSave === 'function') {
        onSave(manipResult.uri, {
          uri: manipResult.uri,
          base64: manipResult.base64,
          width: manipResult.width,
          height: manipResult.height,
          cropType,
        });
      }
    } catch (cropErr) {
      console.warn('ImageManipulator crop failed, using original uri:', cropErr);
      if (typeof onSave === 'function') {
        onSave(imageUri, { uri: imageUri, cropType });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F12" />

        {/* Header Bar */}
        <View style={[styles.headerBar, isRtl && styles.headerBarRtl]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onCancel}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, isRtl && styles.textRtl]}>
              {isAvatar
                ? (isRtl ? 'قص وتعديل الصورة الشخصية' : 'Crop Profile Photo')
                : (isRtl ? 'قص وتعديل صورة الغلاف' : 'Crop Banner')}
            </Text>
            <Text style={[styles.headerSubtitle, isRtl && styles.textRtl]}>
              {isRtl ? 'اسحب للتحريك • قرّب للتكبير' : 'Drag to reposition • Pinch to zoom'}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Interactive Crop Canvas */}
        <View
          style={styles.canvasContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width && height) {
              setCanvasLayout({ width, height });
            }
          }}
          {...panResponder.panHandlers}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDarkMode ? '#4ADE80' : '#00A843'} />
            </View>
          ) : (
            <>
              {/* Scaled & Translated Underlying Image */}
              <View
                style={[
                  styles.imageWrapper,
                  {
                    left: frameLeft + (frameWidth - renderedWidth) / 2 + translate.x,
                    top: frameTop + (frameHeight - renderedHeight) / 2 + translate.y,
                    width: renderedWidth,
                    height: renderedHeight,
                  },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: renderedWidth, height: renderedHeight }}
                  resizeMode="cover"
                />
              </View>

              {/* Darkened Mask Outside the Crop Frame */}
              {/* 1. Top darken block */}
              <View
                pointerEvents="none"
                style={[styles.darkBlock, { top: 0, left: 0, right: 0, height: frameTop }]}
              />
              {/* 2. Bottom darken block */}
              <View
                pointerEvents="none"
                style={[styles.darkBlock, { top: frameTop + frameHeight, left: 0, right: 0, bottom: 0 }]}
              />
              {/* 3. Left darken block */}
              <View
                pointerEvents="none"
                style={[styles.darkBlock, { top: frameTop, left: 0, width: frameLeft, height: frameHeight }]}
              />
              {/* 4. Right darken block */}
              <View
                pointerEvents="none"
                style={[styles.darkBlock, { top: frameTop, left: frameLeft + frameWidth, right: 0, height: frameHeight }]}
              />

              {/* Circular outer mask for avatar corners */}
              {isAvatar && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.circularMaskCutout,
                    {
                      top: frameTop - 2000,
                      left: frameLeft - 2000,
                      width: frameWidth + 4000,
                      height: frameHeight + 4000,
                      borderWidth: 2000,
                      borderRadius: 2000 + frameBorderRadius,
                    },
                  ]}
                />
              )}

              {/* Fixed Outline Frame with Crisp Border */}
              <View
                pointerEvents="none"
                style={[
                  styles.cropFrameOutline,
                  {
                    top: frameTop,
                    left: frameLeft,
                    width: frameWidth,
                    height: frameHeight,
                    borderRadius: frameBorderRadius,
                  },
                ]}
              >
                {/* Subtle Rule-of-Thirds Grid Lines (for banner or avatar framing) */}
                {!isAvatar && (
                  <>
                    <View style={[styles.gridLineH, { top: '33.33%' }]} />
                    <View style={[styles.gridLineH, { top: '66.66%' }]} />
                    <View style={[styles.gridLineV, { left: '33.33%' }]} />
                    <View style={[styles.gridLineV, { left: '66.66%' }]} />
                  </>
                )}

                {/* Framing Badge on top of frame */}
                <View style={styles.frameCornerTopLeft} />
                <View style={styles.frameCornerTopRight} />
                <View style={styles.frameCornerBottomLeft} />
                <View style={styles.frameCornerBottomRight} />
              </View>
            </>
          )}
        </View>

        {/* Zoom Controls Bar */}
        <View style={[styles.zoomBar, isRtl && styles.zoomBarRtl]}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoomChange(-0.25)}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomResetButton}
            onPress={handleZoomReset}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomLevelText}>{`${Math.round(scale * 100)}%`}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => handleZoomChange(0.25)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Footer Actions: Cancel and Save Buttons */}
        <View style={[styles.footerBar, isRtl && styles.footerBarRtl]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={onCancel}
            disabled={isSaving}
            activeOpacity={0.75}
          >
            <Text style={[styles.cancelBtnText, isRtl && styles.textRtl]}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.saveBtn]}
            onPress={handleSaveCrop}
            disabled={isSaving || loading}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={[styles.saveBtnContent, isRtl && styles.saveBtnContentRtl]}>
                <Ionicons
                  name="checkmark-circle"
                  size={19}
                  color="#FFFFFF"
                  style={isRtl ? { marginLeft: 6 } : { marginRight: 6 }}
                />
                <Text style={[styles.saveBtnText, isRtl && styles.textRtl]}>
                  {isRtl ? 'حفظ واختيار' : 'Save'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: 'rgba(11, 15, 18, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 20,
  },
  headerBarRtl: {
    flexDirection: 'row-reverse',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  textRtl: {
    fontFamily: 'AlkhalilArabic-Bold',
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    position: 'absolute',
  },
  darkBlock: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  circularMaskCutout: {
    position: 'absolute',
    borderColor: 'rgba(0, 0, 0, 0.65)',
  },
  cropFrameOutline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  frameCornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00A843',
  },
  frameCornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00A843',
  },
  frameCornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00A843',
  },
  frameCornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00A843',
  },
  zoomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 16,
    backgroundColor: 'rgba(11, 15, 18, 0.85)',
  },
  zoomBarRtl: {
    flexDirection: 'row-reverse',
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomResetButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  zoomLevelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: 'rgba(11, 15, 18, 0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    gap: 14,
  },
  footerBarRtl: {
    flexDirection: 'row-reverse',
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#003514',
    borderWidth: 1,
    borderColor: '#00A843',
    shadowColor: '#00A843',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnContentRtl: {
    flexDirection: 'row-reverse',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
