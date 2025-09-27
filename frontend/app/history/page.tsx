"use client";

import { useEffect, useState } from "react";

interface HistoryItem {
  id: number;
  date: string;
  product: string;
  route: string;
  tradeValue: number;
  tariffRate: number;
  tariffCost: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/history")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched history:", data); // debug log
        setHistory(data);
      })
      .catch((err) => console.error("Fetch history error:", err));
  }, []);


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trade History</h1>
      {history.length === 0 ? (
        <p>No history yet. Make a calculation first!</p>
      ) : (
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Product</th>
              <th className="border px-4 py-2">Route</th>
              <th className="border px-4 py-2">Trade Value</th>
              <th className="border px-4 py-2">Tariff Rate (%)</th>
              <th className="border px-4 py-2">Tariff Cost</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td className="border px-4 py-2">{item.date}</td>
                <td className="border px-4 py-2">{item.product}</td>
                <td className="border px-4 py-2">{item.route}</td>
                <td className="border px-4 py-2">
                  ${item.tradeValue.toLocaleString()}
                </td>
                <td className="border px-4 py-2">{item.tariffRate}%</td>
                <td className="border px-4 py-2">
                  ${item.tariffCost.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
