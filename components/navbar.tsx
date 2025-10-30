"use client";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Bell,
  Search,
  Settings,
  LogOut,
  User,
  AlertTriangle,
  Info,
  CheckCircle,
  Check,
} from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";
import { useSidebar } from "@/contexts/SidebarContext";
import { useDeviceStore } from "@/store/device-store";
import clsx from "clsx";
import { useMemo, useState } from "react";

export const Navbar = () => {
  const { isCollapsed } = useSidebar();
  const { deviceData } = useDeviceStore();
  const [readNotifications, setReadNotifications] = useState<Set<string>>(
    new Set()
  );

  // Generate notifications based on device data
  const notifications = useMemo(() => {
    const notifs = [];

    if (deviceData) {
      const stressLevel = deviceData.stress_level;
      const username = deviceData.username || "User";
      const timestamp = new Date(
        deviceData.timestamp || deviceData.received_at
      );
      const timeAgo = getTimeAgo(timestamp);

      if (stressLevel === 4) {
        notifs.push({
          id: `critical-${deviceData.timestamp}`,
          type: "critical",
          icon: "AlertTriangle",
          color: "danger" as const,
          title: "Critical Stress Level Alert",
          message: `${username} is experiencing critical stress levels`,
          time: timeAgo,
          isRead: false,
        });
      } else if (stressLevel === 3) {
        notifs.push({
          id: `high-${deviceData.timestamp}`,
          type: "warning",
          icon: "AlertTriangle",
          color: "warning" as const,
          title: "High Stress Level Warning",
          message: `${username} has elevated stress levels`,
          time: timeAgo,
          isRead: false,
        });
      } else if (stressLevel === 2) {
        notifs.push({
          id: `moderate-${deviceData.timestamp}`,
          type: "info",
          icon: "Info",
          color: "primary" as const,
          title: "Moderate Stress Level",
          message: `${username} showing moderate stress`,
          time: timeAgo,
          isRead: false,
        });
      } else {
        notifs.push({
          id: `low-${deviceData.timestamp}`,
          type: "success",
          icon: "CheckCircle",
          color: "success" as const,
          title: "Normal Stress Level",
          message: `${username} is within normal stress range`,
          time: timeAgo,
          isRead: false,
        });
      }
    }

    return notifs;
  }, [deviceData]);

  const unreadCount = notifications.filter(
    (n) =>
      !readNotifications.has(n.id) &&
      (n.type === "critical" || n.type === "warning")
  ).length;

  const markAsRead = (notificationId: string) => {
    setReadNotifications((prev) => new Set(prev).add(notificationId));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifications(new Set(allIds));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "AlertTriangle":
        return AlertTriangle;
      case "Info":
        return Info;
      case "CheckCircle":
        return CheckCircle;
      default:
        return Bell;
    }
  };

  return (
    <nav
      className={clsx(
        "fixed top-0 right-0 z-30 h-16 bg-content1 border-b border-divider flex items-center justify-between px-6 transition-all duration-300",
        "left-0",
        isCollapsed ? "lg:left-16" : "lg:left-64"
      )}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <Input
          classNames={{
            base: "max-w-full",
            inputWrapper: "h-10",
          }}
          placeholder="Search drivers, analytics..."
          size="sm"
          startContent={<Search className="w-4 h-4 text-default-400" />}
          type="search"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Switch */}
        <ThemeSwitch />

        {/* Notifications */}
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Button isIconOnly size="sm" variant="light">
              <Badge
                content={unreadCount}
                color="danger"
                isInvisible={unreadCount === 0}
                shape="circle"
                size="sm"
              >
                <Bell className="w-5 h-5" />
              </Badge>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Notifications"
            variant="flat"
            className="w-80"
          >
            <DropdownItem
              key="header"
              className="h-10 gap-2 opacity-100 justify-between"
              textValue="Notifications Header"
            >
              <div className="flex items-center justify-between w-full">
                <p className="font-bold text-lg">Notifications</p>
                {notifications.length > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    color="primary"
                    onPress={markAllAsRead}
                    className="h-7 text-xs"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </DropdownItem>
            {notifications.length > 0 ? (
              <>
                {notifications.map((notif) => {
                  const Icon = getIcon(notif.icon);
                  const isRead = readNotifications.has(notif.id);
                  return (
                    <DropdownItem
                      key={notif.id}
                      className="h-auto py-3"
                      textValue={notif.title}
                    >
                      <div className="flex gap-3 items-start">
                        <Icon
                          className={clsx(
                            "w-5 h-5 flex-shrink-0 mt-0.5",
                            notif.color === "danger" && "text-danger",
                            notif.color === "warning" && "text-warning",
                            notif.color === "primary" && "text-primary",
                            notif.color === "success" && "text-success"
                          )}
                        />
                        <div className="flex flex-col gap-1 flex-1">
                          <p
                            className={clsx(
                              "font-semibold text-sm",
                              isRead && "text-default-400"
                            )}
                          >
                            {notif.title}
                          </p>
                          <p
                            className={clsx(
                              "text-xs",
                              isRead ? "text-default-300" : "text-default-500"
                            )}
                          >
                            {notif.message}
                          </p>
                          <p className="text-xs text-default-400">
                            {notif.time}
                          </p>
                        </div>
                        {!isRead && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => markAsRead(notif.id)}
                            className="min-w-6 w-6 h-6"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {isRead && (
                          <div className="w-2 h-2 rounded-full bg-default-300 mt-1.5" />
                        )}
                      </div>
                    </DropdownItem>
                  );
                })}
              </>
            ) : (
              <DropdownItem key="empty" textValue="No notifications">
                <p className="text-center text-default-400 py-4">
                  No notifications
                </p>
              </DropdownItem>
            )}
            <DropdownItem
              key="view-all"
              className="h-10"
              color="primary"
              textValue="View All Notifications"
            >
              <p className="text-center font-semibold">
                View All Notifications
              </p>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {/* User Menu */}
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform cursor-pointer"
              color="primary"
              name="Admin User"
              size="sm"
              src=""
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">admin@lyppo.com</p>
            </DropdownItem>
            <DropdownItem
              key="settings"
              startContent={<Settings className="w-4 h-4" />}
            >
              Settings
            </DropdownItem>
            <DropdownItem
              key="profile-edit"
              startContent={<User className="w-4 h-4" />}
            >
              My Profile
            </DropdownItem>
            <DropdownItem
              key="logout"
              color="danger"
              startContent={<LogOut className="w-4 h-4" />}
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    </nav>
  );
};

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return Math.floor(seconds) + " seconds ago";
}
