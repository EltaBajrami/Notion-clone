"use client"

import { getDisplayTitle } from "@/lib/utils"

interface RecentPage {
  id: string
  title: string
  icon?: string
  lastEdited: string
  coverImage?: string
  coverColor?: string
}

interface RecentCardsRowProps {
  pages: RecentPage[]
  onCardClick: (pageId: string) => void
}

export function RecentCardsRow({ pages, onCardClick }: RecentCardsRowProps) {
  return (
    <div style={{ userSelect: "none" }}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "32px",
          paddingBottom: "14px",
          marginInlineStart: "8px",
        }}
      >
        <div data-popup-origin="true" style={{ display: "contents" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--c-texSec, #787774)",
              fill: "var(--c-icoSec, #787774)",
              flexShrink: 0,
              maxWidth: "100%",
            }}
          >
            {/* Clock Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "16px",
                height: "16px",
                marginInlineEnd: "8px",
                marginTop: "1px",
              }}
            >
              <svg
                aria-hidden="true"
                role="graphics-symbol"
                viewBox="0 0 16 16"
                className="clockSmall"
                style={{
                  width: "16px",
                  height: "16px",
                  display: "block",
                  fill: "var(--c-icoSec, #787774)",
                  flexShrink: 0,
                  color: "var(--c-icoSec, #787774)",
                }}
              >
                <path d="M8 3.955a.625.625 0 0 0-.625.625v2.795H5.12a.625.625 0 1 0 0 1.25H8c.345 0 .625-.28.625-.625V4.58A.625.625 0 0 0 8 3.955" />
                <path d="M8 1.875a6.125 6.125 0 1 0 0 12.25 6.125 6.125 0 0 0 0-12.25M3.125 8a4.875 4.875 0 1 1 9.75 0 4.875 4.875 0 0 1-9.75 0" />
              </svg>
            </div>
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Recently visited
            </span>
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <div style={{ position: "relative", minHeight: "149px" }}>
        <div style={{ marginInline: "-24px 0px", marginBottom: "-32px" }}>
          <div
            className="notion-scroller horizontal hide-scrollbar"
            style={{
              zIndex: 1,
              overflow: "auto hidden",
              maskImage: "linear-gradient(to left, transparent 0%, black 96px)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "16px",
                width: "max-content",
                marginBottom: "1px",
                paddingTop: "4px",
                paddingInline: "24px 0px",
                paddingBottom: "32px",
              }}
            >
              {pages.map((page) => (
                <div key={page.id} style={{ position: "relative" }}>
                  <div
                    role="link"
                    tabIndex={0}
                    onClick={() => onCardClick(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onCardClick(page.id)
                      }
                    }}
                    style={{
                      display: "flex",
                      color: "inherit",
                      textDecoration: "none",
                      userSelect: "none",
                      transition: "background 20ms ease-in",
                      cursor: "pointer",
                      flexShrink: 0,
                      overflow: "hidden",
                      borderRadius: "16px",
                      background: "var(--cd-homCarBacBas, #ffffff)",
                      position: "relative",
                      width: "144px",
                      height: "144px",
                      justifyContent: "stretch",
                      boxShadow: "unset",
                      flexDirection: "column",
                    }}
                  >
                    {/* Cover Area */}
                    <div
                      style={{
                        position: "relative",
                        width: "144px",
                        marginBottom: "16px",
                      }}
                    >
                      {/* Cover Image/Color */}
                      <div
                        style={{
                          height: "44px",
                          position: "relative",
                          pointerEvents: "none",
                          overflow: "hidden",
                          border: "unset",
                          background: page.coverColor || "var(--ca-homCarCovPhoBas, rgba(127, 122, 26, 0.1))",
                        }}
                      >
                        {page.coverImage && (
                          <div style={{ width: "100%", height: "100%" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt=""
                              src={page.coverImage}
                              referrerPolicy="same-origin"
                              style={{
                                display: "block",
                                objectFit: "cover",
                                borderRadius: "0px",
                                width: "100%",
                                height: "44px",
                                objectPosition: "center 50%",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className="notion-record-icon notranslate"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          height: "28px",
                          width: "28px",
                          borderRadius: "0.25em",
                          flexShrink: 0,
                          position: "absolute",
                          bottom: "-14px",
                          insetInlineStart: "16px",
                        }}
                      >
                        {page.icon ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "28px",
                              width: "28px",
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                height: "28px",
                                width: "28px",
                                fontSize: "28px",
                                lineHeight: 1,
                                marginInlineStart: "0px",
                                color: "var(--c-regEmoCol, inherit)",
                              }}
                            >
                              <span
                                style={{
                                  whiteSpace: "nowrap",
                                  fontFamily:
                                    '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
                                }}
                              >
                                {page.icon}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: "28px", height: "28px" }}>
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                height: "100%",
                              }}
                            >
                              <svg
                                aria-hidden="true"
                                role="graphics-symbol"
                                viewBox="4.12 0 11.75 20"
                                className="pageEmpty"
                                style={{
                                  width: "auto",
                                  height: "100%",
                                  display: "block",
                                  fill: "var(--c-icoTer, #9b9a97)",
                                  flexShrink: 0,
                                  color: "var(--c-icoTer, #9b9a97)",
                                }}
                              >
                                <path d="M6.25 2.375A2.125 2.125 0 0 0 4.125 4.5v11c0 1.174.951 2.125 2.125 2.125h7.5a2.125 2.125 0 0 0 2.125-2.125V8.121c0-.563-.224-1.104-.622-1.502L11.63 2.997a2.13 2.13 0 0 0-1.502-.622zM5.375 4.5c0-.483.392-.875.875-.875h3.7V6.25A2.05 2.05 0 0 0 12 8.3h2.625v7.2a.875.875 0 0 1-.875.875h-7.5a.875.875 0 0 1-.875-.875zm8.691 2.7H12a.95.95 0 0 1-.95-.95V4.184z" />
                              </svg>
                              <svg
                                aria-hidden="true"
                                role="graphics-symbol"
                                viewBox="4.12 0 11.75 20"
                                className="pageEmptyFill"
                                style={{
                                  width: "auto",
                                  height: "100%",
                                  display: "block",
                                  fill: "var(--c-bacEle, #f7f6f3)",
                                  flexShrink: 0,
                                  color: "inherit",
                                  position: "absolute",
                                  top: "0px",
                                  zIndex: -1,
                                }}
                              >
                                <path d="M9.95 2.375h-3.7A2.125 2.125 0 0 0 4.125 4.5v11c0 1.174.951 2.125 2.125 2.125h7.5a2.125 2.125 0 0 0 2.125-2.125V8.3H12a2.05 2.05 0 0 1-2.05-2.05z" />
                                <path d="M15.665 7.2a2.1 2.1 0 0 0-.412-.581L11.63 2.997c-.17-.17-.367-.31-.581-.412V6.25c0 .525.425.95.95.95z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div
                      style={{
                        width: "100%",
                        minHeight: "72px",
                        paddingTop: "10px",
                        paddingBottom: "12px",
                        paddingInline: "16px",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: "10px",
                        flexGrow: 1,
                      }}
                    >
                      {/* Title */}
                      <div
                        className="notranslate"
                        style={{
                          whiteSpace: "pre-wrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: 500,
                          fontSize: "14px",
                          lineHeight: "normal",
                          width: "auto",
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                        }}
                      >
                        {getDisplayTitle(page.title)}
                      </div>

                      {/* User Avatar and Timestamp */}
                      <div data-popup-origin="true" style={{ display: "contents" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "start",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {/* User Avatar */}
                          <div>
                            <div
                              style={{
                                borderRadius: "100%",
                                width: "16px",
                                height: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                userSelect: "none",
                                opacity: 1,
                              }}
                            >
                              <div style={{ width: "100%", height: "100%" }}>
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "100%",
                                    background: "var(--c-bacPri, #ffffff)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    color: "var(--c-texSec, #787774)",
                                  }}
                                >
                                  U
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Timestamp */}
                          <div
                            style={{
                              fontSize: "12px",
                              lineHeight: "16px",
                              color: "var(--c-texTer, #9b9a97)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {page.lastEdited}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Card Shadow */}
                  <div
                    style={{
                      pointerEvents: "none",
                      position: "absolute",
                      borderRadius: "16px",
                      top: "0px",
                      insetInline: "0px",
                      bottom: "0px",
                      zIndex: 1,
                      boxShadow:
                        "rgba(0, 0, 0, 0.02) 0px 12px 32px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
