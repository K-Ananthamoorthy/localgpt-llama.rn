import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  Animated
} from 'react-native';
import { getDeviceSpecs, DeviceSpecs, formatBytes } from '../services/DeviceService';
import { useTheme } from '../context/ThemeContext';

const DeviceCheckScreen = () => {
  const { colors } = useTheme();
  const [specs, setSpecs] = useState<DeviceSpecs | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const fetchDeviceSpecs = async () => {
    try {
      setLoading(true);
      const deviceSpecs = await getDeviceSpecs();
      setSpecs(deviceSpecs);
      

      
    } catch (error) {
      console.error('Error fetching device specs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchDeviceSpecs();
  };

  useEffect(() => {
    fetchDeviceSpecs();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    mainCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    deviceName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    deviceModel: {
      fontSize: 16,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 20,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    specRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 8,
    },
    specLabel: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    specValue: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginTop: 12,
      marginBottom: 8,
    },
    gpuText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading device information...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <Animated.View style={{  }}>
        {specs && (
          <View style={styles.mainCard}>
            <Text style={styles.deviceName}>{specs.deviceName}</Text>
            <Text style={styles.deviceModel}>{specs.brand} • {specs.model}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>System</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>OS Version</Text>
              <Text style={styles.specValue}>{specs.systemName} {specs.systemVersion}</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Processor</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>CPU Cores</Text>
              <Text style={styles.specValue}>{specs.cpuCores}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Architecture</Text>
              <Text style={styles.specValue}>{specs.cpuArchitecture}</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Memory</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Total RAM</Text>
              <Text style={styles.specValue}>{formatBytes(specs.totalMemory)}</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Graphics</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>GPU Type</Text>
              <Text style={[styles.gpuText, {color: specs.hasGPU ? "#4CAF50" : "#FF453A"}]}>
                {specs.hasGPU ? "Dedicated" : "Integrated"}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

export default DeviceCheckScreen;