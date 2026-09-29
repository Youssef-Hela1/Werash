import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, Modal, TextInput, TouchableOpacity,
  Image, ScrollView, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStyles, useTheme } from '../styles/ThemeContext';

export default function ProfileScreen({
  visible,
  onClose,
  currentUser,
  onSaveProfile,
  onOpenSignIn,
  selectedLanguage
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isRtl = selectedLanguage === 'Arabic';

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);

  // Sync inputs with user data
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || null);
    }
  }, [currentUser, visible]);

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        isRtl ? 'مطلوب إذن المعرض' : 'Gallery Permission Required',
        isRtl 
          ? 'نحتاج إلى إذن للوصول إلى معرض الصور الخاص بك لتحديث صورة الملف الشخصي.' 
          : 'We need permission to access your gallery to update your profile picture.'
      );
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert(
        isRtl ? 'حقل مطلوب' : 'Required Field',
        isRtl ? 'الرجاء إدخال الاسم بالكامل.' : 'Please enter your full name.'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        isRtl ? 'بريد إلكتروني غير صالح' : 'Invalid Email',
        isRtl ? 'الرجاء إدخال بريد إلكتروني صحيح.' : 'Please enter a valid email address.'
      );
      return;
    }

    onSaveProfile({
      ...currentUser,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header Row */}
        <View style={[styles.header, isRtl && { flexDirection: 'row-reverse' }]}>
          <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name={isRtl ? "arrow-forward" : "arrow-back"} size={22} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 18.0 }]}>
            {isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile'}
          </Text>
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} activeOpacity={0.7}>
            <Text style={[styles.saveHeaderText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0 }]}>
              {isRtl ? 'حفظ' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {!currentUser ? (
          /* Guest state handler */
          <View style={styles.guestContainer}>
            <Ionicons name="person-circle-outline" size={80} color={colors.textMuted} />
            <Text style={[styles.guestTitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 18.0 }]}>
              {isRtl ? 'تعديل الملف الشخصي غير متاح' : 'Profile Edit Unavailable'}
            </Text>
            <Text style={[styles.guestSubtitle, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 13.0 }]}>
              {isRtl ? 'الرجاء تسجيل الدخول لحسابك لتعديل تفاصيلك الشخصية.' : 'Please sign in to your account to modify your personal details.'}
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                onOpenSignIn && onOpenSignIn();
              }}
            >
              <Text style={[styles.signInButtonText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 15.0 }]}>
                {isRtl ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                activeOpacity={0.85}
                onPress={pickImage}
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={54} color={colors.bgCreamy} />
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarTipText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]}>
                {isRtl ? 'اضغط لتغيير الصورة الشخصية' : 'Tap badge to update photo'}
              </Text>
            </View>

            {/* Input fields */}
            <View style={styles.formGroup}>
              {/* Full Name */}
              <View style={[styles.inputWrapper, isRtl && { alignItems: 'flex-end' }]}>
                <Text style={[styles.inputLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]}>
                  {isRtl ? 'الاسم الكامل' : 'FULL NAME'}
                </Text>
                <View style={[styles.textInputContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="person-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, isRtl && { textAlign: 'right' }]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={isRtl ? 'مثال: يوسف هلال' : 'e.g. Youssef Helal'}
                    placeholderTextColor={colors.textMuted + '60'}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={[styles.inputWrapper, isRtl && { alignItems: 'flex-end' }]}>
                <Text style={[styles.inputLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]}>
                  {isRtl ? 'البريد الإلكتروني' : 'EMAIL ADDRESS'}
                </Text>
                <View style={[styles.textInputContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, isRtl && { textAlign: 'right' }]}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="e.g. youssef@example.com"
                    placeholderTextColor={colors.textMuted + '60'}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={[styles.inputWrapper, isRtl && { alignItems: 'flex-end' }]}>
                <Text style={[styles.inputLabel, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 11.5 }]}>
                  {isRtl ? 'رقم الهاتف' : 'PHONE NUMBER'}
                </Text>
                <View style={[styles.textInputContainer, isRtl && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="call-outline" size={18} color={colors.bgBrand} style={isRtl ? { marginLeft: 8 } : { marginRight: 8 }} />
                  <TextInput
                    style={[styles.textInput, isRtl && { textAlign: 'right' }]}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="e.g. +20 123 456 7890"
                    placeholderTextColor={colors.textMuted + '60'}
                  />
                </View>
              </View>
            </View>

            {/* Bottom Actions Buttons */}
            <View style={[styles.bottomActions, isRtl && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={onClose}>
                <Text style={[styles.cancelButtonText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0 }]}>
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSave}>
                <Text style={[styles.saveButtonText, isRtl && { fontFamily: 'AlkhalilArabic-Bold', fontSize: 14.0 }]}>
                  {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCreamy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: colors.borderGreen,
    backgroundColor: colors.bgCreamy,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgBrandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textDark,
  },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.bgBrand,
  },
  saveHeaderText: {
    color: colors.textCream,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 50,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.bgBrand,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: colors.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bgBrand,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.bgBrand,
    borderWidth: 2,
    borderColor: colors.bgCreamy,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  avatarTipText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 10,
    fontWeight: '600',
  },
  formGroup: {
    gap: 20,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'column',
    width: '100%',
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgBrandLight,
    borderWidth: 1,
    borderColor: colors.borderGreen,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
    height: '100%',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13.5,
  },
  saveButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.bgBrand,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    color: colors.textCream,
    fontWeight: '700',
    fontSize: 13.5,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textDark,
    marginTop: 16,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: colors.bgBrand,
    borderRadius: 14,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    elevation: 2,
  },
  signInButtonText: {
    color: colors.textCream,
    fontWeight: '700',
    fontSize: 14,
  }
});
