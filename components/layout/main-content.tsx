"use client"

import { Doc } from "@/lib/types"
import { DocumentEditor } from "@/components/editor/DocumentEditor"

interface MainContentProps {
  selectedPage: { id: string; doc: Doc } | null
  onUpdatePageDoc: (pageId: string, doc: Doc) => void
  onUpdatePageTitle: (pageId: string, newTitle: string) => void
  shouldFocusTitle?: boolean
  onTitleFocusComplete?: () => void
}

export function MainContent({
  selectedPage,
  onUpdatePageDoc,
  onUpdatePageTitle,
  shouldFocusTitle = false,
  onTitleFocusComplete,
}: MainContentProps) {
  const handleDocumentChange = (doc: Doc) => {
    if (selectedPage) {
      onUpdatePageDoc(selectedPage.id, doc)
    }
  }

  const handleTitleChange = (newTitle: string) => {
    if (selectedPage) {
      onUpdatePageTitle(selectedPage.id, newTitle)
    }
  }

  if (!selectedPage || !selectedPage.doc) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[900px] mx-auto px-[96px] py-[48px]">
            <div className="text-[14px] text-gray-400 text-center">
              Select a page to view its content
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { doc } = selectedPage

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto">
        {selectedPage ? (
          <DocumentEditor
            doc={selectedPage.doc}
            onChange={handleDocumentChange}
            onTitleChange={handleTitleChange}
            autoFocusTarget={shouldFocusTitle ? "title" : undefined}
            onTitleFocusComplete={onTitleFocusComplete}
          />
        ) : (
          <div className="max-w-[900px] mx-auto px-[96px] py-[48px]">
            <div className="text-[14px] text-gray-400 text-center">
              Select a page to view its content
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
