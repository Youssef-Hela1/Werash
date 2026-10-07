const fs = require('fs');

// 1. Update ActiveVehicleCard.js
let card = fs.readFileSync('src/components/ActiveVehicleCard.js', 'utf8');

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
    minHeight: 236,`,
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
    minHeight: 236,`
);

fs.writeFileSync('src/components/ActiveVehicleCard.js', card, 'utf8');

// 2. Update HomeScreen.js
let home = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');

home = home.replace(
  `  leftColumn: {
    width: '48.5%',
  },`,
  `  leftColumn: {
    width: '48.5%',
    height: 236,
  },`
);

fs.writeFileSync('src/screens/HomeScreen.js', home, 'utf8');

console.log('ActiveVehicleCard height locked to 236px to match English layout!');
