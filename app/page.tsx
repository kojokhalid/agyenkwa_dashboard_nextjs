"use client";
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useDeviceStore } from "@/store/device-store";
import { useDeviceDataContext } from "@/contexts/DeviceDataContext";
import {
  StressAreaChart,
  StressPieChart,
  StatsCards,
  DriversTable,
} from "@/components/charts";

type SortDirection = "asc" | "desc" | null;
type SortColumn = "name" | "stress_level" | "timestamp" | null;

const STRESS_COLORS = {
  1: "#22c55e", // green-500
  2: "#eab308", // yellow-500
  3: "#f97316", // orange-500
  4: "#ef4444", // red-500
};

export default function IndexPage() {
  const { deviceData, isLoading } = useDeviceStore();
  const { isInitialized } = useDeviceDataContext();
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [maximizedCard, setMaximizedCard] = useState<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const previousStressLevel = useRef<number | null>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current =
        new AudioContext() || new (window as any).webkitAudioContext();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.close();
      }
    };
  }, []);

  // Play alert sound when critical stress level is detected
  useEffect(() => {
    if (deviceData && deviceData.stress_level === 4) {
      // Only play if stress level changed to 4 (not on every render)
      if (previousStressLevel.current !== 4 && audioRef.current) {
        const ctx = audioRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = 880; // A5 note - alert sound
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
      }
    }
    previousStressLevel.current = deviceData?.stress_level || null;
  }, [deviceData?.stress_level]);

  // Convert single deviceData to array format
  const dataArray = useMemo(() => {
    if (!deviceData) return [];

    return [
      {
        id: "device-current",
        username: deviceData.username || "Unknown User",
        stress_level: deviceData.stress_level,
        timestamp: deviceData.timestamp,
        timestampValue: deviceData.timestamp || deviceData.received_at,
        source: deviceData.source,
        received_at: deviceData.received_at,
      },
    ];
  }, [deviceData]);

  // Calculate stress distribution
  const stressDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 };
    dataArray.forEach((item) => {
      if (item.stress_level in distribution) {
        distribution[item.stress_level as keyof typeof distribution]++;
      }
    });

    return [
      {
        name: "Low",
        value: distribution[1],
        level: 1,
        color: STRESS_COLORS[1],
      },
      {
        name: "Moderate",
        value: distribution[2],
        level: 2,
        color: STRESS_COLORS[2],
      },
      {
        name: "High",
        value: distribution[3],
        level: 3,
        color: STRESS_COLORS[3],
      },
      {
        name: "Critical",
        value: distribution[4],
        level: 4,
        color: STRESS_COLORS[4],
      },
    ];
  }, [dataArray]);

  // Prepare bar chart data (by driver)
  const driverStressData = useMemo(() => {
    return dataArray.map((item) => ({
      name: item.username.split(" ")[0], // First name only
      stress: item.stress_level,
    }));
  }, [dataArray]);

  // Stats
  const stats = useMemo(() => {
    const totalDrivers = dataArray.length;
    const avgStress =
      dataArray.reduce((acc, item) => acc + item.stress_level, 0) /
        totalDrivers || 0;
    const criticalCount = dataArray.filter(
      (item) => item.stress_level >= 3
    ).length;

    return {
      totalDrivers,
      avgStress: avgStress.toFixed(1),
      criticalCount,
    };
  }, [dataArray]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return dataArray;

    return [...dataArray].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "name":
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case "stress_level":
          aValue = a.stress_level;
          bValue = b.stress_level;
          break;
        case "timestamp":
          aValue = new Date(a.timestampValue).getTime();
          bValue = new Date(b.timestampValue).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [dataArray, sortColumn, sortDirection]);

  const handleSort = (columnUid: string) => {
    if (sortColumn === columnUid) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnUid as SortColumn);
      setSortDirection("asc");
    }
  };

  return (
    <section className="flex flex-col gap-6 py-8 md:py-10">
      <div className="w-full">
        {/* <h1 className="text-3xl font-bold mb-6">Dashboard</h1> */}

        {isLoading && !deviceData && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 animate-pulse">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg text-default-500 font-medium">
                Loading device data...
              </p>
              <p className="text-sm text-default-400">
                Please wait while we fetch the latest information
              </p>
            </div>
          </div>
        )}

        {deviceData && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <StatsCards
              totalDrivers={stats.totalDrivers}
              avgStress={stats.avgStress}
              criticalCount={stats.criticalCount}
            />

            {/* Table and Charts Grid */}
            <div
              className={`grid gap-6 ${maximizedCard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}
            >
              {/* Table Column */}
              <div
                className={
                  maximizedCard && maximizedCard !== "table" ? "hidden" : ""
                }
              >
                <DriversTable
                  data={sortedData}
                  isMaximized={maximizedCard === "table"}
                  onToggleMaximize={() =>
                    setMaximizedCard(maximizedCard === "table" ? null : "table")
                  }
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </div>

              {/* Charts Column */}
              <div
                className={`space-y-4 ${maximizedCard === "table" ? "hidden" : ""}`}
              >
                <StressAreaChart
                  data={driverStressData}
                  isMaximized={maximizedCard === "areaChart"}
                  onToggleMaximize={() =>
                    setMaximizedCard(
                      maximizedCard === "areaChart" ? null : "areaChart"
                    )
                  }
                />

                <StressPieChart
                  data={stressDistribution}
                  isMaximized={maximizedCard === "pieChart"}
                  onToggleMaximize={() =>
                    setMaximizedCard(
                      maximizedCard === "pieChart" ? null : "pieChart"
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

        {!deviceData && !isLoading && !isInitialized && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-40 blur-xl animate-pulse"></div>
                <div className="relative flex items-center justify-center w-full h-full rounded-full bg-default-100">
                  <svg
                    className="w-10 h-10 text-primary animate-bounce"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-lg text-default-600 font-medium animate-pulse">
                Connecting to data sources...
              </p>
              <p className="text-sm text-default-400">
                Establishing connection with MQTT and MongoDB
              </p>
            </div>
          </div>
        )}

        {!deviceData && !isLoading && isInitialized && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full bg-default-100 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-full h-full">
                  <svg
                    className="w-12 h-12 text-default-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-lg text-default-600 font-medium">
                No device data available
              </p>
              <p className="text-sm text-default-400">
                Waiting for devices to send data
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
