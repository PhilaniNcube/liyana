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
  UserCheck,
  Menu,
  ChevronLeft,
  BoxIcon,
  VaultIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { title } from "process";

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
    title: "Loans",
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
        title: "Approved Loans",
        href: "/dashboard/loans",
        icon: UserCheck,
      },
      {
        title: "All Users",
        href: "/dashboard/users",
        icon: Users,
      },
    ],
  },
  {
    title: "Life Insurance",
    href: "/dashboard/insurance/life",
    icon: Shield,
  },
  {
    title: "Funeral Insurance",
    href: "/dashboard/insurance/funeral",
    icon: VaultIcon,
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
  // {
  //   title: "Loans",
  //   href: "/dashboard/loans",
  //   icon: CreditCard,
  // },
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
  const isMobile = useIsMobile();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);

  useEffect(() => {
    setIsSidebarExpanded(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarExpanded(false);
      setExpandedItems([]);
    }
  }, [pathname, isMobile]);

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

  const showLabels = !isMobile || isSidebarExpanded;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-background border-r transition-all duration-200 ease-in-out",
        showLabels ? "w-64" : "w-16"
      )}
    >
      {/* Header with toggle above logo on mobile */}
      <div className="border-b p-4">
        {isMobile && (
          <div className="flex">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsSidebarExpanded((v) => !v)}
              aria-label={showLabels ? "Collapse sidebar" : "Expand sidebar"}
            >
              {showLabels ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}
        <div
          className={cn(
            "mt-2 flex items-center gap-2",
            !showLabels && "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-md flex items-center justify-center overflow-hidden">
            <Image
              src="/square.jpg"
              alt=""
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          {showLabels && (
            <span className="font-semibold text-base">Liyana Finance</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 p-2 space-y-2")}>
        {sidebarItems.map((item) => {
          const Icon = item.icon;

          if (item.subItems) {
            const isExpanded = expandedItems.includes(item.title);
            const hasActiveSubItem = isSubItemActive(item.subItems);

            return (
              <div key={item.title}>
                <Button
                  variant={hasActiveSubItem ? "secondary" : "ghost"}
                  className={cn(
                    "w-full gap-2",
                    showLabels ? "justify-start" : "justify-center",
                    hasActiveSubItem && "bg-secondary"
                  )}
                  onClick={() => {
                    if (isMobile && !showLabels) {
                      setIsSidebarExpanded(true);
                      return;
                    }
                    toggleExpanded(item.title);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {showLabels && <span>{item.title}</span>}
                  {showLabels &&
                    (isExpanded ? (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    ))}
                </Button>

                {showLabels && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem: any) => {
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
                            <span>{subItem.title}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href!}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full gap-2",
                  showLabels ? "justify-start" : "justify-center",
                  isActive && "bg-secondary"
                )}
                onClick={() => {
                  if (isMobile) setIsSidebarExpanded(false);
                }}
              >
                <Icon className="h-4 w-4" />
                {showLabels && <span>{item.title}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t">
        <div
          className={cn(
            "flex items-center mb-3",
            showLabels ? "gap-3" : "justify-center"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {showLabels && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          )}
        </div>

        <form action="/auth/logout" method="post">
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "w-full gap-2 text-muted-foreground",
              showLabels ? "justify-start" : "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {showLabels && <span>Sign out</span>}
          </Button>
        </form>
      </div>
    </div>
  );
}
