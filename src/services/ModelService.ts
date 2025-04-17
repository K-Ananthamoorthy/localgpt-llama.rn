// ModelService.ts
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

export const BASE_DIR = Platform.OS === 'android' 
  ? RNFS.CachesDirectoryPath 
  : RNFS.DocumentDirectoryPath;

export const MODELS_DIR = `${BASE_DIR}/models`;

export interface ModelInfo {
  id: string;
  name: string;
  filename: string;
  url: string;
  description: string;
  size: string;
  isDownloaded: boolean;
  localPath?: string;
  expectedMD5?: string;
  isCustom?: boolean;
  author?: string;
  lastUpdated?: string;
}

export interface DownloadProgress {
  bytesWritten: number;
  contentLength: number;
  progress: number;
  timeRemaining?: number;
  bytesPerSecond?: number;
}

export interface HuggingFaceModelInfo {
  isValid: boolean;
  filename: string;
  size: number;
  error?: string;
  modelName?: string;
  author?: string;
  lastUpdated?: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'llama-3-1b',
    name: 'Llama 3.2 1B Instruct',
    filename: 'llama-3.2-1b-instruct-q8_0.gguf',
    url: 'https://huggingface.co/hugging-quants/Llama-3.2-1B-Instruct-Q8_0-GGUF/resolve/main/llama-3.2-1b-instruct-q8_0.gguf?download=true',
    description: 'Small, efficient language model for mobile devices (Q8_0 version)',
    size: '1.3 GB',
    isDownloaded: false,
  }
];

// Store custom models separately
let CUSTOM_MODELS: ModelInfo[] = [];

export const ensureModelsDir = async () => {
  try {
    const exists = await RNFS.exists(MODELS_DIR);
    if (!exists) {
      await RNFS.mkdir(MODELS_DIR);
    }
  } catch (err) {
    console.error('Error ensuring model directory:', err);
    throw err;
  }
};

export const checkDownloadedModels = async (): Promise<ModelInfo[]> => {
  await ensureModelsDir();

  const allModels = [...AVAILABLE_MODELS, ...CUSTOM_MODELS];
  const updatedModels = [...allModels];

  for (let model of updatedModels) {
    const fullPath = `${MODELS_DIR}/${model.filename}`;
    const exists = await RNFS.exists(fullPath);

    if (exists) {
      const stats = await RNFS.stat(fullPath);
      if (stats.size > 1_000_000) {
        model.isDownloaded = true;
        model.localPath = `file://${fullPath}`;
      }
    }
  }

  return updatedModels;
};

