import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

export default function ServiceBrandLogo({ brand, size = 120 }) {
  const brandKey = (brand || '').toLowerCase();

  switch (brandKey) {
    case 'shell':
      return (
        <View style={styles.container}>
          <Svg width={48} height={44} viewBox="0 0 100 92">
            {/* Shell Scallop outer shape */}
            <Path
              d="M50 4 C35 4 12 25 12 55 C12 68 20 78 30 82 L30 88 L70 88 L70 82 C80 78 88 68 88 55 C88 25 65 4 50 4 Z"
              fill="#FFD500"
              stroke="#DD1D21"
              strokeWidth="6"
            />
            {/* Shell Rays */}
            <Path d="M50 14 L50 82" stroke="#DD1D21" strokeWidth="4" />
            <Path d="M50 14 L34 80" stroke="#DD1D21" strokeWidth="4" />
            <Path d="M50 14 L66 80" stroke="#DD1D21" strokeWidth="4" />
            <Path d="M50 14 L20 72" stroke="#DD1D21" strokeWidth="4" />
            <Path d="M50 14 L80 72" stroke="#DD1D21" strokeWidth="4" />
          </Svg>
          <Text style={styles.shellText}>Shell</Text>
        </View>
      );

    case 'mobil':
    case 'mobil1':
      return (
        <View style={styles.container}>
          <View style={styles.row}>
            <Text style={[styles.mobilText, { color: '#005CA9' }]}>M</Text>
            <Text style={[styles.mobilText, { color: '#E31B23' }]}>o</Text>
            <Text style={[styles.mobilText, { color: '#005CA9' }]}>bil</Text>
          </View>
          <View style={styles.mobilBadge}>
            <Text style={styles.mobilBadgeText}>1</Text>
          </View>
        </View>
      );

    case 'castrol':
      return (
        <View style={styles.container}>
          <View style={styles.castrolBadge}>
            <Text style={styles.castrolText}>Castrol</Text>
          </View>
        </View>
      );

    case 'bosch':
      return (
        <View style={styles.container}>
          <View style={styles.row}>
            <Svg width={26} height={26} viewBox="0 0 100 100" style={{ marginRight: 6 }}>
              <Circle cx="50" cy="50" r="44" fill="none" stroke="#EA2212" strokeWidth="10" />
              <Rect x="42" y="16" width="16" height="68" fill="#EA2212" rx="4" />
              <Rect x="20" y="42" width="60" height="16" fill="#EA2212" rx="4" />
            </Svg>
            <Text style={styles.boschText}>BOSCH</Text>
          </View>
        </View>
      );

    case 'brembo':
      return (
        <View style={styles.container}>
          <View style={styles.bremboBadge}>
            <Svg width={20} height={20} viewBox="0 0 100 100" style={{ marginRight: 6 }}>
              <Circle cx="40" cy="50" r="28" fill="none" stroke="#FFFFFF" strokeWidth="12" />
              <Circle cx="60" cy="50" r="28" fill="none" stroke="#FFFFFF" strokeWidth="12" />
            </Svg>
            <Text style={styles.bremboText}>brembo</Text>
          </View>
        </View>
      );

    case 'total':
    case 'totalenergies':
      return (
        <View style={styles.container}>
          <Svg width={36} height={36} viewBox="0 0 100 100">
            <Circle cx="35" cy="40" r="25" fill="#ED1C24" opacity={0.9} />
            <Circle cx="60" cy="35" r="22" fill="#FFC20E" opacity={0.9} />
            <Circle cx="50" cy="65" r="24" fill="#00A3E0" opacity={0.9} />
            <Circle cx="30" cy="60" r="18" fill="#50B848" opacity={0.8} />
          </Svg>
          <Text style={styles.totalText}>TOTAL</Text>
        </View>
      );

    case 'varta':
      return (
        <View style={styles.container}>
          <View style={styles.vartaBadge}>
            <Text style={styles.vartaText}>VARTA</Text>
          </View>
        </View>
      );

    case 'michelin':
      return (
        <View style={styles.container}>
          <View style={styles.michelinBadge}>
            <Text style={styles.michelinText}>MICHELIN</Text>
          </View>
        </View>
      );

    default:
      return (
        <View style={styles.container}>
          <Text style={styles.defaultText}>{(brand || 'SERVICE').toUpperCase()}</Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shellText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DD1D21',
    letterSpacing: 1,
    marginTop: 2,
  },
  mobilText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mobilBadge: {
    backgroundColor: '#E31B23',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  mobilBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  castrolBadge: {
    backgroundColor: '#00843D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#E31B23',
  },
  castrolText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  boschText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#002447',
    letterSpacing: 2,
  },
  bremboBadge: {
    backgroundColor: '#E31B23',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bremboText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: -0.5,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#002D62',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  vartaBadge: {
    backgroundColor: '#002B49',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderBottomWidth: 4,
    borderBottomColor: '#F2A900',
  },
  vartaText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 2,
  },
  michelinBadge: {
    backgroundColor: '#00205B',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#F2A900',
  },
  michelinText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  defaultText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333333',
    letterSpacing: 1,
  },
});
