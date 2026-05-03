"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronUp, Info, MessageCircle, Play, Moon, Sun, GitBranch, User } from "lucide-react";

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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GuestInit } from "@/components/guest-init";
import { useMe } from "@/hooks/use-api";

const navItems = [
  { href: "/play/challenge", label: "Challenge", icon: Play },
  { href: "/game/freeplay", label: "Freeplay", icon: Play },
  { href: "/about", label: "About", icon: Info },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { data: user, isLoading } = useMe();

  useEffect(() => {
    setMounted(true);
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

  const logoSrc = (mounted && darkMode) ? "/icons/logo-white.png" : "/icons/logo-black.png";

  return (
    <>
      <GuestInit />
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <div className="flex flex-col gap-4">
            <div className="relative h-9 w-full">
              <Image
                src={logoSrc}
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
                {(mounted && darkMode) ? <Sun className="size-4 shrink-0" /> : <Moon className="size-4 shrink-0" />}
                <span>{(mounted && darkMode) ? "Light Mode" : "Dark Mode"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* <SidebarMenuItem>
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
            </SidebarMenuItem> */}

            {/* User profile at the very bottom */}
            <SidebarSeparator />
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="w-full justify-start data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      render={
                        <button type="button" className="flex items-center gap-3 w-full">
                          <div className="flex items-center justify-center size-8 rounded-full bg-muted shrink-0">
                            <User className="size-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            {(!mounted || isLoading || !user) ? (
                              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                            ) : (
                              <>
                                <span className="text-sm font-medium text-foreground truncate">
                                  {user.username}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  Guest
                                </span>
                              </>
                            )}
                          </div>
                          <ChevronUp className="size-4 shrink-0 text-muted-foreground ml-auto" />
                        </button>
                      }
                    />
                  }
                />
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  sideOffset={4}
                >
                  <DropdownMenuItem render={<Link href="/profile" className="cursor-pointer">Profile</Link>} />
                  <DropdownMenuItem className="cursor-pointer">Login</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">Create Account</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
