import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet, View, Text, Modal, TouchableOpacity,
  StatusBar, Animated, Dimensions, Easing,
  TextInput, ScrollView, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GREEN       = '#37633B';
const DARK_GREEN  = '#2A4E2E';
const CREAM       = '#FDFBF7';
const LABEL_COLOR = '#5A5A5A';
const BORDER      = '#D5DED6';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SignInScreen({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  
  // Transition / Swap State
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1: Create Account, 2: Add Your Car
  const shiftAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Form States (Sign In)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Form States (Register Step 1)
  const [fullName, setFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Form States (Register Step 2)
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');

  // Dynamic layout measurements
  const [creamHeight, setCreamHeight] = useState(535);
  const [greenHeight, setGreenHeight] = useState(150);

  // Keyboard Animation State
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  // Keyboard Event Listeners (Platform adaptive)
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-SCREEN_WIDTH);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 68,
        friction: 11,
      }).start();
    } else {
      // Reset state on close
      setIsRegisterMode(false);
      setRegisterStep(1);
      setFullName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setAgreeToTerms(false);
      setCarBrand('');
      setCarModel('');
      setCarYear('');
      setEmail('');
      setPassword('');
      shiftAnim.setValue(0);
      contentOpacity.setValue(1);
      keyboardAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleGoToRegister = () => {
    Animated.parallel([
      Animated.timing(shiftAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRegisterMode(true);
      setRegisterStep(1);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleGoToSignIn = () => {
    Animated.parallel([
      Animated.timing(shiftAnim, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsRegisterMode(false);
      setRegisterStep(1);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNextStep = () => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setRegisterStep(2);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePrevStep = () => {
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setRegisterStep(1);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  // Interpolations for translation swap (Normal layout)
  const whiteTranslateYNormal = shiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isRegisterMode ? [-greenHeight, 0] : [0, greenHeight],
  });

  const greenTranslateYNormal = shiftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isRegisterMode ? [creamHeight, 0] : [0, -creamHeight],
  });

  // Interpolations for Keyboard Offset
  const whiteKeyboardOffset = keyboardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isRegisterMode ? -greenHeight : 0],
  });

  const greenKeyboardOffset = keyboardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isRegisterMode ? -greenHeight : greenHeight],
  });

  // Combined Translations
  const whiteTranslateY = Animated.add(whiteTranslateYNormal, whiteKeyboardOffset);
  const greenTranslateY = Animated.add(greenTranslateYNormal, greenKeyboardOffset);

  // Keyboard green section fade out
  const greenOpacity = keyboardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const greenSectionTotalOpacity = Animated.multiply(contentOpacity, greenOpacity);

  return (
    <Modal
      visible={visible}
      animationType="none"
      statusBarTranslucent
      transparent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <Animated.View style={[styles.screen, { transform: [{ translateX: slideAnim }] }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Close button ── */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={CREAM} />
            </TouchableOpacity>
          </View>

          {/* ── Card + Register panel as one connected block ── */}
          <View style={styles.cardWrapper}>

            {!isRegisterMode ? (
              // ── SIGN IN STATE JSX ORDER: CREAM CARD ON TOP, GREEN SECTION ON BOTTOM ──
              <>
                {/* Creamy White Card */}
                <Animated.View 
                  key="cream-card"
                  onLayout={(e) => setCreamHeight(e.nativeEvent.layout.height)}
                  style={[
                    styles.card, 
                    { 
                      transform: [{ translateY: whiteTranslateY }],
                      zIndex: 10,
                      elevation: 10,
                    }
                  ]}
                >
                  <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>Welcome Back</Text>
                      <Text style={styles.cardSubtitle}>
                        Please enter your credentials{'\n'}to access your space.
                      </Text>

                      {/* Email */}
                      <Text style={styles.label}>EMAIL ADDRESS</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="mail-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="name@example.com"
                          placeholderTextColor="#ADADAD"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={email}
                          onChangeText={setEmail}
                        />
                      </View>

                      {/* Password */}
                      <Text style={[styles.label, { marginTop: 26 }]}>PASSWORD</Text>
                      <View style={styles.inputRow}>
                        <Ionicons name="lock-closed-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="••••••••"
                          placeholderTextColor="#ADADAD"
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} activeOpacity={0.7} style={styles.eyeBtn}>
                          <Ionicons
                            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            size={18}
                            color={LABEL_COLOR}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Remember me + Forgot password */}
                      <View style={styles.optionsRow}>
                        <TouchableOpacity
                          style={styles.rememberRow}
                          onPress={() => setRememberMe(v => !v)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                            {rememberMe && <Ionicons name="checkmark" size={11} color={CREAM} />}
                          </View>
                          <Text style={styles.rememberText}>Remember me</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={0.7}>
                          <Text style={styles.forgotText}>Forgot password?</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Sign In button */}
                      <TouchableOpacity style={styles.signInBtn} activeOpacity={0.85}>
                        <Text style={styles.signInBtnText}>Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                </Animated.View>

                {/* Dark Green Section */}
                <Animated.View 
                  key="green-section"
                  onLayout={(e) => setGreenHeight(e.nativeEvent.layout.height)}
                  style={[
                    styles.bottomSection, 
                    { 
                      transform: [{ translateY: greenTranslateY }],
                      zIndex: 1,
                      elevation: 1,
                      opacity: greenSectionTotalOpacity,
                    }
                  ]}
                >
                  <Animated.View style={{ width: '100%', alignItems: 'center', opacity: contentOpacity }}>
                    <Text style={styles.bottomTitle}>NEW TO WERASH?</Text>
                    <Text style={styles.bottomSubtitle}>
                      Create a Warsha to access all contents{`\n`}related to your car.
                    </Text>
                    <TouchableOpacity 
                      style={styles.registerBtn} 
                      activeOpacity={0.8} 
                      onPress={handleGoToRegister}
                    >
                      <Text style={styles.registerBtnText}>Register</Text>
                      <Ionicons name="arrow-forward" size={15} color={CREAM} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              </>
            ) : (
              // ── REGISTER STATE JSX ORDER: GREEN SECTION ON TOP, CREAM CARD ON BOTTOM ──
              <>
                {/* Dark Green Section */}
                <Animated.View 
                  key="green-section"
                  onLayout={(e) => setGreenHeight(e.nativeEvent.layout.height)}
                  style={[
                    styles.bottomSection, 
                    { 
                      transform: [{ translateY: greenTranslateY }],
                      zIndex: 1,
                      elevation: 1,
                      opacity: greenSectionTotalOpacity,
                    }
                  ]}
                >
                  <Animated.View style={{ width: '100%', alignItems: 'center', opacity: contentOpacity }}>
                    <Text style={styles.bottomTitle}>ALREADY HAVE A WARSHA?</Text>
                    <Text style={styles.bottomSubtitle}>
                      Sign in to get back to where you{`\n`}left of with your car.
                    </Text>
                    <TouchableOpacity 
                      style={styles.registerBtn} 
                      activeOpacity={0.8} 
                      onPress={handleGoToSignIn}
                    >
                      <Text style={styles.registerBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={15} color={CREAM} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>

                {/* Creamy White Card */}
                <Animated.View 
                  key="cream-card"
                  onLayout={(e) => setCreamHeight(e.nativeEvent.layout.height)}
                  style={[
                    styles.card, 
                    { 
                      transform: [{ translateY: whiteTranslateY }],
                      zIndex: 10,
                      elevation: 10,
                    }
                  ]}
                >
                  <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
                    {registerStep === 1 ? (
                      // STEP 1: CREATE ACCOUNT CONTENT (MATCHING IMAGE)
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>CREATE ACCOUNT</Text>
                        <Text style={styles.cardSubtitle}>
                          Join us to start personalizing your{'\n'}environment today.
                        </Text>

                        {/* Full Name */}
                        <Text style={styles.label}>FULL NAME</Text>
                        <View style={styles.inputRow}>
                          <Ionicons name="person-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            placeholderTextColor="#ADADAD"
                            autoCapitalize="words"
                            value={fullName}
                            onChangeText={setFullName}
                          />
                        </View>

                        {/* Email */}
                        <Text style={[styles.label, { marginTop: 14 }]}>EMAIL ADDRESS</Text>
                        <View style={styles.inputRow}>
                          <Ionicons name="mail-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="name@example.com"
                            placeholderTextColor="#ADADAD"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={registerEmail}
                            onChangeText={setRegisterEmail}
                          />
                        </View>

                        {/* Password */}
                        <Text style={[styles.label, { marginTop: 14 }]}>PASSWORD</Text>
                        <View style={styles.inputRow}>
                          <Ionicons name="lock-closed-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Min. 8 characters"
                            placeholderTextColor="#ADADAD"
                            secureTextEntry
                            value={registerPassword}
                            onChangeText={setRegisterPassword}
                          />
                        </View>

                        {/* Terms Checkbox */}
                        <View style={[styles.optionsRow, { marginTop: 16, marginBottom: 20 }]}>
                          <TouchableOpacity
                            style={styles.rememberRow}
                            onPress={() => setAgreeToTerms(v => !v)}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                              {agreeToTerms && <Ionicons name="checkmark" size={11} color={CREAM} />}
                            </View>
                            <Text style={styles.rememberText}>I agree to the Terms of Service</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Next Step button */}
                        <TouchableOpacity style={styles.signInBtn} activeOpacity={0.85} onPress={handleNextStep}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.signInBtnText}>Next Step</Text>
                            <Ionicons name="arrow-forward" size={16} color={CREAM} style={{ marginLeft: 6 }} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      // STEP 2: ADD YOUR CAR CONTENT (MATCHING IMAGE)
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>ADD YOUR CAR</Text>
                        <Text style={styles.cardSubtitle}>
                          Add a Warsha for your car to access{'\n'}related content.
                        </Text>

                        {/* Car Make / Brand */}
                        <Text style={styles.label}>CAR MAKE / BRAND</Text>
                        <View style={styles.inputRow}>
                          <Ionicons name="car-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. Porsche, BMW"
                            placeholderTextColor="#ADADAD"
                            value={carBrand}
                            onChangeText={setCarBrand}
                          />
                        </View>

                        {/* Model */}
                        <Text style={[styles.label, { marginTop: 14 }]}>MODEL</Text>
                        <View style={styles.inputRow}>
                          <Ionicons name="build-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. 911, M3"
                            placeholderTextColor="#ADADAD"
                            value={carModel}
                            onChangeText={setCarModel}
                          />
                        </View>

                        {/* Year */}
                        <Text style={[styles.label, { marginTop: 14 }]}>YEAR</Text>
                        <View style={styles.inputRow}>
                          <Ionicons name="calendar-outline" size={17} color={LABEL_COLOR} style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="e.g. 2024"
                            placeholderTextColor="#ADADAD"
                            keyboardType="numeric"
                            value={carYear}
                            onChangeText={setCarYear}
                          />
                        </View>

                        {/* Complete Registration button */}
                        <TouchableOpacity style={[styles.signInBtn, { marginTop: 22 }]} activeOpacity={0.85} onPress={handleClose}>
                          <Text style={styles.signInBtnText}>Complete Registration</Text>
                        </TouchableOpacity>

                        {/* Back & Skip Footer */}
                        <View style={styles.step2Footer}>
                          <TouchableOpacity onPress={handlePrevStep} activeOpacity={0.7}>
                            <Text style={styles.footerLink}>← Back</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                            <Text style={styles.footerLink}>Skip for Now</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </Animated.View>
                </Animated.View>
              </>
            )}

          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: GREEN,
  },
  scroll: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(253,251,247,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Card wrapper — holds card + bottom section as one block */
  cardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: DARK_GREEN,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  /* Card */
  card: {
    backgroundColor: CREAM,
    borderRadius: 24,
    height: 535,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  cardTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 36,
    color: DARK_GREEN,
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: LABEL_COLOR,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },

  /* Inputs */
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    color: LABEL_COLOR,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },

  /* Options row */
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: DARK_GREEN,
    borderColor: DARK_GREEN,
  },
  rememberText: {
    fontSize: 12.5,
    color: LABEL_COLOR,
  },
  forgotText: {
    fontSize: 12.5,
    color: DARK_GREEN,
    fontWeight: '600',
  },

  /* Sign In button */
  signInBtn: {
    backgroundColor: DARK_GREEN,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnText: {
    color: CREAM,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  /* Bottom section */
  bottomSection: {
    alignItems: 'center',
    backgroundColor: DARK_GREEN,
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  bottomTitle: {
    fontFamily: 'GuiltyTreasure',
    fontSize: 25,
    color: CREAM,
    marginBottom: 6,
  },
  bottomSubtitle: {
    fontSize: 13.5,
    color: 'rgba(253,251,247,0.75)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(253,251,247,0.5)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  registerBtnText: {
    color: CREAM,
    fontSize: 15,
    fontWeight: '600',
  },
  step2Footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    paddingHorizontal: 4,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_GREEN,
  },
});
