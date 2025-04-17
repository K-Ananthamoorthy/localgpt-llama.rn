import * as React from 'react';
import { Platform, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../context/ThemeContext';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DeviceCheckScreen from '../screens/DeviceCheckScreen';
import CustomModelScreen from '../screens/CustomModelScreen';

// Type definitions
export type RootStackParamList = {
  Chat: { modelPath: string; modelId: string };
  Home: { refresh?: boolean };
  Splash: undefined;
  MainTabs: undefined;
  Download: { modelId: string };
  AddCustomModel: undefined;
};

export type MainTabParamList = {
  Home: { refresh?: boolean };
  CustomModels: undefined;
  DeviceCheck: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const emojiMap = {
  Home: '📦',       // Home/house emoji
  CustomModels: '⬇️', // Download arrow emoji
  DeviceCheck: '📱', // Mobile phone emoji
  Settings: '⚙️',   // Gear emoji
};

const MainTabNavigator = () => {
  const { colors, theme } = useTheme();
  
  const getTabBarIcon = (routeName: keyof typeof emojiMap, focused: boolean) => {
    const emoji = emojiMap[routeName] || '❓'; // Question mark as fallback
    return (
      <Text style={{
        fontSize: 16,
        color: focused ? colors.primary : colors.secondaryText,
        marginBottom: Platform.OS === 'android' ? -3 : 0,
        includeFontPadding: false,  // Removes extra padding around emoji
        textAlignVertical: 'center',
      }}>
        {emoji}
      </Text>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'android' ? 3 : 0,
        },
        tabBarStyle: { 
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 60,
          paddingBottom: Platform.OS === 'ios' ? 25 : 5,
        },
        headerStyle: {
          backgroundColor: colors.card,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarIcon: ({ focused }) => getTabBarIcon(route.name as keyof typeof emojiMap, focused),
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: "Models" }}
      />
      <Tab.Screen 
        name="CustomModels" 
        component={CustomModelScreen} 
        options={{ title: "Add Models" }}
      />
      <Tab.Screen 
        name="DeviceCheck" 
        component={DeviceCheckScreen} 
        options={{ title: "Device" }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { colors, theme } = useTheme();
  
  return (
    <NavigationContainer
      theme={{
        dark: theme === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.error,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: Platform.select({
            android: {
              backgroundColor: colors.card,
              elevation: 0,
            },
            ios: {
              backgroundColor: colors.card,
              shadowOpacity: 0,
            },
          }),
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={({ route }) => ({
            title: route.params?.modelId || "Chat",
            headerBackTitle: "Back",
          })} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;