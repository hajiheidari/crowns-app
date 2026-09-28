import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** AsyncStorage (localStorage on web) behind zustand's persist middleware. */
export const persistStorage = createJSONStorage(() => AsyncStorage);
