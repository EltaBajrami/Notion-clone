"use client"

interface UpcomingEvent {
  id: string
  time: string
  title: string
  location?: string
}

interface UpcomingEventsPanelProps {
  events: UpcomingEvent[]
  onEventClick: (eventId: string) => void
}

export function UpcomingEventsPanel({
  events,
  onEventClick,
}: UpcomingEventsPanelProps) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold text-gray-900 mb-4">
        Upcoming events
      </h2>

      {/* Two-column panel */}
      <div className="bg-white border border-gray-200 rounded-[8px] p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Marketing Content */}
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <h3 className="text-[20px] font-semibold text-gray-900 mb-2">
                Connect your calendar
              </h3>
              <p className="text-[14px] text-gray-600 leading-relaxed mb-4">
                See your meetings and events right here in Notion. Connect your
                Google Calendar, Outlook, or other calendar to get started.
              </p>
              <button className="text-[14px] font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Connect calendar →
              </button>
            </div>
          </div>

          {/* Right Column - Event List */}
          <div className="border-l border-gray-200 pl-8">
            {events.length === 0 ? (
              <div className="text-[14px] text-gray-400 italic">
                No upcoming events
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event.id)}
                    className="w-full flex items-start gap-3 p-2 rounded-[4px] hover:bg-gray-50 transition-colors duration-150 text-left group"
                  >
                    <div className="text-[12px] text-gray-500 font-medium min-w-[90px] pt-0.5">
                      {event.time}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium text-gray-700 group-hover:text-gray-900">
                        {event.title}
                      </div>
                      {event.location && (
                        <div className="text-[12px] text-gray-400 mt-1">
                          {event.location}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
