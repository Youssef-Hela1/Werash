const fs = require('fs');

// 1. Update ActiveVehicleCard.js to guarantee clean fit inside 236px without overflow
let card = fs.readFileSync('src/components/ActiveVehicleCard.js', 'utf8');

// Replace verticalCardContainer styles
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
    maxHeight: 236,
    overflow: 'hidden',
  },`,
  `  verticalCardContainer: {
    backgroundColor: colors.white === '#FFFFFF' ? '#E2ECE1' : '#1E2B20',
    borderWidth: 1.2,
    borderColor: colors.white === '#FFFFFF' ? 'rgba(77, 110, 79, 0.22)' : 'rgba(93, 130, 96, 0.26)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 236,
    minHeight: 236,
    maxHeight: 236,
    overflow: 'hidden',
  },`
);

// Replace verticalImageSection and logo sizes
card = card.replace(
  `  verticalImageSection: {
    width: '100%',
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },`,
  `  verticalImageSection: {
    width: '100%',
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },`
);

card = card.replace(
  `  verticalBrandLogo: {
    width: 100,
    height: 84,
  },`,
  `  verticalBrandLogo: {
    width: 78,
    height: 58,
  },`
);

fs.writeFileSync('src/components/ActiveVehicleCard.js', card, 'utf8');

// 2. Update Header.js for clean greeting text in Arabic
let header = fs.readFileSync('src/components/Header.js', 'utf8');

header = header.replace(
  `{selectedLanguage === 'Arabic' 
                  ? (getFirstName() ? \`أهلاً \${getFirstName()}\` : 'أهلاً بك')
                  : (getFirstName() ? \`Hello \${getFirstName()}\` : 'Hello Guest')}`,
  `{selectedLanguage === 'Arabic' 
                  ? (getFirstName() ? \`أهلاً \${getFirstName()}\` : 'أهلاً بك')
                  : (getFirstName() ? \`Hello \${getFirstName()}\` : 'Hello Guest')}`
);

fs.writeFileSync('src/components/Header.js', header, 'utf8');

console.log('ActiveVehicleCard sizing and Header greeting updated successfully!');
