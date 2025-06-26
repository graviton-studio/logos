"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Settings,
  Home,
  MessageSquare,
  Bell,
  Puzzle,
  Menu,
  X,
} from "lucide-react";
import { FaFont } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import SignoutButton from "@/components/auth/SignoutButton";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

const menuItems = [
  { name: "Home", href: "/home", icon: Home, badge: null },
  {
    name: "Agents",
    href: "/home/agents",
    icon: FaFont,
    badge: null,
  },
  { name: "Chat", href: "/home/chat", icon: MessageSquare, badge: "New" },
  {
    name: "Integrations",
    href: "/home/integrations",
    icon: Puzzle,
    badge: null,
  },
  { name: "Settings", href: "/home/settings", icon: Settings, badge: null },
];

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      setLoadingUser(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } else {
        setUser(data.user);
      }
      setLoadingUser(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingUser(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col bg-card border-r border-border shadow-lg transition-transform duration-300 ease-in-out",
          { "-translate-x-full": !isSidebarOpen },
        )}
      >
        {/* Sidebar content */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border px-4">
          <Link
            href="/"
            className="flex items-center space-x-2 transition-all duration-300 hover:scale-105"
          >
            <FaFont className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">Logos</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-grow">
          <nav className="flex flex-col space-y-1 p-4">
            {menuItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start transition-all duration-300 hover:bg-muted"
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {item.badge && (
                    <Badge variant="default" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        {/* Profile Section in Sidebar */}
        {loadingUser ? (
          <div className="flex-shrink-0 border-t border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Loading user...</p>
          </div>
        ) : user ? (
          <div className="flex-shrink-0 border-t border-border p-4">
            <div className="mb-3 flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold transition-all duration-300 hover:scale-105">
                {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                  user.email?.[0]?.toUpperCase() ||
                  "U"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {user.user_metadata?.full_name || user.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground hover:text-primary transition-colors duration-300">
                  View profile
                </p>
              </div>
            </div>
            <SignoutButton className="w-full" />
          </div>
        ) : (
          <div className="flex-shrink-0 border-t border-border p-4">
            <Link href="/login">
              <Button variant="default" className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
        )}
      </aside>

      {/* Content Area */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-y-auto overflow-x-auto transition-all duration-300 ease-in-out bg-gradient-to-br from-[var(--background)] to-[var(--muted)]",
          isSidebarOpen ? "md:ml-64" : "",
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-center"></div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto min-w-0">
          {/* The children prop will render the page content here */}
          {children}
        </main>
      </div>
    </div>
  );
}
