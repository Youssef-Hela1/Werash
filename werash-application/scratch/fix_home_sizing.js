const fs = require('fs');

// 1. Update HomeScreen.js
let home = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');

home = home.replace(
  `  miniCardTitleArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 13.5,
    letterSpacing: 0,
    textAlign: 'left',
  },`,
  `  miniCardTitleArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 15,
    letterSpacing: 0,
    textAlign: 'left',
  },`
);

home = home.replace(
  `  miniCardSubtitleArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 9.5,
    letterSpacing: 0,
    textAlign: 'left',
    marginTop: 1,
  },`,
  `  miniCardSubtitleArabic: {
    fontFamily: 'AlkhalilArabic-Bold',
    fontSize: 10.5,
    letterSpacing: 0,
    textAlign: 'left',
    marginTop: 2,
  },`
);

fs.writeFileSync('src/screens/HomeScreen.js', home, 'utf8');

// 2. Update ActiveVehicleCard.js
let card = fs.readFileSync('src/components/ActiveVehicleCard.js', 'utf8');

card = card.replace(
  `(isRtl && !showExtendedInfo) ? { height: hasFooter ? 145 : 125, marginTop: 0 } : { minHeight: hasFooter ? 145 : 125 }`,
  `{ minHeight: hasFooter ? 145 : 125 }`
);

fs.writeFileSync('src/components/ActiveVehicleCard.js', card, 'utf8');

console.log('HomeScreen & ActiveVehicleCard font & card sizing unified with English!');
