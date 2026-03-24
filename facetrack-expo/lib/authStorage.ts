import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Fallback if native AsyncStorage native module is unavailable (e.g. old Expo Go). Session is not persisted across restarts. */
const memoryFallback = new Map<string, string>();

async function nativeGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

async function nativeSet(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    memoryFallback.set(key, value);
  }
}

async function nativeRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    memoryFallback.delete(key);
  }
}

/**
 * Supabase auth storage: web has no AsyncStorage native module — use localStorage.
 * Prevents "Native module is null, cannot access legacy storage" on web.
 */
export const authStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof globalThis.localStorage === 'undefined') {
          return Promise.resolve(null);
        }
        return Promise.resolve(globalThis.localStorage.getItem(key));
      } catch {
        return Promise.resolve(null);
      }
    }
    return nativeGet(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage.setItem(key, value);
      } catch {
        /* ignore quota / private mode */
      }
      return Promise.resolve();
    }
    return nativeSet(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      return Promise.resolve();
    }
    return nativeRemove(key);
  },
};
