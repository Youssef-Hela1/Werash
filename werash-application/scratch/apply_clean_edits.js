const fs = require('fs');

// 1. specialistHelpers.js
let specHelpers = fs.readFileSync('src/data/specialistHelpers.js', 'utf8');
if (!specHelpers.includes('getMechanicBrandLogo')) {
  specHelpers = specHelpers.replace(
    "import { Linking, Alert } from 'react-native';",
    "import { Linking, Alert } from 'react-native';\nimport { BRAND_LOGOS } from './brandLogos';"
  );
  specHelpers += `\n\nexport const getMechanicBrandLogo = (spec, activeVehicle) => {\n  if (activeVehicle && activeVehicle.brand) {\n    const brand = activeVehicle.brand.toLowerCase();\n    if (BRAND_LOGOS[brand]) return BRAND_LOGOS[brand];\n  }\n  return null;\n};\n`;
  fs.writeFileSync('src/data/specialistHelpers.js', specHelpers, 'utf8');
}

// 2. MechanicsScreen.js
let mechanics = fs.readFileSync('src/screens/MechanicsScreen.js', 'utf8');
if (!mechanics.includes('getMechanicBrandLogo')) {
  mechanics = mechanics.replace(
    "import { getSpecialistCover } from '../data/specialistHelpers';",
    "import { getSpecialistCover, getMechanicBrandLogo } from '../data/specialistHelpers';"
  );
  mechanics = mechanics.replace(
    '<Image source={getSpecialistCover(specialist)} style={styles.cardCover} />',
    `{(() => {
            const brandLogo = getMechanicBrandLogo(specialist, activeVehicle);
            if (brandLogo) {
              return (
                <View style={[styles.cardCover, { backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }]}>
                  <Image source={brandLogo} resizeMode="contain" style={{ width: '65%', height: '65%' }} />
                </View>
              );
            }
            return <Image source={getSpecialistCover(specialist)} style={styles.cardCover} />;
          })()}`
  );
  fs.writeFileSync('src/screens/MechanicsScreen.js', mechanics, 'utf8');
}

// 3. SpecialistDetailModal.js
let specModal = fs.readFileSync('src/components/SpecialistDetailModal.js', 'utf8');
if (!specModal.includes('getMechanicBrandLogo')) {
  specModal = specModal.replace(
    "export default function SpecialistDetailModal({ specialist, onClose, selectedLanguage }) {",
    "export default function SpecialistDetailModal({ specialist, onClose, selectedLanguage, activeVehicle }) {"
  );
  specModal = specModal.replace(
    "messageSpecialist \n} from '../data/specialistHelpers';",
    "messageSpecialist,\n  getMechanicBrandLogo\n} from '../data/specialistHelpers';"
  );
  specModal = specModal.replace(
    "messageSpecialist\n} from '../data/specialistHelpers';",
    "messageSpecialist,\n  getMechanicBrandLogo\n} from '../data/specialistHelpers';"
  );
  specModal = specModal.replace(
    '<Image source={getSpecialistCover(specialist)} style={styles.expandedCover} />',
    `{(() => {
            const brandLogo = getMechanicBrandLogo(specialist, activeVehicle);
            if (brandLogo) {
              return (
                <View style={[styles.expandedCover, { backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }]}>
                  <Image source={brandLogo} resizeMode="contain" style={{ width: '65%', height: '65%' }} />
                </View>
              );
            }
            return <Image source={getSpecialistCover(specialist)} style={styles.expandedCover} />;
          })()}`
  );
  fs.writeFileSync('src/components/SpecialistDetailModal.js', specModal, 'utf8');
}

// 4. SpecialistSpotlight.js
let spotlight = fs.readFileSync('src/components/SpecialistSpotlight.js', 'utf8');
if (!spotlight.includes('ServiceBrandLogo')) {
  spotlight = spotlight.replace(
    "import { BlurView } from 'expo-blur';",
    "import { BlurView } from 'expo-blur';\nimport ServiceBrandLogo from './ServiceBrandLogo';"
  );
  spotlight = spotlight.replace("id: 'ad-tuning',", "id: 'ad-tuning', serviceBrand: 'mobil',");
  spotlight = spotlight.replace("id: 'ad-ceramic',", "id: 'ad-ceramic', serviceBrand: 'shell',");
  spotlight = spotlight.replace("id: 'ad-parts',", "id: 'ad-parts', serviceBrand: 'bosch',");
  spotlight = spotlight.replace("id: 'ad-turbo',", "id: 'ad-turbo', serviceBrand: 'total',");
  spotlight = spotlight.replace("id: 'ad-wash',", "id: 'ad-wash', serviceBrand: 'castrol',");
  spotlight = spotlight.replace("id: 'ad-brakes',", "id: 'ad-brakes', serviceBrand: 'brembo',");
  spotlight = spotlight.replace("id: 'ad-transmission',", "id: 'ad-transmission', serviceBrand: 'mobil',");
  spotlight = spotlight.replace("id: 'ad-tires',", "id: 'ad-tires', serviceBrand: 'michelin',");
  spotlight = spotlight.replace("id: 'ad-battery',", "id: 'ad-battery', serviceBrand: 'varta',");
  spotlight = spotlight.replace("id: 'ad-carbon',", "id: 'ad-carbon', serviceBrand: 'shell',");

  spotlight = spotlight.replace(
    '<Image source={ad.image} style={styles.adImage} />',
    `<View style={{ flex: 1, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }}>
                {ad.serviceBrand ? (
                  <ServiceBrandLogo brand={ad.serviceBrand} />
                ) : (
                  <Image source={ad.image} resizeMode="contain" style={{ width: '65%', height: '65%' }} />
                )}
              </View>`
  );
  fs.writeFileSync('src/components/SpecialistSpotlight.js', spotlight, 'utf8');
}

