"use client"

import { useState, useEffect } from "react"
import { RecentCardsRow } from "./RecentCardsRow"
import { getRecentPages, formatTimeAgo, RecentPage } from "@/lib/recently-visited"

// Get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

interface HomeViewProps {
  onCardClick: (pageId: string) => void
  onEventClick?: (eventId: string) => void
}

export function HomeView({ onCardClick, onEventClick }: HomeViewProps) {
  const [recentPages, setRecentPages] = useState<RecentPage[]>([])
  const [greeting, setGreeting] = useState("Good evening")

  // Set greeting on mount (client-side only to avoid hydration mismatch)
  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  // Load recent pages on mount and when component becomes visible
  useEffect(() => {
    const loadRecent = () => {
      setRecentPages(getRecentPages())
    }

    loadRecent()

    // Also refresh when window gains focus (in case user navigated in another tab)
    window.addEventListener("focus", loadRecent)
    return () => window.removeEventListener("focus", loadRecent)
  }, [])

  // Transform RecentPage to the format expected by RecentCardsRow
  const displayPages = recentPages.map((page) => ({
    id: page.id,
    title: page.title,
    icon: page.icon,
    lastEdited: formatTimeAgo(page.lastVisited),
    coverColor: page.coverColor,
    coverImage: page.coverImage,
  }))

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-[96px] py-[64px]">
          {/* Greeting */}
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#37352f",
              marginBottom: "32px",
              textAlign: "center",
            }}
          >
            {greeting}
          </h1>

          {/* Recently Visited Section */}
          {displayPages.length > 0 ? (
            <RecentCardsRow pages={displayPages} onCardClick={onCardClick} />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px",
                color: "var(--c-texTer, #9b9a97)",
                fontSize: "14px",
              }}
            >
              <div style={{ marginBottom: "8px", fontSize: "32px" }}>📄</div>
              <div>No recently visited pages</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                Pages you visit will appear here
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
