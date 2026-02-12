"use client"

import { getDisplayTitle } from "@/lib/utils"

interface RecentPage {
  id: string
  title: string
  icon?: string
  lastEdited: string
}

interface RecentCardsProps {
  pages: RecentPage[]
  onCardClick: (pageId: string) => void
}

export function RecentCards({ pages, onCardClick }: RecentCardsProps) {
  return (
    <div className="mb-12">
      <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
        Recently visited
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onCardClick(page.id)}
            className="flex-shrink-0 w-[240px] bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-150 text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              {page.icon ? (
                <span className="text-[20px]">{page.icon}</span>
              ) : (
                <div className="w-5 h-5 bg-gray-200 rounded" />
              )}
              <span className="text-[14px] font-medium text-gray-900 truncate">
                {getDisplayTitle(page.title)}
              </span>
            </div>
            <div className="text-[12px] text-gray-500">
              {page.lastEdited}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
