import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';

/**
 * Pale sage automotive blueprint & drafting cover illustration for chat messages
 * Matches the reference design with front-end car wireframe, engine gear silhouette, and diagonal open-end wrench.
 */
const ChatPaleSageCover = memo(function ChatPaleSageCover({ isDarkMode }) {
  const bg = isDarkMode ? '#1C291F' : '#E4ECE5';
  const strokeLine = isDarkMode ? 'rgba(74, 222, 128, 0.20)' : 'rgba(77, 112, 83, 0.22)';
  const blueprintStroke = isDarkMode ? '#5EA870' : '#4E7355';
  const wrenchStroke = isDarkMode ? '#68B97C' : '#3E6646';
  const wrenchFill = isDarkMode ? '#223627' : '#F1F7F2';

  return (
    <View style={[styles.coverContainer, { backgroundColor: bg }]}>
      <Svg width="100%" height="100%" viewBox="0 0 320 118" preserveAspectRatio="xMidYMid slice">
        {/* Subtle Horizontal & Vertical Guide Lines */}
        <Line x1="0" y1="58" x2="320" y2="58" stroke={strokeLine} strokeWidth="1" strokeDasharray="4, 4" />
        <Line x1="120" y1="0" x2="120" y2="118" stroke={strokeLine} strokeWidth="1" strokeDasharray="3, 3" />
        <Line x1="210" y1="0" x2="210" y2="118" stroke={strokeLine} strokeWidth="1" strokeDasharray="4, 4" />

        {/* Blueprint Concentric Drafting Arcs */}
        <Circle cx="125" cy="58" r="40" stroke={strokeLine} strokeWidth="1" fill="none" strokeDasharray="3, 3" />
        <Circle cx="125" cy="58" r="64" stroke={strokeLine} strokeWidth="1" fill="none" />

        {/* 1. Left: Wireframe Car Front-End Silhouette */}
        <G transform="translate(-10, 14)" opacity={0.65}>
          {/* Car Hood & Windshield Curve */}
          <Path
            d="M 12 85 C 16 65, 30 50, 60 46 C 85 43, 115 48, 145 62 L 155 72"
            stroke={blueprintStroke}
            strokeWidth="1.5"
            fill="none"
          />
          {/* Headlight outline */}
          <Path
            d="M 28 66 C 36 62, 54 62, 65 67 C 62 74, 42 77, 28 72 Z"
            stroke={blueprintStroke}
            strokeWidth="1.3"
            fill="none"
          />
          {/* Inner headlight lens */}
          <Circle cx="45" cy="68" r="3.5" stroke={blueprintStroke} strokeWidth="1" fill="none" />
          {/* Bumper curve & front grille */}
          <Path
            d="M 15 88 C 22 92, 55 98, 90 98 C 120 98, 142 94, 150 88"
            stroke={blueprintStroke}
            strokeWidth="1.3"
            fill="none"
          />
          <Line x1="40" y1="84" x2="120" y2="84" stroke={strokeLine} strokeWidth="1" />
          <Line x1="45" y1="89" x2="115" y2="89" stroke={strokeLine} strokeWidth="1" />
        </G>

        {/* 2. Right: Engine Block & Timing Gear Drafting Curves */}
        <G transform="translate(240, 35)" opacity={0.55}>
          <Circle cx="40" cy="40" r="34" stroke={blueprintStroke} strokeWidth="1.2" fill="none" strokeDasharray="5, 3" />
          <Circle cx="40" cy="40" r="22" stroke={blueprintStroke} strokeWidth="1.2" fill="none" />
          <Circle cx="40" cy="40" r="10" stroke={blueprintStroke} strokeWidth="1.2" fill="none" />
          {/* Gear teeth hints */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <Rect
              key={`g_tooth_${i}`}
              x="38"
              y="2"
              width="4"
              height="6"
              fill={blueprintStroke}
              transform={`rotate(${angle}, 40, 40)`}
            />
          ))}
          {/* Engine block lines */}
          <Line x1="0" y1="10" x2="70" y2="10" stroke={blueprintStroke} strokeWidth="1.2" />
          <Line x1="0" y1="70" x2="70" y2="70" stroke={blueprintStroke} strokeWidth="1.2" />
        </G>

        {/* 3. Center: Prominent Open-End Wrench (Rotated Diagonally matching reference) */}
        <G transform="translate(160, 4) rotate(15, 60, 50)">
          {/* Wrench Silhouette */}
          <Path
            d="M 46 22
               C 51 13, 62 7, 73 9
               C 83 11, 91 18, 95 28
               C 97 32, 96 37, 92 41
               L 77 34
               C 73 32, 68 35, 68 39
               C 68 44, 73 47, 77 47
               L 90 57
               C 84 62, 78 64, 70 62
               C 60 60, 52 52, 50 42
               L 10 88
               C 5 94, -3 94, -8 89
               C -13 84, -12 76, -6 71
               Z"
            fill={wrenchFill}
            stroke={wrenchStroke}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Inner Handle Grip Recess */}
          <Line
            x1="42"
            y1="47"
            x2="8"
            y2="79"
            stroke={wrenchStroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity={0.65}
          />
        </G>
      </Svg>
    </View>
  );
});

export default ChatPaleSageCover;

const styles = StyleSheet.create({
  coverContainer: {
    width: '100%',
    height: 118,
    overflow: 'hidden',
  },
});
