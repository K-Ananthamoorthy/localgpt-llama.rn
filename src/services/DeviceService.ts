/// <reference lib="dom" />
import DeviceInfo from 'react-native-device-info';
import { Platform, NativeModules } from 'react-native';

declare global {
  interface Navigator {
    hardwareConcurrency?: number;
  }
}

export interface DeviceSpecs {
  deviceName: string;
  model: string;
  brand: string;
  systemName: string;
  systemVersion: string;
  cpuArchitecture: string;
  cpuCores: number;
  totalMemory: number;
  hasGPU: boolean;
}

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Improved function to get CPU cores
const getCPUCores = async (): Promise<number> => {
  try {
    // Try to use OS-specific native modules if available
    if (Platform.OS === 'android') {
      // Try to use a native module or API
      try {
        // First attempt: Try to read from /proc/cpuinfo if a native module exposes this
        if (NativeModules.DeviceInfo && NativeModules.DeviceInfo.getNumberOfCPUCores) {
          const cores = await NativeModules.DeviceInfo.getNumberOfCPUCores();
          if (typeof cores === 'number' && cores > 0) {
            return cores;
          }
        }
        
        // Second attempt: Try to use CPU frequency files to count cores
        try {
          // This requires a native module that can access file system
          // If you have react-native-fs or similar installed
          if (NativeModules.RNFSManager) {
            const RNFS = require('react-native-fs');
            const basePath = '/sys/devices/system/cpu/';
            const cpuDirs = await RNFS.readDir(basePath);
            const cpuCount = cpuDirs.filter((dir: { name: string; }) => /^cpu[0-9]+$/.test(dir.name)).length;
            if (cpuCount > 0) {
              return cpuCount;
            }
          }
        } catch (fsError) {
          console.warn('Failed to read CPU count from file system:', fsError);
        }
        
        // Default estimation based on device tier
        const apiLevel = await DeviceInfo.getApiLevel();
        const totalMemoryGB = (await DeviceInfo.getTotalMemory()) / (1024 * 1024 * 1024);
        
        // Modern high-end devices (newer API and more RAM likely have more cores)
        if (apiLevel >= 30 && totalMemoryGB >= 6) return 8;
        if (apiLevel >= 28 && totalMemoryGB >= 4) return 6; 
        if (apiLevel >= 26) return 4;
        return Math.max(2, Math.min(Math.ceil(totalMemoryGB * 2), 8)); // Estimate based on memory
      } catch (androidError) {
        console.warn('Failed to get Android CPU cores:', androidError);
        return 4; // Default for modern Android devices
      }
    } else if (Platform.OS === 'ios') {
      // For iOS, use device model to estimate cores
      const model = DeviceInfo.getModel();
      const modelYear = getAppleDeviceYear(model);
      
      // Map estimated year to likely CPU core count
      if (modelYear >= 2022) return 8; // A16, M2, etc.
      if (modelYear >= 2020) return 6; // A14, A15, M1
      if (modelYear >= 2017) return 6; // A11, A12, A13
      if (modelYear >= 2015) return 2; // A9, A10
      return 2; // Older devices
    } else if (Platform.OS === 'web') {
      // Web has direct API for this
      if (typeof window !== 'undefined' && 
          window.navigator && 
          window.navigator.hardwareConcurrency) {
        return window.navigator.hardwareConcurrency;
      }
    }
    
    // Fallback based on memory (rough correlation)
    const totalMemoryGB = (await DeviceInfo.getTotalMemory()) / (1024 * 1024 * 1024);
    return Math.max(2, Math.min(Math.ceil(totalMemoryGB / 2), 8));
  } catch (e) {
    console.warn('Error determining CPU cores:', e);
    return 2; // Default fallback
  }
};

// Helper to estimate Apple device year from model identifier
const getAppleDeviceYear = (model: string): number => {
  // iPhone estimation
  if (model.includes('iPhone')) {
    if (model.includes('15')) return 2023;
    if (model.includes('14')) return 2022;
    if (model.includes('13')) return 2021;
    if (model.includes('12')) return 2020;
    if (model.includes('11')) return 2019;
    if (model.includes('X')) return 2017;
    if (model.includes('8')) return 2017;
    if (model.includes('7')) return 2016;
    if (model.includes('6')) return 2015;
    if (model.includes('5')) return 2013;
  }
  
  // iPad estimation
  if (model.includes('iPad')) {
    if (model.includes('Pro') && model.includes('5th')) return 2021; // M1
    if (model.includes('Pro') && model.includes('4th')) return 2020;
    if (model.includes('Pro') && model.includes('3rd')) return 2018;
    if (model.includes('Air') && model.includes('5th')) return 2022;
    if (model.includes('Air') && model.includes('4th')) return 2020;
  }
  
  return 2017; // Default reasonable year
};

