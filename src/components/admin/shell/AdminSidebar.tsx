"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Settings,
} from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" aria-hidden="true" /> },
  { href: "/admin/products",  label: "Products",  icon: <Package        className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" aria-hidden="true" /> },
  { href: "/admin/orders",    label: "Orders",    icon: <ShoppingCart   className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" aria-hidden="true" /> },
  { href: "/admin/coupons",   label: "Coupons",   icon: <Tag            className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" aria-hidden="true" /> },
];

const Logo = () => (
  <a href="/admin/dashboard" className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal">
    <Image src="/icon0.svg" alt="Naysa" width={28} height={28} className="shrink-0" />
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-semibold whitespace-pre text-black dark:text-white"
    >
      Naysa Admin
    </motion.span>
  </a>
);

const LogoIcon = () => (
  <a href="/admin/dashboard" className="relative z-20 flex items-center gap-2 py-1 text-sm font-normal">
    <Image src="/icon0.svg" alt="Naysa" width={28} height={28} className="shrink-0" />
  </a>
);

export function AdminSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 h-full bg-neutral-100 dark:bg-neutral-800">
        {/* Top: logo + nav */}
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const isActive =
                href === "/admin/dashboard" ? pathname === "/admin/dashboard" : pathname.startsWith(href);
              return (
                <SidebarLink
                  key={href}
                  link={{ label, href, icon }}
                  className={cn(
                    "rounded-md px-2",
                    isActive
                      ? "bg-neutral-200 dark:bg-neutral-700"
                      : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  )}
                  aria-current={isActive ? "page" : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom: settings */}
        <div>
          <SidebarLink
            link={{
              label: "Settings",
              href: "/admin/settings",
              icon: <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" aria-hidden="true" />,
            }}
            className={cn(
              "rounded-md px-2",
              pathname === "/admin/settings"
                ? "bg-neutral-200 dark:bg-neutral-700"
                : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
