// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme type
export type ThemeType = 'dark' | 'light';

// Color definitions
export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  primary: string;
  accent: string;
  error: string;
  userBubble: string;
  assistantBubble: string;
  systemBubble: string;
  userText: string;
  assistantText: string;
  inputBackground: string;
  modalBackground: string;
  cancelButton: string;
  infoText: string;
}

export const themes: Record<ThemeType, ThemeColors> = {
  light: {
    background: '#FAFAFA',           // Soft off-white background
    card: '#FFFFFF',                 // True white cards
    text: '#111111',                 // Rich black for main text
    secondaryText: '#444444',        // More readable secondary text
    border: '#E0E0E0',               // Soft but visible border
    primary: '#007AFF',              // iOS-style blue
    accent: '#005FCC',               // Slightly deeper blue for accent elements
    error: '#D32F2F',                // Consistent error red
    userBubble: '#007AFF',           // Primary blue for user messages
    assistantBubble: '#F1F1F1',      // Softer assistant background
    systemBubble: '#EDEDED',         // Slightly darker for distinction
    userText: '#FFFFFF',             // White on blue bubble
    assistantText: '#111111',        // Rich black on light bubble
    inputBackground: '#F5F5F5',      // Clean input background
    modalBackground: '#FFFFFF',      // Modals match card look
    cancelButton: '#E0E0E0',         // Subtle cancel button background
    infoText: '#777777',             // Better gray for hints/info
  },
  
  dark: {
    background: '#0A0A0A',         // Deeper black tone
    card: '#121212',               // Very dark card background
    text: '#F1F1F1',
    secondaryText: '#BBBBBB',
    border: '#1F1F1F',
    primary: '#0A84FF',
    accent: '#448AFF',
    error: '#FF453A',
    userBubble: '#0A84FF',
    assistantBubble: '#1A1A1A',    // Rich black instead of gray
    systemBubble: '#2A2A2A',       // Neutral but darker
    userText: '#FFFFFF',
    assistantText: '#F1F1F1',
    inputBackground: '#1A1A1A',
    modalBackground: '#1A1A1A',
    cancelButton: '#2C2C2C',
    infoText: '#888888',
  },
};

interface ThemeContextProps {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        setTheme(savedTheme === 'light' ? 'light' : 'dark');
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: themes[theme], toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
