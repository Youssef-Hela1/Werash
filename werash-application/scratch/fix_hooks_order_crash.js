const fs = require('fs');

let specModal = fs.readFileSync('src/components/SpecialistDetailModal.js', 'utf8');

// 1. Remove early return before hooks
specModal = specModal.replace(
  `export default function SpecialistDetailModal({ specialist, onClose, selectedLanguage, activeVehicle }) {
  if (!specialist) return null;`,
  `export default function SpecialistDetailModal({ specialist, onClose, selectedLanguage, activeVehicle }) {`
);

// 2. Place early return right before backdropOpacity calculation (after all hooks)
specModal = specModal.replace(
  `  const backdropOpacity = panY.interpolate({`,
  `  if (!specialist) return null;\n\n  const backdropOpacity = panY.interpolate({`
);

fs.writeFileSync('src/components/SpecialistDetailModal.js', specModal, 'utf8');
console.log('Hooks order in SpecialistDetailModal fixed completely!');