export const validateHuggingFaceUrl = async (url: string): Promise<HuggingFaceModelInfo> => {
  try {
    // Basic URL validation
    if (!url.includes('huggingface.co')) {
      return { isValid: false, filename: '', size: 0, error: 'Not a Hugging Face URL' };
    }

    // Extract filename from URL
    const filename = url.split('/').pop()?.split('?')[0] || '';
    if (!filename) {
      return { isValid: false, filename: '', size: 0, error: 'Could not extract filename from URL' };
    }

    // Check if it's a GGUF or other supported format
    const supportedFormats = ['.gguf', '.bin', '.safetensors', '.pt', '.pth', '.ggml'];
    const isSupported = supportedFormats.some(ext => filename.endsWith(ext));
    if (!isSupported) {
      return { 
        isValid: false, 
        filename: '', 
        size: 0, 
        error: 'Unsupported file format. Supported formats: ' + supportedFormats.join(', ')
      };
    }

    // Get file size using HEAD request
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return { 
        isValid: false, 
        filename: '', 
        size: 0, 
        error: `Failed to fetch file info (HTTP ${response.status})` 
      };
    }

    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    
    // Extract model and author info from URL
    const urlParts = url.split('/');
    const authorIndex = urlParts.findIndex(part => part === 'resolve') - 2;
    const modelIndex = authorIndex + 1;
    
    const author = authorIndex >= 0 ? urlParts[authorIndex] : undefined;
    const modelName = modelIndex >= 0 ? urlParts[modelIndex] : undefined;
    
    // Try to get last modified date
    const lastUpdated = response.headers.get('last-modified') || undefined;

    return { 
      isValid: true, 
      filename, 
      size: contentLength,
      modelName,
      author,
      lastUpdated
    };
  } catch (err) {
    return { 
      isValid: false, 
      filename: '', 
      size: 0, 
      error: `Error validating URL: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
};

export const addCustomModel = async (model: ModelInfo) => {
  // Check if model already exists
  const existingIndex = CUSTOM_MODELS.findIndex(m => m.id === model.id);
  if (existingIndex >= 0) {
    CUSTOM_MODELS[existingIndex] = model;
  } else {
    CUSTOM_MODELS.push(model);
  }
};

export const deleteCustomModel = async (modelId: string) => {
  const modelIndex = CUSTOM_MODELS.findIndex(m => m.id === modelId);
  if (modelIndex >= 0) {
    const model = CUSTOM_MODELS[modelIndex];
    if (model.isDownloaded && model.filename) {
      try {
        const fullPath = `${MODELS_DIR}/${model.filename}`;
        await RNFS.unlink(fullPath);
      } catch (err) {
        console.error('Error deleting model file:', err);
      }
    }
    CUSTOM_MODELS.splice(modelIndex, 1);
    return true;
  }
  return false;
};

export const getCustomModels = () => {
  return [...CUSTOM_MODELS];
};

const calculateMD5 = async (filePath: string): Promise<string> => {
  // Placeholder - implement using native module or a library like `react-native-hash`
  return 'mock-md5-hash';
};

export const downloadModel = async (
  model: ModelInfo,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> => {
  await ensureModelsDir();

  const fullPath = `${MODELS_DIR}/${model.filename}`;

  const alreadyExists = await RNFS.exists(fullPath);
  if (alreadyExists) {
    const stats = await RNFS.stat(fullPath);
    if (stats.size > 1_000_000) {
      if (model.expectedMD5) {
        const hash = await calculateMD5(fullPath);
        if (hash === model.expectedMD5) {
          return `file://${fullPath}`;
        } else {
          await RNFS.unlink(fullPath);
        }
      } else {
        return `file://${fullPath}`;
      }
    }
  }

  let lastUpdateTime = Date.now();
  let lastBytes = 0;

  const download = RNFS.downloadFile({
    fromUrl: model.url,
    toFile: fullPath,
    progressDivider: 1,
    background: true,
    discretionary: true,
    progress: (res) => {
      if (!onProgress) return;

      const now = Date.now();
      const timeElapsed = (now - lastUpdateTime) / 1000;

      if (timeElapsed > 0.5) {
        const bytesPerSecond = (res.bytesWritten - lastBytes) / timeElapsed;
        const timeRemaining = (res.contentLength - res.bytesWritten) / bytesPerSecond;

        onProgress({
          bytesWritten: res.bytesWritten,
          contentLength: res.contentLength,
          progress: res.bytesWritten / res.contentLength,
          bytesPerSecond,
          timeRemaining,
        });

        lastUpdateTime = now;
        lastBytes = res.bytesWritten;
      }
    },
  });

  const result = await download.promise;

  if (result.statusCode !== 200) {
    throw new Error(`Download failed with status: ${result.statusCode}`);
  }

  const fileStats = await RNFS.stat(fullPath);
  if (fileStats.size < 1_000_000) {
    await RNFS.unlink(fullPath);
    throw new Error('Downloaded file is too small');
  }

  if (model.expectedMD5) {
    const md5 = await calculateMD5(fullPath);
    if (md5 !== model.expectedMD5) {
      await RNFS.unlink(fullPath);
      throw new Error('MD5 verification failed');
    }
  }

  return `file://${fullPath}`;
};

export const deleteModelFile = async (model: ModelInfo): Promise<boolean> => {
  if (!model.isDownloaded || !model.filename) {
    return false;
  }

  try {
    const fullPath = `${MODELS_DIR}/${model.filename}`;
    const exists = await RNFS.exists(fullPath);
    
    if (exists) {
      await RNFS.unlink(fullPath);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting model file:', error);
    throw error;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};