// 5. AdDetailModal.js
let adModal = fs.readFileSync('src/components/AdDetailModal.js', 'utf8');
if (!adModal.includes('ServiceBrandLogo')) {
  adModal = adModal.replace(
    "import { BlurView } from 'expo-blur';",
    "import { BlurView } from 'expo-blur';\nimport ServiceBrandLogo from './ServiceBrandLogo';"
  );
  adModal = adModal.replace(
    '<Image source={ad.image} style={styles.expandedCover} />',
    `<View style={[styles.expandedCover, { backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' }]}>
            {ad.serviceBrand ? (
              <ServiceBrandLogo brand={ad.serviceBrand} />
            ) : (
              <Image source={ad.image} resizeMode="contain" style={{ width: '65%', height: '65%' }} />
            )}
          </View>`
  );
  fs.writeFileSync('src/components/AdDetailModal.js', adModal, 'utf8');
}

// 6. SignInScreen.js
let signIn = fs.readFileSync('src/screens/SignInScreen.js', 'utf8');
if (!signIn.includes('STORAGE_KEY_LOCAL_USERS')) {
  signIn = signIn.replace(
    "import { useTheme } from '../styles/ThemeContext';",
    "import { useTheme } from '../styles/ThemeContext';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n\nconst STORAGE_KEY_LOCAL_USERS = '@werash_local_users_db';"
  );
  signIn = signIn.replace("const localUsersDb = [", "let localUsersDb = [");
  signIn = signIn.replace(
    "let localUsersDb = [",
    "// Load local users DB from AsyncStorage on launch\nAsyncStorage.getItem(STORAGE_KEY_LOCAL_USERS).then(stored => {\n  if (stored) {\n    try {\n      const parsed = JSON.parse(stored);\n      if (Array.isArray(parsed) && parsed.length > 0) {\n        localUsersDb = parsed;\n      }\n    } catch (_) {}\n  }\n}).catch(() => {});\n\nlet localUsersDb = ["
  );
  signIn = signIn.replace(
    "localUsersDb.push(newUser);",
    "localUsersDb.push(newUser);\n      AsyncStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(localUsersDb)).catch(() => {});"
  );
  fs.writeFileSync('src/screens/SignInScreen.js', signIn, 'utf8');
}

// 7. App.js
let app = fs.readFileSync('App.js', 'utf8');
if (!app.includes('STORAGE_KEY_USER_VEHICLES')) {
  app = app.replace(
    "import { ThemeProvider, useThemeStyles, useTheme } from './src/styles/ThemeContext';",
    "import { ThemeProvider, useThemeStyles, useTheme } from './src/styles/ThemeContext';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\n\nconst STORAGE_KEY_USER_VEHICLES = '@werash_user_vehicles';\nconst STORAGE_KEY_ACTIVE_VEHICLE_ID = '@werash_active_vehicle_id';\nconst STORAGE_KEY_CURRENT_USER = '@werash_current_user';"
  );

  app = app.replace(
    '<SpecialistDetailModal \n          specialist={activeSpecialist} \n          onClose={() => setActiveSpecialist(null)} \n          selectedLanguage={selectedLanguage}\n        />',
    `<SpecialistDetailModal 
          specialist={activeSpecialist} 
          onClose={() => setActiveSpecialist(null)} 
          selectedLanguage={selectedLanguage}
          activeVehicle={userVehicles.find(v => v.id === activeVehicleId)}
        />`
  );

  const syncEffectTarget = "  // Sync user cars on login/change";
  const syncEffectReplacement = `  // Load stored user & vehicles on launch
  useEffect(() => {
    let isMounted = true;
    const loadStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY_CURRENT_USER);
        if (storedUser && isMounted) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser) setCurrentUser(parsedUser);
        }

        const storedVehicles = await AsyncStorage.getItem(STORAGE_KEY_USER_VEHICLES);
        const storedActiveId = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_VEHICLE_ID);
        if (storedVehicles && isMounted) {
          const parsedVehicles = JSON.parse(storedVehicles);
          if (Array.isArray(parsedVehicles) && parsedVehicles.length > 0) {
            setUserVehicles(parsedVehicles);
            setActiveVehicleId(storedActiveId || parsedVehicles[0].id);
          }
        }
      } catch (e) {
        console.warn('Storage load error:', e);
      }
    };
    loadStorage();
    return () => { isMounted = false; };
  }, []);

  // Save vehicles when updated
  useEffect(() => {
    if (userVehicles && userVehicles.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY_USER_VEHICLES, JSON.stringify(userVehicles)).catch(() => {});
    }
  }, [userVehicles]);

  // Save active vehicle ID when changed
  useEffect(() => {
    if (activeVehicleId) {
      AsyncStorage.setItem(STORAGE_KEY_ACTIVE_VEHICLE_ID, activeVehicleId).catch(() => {});
    }
  }, [activeVehicleId]);

  // Save current user session when updated
  useEffect(() => {
    if (currentUser) {
      AsyncStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_CURRENT_USER).catch(() => {});
    }
  }, [currentUser]);

  // Sync user cars on login/change`;

  app = app.replace(syncEffectTarget, syncEffectReplacement);
  fs.writeFileSync('App.js', app, 'utf8');
}

console.log('Clean surgical edits complete!');
