import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import NotificationsScreen from '../screens/NotificationsScreen';
import { useTheme } from '../styles/ThemeContext';

export default function NotificationsModal({
  visible,
  onClose,
  notifications,
  setNotifications,
  selectedLanguage,
  currentUser,
  userVehicles,
  onNavigate,
  onOpenChat,
  onRefresh,
}) {
  const { colors, isDarkMode } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDarkMode ? colors.screenBg : '#FFFFFF' }]}>
        <NotificationsScreen
          currentUser={currentUser}
          userVehicles={userVehicles}
          selectedLanguage={selectedLanguage}
          notifications={notifications}
          setNotifications={setNotifications}
          onBack={onClose}
          onRefresh={onRefresh}
          onNavigate={(target) => {
            onClose();
            if (onNavigate) onNavigate(target);
          }}
          onOpenChat={(chatUser) => {
            onClose();
            if (onOpenChat) onOpenChat(chatUser);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
