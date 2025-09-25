"use client";

import { TariffChart } from "./TariffChart";
import { ViewCalculation } from "./ViewCalculation";

export default function Home() {
  return (
    <div className="space-y-16 max-w-6xl mx-auto p-4">
      <TariffChart />
      <ViewCalculation />
    </div>
  );
}

