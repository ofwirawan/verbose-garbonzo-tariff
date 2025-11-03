"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle,
  History,
  Menu,
  X,
} from "lucide-react";
import { CountriesManager } from "./components/manager/CountriesManager";
import { ProductsManager } from "./components/business-logic/ProductsManager";
import { UsersManager } from "./components/manager/UsersManager";
import { MeasuresManager } from "./components/business-logic/MeasuresManager";
import { PreferencesManager } from "./components/business-logic/PreferencesManager";
import { SuspensionsManager } from "./components/business-logic/SuspensionsManager";
import { TransactionsManager } from "./components/manager/TransactionsManager";

type TabType =
  | "countries"
  | "products"
  | "users"
  | "measures"
  | "preferences"
  | "suspensions"
  | "transactions";

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("countries");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems: NavItem[] = [
    {
      id: "countries",
      label: "Countries",
      icon: <Globe className="w-5 h-5" />,
      description: "Manage countries and their codes",
    },
    {
      id: "products",
      label: "Products",
      icon: <Package className="w-5 h-5" />,
      description: "Manage product catalog and HS6 codes",
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      description: "Manage system users and roles",
    },
    {
      id: "measures",
      label: "Measures",
      icon: <BarChart3 className="w-5 h-5" />,
      description: "Manage import duty measures and rates",
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Manage trade preferences",
    },
    {
      id: "suspensions",
      label: "Suspensions",
      icon: <AlertCircle className="w-5 h-5" />,
      description: "Manage tariff suspensions",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: <History className="w-5 h-5" />,
      description: "View and manage transactions",
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
      case "measures":
        return <MeasuresManager />;
      case "preferences":
        return <PreferencesManager />;
      case "suspensions":
        return <SuspensionsManager />;
      case "transactions":
        return <TransactionsManager />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } lg:w-64 bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden lg:overflow-visible fixed lg:static h-full lg:h-screen z-40 lg:z-auto`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 hidden lg:block">
            Admin Panel
          </h1>
          <p className="text-sm text-gray-600 hidden lg:block">
            Tariff Management System
          </p>
        </div>

        <nav className="space-y-2 p-6 pt-0 overflow-y-auto h-[calc(100vh-160px)] lg:h-[calc(100vh-120px)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all text-left group ${
                activeTab === item.id
                  ? "bg-black text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{item.label}</div>
                <div
                  className={`text-xs mt-0.5 ${
                    activeTab === item.id ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="pt-20 lg:pt-0">
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                {navItems.find((item) => item.id === activeTab)?.icon}
                <h2 className="text-3xl font-bold text-gray-900">
                  {navItems.find((item) => item.id === activeTab)?.label}
                </h2>
              </div>
              <p className="text-gray-600">
                {navItems.find((item) => item.id === activeTab)?.description}
              </p>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
