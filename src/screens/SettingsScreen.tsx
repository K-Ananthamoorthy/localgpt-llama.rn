import React, { useState } from 'react';
import { View, Text, Switch, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = () => {
  const { theme, colors, toggleTheme } = useTheme();
  const [autoDownload, setAutoDownload] = useState(false);

  const isDarkMode = theme === 'dark';

  const toggleAutoDownload = () => {
    setAutoDownload(prev => !prev);
    // Later: persist in AsyncStorage or context
  };

  const clearModelCache = async () => {
    try {
      // Only clear specific app data, not theme settings
      const keys = await AsyncStorage.getAllKeys();
      const modelKeys = keys.filter(key => key !== 'theme');
      await AsyncStorage.multiRemove(modelKeys);
      Alert.alert('Success', 'Model cache cleared!');
    } catch (e) {
      Alert.alert('Error', 'Failed to clear cache');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      <View style={styles.setting}>
        <Text style={{ color: colors.text }}>Dark Mode</Text>
        <Switch 
          value={isDarkMode} 
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.setting}>
        <Text style={{ color: colors.text }}>Auto-Download Models</Text>
        <Switch 
          value={autoDownload} 
          onValueChange={toggleAutoDownload}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={autoDownload ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.setting}>
        <Button title="Clear Model Cache" onPress={clearModelCache} color={colors.error} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
});

export default SettingsScreen;