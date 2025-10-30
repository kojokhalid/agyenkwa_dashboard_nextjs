"use client";

import React from "react";
import clsx from "clsx";
import { useSidebar } from "@/contexts/SidebarContext";
import { Navbar } from "@/components/navbar";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div
      className={clsx(
        "flex-1 flex flex-col transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}
    >
      <Navbar />
      <main className="flex-1 container mx-auto max-w-7xl px-6 overflow-auto mt-16">
        {children}
      </main>
    </div>
  );
}
