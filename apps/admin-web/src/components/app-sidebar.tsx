"use client"

import * as React from "react"
import { IconDashboard, IconSettings, IconUsers, IconReceipt2, IconUserCog, IconReportAnalytics } from "@tabler/icons-react"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Sep Ursone",
    email: "sep@letseat.com",
    avatar: "", // Placeholder; add an image under public/avatars later
  },
  navMain: [
    { title: "Overview", url: "/overview", icon: IconDashboard },
    { title: "Users", url: "/users", icon: IconUsers },
    { title: "Groups", url: "/groups", icon: IconUserCog },
    { title: "Orders", url: "/orders", icon: IconReceipt2 },
    { title: "Restaurants", url: "/restaurants", icon: IconReceipt2 },
    { title: "Analytics", url: "/analytics", icon: IconReportAnalytics },
    { title: "Settings", url: "/settings", icon: IconSettings },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-2">
              <a href="/overview" className="flex items-center gap-2">
                <Image
                  src="/main_logo_with_text_horizontal.svg"
                  alt="Let's Eat"
                  width={300}
                  height={60}
                  priority
                  className="h-14 w-auto"
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
