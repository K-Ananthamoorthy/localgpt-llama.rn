// ModelLibraryScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  ModelInfo,
  getCustomModels,
  checkDownloadedModels,
  downloadModel,
  deleteCustomModel,
  deleteModelFile,
} from '../services/ModelService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ModelLibraryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);

  const loadModels = async () => {
    setLoading(true);
    try {
      const allModels = await checkDownloadedModels();
      setModels(allModels);
    } catch (err) {
      console.error('Error loading models:', err);
      Alert.alert('Error', 'Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleDownload = async (model: ModelInfo) => {
    setDownloadingModelId(model.id);
    try {
      const localPath = await downloadModel(model, (progress) => {
        console.log(`Download progress: ${(progress.progress * 100).toFixed(1)}%`);
      });
      
      await loadModels();
      Alert.alert('Success', `Model downloaded successfully to ${localPath}`);
    } catch (err) {
      console.error('Download failed:', err);
      Alert.alert('Error', `Download failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingModelId(null);
    }
  };

  const handleDelete = async (model: ModelInfo) => {
    setDeletingModelId(model.id);
    try {
      if (model.isDownloaded) {
        await deleteModelFile(model);
      }
      await deleteCustomModel(model.id);
      await loadModels();
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('Error', `Failed to delete model: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDeletingModelId(null);
    }
  };

  const navigateToAddModel = () => {
    navigation.navigate('AddCustomModel');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 Model Library</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddModel}>
          <Text style={styles.addButtonText}>+ Add Model</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.modelsContainer}>
          {models.filter(m => m.isCustom).length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No custom models added yet</Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={navigateToAddModel}>
                <Text style={styles.emptyStateButtonText}>Add Your First Model</Text>
              </TouchableOpacity>
            </View>
          )}

          {models.filter(m => m.isCustom).map((model) => (
            <View key={model.id} style={styles.modelCard}>
              <View style={styles.modelHeader}>
                <Text style={styles.modelName}>{model.name}</Text>
                {model.author && <Text style={styles.modelAuthor}>by {model.author}</Text>}
              </View>
              
              <Text style={styles.modelDescription}>{model.description}</Text>
              
              <View style={styles.modelDetails}>
                <Text style={styles.modelDetail}>📦 {model.size}</Text>
                {model.lastUpdated && <Text style={styles.modelDetail}>🕒 {model.lastUpdated}</Text>}
              </View>

              <View style={styles.modelActions}>
                {model.isDownloaded ? (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(model)}
                    disabled={deletingModelId === model.id}
                  >
                    {deletingModelId === model.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.downloadButton]}
                    onPress={() => handleDownload(model)}
                    disabled={downloadingModelId === model.id}
                  >
                    {downloadingModelId === model.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.actionButtonText}>⬇️ Download</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelsContainer: {
    padding: 16,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modelHeader: {
    marginBottom: 8,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modelAuthor: {
    fontSize: 14,
    color: '#666',
  },
  modelDescription: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
  },
  modelDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modelDetail: {
    fontSize: 12,
    color: '#888',
  },
  modelActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ModelLibraryScreen;