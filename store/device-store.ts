import { create } from 'zustand';

interface DeviceData {
  name: string;
  username?: string;
  stress_level: number;
  timestamp: string;
  source: string;
  received_at: string;
  decoded_payload: any;
  avatar: string;
  email: string;
}

interface DeviceStore {
  deviceData: DeviceData | null;
  isLoading: boolean;
  lastUpdate: number;
  setDeviceData: (data: DeviceData) => void;
  setLoading: (loading: boolean) => void;
  updateIfNewer: (newData: DeviceData) => boolean;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  deviceData: null,
  isLoading: false,
  lastUpdate: 0,
  
  setDeviceData: (data) => set({ 
    deviceData: data, 
    lastUpdate: Date.now() 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  updateIfNewer: (newData) => {
    const current = get().deviceData;
    
    // If no current data, accept new data
    if (!current) {
      set({ deviceData: newData, lastUpdate: Date.now() });
      return true;
    }
    
    // Parse timestamps to compare
    const parseTimestamp = (ts: any): number => {
      if (!ts) return 0;
      if (typeof ts === 'number') {
        return ts > 1e12 ? ts : ts * 1000;
      }
      if (typeof ts === 'string') {
        const parsed = Date.parse(ts);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    const currentTime = parseTimestamp(current.timestamp || current.received_at);
    const newTime = parseTimestamp(newData.timestamp || newData.received_at);
    
    // Only update if new data is newer
    if (newTime > currentTime) {
      console.log('📈 Updating with newer data:', {
        old: { timestamp: current.timestamp, stress: current.stress_level, source: current.source },
        new: { timestamp: newData.timestamp, stress: newData.stress_level, source: newData.source }
      });
      set({ deviceData: newData, lastUpdate: Date.now() });
      return true;
    }
    
    console.log('⏸️ Keeping existing data (newer or same):', {
      current: { timestamp: current.timestamp, stress: current.stress_level },
      attempted: { timestamp: newData.timestamp, stress: newData.stress_level }
    });
    return false;
  }
}));
