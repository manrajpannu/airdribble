"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronUp, Info, MessageCircle, Play, Users, Moon, Sun, GitBranch } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/play/challenge", label: "Challenge", icon: Play },
  { href: "/game/freeplay", label: "Freeplay", icon: Play },
  { href: "/about", label: "About", icon: Info },
  // { href: "/community", label: "Community", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("airdribble-theme");
    const prefersDark = saved === "dark";
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("airdribble-theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex flex-col gap-4">
          <div className="relative h-9 w-full">
            <Image
              src={darkMode ? "/icons/logo-white.png" : "/icons/logo-black.png"}
              alt="airdribble logo"
              fill
              className="object-contain object-left pr-12"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Aim Trainer</h1>
            <p className="text-sm text-muted-foreground leading-tight">Modern practice workspace</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <Link href={item.href} className="flex items-center gap-2 w-full">
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <Link href="/community" className="flex items-center gap-2 w-full">
                  <MessageCircle className="size-4 shrink-0" />
                  <span>Discord</span>
                </Link>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleDarkMode}>
              {darkMode ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={
                <a 
                  href="https://github.com/manrajpannu/airdribble" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 w-full"
                >
                  <GitBranch className="size-4 shrink-0" />
                  <span>GitHub</span>
                </a>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
