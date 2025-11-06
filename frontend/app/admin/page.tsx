"use client";

import { useState } from "react";
import {
  IconGlobe,
  IconPackage,
  IconUsers,
  IconChartBar,
  IconHistory,
} from "@tabler/icons-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { type NavItem } from "@/components/sidebar-config";
import { CountriesManager } from "./components/manager/CountriesManager";
import { ProductsManager } from "./components/business-logic/ProductsManager";
import { UsersManager } from "./components/manager/UsersManager";
import { TradeRulesManager } from "./components/business-logic/TradeRulesManager";
import { TransactionsManager } from "./components/manager/TransactionsManager";

type TabType =
  | "countries"
  | "products"
  | "users"
  | "trade-rules"
  | "transactions";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("countries");

  const navItems: NavItem[] = [
    {
      id: "countries",
      title: "Countries",
      url: "#countries",
      icon: IconGlobe,
      onClick: () => setActiveTab("countries"),
      isActive: activeTab === "countries",
    },
    {
      id: "products",
      title: "Products",
      url: "#products",
      icon: IconPackage,
      onClick: () => setActiveTab("products"),
      isActive: activeTab === "products",
    },
    {
      id: "users",
      title: "Users",
      url: "#users",
      icon: IconUsers,
      onClick: () => setActiveTab("users"),
      isActive: activeTab === "users",
    },
    {
      id: "trade-rules",
      title: "Trade Rules",
      url: "#trade-rules",
      icon: IconChartBar,
      onClick: () => setActiveTab("trade-rules"),
      isActive: activeTab === "trade-rules",
    },
    {
      id: "transactions",
      title: "Transactions",
      url: "#transactions",
      icon: IconHistory,
      onClick: () => setActiveTab("transactions"),
      isActive: activeTab === "transactions",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "countries":
        return <CountriesManager />;
      case "products":
        return <ProductsManager />;
      case "users":
        return <UsersManager />;
      case "trade-rules":
        return <TradeRulesManager />;
      case "transactions":
        return <TransactionsManager />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        isAdmin={true}
        variant="inset"
        adminItems={navItems}
        onAdminItemClick={() => {
          // Sidebar will handle the click via onClick handlers
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const currentItem = navItems.find((item) => item.id === activeTab);
                  if (!currentItem?.icon) return null;

                  const IconComponent = currentItem.icon as React.ComponentType<{ className?: string }>;
                  return <IconComponent className="size-8" />;
                })()}
                <h1 className="text-3xl font-bold text-gray-900">
                  {navItems.find((item) => item.id === activeTab)?.title}
                </h1>
              </div>
              <p className="text-sm text-gray-600">
                {activeTab === "countries" && "Manage countries and their tariff data"}
                {activeTab === "products" && "Manage products and categorization"}
                {activeTab === "users" && "Manage users and their permissions"}
                {activeTab === "trade-rules" && "Manage trade rules, preferences, and suspensions"}
                {activeTab === "transactions" && "View and manage transaction history"}
              </p>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              {renderContent()}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
