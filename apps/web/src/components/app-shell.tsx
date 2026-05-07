"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppFooter } from "@/components/app-footer";
import { StarProjectModal } from "@/components/star-project-modal";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { ActiveUsers } from "@/components/active-users";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isGameRoute = pathname.includes("/game/");

  if (isGameRoute) {
    return (
      <main className="min-h-screen bg-background relative">
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
           <div className="pointer-events-auto">
             <ActiveUsers />
           </div>
        </div>
        {children}
        <StarProjectModal />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full relative min-h-screen flex flex-col">
        <div className="flex items-center justify-between p-4 pb-0">
          <SidebarTrigger />
          <ActiveUsers />
        </div>
        <div className="flex-1 p-4 md:p-8 pt-4">
          {children}
        </div>
        <AppFooter />
        <StarProjectModal />
      </main>
    </SidebarProvider>
  );
}
