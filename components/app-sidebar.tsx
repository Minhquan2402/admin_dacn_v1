"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Home,
  Bell,
  Store,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Fresh Food Platform",
      logo: GalleryVerticalEnd,
      plan: "Admin Panel",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home,
      isActive: true,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Categories",
      url: "/admin/categories",
      icon: BookOpen,
    },
    {
      title: "Shops",
      url: "/admin/shops",
      icon: Store,
    },
    {
      title: "Products",
      url: "/admin/products",
      icon: Package,
    },
    {
      title: "Orders",
      url: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
    },
    {
      title: "Thông báo",
      url: "/admin/violations",
      icon: Bell,
    },
    {
      title: "Quản lý livestream",
      url: "/admin/livestreams",
      icon: AudioWaveform,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}