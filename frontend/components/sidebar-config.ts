import { type Icon } from "@tabler/icons-react";
import React from "react";

export type NavItem = {
  id?: string;
  title: string;
  url: string;
  icon?: Icon | React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
};

export const SIDEBAR_MODES = {
  user: {
    badge: undefined,
    navigationMode: "route" as const,
  },
  admin: {
    badge: "Admin Panel",
    navigationMode: "state" as const,
  },
} as const;

export type SidebarMode = keyof typeof SIDEBAR_MODES;
