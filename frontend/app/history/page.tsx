"use client"

import { useEffect, useState } from "react"
import { HistoryTable, HistoryItem, BackendTransaction, transformTransactionToHistoryItem } from "./HistoryTable"
import { authenticatedFetch, getToken } from "@/lib/auth"

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

  // Delete multiple history records using authenticated requests
  const handleDelete = async (ids: number[]) => {
    try {
      await Promise.all(
        ids.map((id) =>
          authenticatedFetch(`/api/history/${id}`, {
            method: "DELETE",
          })
        )
      )

      // Remove deleted records from state
      setHistory((prev) => prev.filter((item) => !ids.includes(item.id)))
    } catch (err) {
      console.error("Delete history error:", err)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trade History</h1>
      {history.length === 0 ? (
        <p>No history yet. Make a calculation first!</p>
      ) : (
        <HistoryTable data={history} onDelete={handleDelete} />
      )}
    </div>
  )
}
