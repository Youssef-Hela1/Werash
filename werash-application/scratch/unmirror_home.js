const fs = require('fs');

// 1. Unmirror HomeScreen.js
let home = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');

// Replace watermarks & layout reversals
home = home.replace(/isRtl && styles\.watermarkHaloRtl/g, 'false');
home = home.replace(/isRtl && styles\.miniCardWatermarkWrapperRtl/g, 'false');
home = home.replace(/isRtl && \{ flexDirection: 'row-reverse' \}/g, 'false');
home = home.replace(/isRtl && styles\.constructionSignWrapperRtl/g, 'false');
home = home.replace(/name=\{isRtl \? "arrow-back" : "arrow-forward"\}/g, 'name="arrow-forward"');
home = home.replace(/style=\{isRtl \? \{ marginLeft: 4 \} : \{ marginRight: 4 \}\}/g, 'style={{ marginRight: 4 }}');

// Fix text alignment in miniCardTitleArabic and miniCardSubtitleArabic
home = home.replace(/textAlign: 'right',/g, "textAlign: 'left',");

fs.writeFileSync('src/screens/HomeScreen.js', home, 'utf8');


// 2. Unmirror ActiveVehicleCard.js
let activeCard = fs.readFileSync('src/components/ActiveVehicleCard.js', 'utf8');

activeCard = activeCard.replace(/isRtl && \{ flexDirection: 'row-reverse' \}/g, 'false');
activeCard = activeCard.replace(/isRtl \? \{ marginLeft: (\d+) \} : \{ marginRight: (\d+) \}/g, 'style={{ marginRight: $2 }}');
activeCard = activeCard.replace(/isRtl \? \{ marginLeft: (\d+), marginRight: 0 \} : \{ marginRight: (\d+) \}/g, 'style={{ marginRight: $2 }}');
activeCard = activeCard.replace(/isRtl && \{ paddingLeft: 10, paddingRight: 0 \}/g, 'false');
activeCard = activeCard.replace(/isRtl && \{ textAlign: 'right' \}/g, 'false');

fs.writeFileSync('src/components/ActiveVehicleCard.js', activeCard, 'utf8');


// 3. Unmirror Header.js
let header = fs.readFileSync('src/components/Header.js', 'utf8');

header = header.replace(/isRTL && \{ flexDirection: 'row-reverse' \}/g, 'false');
header = header.replace(/isRTL && styles\.brandWrapperRtl/g, 'false');
header = header.replace(/isRTL && styles\.logoContainerRtl/g, 'false');
header = header.replace(/isRTL && styles\.logoImageRtl/g, 'false');
header = header.replace(/isRTL \? styles\.cornerTireBlobRtl : styles\.cornerTireBlobLtr/g, 'styles.cornerTireBlobLtr');
header = header.replace(/isRTL && styles\.notificationButtonHomeRtl/g, 'false');
header = header.replace(/isRTL \? \{ left: -4 \} : \{ right: -4 \}/g, '{ right: -4 }');
header = header.replace(/isRTL \? \{ left: -6 \} : \{ right: -6 \}/g, '{ right: -6 }');
header = header.replace(/isRTL \? \{ marginLeft: 6 \} : \{ marginRight: 6 \}/g, '{ marginRight: 6 }');

fs.writeFileSync('src/components/Header.js', header, 'utf8');


// 4. Unmirror SpecialistSpotlight.js
let spotlight = fs.readFileSync('src/components/SpecialistSpotlight.js', 'utf8');

spotlight = spotlight.replace(/isRtl && \{ flexDirection: 'row-reverse' \}/g, 'false');
spotlight = spotlight.replace(/isRtl && \{ textAlign: 'right' \}/g, 'false');

fs.writeFileSync('src/components/SpecialistSpotlight.js', spotlight, 'utf8');

console.log('Home Page successfully un-mirrored while keeping Arabic text!');
