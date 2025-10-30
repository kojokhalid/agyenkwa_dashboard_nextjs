"use client";
import React from "react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StressAreaChartProps {
  data: Array<{ name: string; stress: number }>;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export const StressAreaChart: React.FC<StressAreaChartProps> = ({
  data,
  isMaximized,
  onToggleMaximize,
}) => {
  return (
    <Card className={`p-4 ${isMaximized ? "col-span-full" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Stress Level Trend</h3>
        <Button isIconOnly size="sm" variant="light" onPress={onToggleMaximize}>
          {isMaximized ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </div>
      <ResponsiveContainer width="100%" height={isMaximized ? 500 : 250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: "12px" }} />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1, 2, 3, 4]}
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="stress"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#stressGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
