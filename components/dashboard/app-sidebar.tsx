"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChartColumnIcon,
  LayoutDashboardIcon,
  ListOrderedIcon,
  LogOutIcon,
  MegaphoneIcon,
  MonitorIcon,
  QrCodeIcon,
} from "lucide-react"

import { Logo } from "@/components/brand/logo"
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
} from "@/components/ui/sidebar"
import { logout } from "@/lib/actions"

const OPERATE = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboardIcon },
  { href: "/dashboard/loket", label: "Konsol loket", icon: MegaphoneIcon },
]
const MANAGE = [
  { href: "/dashboard/layanan", label: "Layanan & loket", icon: ListOrderedIcon },
  { href: "/dashboard/laporan", label: "Laporan", icon: ChartColumnIcon },
  { href: "/dashboard/qr", label: "Poster QR", icon: QrCodeIcon },
]

function NavGroup({ label, items }: { label: string; items: typeof OPERATE }) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={item.label}
                render={<Link href={item.href} />}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ displayHref, userName }: { displayHref: string; userName: string }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-3">
        <Logo href="/dashboard" className="text-base group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Operasional" items={OPERATE} />
        <NavGroup label="Kelola" items={MANAGE} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Layar ruang tunggu" render={<Link href={displayHref} target="_blank" />}>
              <MonitorIcon />
              <span>Layar ruang tunggu</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton type="submit" tooltip={`Keluar (${userName})`}>
                <LogOutIcon />
                <span>Keluar</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
