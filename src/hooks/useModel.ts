import { useState, useRef, useCallback } from 'react';
import { initLlama, loadLlamaModelInfo, LlamaContext } from 'llama.rn';
import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';

type ModelInfo = {
  name?: string;
  n_ctx?: number;
  n_gpu_layers?: number;
  n_params?: number;
  tensorSplits?: any;
  vocab_size?: number;
  [key: string]: any;
};

type UseModelReturn = {
  model: LlamaContext | null;
  loadModel: (modelPath: string) => Promise<LlamaContext>;
  loading: boolean;
  error: string | null;
  modelInfo: ModelInfo | null;
  tokenizeText: (text: string) => Promise<number>;
  unloadModel: () => void;
};

// Platform-specific optimization defaults
const PLATFORM_DEFAULTS = {
  ios: {
    n_gpu_layers: 99, // Use maximum GPU acceleration on iOS
    n_threads: 6,
    batch_size: 512,
  },
  android: {
    n_gpu_layers: 0, // CPU only on most Android devices
    n_threads: Math.max(4, Math.floor(navigator.hardwareConcurrency || 4) - 1), // Leave one thread for UI
    batch_size: 256,
  }
};

export const useModel = (): UseModelReturn => {
  const [model, setModel] = useState<LlamaContext | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Using useRef to cache tokenization results
  const tokenCache = useRef<Map<string, number>>(new Map());
  
  // Clean up model when component unmounts or before loading a new one
  const unloadModel = useCallback(() => {
    if (model) {
      try {
        // Release model resources
        model.release();
      } catch (e) {
        console.warn('Error releasing model resources:', e);
      }
      setModel(null);
    }
    
    // Clear token cache when unloading model
    tokenCache.current.clear();
  }, [model]);

  const loadModel = async (modelPath: string): Promise<LlamaContext> => {
    setLoading(true);
    setError(null);
    
    // Clean up any existing model first
    unloadModel();

    try {
      const cleanPath = modelPath.replace('file://', '');
      
      // Fast path check for file existence
      const exists = await RNFS.exists(cleanPath);
      if (!exists) throw new Error(`Model file not found: ${cleanPath}`);

      // Get file stats to verify it's actually a file with content
      const fileStats = await RNFS.stat(cleanPath);
      if (fileStats.isDirectory() || fileStats.size === 0) {
        throw new Error(`Invalid model file: ${cleanPath}`);
      }

      // Load model info - try with a timeout to prevent hanging
      const infoPromise = loadLlamaModelInfo(modelPath);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Model info loading timeout')), 10000);
      });
      
      const info = await Promise.race([infoPromise, timeoutPromise]);
      
      // Extract file name from path for display
      const fileName = modelPath.split('/').pop() || 'unknown-model';
      
      const enhancedInfo: ModelInfo = {
        ...info,
        name: fileName,
        loadedAt: new Date().toISOString(),
      };
      
      setModelInfo(enhancedInfo);

      // Get platform-specific optimizations
      const platformDefaults = Platform.OS === 'ios' 
        ? PLATFORM_DEFAULTS.ios 
        : PLATFORM_DEFAULTS.android;

      // Initialize model with optimized parameters
      const llama = await initLlama({
        model: Platform.OS === 'android' ? cleanPath : modelPath,
        use_mlock: true,
        n_ctx: 2048,
        n_gpu_layers: platformDefaults.n_gpu_layers,
        n_threads: platformDefaults.n_threads,
        use_mmap: true, // Memory-mapped IO can be faster
        embedding: false, // Disable if not needed
      });

      console.log('Model initialized successfully');
      setModel(llama);
      return llama;
    } catch (err: any) {
      console.error('Model loading failed:', err);
      setError(err.message || 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Optimized tokenization with caching
  const tokenizeText = useCallback(async (text: string): Promise<number> => {
    if (!model) {
      console.warn('Cannot tokenize: Model not loaded');
      return 0;
    }
    
    // Return cached result if available
    if (tokenCache.current.has(text)) {
      return tokenCache.current.get(text)!;
    }
    
    try {
      // Use the model's tokenize function to get actual token count
      const tokenIds = await model.tokenize(text);
      const count = tokenIds.tokens.length;
      
      // Cache the result for future use
      tokenCache.current.set(text, count);
      
      // Limit cache size to prevent memory issues
      if (tokenCache.current.size > 1000) {
        // Remove oldest entries when cache gets too large
        const keysIterator = tokenCache.current.keys();
        const nextKey = keysIterator.next().value;
        if (nextKey !== undefined) {
          tokenCache.current.delete(nextKey);
        }
      }
      
      return count;
    } catch (err) {
      console.error('Tokenization error:', err);
      return 0;
    }
  }, [model]);

  return {
    model,
    loadModel,
    loading,
    error,
    modelInfo,
    tokenizeText,
    unloadModel,
  };
};