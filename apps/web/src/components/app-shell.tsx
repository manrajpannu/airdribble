"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppFooter } from "@/components/app-footer";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isGameRoute = pathname.startsWith("/game/");

  if (isGameRoute) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="m-4" />
        <div className="p-4 md:p-8 pt-0">
          {children}
        </div>
        <AppFooter />
      </main>
    </SidebarProvider>
  );
}
