"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useDeviceStore } from "@/store/device-store";

interface DeviceDataContextType {
  isInitialized: boolean;
}

const DeviceDataContext = createContext<DeviceDataContextType>({
  isInitialized: false,
});

export const useDeviceDataContext = () => useContext(DeviceDataContext);

const DEVICE_NAME = "Agyenkwa Device";

export function DeviceDataProvider({ children }: { children: React.ReactNode }) {
  const { updateIfNewer, setLoading } = useDeviceStore();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const mongoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchMongoDBData = async () => {
    try {
      console.log("🗄️ Fetching MongoDB data...");
      const mongoRes = await fetch("/api/mongodb-data", { cache: "no-store" });

      if (mongoRes.ok) {
        const mongoJson = await mongoRes.json();
        const rawMongo = mongoJson.data;

        if (rawMongo) {
          const decoded = rawMongo.decoded_payload || rawMongo;
          const mongoData = {
            name: rawMongo.username,
            username: rawMongo.username || decoded.username || "",
            stress_level: decoded.stress_level || rawMongo.stress_level || 0,
            timestamp:
              decoded.timestamp_iso ||
              rawMongo.timestamp ||
              rawMongo.upload_timestamp ||
              mongoJson.timestamp,
            received_at:
              rawMongo.timestamp ||
              rawMongo.upload_timestamp ||
              mongoJson.timestamp,
            decoded_payload: decoded,
            avatar: "https://i.pravatar.cc/150?u=mongodb",
            email: rawMongo.device_address || rawMongo.dev_eui || "",
            source:
              rawMongo.upload_method === "ttn_webhook"
                ? "TTN Webhook"
                : "MongoDB",
          };

          console.log("🗄️ MongoDB data:", {
            stress: mongoData.stress_level,
            timestamp: mongoData.timestamp,
            source: mongoData.source,
            username: mongoData.username,
          });

          updateIfNewer(mongoData);
          setIsInitialized(true);
          setLoading(false);
        }
      } else {
        console.warn("❌ MongoDB fetch failed", mongoRes.status);
        setLoading(false);
      }
    } catch (e) {
      console.warn("❌ MongoDB fetch error", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchMongoDBData();

    mongoIntervalRef.current = setInterval(() => {
      if (mountedRef.current) fetchMongoDBData();
    }, 10000);

    return () => {
      mountedRef.current = false;
      if (mongoIntervalRef.current) {
        clearInterval(mongoIntervalRef.current);
      }
    };
  }, []);

  return (
    <DeviceDataContext.Provider value={{ isInitialized }}>
      {children}
    </DeviceDataContext.Provider>
  );
}
