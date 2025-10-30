"use client";
import React from "react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface StressDistribution {
  name: string;
  value: number;
  level: number;
  color: string;
}

interface StressPieChartProps {
  data: Array<StressDistribution & Record<string, any>>;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export const StressPieChart: React.FC<StressPieChartProps> = ({
  data,
  isMaximized,
  onToggleMaximize,
}) => {
  return (
    <Card className={`p-4 ${isMaximized ? "col-span-full" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Stress Distribution</h3>
        <Button isIconOnly size="sm" variant="light" onPress={onToggleMaximize}>
          {isMaximized ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </div>
      <ResponsiveContainer width="100%" height={isMaximized ? 500 : 250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={isMaximized ? 180 : 80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
