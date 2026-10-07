const fs = require('fs');

let card = fs.readFileSync('src/components/ActiveVehicleCard.js', 'utf8');

// 1. Add numberOfLines={2} to verticalNoVehicleText and numberOfLines={1} to verticalNoVehicleSubtext
card = card.replace(
  `<Text style={[styles.verticalNoVehicleText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]}>`,
  `<Text style={[styles.verticalNoVehicleText, isRtl && { fontFamily: 'AlkhalilArabic-Bold' }]} numberOfLines={2}>`
);

card = card.replace(
  `<Text style={styles.verticalNoVehicleSubtext}>`,
  `<Text style={styles.verticalNoVehicleSubtext} numberOfLines={1}>`
);

// 2. Lock verticalCardContainer height and maxHeight to 236px with overflow hidden
card = card.replace(
  `  verticalCardContainer: {
    backgroundColor: colors.white === '#FFFFFF' ? '#E2ECE1' : '#1E2B20',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.22)' : 'rgba(93, 130, 96, 0.26)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 236,
    minHeight: 236,
  },`,
  `  verticalCardContainer: {
    backgroundColor: colors.white === '#FFFFFF' ? '#E2ECE1' : '#1E2B20',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.22)' : 'rgba(93, 130, 96, 0.26)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 236,
    minHeight: 236,
    maxHeight: 236,
    overflow: 'hidden',
  },`
);

// 3. Adjust verticalImageSection height slightly to 88px so logo and text fit cleanly without pushing
card = card.replace(
  `  verticalImageSection: {
    width: '100%',
    height: 102,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },`,
  `  verticalImageSection: {
    width: '100%',
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },`
);

card = card.replace(
  `  verticalBrandLogo: {
    width: 110,
    height: 98,
  },`,
  `  verticalBrandLogo: {
    width: 100,
    height: 84,
  },`
);

fs.writeFileSync('src/components/ActiveVehicleCard.js', card, 'utf8');
console.log('ActiveVehicleCard size strictly fixed to 236px across English and Arabic!');
