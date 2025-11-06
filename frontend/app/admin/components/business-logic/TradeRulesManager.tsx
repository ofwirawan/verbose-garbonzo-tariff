"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MeasuresManager } from "./MeasuresManager";
import { PreferencesManager } from "./PreferencesManager";
import { SuspensionsManager } from "./SuspensionsManager";

type TradeRulesTab = "measures" | "preferences" | "suspensions";

export function TradeRulesManager() {
  const [activeTab, setActiveTab] = useState<TradeRulesTab>("measures");

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TradeRulesTab)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="measures">Measures</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="suspensions">Suspensions</TabsTrigger>
        </TabsList>
        <TabsContent value="measures" className="mt-6">
          <MeasuresManager />
        </TabsContent>
        <TabsContent value="preferences" className="mt-6">
          <PreferencesManager />
        </TabsContent>
        <TabsContent value="suspensions" className="mt-6">
          <SuspensionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
