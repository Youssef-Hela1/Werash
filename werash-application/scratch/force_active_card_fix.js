const fs = require('fs');

let card = fs.readFileSync('src/components/ActiveVehicleCard.js', 'utf8');

// Replace minHeight: 236 with height, minHeight, maxHeight, overflow
card = card.replace(
  "minHeight: 236,",
  "height: 236,\n    minHeight: 236,\n    maxHeight: 236,\n    overflow: 'hidden',"
);

// Replace verticalImageSection height 102 -> 65
card = card.replace(
  "height: 102,",
  "height: 65,"
);

// Replace verticalBrandLogo width/height 110/98 -> 75/55
card = card.replace(
  "width: 110,\n    height: 98,",
  "width: 75,\n    height: 55,"
);

fs.writeFileSync('src/components/ActiveVehicleCard.js', card, 'utf8');
console.log('Force update to ActiveVehicleCard applied!');
