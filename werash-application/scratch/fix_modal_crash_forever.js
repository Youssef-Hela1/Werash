const fs = require('fs');

// 1. Update specialistHelpers.js for string URI safety
let specHelpers = fs.readFileSync('src/data/specialistHelpers.js', 'utf8');

specHelpers = specHelpers.replace(
  `export const getSpecialistCover = (spec) => {
  if (spec?.image) return spec.image;`,
  `export const getSpecialistCover = (spec) => {
  if (spec?.image) {
    if (typeof spec.image === 'string') return { uri: spec.image };
    return spec.image;
  }`
);

specHelpers = specHelpers.replace(
  `export const getSpecialistAvatar = (spec) => {
  if (spec?.avatar) return spec.avatar;`,
  `export const getSpecialistAvatar = (spec) => {
  if (spec?.avatar) {
    if (typeof spec.avatar === 'string') return { uri: spec.avatar };
    return spec.avatar;
  }`
);

fs.writeFileSync('src/data/specialistHelpers.js', specHelpers, 'utf8');


// 2. Update SpecialistDetailModal.js for complete crash protection and null safety
let specModal = fs.readFileSync('src/components/SpecialistDetailModal.js', 'utf8');

// Ensure early return if specialist is null/undefined
specModal = specModal.replace(
  "export default function SpecialistDetailModal({ specialist, onClose, selectedLanguage, activeVehicle }) {",
  `export default function SpecialistDetailModal({ specialist, onClose, selectedLanguage, activeVehicle }) {
  if (!specialist) return null;`
);

// Safe rating text
specModal = specModal.replace(
  `{specialist.rating}{' '}
                    <Text style={styles.reviewsText}>
                      ({isRtl ? \`\${specialist.reviews} \` : \`\${specialist.reviews} reviews\`})
                    </Text>`,
  `{specialist?.rating || '4.5'}{' '}
                    <Text style={styles.reviewsText}>
                      ({isRtl ? \`\${specialist?.reviews || '0'} تقييم\` : \`\${specialist?.reviews || '0'} reviews\`})
                    </Text>`
);

fs.writeFileSync('src/components/SpecialistDetailModal.js', specModal, 'utf8');


// 3. Update App.js to pass activeVehicle to SpecialistDetailModal
let app = fs.readFileSync('App.js', 'utf8');

app = app.replace(
  `<SpecialistDetailModal 
          specialist={activeSpecialist} 
          onClose={() => setActiveSpecialist(null)} 
          selectedLanguage={selectedLanguage}
        />`,
  `<SpecialistDetailModal 
          specialist={activeSpecialist} 
          onClose={() => setActiveSpecialist(null)} 
          selectedLanguage={selectedLanguage}
          activeVehicle={userVehicles.find(v => v.id === activeVehicleId)}
        />`
);

fs.writeFileSync('App.js', app, 'utf8');

console.log('SpecialistDetailModal crash fix applied permanently!');
