# Assessment 1 Checklist: Notion-like Document Editor + Sidebar Page Tree

## Scope Definition

**Component Set**: Notion's Document Editor + Sidebar Page Tree

This assessment focuses on replicating:
1. **Left Sidebar**: Page navigation tree with hierarchical structure
2. **Document Editor**: Rich text editing with formatting, block types, and slash commands

**Out of Scope**:
- Top bar (comments, share, undo/redo buttons)
- Database/table views
- Real-time collaboration
- Dark mode
- Advanced block types beyond paragraph, heading1, todo

---

## Visual Fidelity Checklist

### Colors
- [ ] Sidebar background: `#F7F6F3` (hsl(45, 20%, 97%))
- [ ] Sidebar hover state: `#F1F1EF` (hsl(0, 0%, 94.5%))
- [ ] Sidebar active/selected: `#E9E9E6` (hsl(0, 0%, 91.4%))
- [ ] Divider/border: `#E4E4E1` (hsl(0, 0%, 89.2%))
- [ ] Text primary: `#37352F` (hsl(0, 0%, 21.6%))
- [ ] Text secondary: `#787774` (hsl(0, 0%, 46.7%))
- [ ] Text muted: `#9B9A97`
- [ ] Selection toolbar: White background, `#E4E4E1` border, subtle shadow
- [ ] Slash menu: White background, `#E4E4E1` border, subtle shadow

### Typography
- [ ] Body text: 16px, normal weight, `#37352F` or `#787774`
- [ ] Heading 1: 24px, semibold, `#37352F`
- [ ] UI text (buttons, menus): 14px
- [ ] Line height: 28px for paragraphs (tight, Notion-like)
- [ ] Line height: 1.3 for headings
- [ ] Font family: System font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", etc.)

### Spacing
- [ ] Block vertical padding: `py-[2px]` (minimal, tight spacing)
- [ ] No spacing between blocks (removed `space-y-*`)
- [ ] Sidebar item padding: Consistent vertical spacing
- [ ] Gutter controls: 40px width (`w-10`), proper alignment
- [ ] Selection toolbar: Proper padding (`px-2 py-1`)
- [ ] Slash menu: Item padding (`px-3 py-2`)

### Hover States
- [ ] Sidebar page items: Light gray background on hover
- [ ] Sidebar buttons (Search, Plus): Hover background change
- [ ] Block gutter controls: Visible on block hover, smooth opacity transition
- [ ] Insert button (+): Hover background `hover:bg-gray-200`
- [ ] Drag handle (⋮⋮): Hover background `hover:bg-gray-200`
- [ ] Selection toolbar buttons: Hover background `hover:bg-gray-100`
- [ ] Slash menu items: Hover background `hover:bg-gray-50`

### Active/Selected States
- [ ] Selected sidebar page: Active background color, visible indicator
- [ ] Active selection toolbar button: `bg-gray-200` when mark is active
- [ ] Selected slash menu item: `bg-blue-50` with blue icon background

### Focus States
- [ ] All interactive elements: Blue focus ring (`focus:ring-1 focus:ring-blue-500`)
- [ ] Textarea focus: No default browser outline, custom focus styling
- [ ] Button focus: Visible focus ring for keyboard navigation

### Visual Details
- [ ] Selection toolbar: Rounded corners (`rounded-lg`), subtle shadow
- [ ] Slash menu: Rounded corners (`rounded-lg`), subtle shadow
- [ ] Icons: Consistent size (4x4 for small icons, proper alignment)
- [ ] Borders: Subtle, light gray (`border-gray-200` or `border-gray-300`)
- [ ] Shadows: Subtle, not too dark (`shadow-md` or `shadow-lg`)

---

## Interaction Checklist

### Sidebar Page Tree
- [ ] Page selection: Clicking page selects it and shows in editor
- [ ] Expand/collapse: Clicking chevron expands/collapses children
- [ ] Page creation: "+ New page" button creates new page
- [ ] Page creation: "+" button on page row creates child page
- [ ] Page renaming: Double-click or context menu to rename
- [ ] Page deletion: Context menu delete option works
- [ ] Page duplication: Context menu duplicate option works
- [ ] Search functionality: Search icon button (can be stubbed)
- [ ] Persistence: Page structure persists in localStorage
- [ ] Auto-selection: First page auto-selected on load

### Document Editor - Basic Editing
- [ ] Title editing: Click title to edit, Enter to confirm
- [ ] Block creation: Enter creates new paragraph block
- [ ] Block deletion: Backspace on empty block deletes it
- [ ] Block merging: Backspace at start merges with previous
- [ ] Block splitting: Enter in middle of block splits it
- [ ] Focus management: New blocks auto-focus after creation
- [ ] Empty state: Shows helpful message when no blocks exist

### Document Editor - Rich Text Formatting
- [ ] Text selection: Selecting text shows selection toolbar
- [ ] Toolbar positioning: Appears above selection, centered
- [ ] Bold toggle: Clicking B toggles bold on selected text
- [ ] Italic toggle: Clicking I toggles italic on selected text
- [ ] Underline toggle: Clicking U toggles underline on selected text
- [ ] Selection preservation: Selection remains after formatting
- [ ] Real-time display: Formatting visible immediately (mirror overlay)
- [ ] Format persistence: Formatting persists across page switches
- [ ] Format persistence: Formatting persists after page reload

