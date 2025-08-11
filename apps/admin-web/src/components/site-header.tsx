"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

const TITLE_MAP: Record<string, string> = {
  overview: "Overview",
  users: "Users",
  groups: "Groups",
  orders: "Orders",
  analytics: "Analytics",
  settings: "Settings",
}

export function SiteHeader() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const root = segments[0] || "overview"
  const pageTitle = TITLE_MAP[root] || (root ? root.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Overview")
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
        </div>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex gap-2">
            <a
              href="https://letseat.example.com" // TODO: replace with real production site
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5" />
              <Image src="/main_logo_with_text_horizontal.svg" alt="Let's Eat" width={240} height={64} className="h-10 w-auto" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
