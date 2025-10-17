"use client";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import {
  Bluetooth,
  Home,
  Settings,
  Activity,
  Waves,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
    },
    {
      label: "BLE Devices",
      icon: Bluetooth,
      href: "/devices",
    },
    {
      label: "Live Stream",
      icon: Waves,
      href: "/stream",
    },
    {
      label: "Activity Log",
      icon: Activity,
      href: "/activity",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className="fixed top-4 left-4 z-50 lg:hidden bg-content1 border border-divider"
        onPress={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed left-0 top-0 h-screen bg-content1 border-r border-divider transition-all duration-300 z-40 flex flex-col",
          // Desktop styles
          "lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          // Mobile styles - off-canvas by default
          "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between p-4 border-b border-divider h-16">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              {/* <Bluetooth className="w-6 h-6 text-primary" /> */}
              <span className="font-bold text-xl">Agyenkwa</span>
            </Link>
          )}
          {isCollapsed && <Bluetooth className="w-6 h-6 text-primary mx-auto" />}
        </div>

      {/* Desktop Toggle Button - Hidden on mobile */}
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className="hidden lg:flex absolute -right-3 top-20 rounded-full bg-content1 border border-divider"
        onPress={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-default-100 transition-colors text-default-700 hover:text-primary",
                    isCollapsed ? "justify-center" : ""
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-divider">
        {!isCollapsed ? (
          <div className="text-xs text-default-500 space-y-1">
            <p className="font-semibold">BLE Device Manager</p>
            <p>v1.0.0</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
