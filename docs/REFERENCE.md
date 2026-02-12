# Notion Home Screen Reference Spec

## Layout Measurements

### Sidebar
- **Width**: 256px (fixed)
- **Background**: Light gray (#F7F6F3 or similar)
- **Border**: Right border, subtle divider color

### Main Content
- **Max Width**: 900px (centered)
- **Horizontal Padding**: 96px
- **Vertical Padding**: 48px top, adjusts for content

## Typography

### Headers
- **Page Title (Good evening)**: 40px, semibold, gray-900
- **Section Headers (Recently visited, Upcoming events)**: 16px, semibold, gray-900
- **Card Titles**: 14px, medium weight, gray-900
- **Card Metadata**: 12px, regular, gray-500

### Body Text
- **Sidebar Items**: 14px, regular, gray-700
- **Sidebar Section Headers**: 11px, medium, uppercase, gray-500, letter-spacing 0.03em

## Components List

### 1. SidebarNav
- **Location**: Left side, fixed width
- **Sections**:
  - Top: Workspace header + Search + Home + Meetings + Notion AI + Inbox
  - Middle: Shared, Private sections (with expand/collapse)
  - Bottom: Notion apps section
- **Props**: `selectedId`, `onSelect`, `expandedIds`, `onToggleExpand`

### 2. HomeHeader
- **Location**: Top of main content
- **Content**: "Good evening" (or time-based greeting)
- **Props**: None (static or time-based)

### 3. RecentCards
- **Location**: Below header in main content
- **Content**: Horizontal scrollable row of page cards
- **Props**: `pages[]`, `onCardClick`
- **Card Structure**: Icon + Title + Last edited time

### 4. UpcomingEvents
- **Location**: Below RecentCards
- **Content**: Vertical list of calendar events
- **Props**: `events[]`, `onEventClick`
- **Event Structure**: Time + Title + Location/Details

### 5. PageView
- **Location**: Main content area (conditional)
- **Content**: Full page editor view (existing DocumentEditor)
- **Props**: `page`, `onDocumentChange`

## States Checklist

### Sidebar States
- **Default**: Gray text, no background
- **Hover**: Light gray background (#F1F1EF)
- **Active/Selected**: Darker gray background (#E9E9E6), left border accent
- **Focused**: Blue ring outline (keyboard navigation)

### Card States
- **Default**: White background, subtle border/shadow
- **Hover**: Slight elevation, border highlight
- **Active/Clicked**: Navigate to page view
- **Focused**: Blue ring outline

### Event States
- **Default**: List item styling
- **Hover**: Light background highlight
- **Active/Clicked**: Navigate to event details (stub)
- **Focused**: Blue ring outline

## Interaction Model

1. **Sidebar Selection**: Clicking sidebar item selects it, shows in main content
2. **Card Navigation**: Clicking card opens that page in main content
3. **Back Navigation**: Can return to home view
4. **Keyboard Navigation**: Tab through interactive elements, Enter to activate

## Data Structure (Mocked)

```typescript
interface RecentPage {
  id: string
  title: string
  icon?: string
  lastEdited: string // "2 hours ago", "Yesterday", etc.
}

interface UpcomingEvent {
  id: string
  time: string // "9:00 AM", "Tomorrow 2:00 PM"
  title: string
  location?: string
}
```

## Color Palette

- **Background**: White (#FFFFFF)
- **Sidebar Background**: Light gray (#F7F6F3)
- **Text Primary**: Dark gray (#37352F)
- **Text Secondary**: Medium gray (#787774)
- **Text Muted**: Light gray (#9B9A97)
- **Hover Background**: Very light gray (#F1F1EF)
- **Active Background**: Light gray (#E9E9E6)
- **Border**: Subtle gray (#E4E4E1)