### Document Editor - Slash Command Menu
- [ ] Menu trigger: Typing "/" opens menu
- [ ] Menu trigger: Only "/" triggers (not "\")
- [ ] Filter input: Text after "/" filters commands
- [ ] Keyboard navigation: ArrowUp/ArrowDown navigates menu
- [ ] Keyboard selection: Enter selects highlighted item
- [ ] Keyboard close: Escape closes menu
- [ ] Mouse selection: Clicking item selects it
- [ ] Command execution: Selecting command converts block type
- [ ] Text cleanup: "/query" text removed after selection
- [ ] Menu positioning: Appears below block, left-aligned

### Document Editor - Block Types
- [ ] Paragraph: Default block type, normal text
- [ ] Heading 1: Larger font (24px), semibold
- [ ] Todo: Shows checkbox, supports checked state
- [ ] Todo toggle: Clicking checkbox toggles checked state
- [ ] Todo display: Checked items show strikethrough
- [ ] Type conversion: Slash menu converts block types
- [ ] Type persistence: Block types persist in localStorage

### Document Editor - Block Controls
- [ ] Gutter visibility: Controls appear on block hover
- [ ] Insert block: "+" button inserts new block below
- [ ] Insert focus: New block auto-focuses after insertion
- [ ] Drag handle: "⋮⋮" icon initiates drag
- [ ] Drag feedback: Visual feedback during drag (opacity change)
- [ ] Drop target: Visual feedback on drop target (background highlight)
- [ ] Block reordering: Drag and drop reorders blocks
- [ ] Reorder persistence: Reordered blocks persist in localStorage

### Persistence
- [ ] Page structure: Sidebar page tree persists
- [ ] Page selection: Selected page persists
- [ ] Page expansion: Expanded/collapsed state persists
- [ ] Document content: All block text persists
- [ ] Document formatting: All marks (bold/italic/underline) persist
- [ ] Block types: All block types persist
- [ ] Todo states: Checked/unchecked states persist
- [ ] Title: Page title persists
- [ ] Data recovery: Corrupted localStorage data handled gracefully

### Keyboard Navigation
- [ ] Tab navigation: Tab moves through interactive elements
- [ ] Enter activation: Enter activates buttons and menu items
- [ ] Escape closing: Escape closes menus and dialogs
- [ ] Arrow navigation: Arrow keys navigate slash menu
- [ ] Focus visibility: All focused elements show focus ring

### Tooltips
- [ ] Sidebar Search: Tooltip shows "Search"
- [ ] Sidebar Plus: Tooltip shows "New page"
- [ ] Insert block: Tooltip shows "Insert block below"
- [ ] Drag handle: Tooltip shows "Drag to reorder"
- [ ] Bold button: Tooltip shows "Bold"
- [ ] Italic button: Tooltip shows "Italic"
- [ ] Underline button: Tooltip shows "Underline"

---

## Done Criteria

### Must Work Perfectly

1. **Visual Fidelity**
   - Colors match Notion reference images exactly (within 1-2% tolerance)
   - Typography matches (font sizes, weights, line-heights)
   - Spacing is tight and consistent (no large gaps between blocks)
   - Hover states are smooth and visible
   - Focus states are clearly visible for keyboard navigation

2. **Core Interactions**
   - Text selection and formatting (B/I/U) works flawlessly
   - Formatting appears immediately (no delay, no Enter required)
   - Selection is preserved after formatting
   - Slash menu opens/closes correctly, filters properly
   - Block creation, deletion, splitting, merging all work
   - Block reordering via drag & drop works smoothly

3. **Persistence**
   - All content persists across page switches
   - All formatting persists across page switches
   - All state persists after page reload
   - No data loss on refresh
   - Graceful handling of corrupted localStorage

4. **Edge Cases**
   - Empty document shows helpful empty state
   - Empty blocks show placeholder text
   - Very long text wraps correctly
   - Rapid clicking doesn't break state
   - Keyboard navigation works throughout

5. **Polish**
   - All icon buttons have tooltips
   - Smooth transitions on hover/focus
   - No visual glitches or flickering
   - Consistent spacing and alignment
   - Professional, production-ready appearance

### Success Metrics

- **Visual Fidelity**: Pixel-perfect match to Notion reference (score: 2/2)
- **Functional Accuracy**: All interactions smooth and accurate (score: 2/2)
- **Code Structure**: Clean, modular, production-ready (score: 2/2)
- **Commitment to Detail**: Every button, state, and element is perfect (score: 2/2)
- **Workflow Efficiency**: Clear use of AI tools and automation (score: 2/2)

**Target Score**: 8-10/10 (passing threshold: 7/10)

---

## Testing Checklist

### Manual Testing
- [ ] Create new page, add content, switch pages, return - content persists
- [ ] Format text (B/I/U), switch pages, return - formatting persists
- [ ] Create todo block, check/uncheck, reload - state persists
- [ ] Reorder blocks via drag & drop, reload - order persists
- [ ] Use slash menu to convert block types - works correctly
- [ ] Test keyboard navigation (Tab, Enter, Escape, Arrows)
- [ ] Test empty states (no blocks, no pages)
- [ ] Test edge cases (very long text, rapid clicking)

### Visual Testing
- [ ] Compare colors side-by-side with Notion reference
- [ ] Verify spacing matches reference (use browser dev tools)
- [ ] Check hover states on all interactive elements
- [ ] Verify focus rings on keyboard navigation
- [ ] Check tooltip appearance and timing

### Persistence Testing
- [ ] Add content, refresh page - all content present
- [ ] Format text, refresh page - all formatting present
- [ ] Create pages, refresh page - page structure intact
- [ ] Clear localStorage, verify graceful fallback

---

## Notes

- Focus on quality over quantity - better to have fewer features that work perfectly
- Visual fidelity is critical - spend time matching colors and spacing exactly
- Test persistence thoroughly - data loss is a critical bug
- Document any known limitations or trade-offs
