"use client";
import React from "react";
import { Card } from "@heroui/card";
import { TrendingUp, Users, AlertCircle } from "lucide-react";

interface StatsCardsProps {
  totalDrivers: number;
  avgStress: string;
  criticalCount: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalDrivers,
  avgStress,
  criticalCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-default-500">Total Drivers</p>
            <p className="text-2xl font-bold">{totalDrivers}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-default-500">Avg Stress Level</p>
            <p className="text-2xl font-bold">{avgStress}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-default-500">High Risk Drivers</p>
            <p className="text-2xl font-bold">{criticalCount}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
