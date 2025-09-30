"use client"

import { useEffect, useState } from "react"
import { HistoryTable, HistoryItem } from "./HistoryTable"

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Fetch history from backend
  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/history")
      if (!res.ok) throw new Error("Failed to fetch history")
      const data: HistoryItem[] = await res.json()
      setHistory(data)
    } catch (err) {
      console.error("Fetch history error:", err)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Delete multiple history records
  const handleDelete = async (ids: number[]) => {
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`http://localhost:8080/api/history/${id}`, {
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
