"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { HistoryTable } from "./components/HistoryTable"
import { HistoryItem, BackendTransaction, transformTransactionToHistoryItem } from "./types"
import { authenticatedFetch } from "@/lib/auth"

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch history from backend using authenticated request
  const fetchHistory = async () => {
    if (isLoading) {
      return
    }

    try {
      setIsLoading(true)
      const res = await authenticatedFetch("/api/history")

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to fetch history")
      }

      const backendData: BackendTransaction[] = await res.json()

      // Transform backend data to frontend format
      const transformedData = backendData.map(transformTransactionToHistoryItem)

      setHistory(transformedData)
    } catch (err) {
      console.error("Fetch history error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex-1 overflow-auto">
            <div className="flex flex-col gap-6 p-4 md:p-6">
              {history.length === 0 ? (
                <p>No history yet. Make a calculation first!</p>
              ) : (
                <HistoryTable data={history} />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
