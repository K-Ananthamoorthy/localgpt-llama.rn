// CustomModelScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  validateHuggingFaceUrl,
  addCustomModel,
  formatFileSize,
  ModelInfo
} from '../services/ModelService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../context/ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddCustomModelScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, theme } = useTheme();
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedInfo, setValidatedInfo] = useState<{
    filename: string;
    size: number;
    modelName?: string;
    author?: string;
    lastUpdated?: string;
  } | null>(null);

  const handleValidateUrl = async () => {
    if (!url.trim()) {
      setValidationError('Please enter a URL');
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidatedInfo(null);

    try {
      const validation = await validateHuggingFaceUrl(url);
      
      if (validation.isValid && validation.filename) {
        setValidatedInfo({
          filename: validation.filename,
          size: validation.size || 0,
          modelName: validation.modelName,
          author: validation.author,
          lastUpdated: validation.lastUpdated
        });
      } else {
        setValidationError(validation.error || 'Invalid URL');
      }
    } catch (err) {
      setValidationError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddModel = async () => {
    if (!validatedInfo) {
      setValidationError('Please validate the URL first');
      return;
    }

    try {
      const modelId = `custom-${Date.now()}`;
      const modelName = validatedInfo.modelName || validatedInfo.filename.replace(/\.[^/.]+$/, "");
      
      const newModel: ModelInfo = {
        id: modelId,
        name: modelName,
        filename: validatedInfo.filename,
        url: url.trim(),
        description: `Custom model from ${validatedInfo.author || 'Hugging Face'}`,
        size: formatFileSize(validatedInfo.size),
        isDownloaded: false,
        isCustom: true,
        author: validatedInfo.author,
        lastUpdated: validatedInfo.lastUpdated
      };

      await addCustomModel(newModel);
      
      Alert.alert(
        '✅ Success',
        'Custom model added successfully',
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('Home', { refresh: true }) 
        }]
      );
    } catch (err) {
      setValidationError(`❌ Failed to add model: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Create dynamic styles based on the current theme
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
    formContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      backgroundColor: colors.inputBackground,
      fontSize: 16,
      color: colors.text,
    },
    validateButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      backgroundColor: '#4CAF50',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    disabledButton: {
      backgroundColor: colors.secondaryText,
      opacity: 0.5,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    errorText: {
      color: colors.error,
      marginBottom: 16,
      fontSize: 14,
    },
    validatedInfo: {
      backgroundColor: theme === 'dark' ? '#1F3D2A' : '#e8f5e9',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    validText: {
      color: theme === 'dark' ? '#7CFC00' : '#4CAF50',
      fontWeight: 'bold',
      marginBottom: 4,
    },
    infoText: {
      color: colors.text,
      marginBottom: 4,
    },
    helpContainer: {
      backgroundColor: theme === 'dark' ? '#1A3A5A' : '#e3f2fd',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    helpTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme === 'dark' ? colors.accent : '#1976D2',
    },
    helpText: {
      color: colors.text,
      marginBottom: 8,
      fontSize: 14,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>📤 Add Custom Hugging Face Model</Text>
      
      <View style={dynamicStyles.formContainer}>
        <Text style={dynamicStyles.label}>🔗 Hugging Face URL</Text>
        <TextInput
          style={dynamicStyles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://huggingface.co/username/model/resolve/main/model.gguf"
          placeholderTextColor={colors.secondaryText}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.validationContainer}>
          <TouchableOpacity
            style={dynamicStyles.validateButton}
            onPress={handleValidateUrl}
            disabled={isValidating}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={dynamicStyles.buttonText}>🔍 Validate URL</Text>
            )}
          </TouchableOpacity>
        </View>

        {validationError && (
          <Text style={dynamicStyles.errorText}>⚠️ {validationError}</Text>
        )}

        {validatedInfo && (
          <View style={dynamicStyles.validatedInfo}>
            <Text style={dynamicStyles.validText}>✔️ Valid model URL</Text>
            <Text style={dynamicStyles.infoText}>📄 Filename: {validatedInfo.filename}</Text>
            <Text style={dynamicStyles.infoText}>📦 Size: {formatFileSize(validatedInfo.size)}</Text>
            {validatedInfo.modelName && (
              <Text style={dynamicStyles.infoText}>🏷️ Model: {validatedInfo.modelName}</Text>
            )}
            {validatedInfo.author && (
              <Text style={dynamicStyles.infoText}>👤 Author: {validatedInfo.author}</Text>
            )}
            {validatedInfo.lastUpdated && (
              <Text style={dynamicStyles.infoText}>🕒 Last Updated: {validatedInfo.lastUpdated}</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            dynamicStyles.addButton,
            !validatedInfo && dynamicStyles.disabledButton
          ]}
          onPress={handleAddModel}
          disabled={!validatedInfo}
        >
          <Text style={dynamicStyles.buttonText}>➕ Add Model</Text>
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.helpContainer}>
        <Text style={dynamicStyles.helpTitle}>ℹ️ How to find model URLs on Hugging Face</Text>
        <Text style={dynamicStyles.helpText}>
          1️⃣ Navigate to a model page on Hugging Face
        </Text>
        <Text style={dynamicStyles.helpText}>
          2️⃣ Go to the "Files and versions" tab
        </Text>
        <Text style={dynamicStyles.helpText}>
          3️⃣ Find a compatible model file (.gguf or .bin)
        </Text>
        <Text style={dynamicStyles.helpText}>
          4️⃣ Right-click on the download button
        </Text>
        <Text style={dynamicStyles.helpText}>
          5️⃣ Copy the link and paste here
        </Text>
      </View>
    </ScrollView>
  );
};

// These styles don't change with theme
const styles = StyleSheet.create({
  validationContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
});

export default AddCustomModelScreen;