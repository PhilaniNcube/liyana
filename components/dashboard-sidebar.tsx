"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  Users,
  FileText,
  Settings,
  Home,
  CreditCard,
  LogOut,
  Code,
  Shield,
  UserX,
  ChevronDown,
  ChevronRight,
  Database,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface DashboardSidebarProps {
  user: User;
}

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "User Management",
    icon: Database,
    subItems: [
      {
        title: "Pending Applications",
        href: "/dashboard/applications",
        icon: FileText,
      },
      {
        title: "Declined Loans",
        href: "/dashboard/declined-loans",
        icon: UserX,
      },
      {
        title: "All Users",
        href: "/dashboard/users",
        icon: Users,
      },
    ],
  },
  {
    title: "API Checks",
    href: "/dashboard/api-checks",
    icon: Code,
  },
  {
    title: "Credit Check",
    href: "/dashboard/fraud-check",
    icon: Shield,
  },
  {
    title: "Loans",
    href: "/dashboard/loans",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isSubItemActive = (subItems: any[]) => {
    return subItems.some((subItem) => pathname === subItem.href);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      {/* Header */}
      <div className="flex items-center gap-2 p-6 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center">
            <Image
              src="/square.jpg"
              alt=""
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <span className="font-semibold text-lg">Liyana Finance</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;

          // Handle items with subItems (nested menu)
          if (item.subItems) {
            const isExpanded = expandedItems.includes(item.title);
            const hasActiveSubItem = isSubItemActive(item.subItems);

            return (
              <div key={item.title}>
                <Button
                  variant={hasActiveSubItem ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    hasActiveSubItem && "bg-secondary"
                  )}
                  onClick={() => toggleExpanded(item.title)}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isActive = pathname === subItem.href;

                      return (
                        <Link key={subItem.href} href={subItem.href}>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-start gap-2 text-sm",
                              isActive && "bg-secondary"
                            )}
                          >
                            <SubIcon className="h-3 w-3" />
                            {subItem.title}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Handle regular items (no subItems)
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href!}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2",
                  isActive && "bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.user_metadata?.full_name || user.email}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>

        <form action="/auth/logout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
