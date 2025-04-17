import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { 
  downloadModel, 
  checkDownloadedModels, 
  DownloadProgress, 
  ModelInfo 
} from '../services/ModelService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList> & {
  openDrawer: () => void;
};
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '--:--';
  
  seconds = Math.ceil(seconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { colors } = useTheme();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    loadModels();
  });

  const loadModels = async () => {
    try {
      const availableModels = await checkDownloadedModels();
      setModels(availableModels);
    } catch (err) {
      console.error('Error loading models:', err);
      Alert.alert('Error', 'Failed to load available models');
    }
  };

  const handleDownload = async (model: ModelInfo) => {
    setDownloading(model.id);
    setProgress(null);
    
    try {
      console.log(`Starting download for ${model.name}...`);
      const modelPath = await downloadModel(model, (progress) => {
        setProgress(progress);
      });
      
      console.log('Model downloaded successfully to:', modelPath);
      setDownloading(null);
      setProgress(null);
      
      // Update model's status
      setModels(prev => prev.map(m => 
        m.id === model.id 
          ? { ...m, isDownloaded: true, localPath: modelPath } 
          : m
      ));
      
      Alert.alert(
        'Download Complete', 
        `${model.name} is ready to use!`,
        [
          {
            text: 'Open Model',
            onPress: () => navigation.navigate('Chat', { modelPath, modelId: model.id }),
          },
          { text: 'OK' }
        ]
      );
    } catch (err: any) {
      console.error('Download error details:', err);
      setDownloading(null);
      setProgress(null);
      Alert.alert('Download Failed', err.message || 'Failed to download model');
    }
  };

  const handleOpenModel = (model: ModelInfo) => {
    if (model.isDownloaded && model.localPath) {
      navigation.navigate('Chat', { modelPath: model.localPath, modelId: model.id });
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colors.text,
    },
    modelCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    modelName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginRight: 8,
      flexShrink: 1,
    },
    modelSize: {
      fontSize: 14,
      color: colors.secondaryText,
      marginLeft: 'auto',
    },
    modelDescription: {
      fontSize: 14,
      color: colors.secondaryText,
      marginVertical: 12,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#4CAF50',
    },
    progressDetails: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    downloadSize: {
      fontSize: 12,
      color: colors.secondaryText,
      textAlign: 'right',
    },
    customBadge: {
      backgroundColor: '#FF9800',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    customText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    badgesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    modelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={styles.header}>
        <Text style={dynamicStyles.title}>Available Models</Text>
      </View>
      
      <ScrollView style={styles.modelList}>
        {models.map(model => (
          <View key={model.id} style={dynamicStyles.modelCard}>
            {model.isCustom && (
              <View style={dynamicStyles.customBadge}>
                <Text style={dynamicStyles.customText}>Custom</Text>
              </View>
            )}
            
            <View style={dynamicStyles.modelHeader}>
              <Text style={dynamicStyles.modelName}>{model.name}</Text>
              <Text style={dynamicStyles.modelSize}>{model.size}</Text>
            </View>
            
            <Text style={dynamicStyles.modelDescription}>{model.description}</Text>
            
            {downloading === model.id && progress ? (
              <View style={styles.progressContainer}>
                <View style={dynamicStyles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${progress.progress * 100}%` }
                    ]} 
                  />
                </View>
                
                <View style={styles.progressStats}>
                  <Text style={dynamicStyles.progressText}>
                    {`${(progress.progress * 100).toFixed(1)}%`}
                  </Text>
                  
                  <Text style={dynamicStyles.progressDetails}>
                    {progress.bytesPerSecond 
                      ? `${formatBytes(progress.bytesPerSecond)}/s` 
                      : ''}
                  </Text>
                  
                  <Text style={dynamicStyles.progressDetails}>
                    {progress.timeRemaining 
                      ? `ETA: ${formatTime(progress.timeRemaining)}` 
                      : ''}
                  </Text>
                </View>
                
                <Text style={dynamicStyles.downloadSize}>
                  {`${formatBytes(progress.bytesWritten)} / ${formatBytes(progress.contentLength)}`}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  model.isDownloaded ? styles.openButton : styles.downloadButton
                ]}
                onPress={() => model.isDownloaded 
                  ? handleOpenModel(model) 
                  : handleDownload(model)
                }
                disabled={downloading !== null}
              >
                <Text style={styles.buttonText}>
                  {model.isDownloaded ? 'Open' : 'Download'}
                </Text>
              </TouchableOpacity>
            )}
            
            {model.isDownloaded && (
              <View style={styles.downloadedBadge}>
                <Text style={styles.downloadedText}>Downloaded</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modelList: {
    flex: 1,
  },
  progressContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    backgroundColor: '#2196F3',
  },
  openButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  downloadedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  downloadedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;