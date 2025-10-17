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

  async function fetchUplinks() {
    try {
      setLoading(true);
      console.log("🔄 Fetching data from TTN and S3...");
      
      // Fetch TTN data
      const params = new URLSearchParams({ last: "24h", limit: "10" });
      const res = await fetch(`${TTN_BASE_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${TTN_API_KEY}`,
          Accept: "text/event-stream, application/x-ndjson, application/json",
        },
        cache: "no-store",
      });

      let ttnData: any = null;
      if (res.ok) {
        const text = await res.text();
        let ttnMessages = parseNdjson(text);
        if (ttnMessages.length === 0) {
          try {
            const json = JSON.parse(text);
            if (Array.isArray(json)) ttnMessages = json;
            else if (json && json.result) ttnMessages = json.result;
            else ttnMessages = [json];
          } catch (e) {
            // nothing
          }
        }
        
        // Get the latest message from TTN
        if (ttnMessages.length > 0) {
          const latest = ttnMessages[0]; // Assuming first is latest
          const result = latest.result || latest;
          const uplink = result.uplink_message || result;
          const ids = result.end_device_ids || {};
          const decoded = uplink.decoded_payload || {};
          
          ttnData = {
            name: DEVICE_NAME,
            stress_level: decoded.stress_level || 0,
            timestamp: decoded.timestamp_iso || uplink.received_at,
            received_at: uplink.received_at,
            decoded_payload: decoded,
            avatar: "https://i.pravatar.cc/150?u=ttn",
            email: ids.dev_eui || "",
            source: "TTN"
          };
          
          console.log("📡 TTN latest data:", {
            stress: ttnData.stress_level,
            timestamp: ttnData.timestamp,
            source: "TTN"
          });
        }
      } else {
        console.warn("❌ TTN fetch failed", res.status);
      }

      // Fetch S3 data
      let s3Data: any = null;
      try {
        const s3Res = await fetch("/api/s3-data", { cache: "no-store" });
        if (s3Res.ok) {
          const s3Json = await s3Res.json();
          const rawS3 = s3Json.data;
          
          if (rawS3) {
            const decoded = rawS3.decoded_payload || rawS3;
            s3Data = {
              name: DEVICE_NAME,
              stress_level: decoded.stress_level || rawS3.stress_level || 0,
              timestamp: decoded.timestamp_iso || rawS3.timestamp || rawS3.upload_timestamp,
              received_at: rawS3.timestamp || rawS3.upload_timestamp,
              decoded_payload: decoded,
              avatar: "https://i.pravatar.cc/150?u=s3",
              email: rawS3.device_address || "",
              source: "S3"
            };
            
            console.log("📦 S3 latest data:", {
              stress: s3Data.stress_level,
              timestamp: s3Data.timestamp,
              source: "S3"
            });
          }
        } else {
          console.warn("❌ S3 fetch failed", s3Res.status);
        }
      } catch (e) {
        console.warn("❌ S3 fetch error", e);
      }

      // Compare and update with the newest data
      const candidates = [ttnData, s3Data].filter(Boolean);
      
      if (candidates.length === 0) {
        console.warn("⚠️ No data received from any source");
        setLoading(false);
        return;
      }

      console.log(`📊 Comparing ${candidates.length} data source(s)...`);
      
      // Compare stress levels and timestamps
      if (candidates.length === 2) {
        const [data1, data2] = candidates;
        console.log("🔍 Comparison:", {
          TTN: { stress: ttnData?.stress_level, time: ttnData?.timestamp },
          S3: { stress: s3Data?.stress_level, time: s3Data?.timestamp }
        });
        
        // Check if they have the same stress level
        if (data1.stress_level === data2.stress_level) {
          console.log("✅ Both sources have same stress level:", data1.stress_level);
        } else {
          console.log("⚠️ Different stress levels - TTN:", data1.stress_level, "S3:", data2.stress_level);
        }
      }
      
      // Try updating with each candidate (store will keep the newest)
      candidates.forEach(data => {
        updateIfNewer(data);
      });
      
      setLoading(false);
    } catch (e) {
      console.error("❌ fetchUplinks error", e);
      setLoading(false);
    }
  }

  // Poll every 5s for near-real-time updates
  useEffect(() => {
    fetchUplinks();
    const id = setInterval(fetchUplinks, 5000);
    return () => clearInterval(id);
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
