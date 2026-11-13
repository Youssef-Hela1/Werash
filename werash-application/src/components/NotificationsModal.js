import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import NotificationsScreen from '../screens/NotificationsScreen';

export default function NotificationsModal({
  visible,
  onClose,
  notifications,
  setNotifications,
  selectedLanguage,
  currentUser,
  onNavigate,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <NotificationsScreen
          currentUser={currentUser}
          selectedLanguage={selectedLanguage}
          notifications={notifications}
          setNotifications={setNotifications}
          onBack={onClose}
          onNavigate={(target) => {
            onClose();
            if (onNavigate) onNavigate(target);
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
