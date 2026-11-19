import type { Metadata } from "next"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DEMO_BRANCH, DEMO_TENANT } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Dashboard Lapak Antre" },
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{DEMO_TENANT.name}</p>
            <p className="truncate text-xs text-muted-foreground">{DEMO_BRANCH.name}</p>
          </div>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
