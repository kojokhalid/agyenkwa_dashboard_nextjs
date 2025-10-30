"use client";
import React from "react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import {
  Maximize2,
  Minimize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

interface DeviceData {
  id: string;
  username: string;
  stress_level: number;
  timestampValue: string;
  source: string;
}

interface DriversTableProps {
  data: DeviceData[];
  isMaximized: boolean;
  onToggleMaximize: () => void;
  sortColumn: string | null;
  sortDirection: "asc" | "desc" | null;
  onSort: (columnUid: string) => void;
}

const columns = [
  { name: "USER NAME", uid: "name", sortable: true },
  { name: "STRESS LEVEL", uid: "stress_level", sortable: true },
  { name: "TIMESTAMP", uid: "timestamp", sortable: true },
  //   { name: "SOURCE", uid: "source", sortable: false },
];

export const DriversTable: React.FC<DriversTableProps> = ({
  data,
  isMaximized,
  onToggleMaximize,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  const renderSortIcon = (columnUid: string) => {
    if (sortColumn !== columnUid) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-primary" />
    );
  };

  const renderCell = React.useCallback(
    (item: DeviceData, columnKey: string): React.ReactNode => {
      switch (columnKey) {
        case "name":
          return (
            <div className="flex items-center gap-2">
              <Avatar
                getInitials={(name: string) => name.charAt(0)}
                name={item.username}
                size="sm"
              />
              <div className="flex flex-col">
                <p className="text-bold text-sm">{item.username}</p>
              </div>
            </div>
          );
        case "stress_level": {
          const level = item.stress_level;
          const colorClass = (() => {
            switch (level) {
              case 1:
                return "bg-green-500 text-white";
              case 2:
                return "bg-yellow-500 text-white";
              case 3:
                return "bg-orange-500 text-white";
              case 4:
                return "bg-red-500 text-white";
              default:
                return "bg-gray-500 text-white";
            }
          })();

          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium ${colorClass}`}
            >
              {level || "-"}
            </span>
          );
        }
        case "source":
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                item.source === "TTN Webhook"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {item.source}
            </span>
          );
        case "timestamp":
          return new Date(item.timestampValue).toLocaleString();
        default:
          return "-";
      }
    },
    []
  );

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Button isIconOnly size="sm" variant="light" onPress={onToggleMaximize}>
          {isMaximized ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </Button>
      </div>
      <Table aria-label="Device stress monitoring table with sorting">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align="start"
              className={column.sortable ? "cursor-pointer select-none" : ""}
              onClick={() => column.sortable && onSort(column.uid)}
            >
              <div className="flex items-center">
                {column.name}
                {column.sortable && renderSortIcon(column.uid)}
              </div>
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={data} emptyContent="No data found">
          {(item) => (
            <TableRow
              key={item.id}
              className={item.stress_level === 4 ? "animate-pulse-red" : ""}
            >
              {(columnKey) => (
                <TableCell>{renderCell(item, String(columnKey))}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
