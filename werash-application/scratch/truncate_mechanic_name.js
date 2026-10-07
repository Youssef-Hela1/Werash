const fs = require('fs');

let mechanics = fs.readFileSync('src/screens/MechanicsScreen.js', 'utf8');

mechanics = mechanics.replace(
  `<Text style={[styles.cardName, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.5 }]} numberOfLines={2}>`,
  `<Text style={[styles.cardName, isRtl && { textAlign: 'right', fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.5 }]} numberOfLines={1} ellipsizeMode="tail">`
);

fs.writeFileSync('src/screens/MechanicsScreen.js', mechanics, 'utf8');
console.log('MechanicsScreen card name updated to numberOfLines={1} with ellipsizeMode="tail"!');
