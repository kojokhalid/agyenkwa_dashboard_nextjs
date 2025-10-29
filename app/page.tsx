"use client";
import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Avatar } from "@heroui/avatar";
import { useDeviceStore } from "@/store/device-store";
import { useDeviceDataContext } from "@/contexts/DeviceDataContext";

const columns = [
  { name: "USER NAME", uid: "name" },
  { name: "STRESS LEVEL", uid: "stress_level" },
  { name: "TIMESTAMP", uid: "timestamp" },
  { name: "SOURCE", uid: "source" },
];

const DEVICE_NAME = "Agyenkwa Device";

export default function IndexPage() {
  const { deviceData, isLoading } = useDeviceStore();
  const { isInitialized } = useDeviceDataContext();

  const renderCell = React.useCallback((columnKey: string): React.ReactNode => {
    if (!deviceData) return "-";

    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-2">
            <Avatar src={deviceData.avatar} name={deviceData.username || deviceData.name} className="flex-shrink-0" size="sm" />
            <div className="flex flex-col">
              <p className="text-bold text-sm">{deviceData.username || deviceData.name || DEVICE_NAME}</p>
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
            deviceData.source === "TTN Webhook" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
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

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full max-w-4xl">
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
        {!deviceData && !isLoading && !isInitialized && (
          <div className="text-center text-default-500">Connecting to data sources...</div>
        )}
        {!deviceData && !isLoading && isInitialized && (
          <div className="text-center text-default-500">No device data available</div>
        )}
      </div>
    </section>
  );
}
