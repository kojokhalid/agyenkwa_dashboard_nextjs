"use client"
import React from "react";
import { useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  
} from "@heroui/table";
import { useDeviceStore } from "@/store/device-store";

const columns = [
  { name: "DEVICE NAME", uid: "name" },
  { name: "STRESS LEVEL", uid: "stress_level" },
  { name: "TIMESTAMP", uid: "timestamp" },
  { name: "SOURCE", uid: "source" },
];

const TTN_APPLICATION_ID = "mo-lora-lora-no";
const TTN_API_KEY = "NNSXS.AIEQECWKQPVAPNRFKKDWJX3RXBQ2A5VWLNETOCI.6UOIMQHT65CJ3OX23OWXEM2OLOJ6SVUHDDPFHW35TY3PYMKQXPDA";
const TTN_BASE_URL = `https://eu1.cloud.thethings.network/api/v3/as/applications/${TTN_APPLICATION_ID}/packages/storage/uplink_message`;

// Static device name
const DEVICE_NAME = "Agyenkwa Device";

export default function IndexPage() {
  const { deviceData, isLoading, updateIfNewer, setLoading } = useDeviceStore();

  const renderCell = React.useCallback((columnKey: string): React.ReactNode => {
    if (!deviceData) return "-";
    
    const decoded = deviceData.decoded_payload || {};

    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <img src={deviceData.avatar} alt={deviceData.name} className="w-8 h-8 rounded-full" />
            <div className="flex flex-col">
              <p className="text-bold text-sm">{DEVICE_NAME}</p>
              <p className="text-sm text-default-400">{deviceData.email}</p>
            </div>
          </div>
        );
      case "stress_level": {
        const level = deviceData.stress_level;
        const colorClass = (() => {
          switch (level) {
            case 1:
              return "bg-green-100 text-green-800";
            case 2:
              return "bg-yellow-100 text-yellow-800";
            case 3:
              return "bg-orange-100 text-orange-800";
            case 4:
              return "bg-red-100 text-red-800";
            default:
              return "bg-gray-100 text-gray-800";
          }
        })();

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium ${colorClass}`}>
            {level || "-"}
          </span>
        );
      }
      case "source":
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
            deviceData.source === "TTN" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
          }`}>
            {deviceData.source}
          </span>
        );
      case "timestamp": {
        const raw = deviceData.timestamp || deviceData.received_at;
        const formatTimestamp = (v: any) => {
          if (!v && v !== 0) return "-";
          if (typeof v === "number") {
            const millis = v > 1e12 ? v : v * 1000;
            const d = new Date(millis);
            if (!isNaN(d.getTime())) return d.toLocaleString();
            return String(v);
          }
          if (typeof v === "string") {
            if (/^\d+$/.test(v)) {
              const num = Number(v);
              const millis = num > 1e12 ? num : num * 1000;
              const d = new Date(millis);
              if (!isNaN(d.getTime())) return d.toLocaleString();
            }
            const parsed = Date.parse(v);
            if (!isNaN(parsed)) return new Date(parsed).toLocaleString();
            return v;
          }
          return String(v);
        };

        return formatTimestamp(raw);
      }
      default:
        return "-";
    }
  }, [deviceData]);

  // Parse NDJSON helper (simple)
  function parseNdjson(text: string) {
    const out: any[] = [];
    text.split(/\r?\n/).forEach((line) => {
      line = line.trim();
      if (!line) return;
      try {
        out.push(JSON.parse(line));
      } catch (e) {
        // ignore parse errors for individual lines
      }
    });
    return out;
  }

  // Fetch S3 data as fallback
  async function fetchS3Data() {
    try {
      console.log("📦 Fetching S3 data...");
      const s3Res = await fetch("/api/s3-data", { cache: "no-store" });
      
      if (s3Res.ok) {
        const s3Json = await s3Res.json();
        const rawS3 = s3Json.data;

        if (rawS3) {
          const decoded = rawS3.decoded_payload || rawS3;
          const s3Data = {
            name: DEVICE_NAME,
            stress_level: decoded.stress_level || rawS3.stress_level || 0,
            timestamp: decoded.timestamp_iso || rawS3.timestamp || rawS3.upload_timestamp,
            received_at: rawS3.timestamp || rawS3.upload_timestamp,
            decoded_payload: decoded,
            avatar: "https://i.pravatar.cc/150?u=s3",
            email: rawS3.device_address || "",
            source: "S3",
          };

          console.log("📦 S3 data:", {
            stress: s3Data.stress_level,
            timestamp: s3Data.timestamp,
            source: "S3",
          });

          updateIfNewer(s3Data);
        }
      } else {
        console.warn("❌ S3 fetch failed", s3Res.status);
      }
    } catch (e) {
      console.warn("❌ S3 fetch error", e);
    }
  }

  // Process incoming MQTT uplink message
  function processMQTTUplink(uplinkData: any) {
    try {
      const uplink = uplinkData.uplink_message || uplinkData;
      const ids = uplinkData.end_device_ids || {};
      const decoded = uplink.decoded_payload || {};

      const ttnData = {
        name: DEVICE_NAME,
        stress_level: decoded.stress_level || 0,
        timestamp: decoded.timestamp_iso || uplink.received_at,
        received_at: uplink.received_at,
        decoded_payload: decoded,
        avatar: "https://i.pravatar.cc/150?u=ttn",
        email: ids.dev_eui || "",
        source: "TTN-MQTT",
      };

      console.log("📡 MQTT uplink processed:", {
        stress: ttnData.stress_level,
        timestamp: ttnData.timestamp,
        source: "TTN-MQTT",
      });

      updateIfNewer(ttnData);
    } catch (e) {
      console.error("❌ Error processing MQTT uplink:", e);
    }
  }

  // Real-time MQTT + periodic S3 fallback
  useEffect(() => {
    let mounted = true;
    let eventSource: EventSource | null = null;

    // Connect to MQTT stream
    function connectMQTT() {
      console.log("🔌 Connecting to MQTT stream...");
      eventSource = new EventSource("/api/mqtt-stream");

      eventSource.onopen = () => {
        console.log("✅ MQTT stream connected");
        setLoading(false);
      };

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'uplink') {
            processMQTTUplink(message.data);
          } else if (message.type === 'connected') {
            console.log("🎉 MQTT stream ready");
          } else if (message.type === 'keepalive') {
            // Silent keepalive
          }
        } catch (e) {
          console.error("❌ Error parsing SSE message:", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error("❌ MQTT stream error:", error);
        eventSource?.close();
        
        // Reconnect after 5 seconds if still mounted
        if (mounted) {
          setTimeout(() => {
            if (mounted) connectMQTT();
          }, 5000);
        }
      };
    }

    // Start MQTT connection
    connectMQTT();

    // Poll S3 as fallback every 30 seconds
    const s3Interval = setInterval(() => {
      if (mounted) fetchS3Data();
    }, 30000);

    // Initial S3 fetch
    fetchS3Data();

    // Cleanup
    return () => {
      mounted = false;
      eventSource?.close();
      clearInterval(s3Interval);
    };
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full max-w-4xl">
        {/* <h1 className="text-2xl font-bold mb-4">Device Stress Monitor</h1> */}
        {isLoading && !deviceData && (
          <div className="text-center text-default-500">Loading device data...</div>
        )}
        {deviceData && (
          <Table aria-label="Device stress monitoring table">
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.uid} align="start">
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody>
              <TableRow key="device-1">
                {(columnKey) => <TableCell>{renderCell(String(columnKey))}</TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        )}
        {!deviceData && !isLoading && (
          <div className="text-center text-default-500">No device data available</div>
        )}
      </div>
    </section>
  );
}
