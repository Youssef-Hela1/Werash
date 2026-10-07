const fs = require('fs');

let card = fs.readFileSync('src/components/ActiveVehicleCard.js', 'utf8');

// Replace row-reverse layout direction
card = card.replace(/isRtl && \{ flexDirection: 'row-reverse' \}/g, 'false');

// Replace Icon margin flips
card = card.replace(/style=\{isRtl \? \{ marginLeft: 5 \} : \{ marginRight: 5 \}\}/g, "style={{ marginRight: 5 }}");
card = card.replace(/style=\{isRtl \? \{ marginLeft: 6, marginRight: 0 \} : \{ marginRight: 6 \}\}/g, "style={{ marginRight: 6 }}");
card = card.replace(/style=\{isRtl \? \{ marginLeft: 4, marginRight: 0 \} : \{ marginRight: 4 \}\}/g, "style={{ marginRight: 4 }}");

// Replace text padding & alignment flips
card = card.replace(/isRtl && \{ paddingLeft: 10, paddingRight: 0 \}/g, 'false');
card = card.replace(/isRtl && \{ textAlign: 'right' \}/g, 'false');

fs.writeFileSync('src/components/ActiveVehicleCard.js', card, 'utf8');
console.log('ActiveVehicleCard unmirrored cleanly!');