// Improved GPU detection
const detectGPU = async (): Promise<boolean> => {
  try {
    // Try multiple approaches for detection
    
    // 1. Check for device capabilities that typically need GPU
    if (Platform.OS === 'android') {
      // On Android, check if the device has hardware acceleration
      if (NativeModules.UIManager && NativeModules.UIManager.getConstants) {
        const constants = NativeModules.UIManager.getConstants();
        if (constants.Dimensions && constants.Dimensions.windowPhysicalPixels) {
          // Higher density devices typically have GPUs
          const density = constants.Dimensions.windowPhysicalPixels.density || 1;
          if (density >= 2.5) {
            return true;
          }
        }
      }
      
      // Try to detect via API level & memory (recent devices with good specs likely have GPU)
      const apiLevel = await DeviceInfo.getApiLevel();
      const totalMemoryGB = (await DeviceInfo.getTotalMemory()) / (1024 * 1024 * 1024);
      
      if (apiLevel >= 28 && totalMemoryGB >= 4) {
        return true;
      }
    } else if (Platform.OS === 'ios') {
      // All modern iOS devices have GPUs
      // Just check if it's a reasonably recent device
      const model = DeviceInfo.getModel();
      const modelYear = getAppleDeviceYear(model);
      
      if (modelYear >= 2016) { // iPhone 7 and newer definitely have GPUs
        return true;
      }
    }
    
    // 2. Fallback: Use a brand/model list but make it more comprehensive
    const highEndBrands = [
      'iPhone', 'iPad', 'Pixel', 'Galaxy S', 'Galaxy Note', 'OnePlus', 
      'Huawei', 'Xiaomi', 'OPPO', 'vivo', 'ROG', 'Legion', 'Nova', 'Pro',
      'Neo', 'Edge', 'Find', 'Reno', 'Mi', 'Redmi', 'Galaxy A', 'Galaxy M'
    ];
    
    const model = DeviceInfo.getModel().toLowerCase();
    const brand = DeviceInfo.getBrand().toLowerCase();
    
    // Check if any high-end brand matches
    if (highEndBrands.some(brandName => 
      model.includes(brandName.toLowerCase()) || 
      brand.includes(brandName.toLowerCase())
    )) {
      return true;
    }
    
    // 3. RAM-based heuristic (devices with 3+ GB RAM likely have GPUs)
    const totalMemoryGB = (await DeviceInfo.getTotalMemory()) / (1024 * 1024 * 1024);
    return totalMemoryGB >= 3;
    
  } catch (e) {
    console.warn('Error detecting GPU:', e);
    
    // Last resort: Memory-based estimation
    try {
      const totalMemoryGB = (await DeviceInfo.getTotalMemory()) / (1024 * 1024 * 1024);
      return totalMemoryGB >= 3; // Devices with 3+ GB RAM typically have GPUs
    } catch {
      return false; // Default fallback
    }
  }
};

export const getDeviceSpecs = async (): Promise<DeviceSpecs> => {
  try {
    // Get basic device info
    const deviceName = await DeviceInfo.getDeviceName();
    const model = DeviceInfo.getModel();
    const brand = DeviceInfo.getBrand();
    const systemName = DeviceInfo.getSystemName();
    const systemVersion = DeviceInfo.getSystemVersion();
    
    // Get CPU info
    let cpuArchitecture: string;
    if (Platform.OS === 'android') {
      try {
        const abis = await DeviceInfo.supportedAbis();
        // Get the first ABI as primary architecture
        cpuArchitecture = abis && abis.length > 0 ? abis[0] : 'unknown';
        
        // Improve architecture naming
        if (cpuArchitecture.includes('arm64')) {
          cpuArchitecture = 'ARM64';
        } else if (cpuArchitecture.includes('armeabi')) {
          cpuArchitecture = 'ARM';
        } else if (cpuArchitecture.includes('x86_64')) {
          cpuArchitecture = 'x86_64';
        } else if (cpuArchitecture.includes('x86')) {
          cpuArchitecture = 'x86';
        }
      } catch (abiError) {
        console.warn('Error getting CPU architecture:', abiError);
        cpuArchitecture = 'ARM64'; // Most modern Android devices
      }
    } else if (Platform.OS === 'ios') {
      // Most modern iOS devices use ARM64
      const model = DeviceInfo.getModel();
      if (model.includes('iPhone') || model.includes('iPad')) {
        const modelYear = getAppleDeviceYear(model);
        // M1 and newer use Apple Silicon
        if (modelYear >= 2021 && model.includes('iPad Pro')) {
          cpuArchitecture = 'Apple Silicon';
        } else {
          cpuArchitecture = 'ARM64';
        }
      } else {
        cpuArchitecture = 'ARM64';
      }
    } else {
      cpuArchitecture = 'unknown';
    }
    
    const cpuCores = await getCPUCores();
    
    // Get memory
    const totalMemory = await DeviceInfo.getTotalMemory();
    
    // GPU detection (improved method)
    const hasGPU = await detectGPU();

    return {
      deviceName,
      model,
      brand,
      systemName,
      systemVersion,
      cpuArchitecture,
      cpuCores,
      totalMemory,
      hasGPU
    };
  } catch (error) {
    console.error('Error getting device specs:', error);
    // Return default values in case of failure
    return {
      deviceName: 'Unknown Device',
      model: 'Unknown',
      brand: 'Unknown',
      systemName: Platform.OS,
      systemVersion: 'Unknown',
      cpuArchitecture: 'Unknown',
      cpuCores: 2,
      totalMemory: 0,
      hasGPU: false
    };
  }
};