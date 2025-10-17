"use client"
import React from "react";
import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  
} from "@heroui/table";
// No UI imports required for actions; using simple cells for stress fields

const columns = [
  { name: "NAME", uid: "name" },
  { name: "STRESS LEVEL", uid: "stress_level" },
  // { name: "STRESS STATUS", uid: "stress_status" },
  { name: "TIMESTAMP", uid: "timestamp" },
];
// removed action icons — table focuses on stress fields only

// statusColorMap removed — we display raw stress status text instead

const TTN_APPLICATION_ID = "mo-lora-lora-no";
const TTN_API_KEY = "NNSXS.AIEQECWKQPVAPNRFKKDWJX3RXBQ2A5VWLNETOCI.6UOIMQHT65CJ3OX23OWXEM2OLOJ6SVUHDDPFHW35TY3PYMKQXPDA";
const TTN_BASE_URL = `https://eu1.cloud.thethings.network/api/v3/as/applications/${TTN_APPLICATION_ID}/packages/storage/uplink_message`;

export default function IndexPage() {
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

  const renderCell = React.useCallback((user: any, columnKey: string): React.ReactNode => {
    const decoded = user.decoded_payload || {};

    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" />
            <div className="flex flex-col">
              <p className="text-bold text-sm">{user.name}</p>
              <p className="text-sm text-default-400">{user.email}</p>
            </div>
          </div>
        );
      case "stress_level": {
        const lvl = decoded.stress_level ?? user.raw ?? null;
        const level = Number(lvl);
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
            {Number.isNaN(level) || level === 0 ? "-" : level}
          </span>
        );
      }
      case "stress_status":
        return decoded.stress_status ?? "-";
      case "timestamp": {
        const raw = decoded.timestamp_iso ?? user.received_at ?? decoded.timestamp ?? null;
        // helper to format a variety of timestamp shapes
        const formatTimestamp = (v: any) => {
          if (!v && v !== 0) return "-";
          // numeric (seconds or milliseconds)
          if (typeof v === "number") {
            // if it's likely seconds (10 digits) convert to ms
            const millis = v > 1e12 ? v : v * 1000;
            const d = new Date(millis);
            if (!isNaN(d.getTime())) return d.toLocaleString();
            return String(v);
          }
          if (typeof v === "string") {
            // pure digits?
            if (/^\d+$/.test(v)) {
              const num = Number(v);
              const millis = num > 1e12 ? num : num * 1000;
              const d = new Date(millis);
              if (!isNaN(d.getTime())) return d.toLocaleString();
            }
            // try ISO parse
            const parsed = Date.parse(v);
            if (!isNaN(parsed)) return new Date(parsed).toLocaleString();
            return v;
          }
          return String(v);
        };

        return formatTimestamp(raw);
      }
      default:
        return user[columnKey] ?? "-";
    }
  }, []);

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
  // start fetch
    try {
      // Fetch TTN data
      const params = new URLSearchParams({ last: "24h", limit: "50" });
      const res = await fetch(`${TTN_BASE_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${TTN_API_KEY}`,
          Accept: "text/event-stream, application/x-ndjson, application/json",
        },
        cache: "no-store",
      });

      let ttnMessages: any[] = [];
      if (res.ok) {
        const text = await res.text();
        // Try NDJSON first
        ttnMessages = parseNdjson(text);
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
      } else {
        console.warn("TTN fetch failed", res.status);
      }

      // Fetch S3 data
      let s3Data: any = null;
      try {
        const s3Res = await fetch("/api/s3-data", { cache: "no-store" });
        if (s3Res.ok) {
          const s3Json = await s3Res.json();
          s3Data = s3Json.data;
        } else {
          console.warn("S3 fetch failed", s3Res.status);
        }
      } catch (e) {
        console.warn("S3 fetch error", e);
      }

      // Map TTN messages to rows
      const ttnMapped = ttnMessages.map((m: any, idx: number) => {
        const result = m.result || m;
        const uplink = result.uplink_message || result;
        const ids = result.end_device_ids || {};
        const decoded = uplink.decoded_payload || {};
        return {
          id: `ttn-${ids.device_id || idx}`,
          name: ids.device_id || `device-${idx}`,
          role: decoded.stress_status || "unknown",
          team: decoded ? JSON.stringify(decoded) : "",
          status: decoded && decoded.stress_status ? decoded.stress_status.toLowerCase() : "active",
          age: "-",
          avatar: "https://i.pravatar.cc/150?u=ttn", // placeholder
          email: ids.dev_eui || "",
          raw: uplink.frm_payload,
          received_at: uplink.received_at,
          decoded_payload: decoded,
          source: "TTN",
        };
      });

      // Process S3 data
      let s3Mapped: any[] = [];
      if (s3Data) {
        // Handle different S3 data structures
        let s3Items: any[] = [];
        if (Array.isArray(s3Data)) {
          s3Items = s3Data;
        } else if (typeof s3Data === "object") {
          // If it's a single object, wrap it in an array
          s3Items = [s3Data];
        }

        s3Mapped = s3Items.map((item: any, idx: number) => {
          const decoded = item.decoded_payload || item;
          return {
            id: `s3-${item.device_id || item.name || idx}`,
            name: item.device_id || item.name || `s3-device-${idx}`,
            role: decoded.stress_status || item.stress_status || "unknown",
            team: JSON.stringify(decoded),
            status: (decoded.stress_status || item.stress_status || "active").toLowerCase(),
            age: "-",
            avatar: "https://i.pravatar.cc/150?u=s3",
            email: item.dev_eui || item.email || "",
            raw: item.frm_payload || item.raw,
            received_at: item.timestamp || item.received_at || item.lastModified,
            decoded_payload: decoded,
            source: "S3",
          };
        });
      }

      // Merge TTN and S3 data
      const allMapped = [...ttnMapped, ...s3Mapped];

      // Sort by timestamp (latest first)
      allMapped.sort((a, b) => {
        const getTimestamp = (item: any) => {
          const decoded = item.decoded_payload || {};
          const raw = decoded.timestamp_iso ?? item.received_at ?? decoded.timestamp ?? null;
          
          if (!raw && raw !== 0) return 0;
          
          // Handle numeric timestamps
          if (typeof raw === "number") {
            return raw > 1e12 ? raw : raw * 1000;
          }
          
          // Handle string timestamps
          if (typeof raw === "string") {
            if (/^\d+$/.test(raw)) {
              const num = Number(raw);
              return num > 1e12 ? num : num * 1000;
            }
            const parsed = Date.parse(raw);
            return isNaN(parsed) ? 0 : parsed;
          }
          
          return 0;
        };
        
        return getTimestamp(b) - getTimestamp(a); // Descending order (latest first)
      });

      // Keep only the latest entry for each unique device name
      const uniqueDevices = new Map<string, any>();
      allMapped.forEach((item) => {
        if (!uniqueDevices.has(item.name)) {
          uniqueDevices.set(item.name, item);
        }
      });
      
      const uniqueMapped = Array.from(uniqueDevices.values());

      setRemoteUsers(uniqueMapped);
    } catch (e) {
      console.error("fetchUplinks error", e);
    } finally {
      // no-op
    }
  }

  // Poll every 5s for near-real-time updates
  useEffect(() => {
    fetchUplinks();
    const id = setInterval(fetchUplinks, 2000);
    return () => clearInterval(id);
  }, []);

  // We render only remoteUsers (no static data)

  return (
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <Table aria-label="Example table with custom cells">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.uid} align={column.uid === "actions" ? "center" : "start"}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={remoteUsers}>
        {(item: any) => (
          <TableRow key={item.id}>
            {(columnKey: string | number) => <TableCell>{renderCell(item, String(columnKey))}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
      </section>
  );
}
