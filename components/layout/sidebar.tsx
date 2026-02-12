"use client"

import { ChevronsLeft, ChevronDown, SquarePen, CircleUser, Home } from "lucide-react"
import { SIDEBAR_WIDTH } from "@/lib/tokens"
import { PageNode } from "@/lib/types"
import { PageTree } from "./page-tree"
import { cn } from "@/lib/utils"

interface SidebarProps {
  pages: PageNode[]
  selectedPageId: string | null
  expandedIds: string[]
  renamingId: string | null
  onSelectPage: (pageId: string) => void
  onToggleExpand: (pageId: string) => void
  onCreatePage: (parentId?: string) => void
  onRename: (pageId: string) => void
  onRenameSave: (pageId: string, newTitle: string) => void
  onRenameCancel: () => void
  onDuplicate: (pageId: string) => void
  onDelete: (pageId: string) => void
  onMovePage: (pageId: string, targetSectionId: string, targetParentId: string | null, targetIndex: number) => void
}

export function Sidebar({
  pages,
  selectedPageId,
  expandedIds,
  renamingId,
  onSelectPage,
  onToggleExpand,
  onCreatePage,
  onRename,
  onRenameSave,
  onRenameCancel,
  onDuplicate,
  onDelete,
  onMovePage,
}: SidebarProps) {
  // Filter out Favorites and Shared sections, keep only Private
  const sections = pages.filter((section) => section.id !== "favorites" && section.id !== "shared")

  return (
    <div
      className="h-full bg-neutral-100/80 border-r border-sidebar-divider flex flex-col"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      {/* Workspace Header - Notion style */}
      <div style={{ display: "block", flexShrink: 0, flexGrow: 0 }}>
        <div>
          <div style={{ flex: "1 1 0%", minWidth: "0px" }}>
            <div style={{ display: "contents" }}>
              <div
                role="button"
                tabIndex={0}
                className="notion-sidebar-switcher"
                aria-expanded="false"
                aria-haspopup="dialog"
                style={{
                  userSelect: "none",
                  transition: "background 20ms ease-in",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "0px",
                  height: "32px",
                  width: "auto",
                  marginInline: "8px",
                  marginTop: "6px",
                  borderRadius: "6px",
                  marginBottom: "6px",
                  padding: "0px",
                }}
              >
                <div
                  dir="ltr"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    fontSize: "14px",
                    minHeight: "27px",
                    height: "30px",
                    paddingTop: "4px",
                    paddingBottom: "4px",
                    paddingInline: "8px",
                    overflow: "hidden",
                    marginInlineStart: "0px",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      flexShrink: 0,
                      flexGrow: 0,
                      borderRadius: "4px",
                      width: "22px",
                      height: "22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginInlineEnd: "8px",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      <div
                        className="notion-record-icon notranslate"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "22px",
                          width: "22px",
                          borderRadius: "0.25em",
                          flexShrink: 0,
                          marginTop: "1px",
                          fontWeight: 500,
                        }}
                      >
                        <CircleUser className="w-[19.536px] h-[19.536px] text-neutral-700" />
                      </div>
                    </div>
                  </div>
                  {/* Text */}
                  <div
                    style={{
                      flex: "1 1 auto",
                      whiteSpace: "nowrap",
                      minWidth: "0px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <div className="notranslate" style={{ display: "flex", alignItems: "center", justifyContent: "start" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          marginInlineEnd: "6px",
                          marginTop: "0px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            className="text-neutral-900 font-medium"
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              lineHeight: "20px",
                              unicodeBidi: "plaintext",
                            }}
                          >
                            user
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right side icons */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                    marginInline: "auto 0px",
                  }}
                >
                  <div
                    style={{
                      alignItems: "center",
                      display: "inline-flex",
                      marginInlineEnd: "2px",
                      gap: "2px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {/* Collapse chevron */}
                      <div style={{ display: "contents" }}>
                        <button
                          role="button"
                          tabIndex={0}
                          aria-label="Collapse sidebar"
                          style={{
                            userSelect: "none",
                            transition: "background 20ms ease-in",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0px",
                            height: "28px",
                            paddingInline: "0px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                            fontSize: "14px",
                            fontWeight: 500,
                            lineHeight: "1.2",
                            width: "28px",
                            flexShrink: 0,
                          }}
                          className="hover:bg-neutral-200/60 rounded-md text-neutral-700"
                        >
                          <ChevronsLeft size={18} strokeWidth={1.75} className="text-neutral-600" />
                        </button>
                      </div>
                      {/* Compose icon */}
                      <div style={{ display: "contents" }}>
                        <button
                          role="button"
                          tabIndex={0}
                          aria-label="New page"
                          onClick={() => onCreatePage()}
                          style={{
                            userSelect: "none",
                            transition: "background 20ms ease-in",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0px",
                            height: "28px",
                            paddingInline: "0px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                            fontSize: "14px",
                            fontWeight: 500,
                            lineHeight: "1.2",
                            width: "28px",
                            flexShrink: 0,
                          }}
                          className="hover:bg-neutral-200/60 rounded-md text-neutral-700"
                        >
                          <SquarePen size={18} strokeWidth={1.75} className="text-neutral-600" />
                        </button>
                      </div>
                      {/* Dropdown chevron */}
                      <div style={{ display: "contents" }}>
                        <div style={{ display: "contents" }}>
                          <button
                            role="button"
                            tabIndex={0}
                            aria-expanded="false"
                            aria-label="More options"
                            aria-haspopup="dialog"
                            style={{
                              userSelect: "none",
                              transition: "background 20ms ease-in",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0px",
                              height: "28px",
                              paddingInline: "0px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap",
                              fontSize: "14px",
                              fontWeight: 500,
                              lineHeight: "1.2",
                              width: "16px",
                              flexShrink: 0,
                            }}
                            className="hover:bg-neutral-200/60 rounded-md text-neutral-700"
                          >
                            <ChevronDown size={14} strokeWidth={1.75} className="text-neutral-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-neutral-200/70" />

      {/* Top Navigation Items - Home */}
      <div className="px-1 py-[4px] border-b border-neutral-200/70">
        {/* Home Row */}
        {(() => {
          const isActive = selectedPageId === "home"
          return (
            <button
              onClick={() => onSelectPage("home")}
              style={{
                display: "flex",
                color: "#5F5E5B",
                textDecoration: "none",
                userSelect: "none",
                transition: "background 150ms",
                cursor: "pointer",
                borderRadius: "6px",
                marginInline: "0px",
                fontWeight: 500,
                fontSize: "14px",
                width: "100%",
                alignItems: "center",
                minHeight: "27px",
                height: "30px",
                paddingTop: "4px",
                paddingBottom: "4px",
                paddingInline: "8px",
                outline: "none",
              }}
              className={cn(
                "hover:bg-neutral-200/60",
                "focus:ring-1 focus:ring-blue-500 focus:ring-inset",
                isActive ? "bg-neutral-200/70" : "bg-transparent"
              )}
            >
          <span
            className={cn(
              "w-[22px] h-[22px]",
              "rounded-[4px]",
              "flex items-center justify-center",
              "mr-1",
              "text-neutral-500",
              "flex-shrink-0"
            )}
          >
            <svg
              aria-hidden="true"
              role="graphics-symbol"
              viewBox="0 0 20 20"
              className="home"
              style={{
                width: "22px",
                height: "22px",
                display: "block",
                fill: "currentColor",
                flexShrink: 0,
                color: "currentColor",
              }}
            >
              <path d="M9.08 3.341a1.625 1.625 0 0 1 1.84 0l5.875 4.035c.441.304.705.805.705 1.34v6.034a2.125 2.125 0 0 1-2.125 2.125h-2.716a1.625 1.625 0 0 1-1.625-1.625v-4.065H8.967v4.065c0 .898-.728 1.625-1.625 1.625H4.625A2.125 2.125 0 0 1 2.5 14.75V8.716c0-.535.264-1.036.705-1.34zm1.132 1.03a.375.375 0 0 0-.424 0L3.913 8.407a.38.38 0 0 0-.163.309v6.034c0 .483.392.875.875.875h2.716a.375.375 0 0 0 .375-.375v-4.19c0-.621.503-1.125 1.125-1.125h2.319c.62 0 1.124.504 1.124 1.125v4.19c0 .207.168.375.375.375h2.716a.875.875 0 0 0 .875-.875V8.716c0-.124-.06-.24-.163-.31z" />
            </svg>
          </span>
              <span 
                style={{
                  whiteSpace: "nowrap",
                  minWidth: "0px",
                  overflow: "hidden",
                  textOverflow: "clip",
                }}
              >
                Home
              </span>
            </button>
          )
        })()}
      </div>

      {/* Scrollable Navigation Region */}
      <div className="flex-1 overflow-y-auto py-2 sidebar-scroll">
        <div className="px-1">
          {sections.map((section) => (
            <div key={section.id} className="mb-1">
              {/* Section Header */}
              <div className="px-3 py-1">
                <div className="text-[11px] font-medium text-neutral-700 uppercase tracking-[0.03em] leading-tight">
                  {section.title}
                </div>
              </div>
              {/* Section Pages Tree */}
              {section.children && section.children.length > 0 && (
                <PageTree
                  pages={section.children}
                  depth={0}
                  sectionId={section.id}
                  expandedIds={expandedIds}
                  selectedId={selectedPageId}
                  renamingId={renamingId}
                  onSelect={onSelectPage}
                  onToggleExpand={onToggleExpand}
                  onAddPage={(parentId) => onCreatePage(parentId)}
                  onRename={onRename}
                  onRenameSave={onRenameSave}
                  onRenameCancel={onRenameCancel}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                  onMovePage={onMovePage}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Bottom help button - Notion style */}
      <div className="mt-auto border-t border-neutral-200/70" style={{ padding: "10px 12px", boxSizing: "border-box" }}>
        <div className="flex items-center justify-between">
          <div className="flex flex-row">
            <div style={{ display: "contents" }}>
              <div className="relative flex items-center">
                <div style={{ display: "contents" }}>
                  <button
                    className="inline-flex items-center justify-center gap-0 h-7 w-7 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors duration-75 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer relative flex-shrink-0"
                    style={{
                      userSelect: "none",
                      transition: "background 20ms ease-in",
                      paddingInline: "0px",
                      borderRadius: "6px",
                      whiteSpace: "nowrap",
                      fontSize: "14px",
                      fontWeight: 500,
                      lineHeight: "1.2",
                      width: "28px",
                      height: "28px",
                    }}
                    aria-label="What's new, help, contact, more…"
                    aria-haspopup="dialog"
                    role="button"
                    tabIndex={0}
                  >
                    <svg
                      aria-hidden="true"
                      role="graphics-symbol"
                      viewBox="0 0 20 20"
                      className="questionMarkCircle flex-shrink-0 block"
                      style={{ width: "20px", height: "20px", fill: "currentColor" }}
                    >
                      <path d="M9.978 7.154c-.804 0-1.333.456-1.438.874a.625.625 0 0 1-1.213-.303c.28-1.121 1.44-1.82 2.65-1.82 1.365 0 2.714.905 2.714 2.298 0 .812-.49 1.477-1.13 1.872l-.755.516a.84.84 0 0 0-.381.677.625.625 0 1 1-1.25 0c0-.688.36-1.318.921-1.706l.003-.002.784-.535.014-.008c.374-.228.544-.537.544-.814 0-.459-.517-1.049-1.463-1.049m.662 6.336a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0" />
                      <path d="M2.375 10a7.625 7.625 0 1 1 15.25 0 7.625 7.625 0 0 1-15.25 0M10 3.625a6.375 6.375 0 1 0 0 12.75 6.375 6.375 0 0 0 0-12.75" />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        role="img"
                        aria-label="New"
                        style={{
                          height: "8px",
                          width: "8px",
                          background: "rgb(59, 130, 246)",
                          flexShrink: 0,
                          borderRadius: "100%",
                          pointerEvents: "none",
                          border: "1px solid rgb(245, 245, 245)",
                        }}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
