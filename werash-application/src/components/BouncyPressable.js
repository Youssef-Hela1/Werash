import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

export default function BouncyPressable({ 
  children, 
  onPress, 
  style, 
  activeOpacity = 0.9,
  scaleTo = 0.96,
  disabled = false
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: scaleTo,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: activeOpacity,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.0,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1.0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  // Flatten styles to extract flex for the outer Pressable
  const flatStyle = StyleSheet.flatten(style);

  return (
    <Pressable
      onPress={disabled ? null : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={flatStyle?.flex ? { flex: flatStyle.flex } : null}
    >
      <Animated.View style={[
        style,
        { 
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim
        }
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
