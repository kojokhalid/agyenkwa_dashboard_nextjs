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
  LayoutDashboard,
  Users,
  UserPlus,
  BarChart3,
  TrendingUp,
  BrainCircuit,
  Moon,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import Image from "next/image";
import { useSidebar } from "@/contexts/SidebarContext";

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([
    "drivers",
    "analytics",
  ]);

  const pathname = usePathname() ?? "/";

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
    },
    {
      id: "drivers",
      label: "Drivers",
      icon: Users,
      subItems: [
        {
          label: "All Drivers",
          href: "/drivers",
        },
        {
          label: "Add New Driver",
          href: "/drivers/new",
        },
      ],
    },
    {
      id: "analytics",
      label: "Analytics & Insights",
      icon: BarChart3,
      subItems: [
        {
          label: "Fatigue Trends",
          href: "/analytics/fatigue",
        },
        {
          label: "Driver Comparison",
          href: "/analytics/comparison",
        },
        {
          label: "Sleep Analytics",
          href: "/analytics/sleep",
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
    {
      id: "help",
      label: "Help & Support",
      icon: HelpCircle,
      href: "/help",
    },
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

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
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
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
              <Image src="/logo.png" alt="logo" height={50} width={50} />
              <span className="font-bold text-xl">lyppo</span>
            </Link>
          )}
          {isCollapsed && (
            // <Bluetooth className="w-6 h-6 text-primary mx-auto" />
            <Image src="/logo.png" alt="logo" height={50} width={50} />
          )}
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
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus.includes(item.id);

              // Check if current route matches this item or any sub-item
              const isActive = item.href
                ? item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)
                : item.subItems?.some((sub) => pathname.startsWith(sub.href));

              return (
                <li key={item.id}>
                  {/* Main Menu Item */}
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={clsx(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-default-700 hover:text-primary hover:bg-default-100",
                        isCollapsed ? "justify-center" : "justify-between"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={clsx(
                            "w-5 h-5 flex-shrink-0",
                            isActive ? "text-primary" : "text-default-500"
                          )}
                        />
                        {!isCollapsed && (
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={clsx(
                            "w-4 h-4 transition-transform",
                            isExpanded ? "rotate-180" : ""
                          )}
                        />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href!}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-default-700 hover:text-primary hover:bg-default-100",
                        isCollapsed ? "justify-center" : ""
                      )}
                    >
                      <Icon
                        className={clsx(
                          "w-5 h-5 flex-shrink-0",
                          isActive ? "text-primary" : "text-default-500"
                        )}
                      />
                      {!isCollapsed && (
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Sub Menu Items */}
                  {hasSubItems && !isCollapsed && isExpanded && (
                    <ul className="mt-1 ml-8 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname.startsWith(subItem.href);
                        return (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                                isSubActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-default-600 hover:text-primary hover:bg-default-50"
                              )}
                            >
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-divider">
          {!isCollapsed ? (
            <div className="text-xs text-default-500 space-y-1">
              <p className="font-semibold">Lyppo Dashboard</p>
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
