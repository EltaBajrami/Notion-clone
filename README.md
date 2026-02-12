# Notion Core Layout - Functional Prototype

A pixel-perfect functional prototype of Notion's core layout interface, built with modern web technologies.

## Reference Component

This project replicates **Notion's Document Editor component set**, specifically:

- **Left Sidebar**: Page navigation with hierarchical structure, search functionality, and page management
- **Main Content Area**: Fully functional document editor with rich text formatting, block types, and slash commands

The implementation focuses on matching Notion's visual design, interaction patterns, and user experience with pixel-perfect fidelity, including:
- Rich text editing (bold, italic, underline) with real-time formatting
- Slash command menu (/) for block type conversion
- Selection toolbar for text formatting
- Multiple block types (paragraph, heading1, todo)
- Block reordering via drag & drop
- Left gutter controls for block insertion and reordering
- Hover states, focus states, and smooth transitions
- Tooltips for all interactive elements
- Keyboard navigation support

## Technology Stack

### Core Framework
- **Next.js 14** (App Router) - React framework for production
- **TypeScript** - Type-safe development
- **React 18** - UI library

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **tailwindcss-animate** - Animation utilities

### UI Components
- **shadcn/ui** - High-quality component library built on Radix UI
  - Dropdown Menu
  - Button
  - Tooltip
  - Separator

### Icons
- **Lucide React** - Beautiful, consistent icon library

### Additional Libraries
- **Radix UI** - Unstyled, accessible component primitives
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-tooltip`
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility
- **tailwind-merge** - Merge Tailwind classes intelligently

## AI Tools & Automation Used

### Development Tools
- **Cursor AI** - Primary development assistant for code generation, refactoring, and debugging
- **ChatGPT/Claude** - Architecture decisions, complex logic implementation, and problem-solving assistance

### Workflow Efficiency Techniques
1. **Component Scaffolding**: Used AI to generate initial component structure and boilerplate code, reducing setup time by ~70%
2. **Type Generation**: Automated TypeScript type definitions from data models and interfaces
3. **Code Refactoring**: Leveraged AI to restructure code for better organization and maintainability
4. **Bug Fixing**: Used AI to quickly identify and fix edge cases (e.g., mark adjustment logic, selection preservation)
5. **Algorithm Implementation**: AI-assisted implementation of complex algorithms (e.g., mark range adjustment, text edit application to marks)
6. **Documentation**: AI-assisted README and code comments generation

### Time-Saving Examples
- **Mark System Implementation**: Used AI to generate the complete mark adjustment logic (`applyTextEditToMarks`) in ~15 minutes vs ~2 hours manually
- **Rich Text Rendering**: AI-generated the `renderMarkedText` function with proper mark nesting in ~20 minutes vs ~1.5 hours manually
- **Selection Preservation**: AI-assisted implementation of selection restoration logic with proper timing using `requestAnimationFrame`

## Project Structure

```
notion-clone/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles and Tailwind directives
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx     # Left sidebar with page navigation
│   │   ├── topbar.tsx      # Top action bar
│   │   └── main-content.tsx # Main editable content area
│   └── ui/
│       ├── button.tsx      # Button component (shadcn/ui)
│       ├── dropdown-menu.tsx # Dropdown menu component (shadcn/ui)
│       ├── separator.tsx   # Separator component (shadcn/ui)
│       └── tooltip.tsx     # Tooltip component (shadcn/ui)
├── lib/
│   └── utils.ts            # Utility functions (cn helper)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Features Implemented

### Sidebar
- ✅ Hierarchical page structure with expand/collapse
- ✅ Search functionality
- ✅ Page icons and favorites
- ✅ Context menus for page actions
- ✅ Hover states and interactions
- ✅ "New page" button

### Top Bar
- ✅ Page title display
- ✅ Action buttons (Comments, Share, Undo, Redo)
- ✅ Settings dropdown menu
- ✅ Tooltips on hover
- ✅ Visual separators

### Document Editor
- ✅ Editable page title
- ✅ Rich text editing with marks (bold, italic, underline)
- ✅ Real-time formatting display with mirror overlay
- ✅ Slash command menu (/) for block type conversion
- ✅ Selection toolbar (B/I/U buttons) for text formatting
- ✅ Multiple block types: paragraph, heading1, todo
- ✅ Todo blocks with checkbox and checked state
- ✅ Block reordering via drag & drop
- ✅ Left gutter controls (+ insert, drag handle)
- ✅ Empty state messages
- ✅ Focus states and keyboard navigation
- ✅ localStorage persistence for all content and formatting

## Workflow Efficiency Report

### Automation & Tooling Used

1. **AI-Assisted Development**: Leveraged Cursor AI and ChatGPT/Claude extensively for:
   - Generating complex algorithms (mark range adjustment, text edit application)
   - Implementing rich text rendering with proper mark nesting
   - Debugging and fixing edge cases (selection preservation, mark normalization)
   - Code refactoring and optimization
   - Estimated time savings: ~60-70% on complex logic implementation

2. **shadcn/ui Component Library**: Instead of building dropdown menus, buttons, and tooltips from scratch, leveraged shadcn/ui which provides production-ready, accessible components built on Radix UI. This significantly reduced development time while ensuring accessibility and consistent styling.

3. **Tailwind CSS Utility Classes**: Used Tailwind's utility-first approach to rapidly style components without writing custom CSS. The configuration includes custom color variables matching Notion's design system exactly, allowing for quick theme adjustments and pixel-perfect replication.

4. **TypeScript for Type Safety**: Implemented TypeScript throughout to catch errors early and improve developer experience, reducing debugging time. AI-assisted type generation from data models saved significant time.

5. **Component Architecture**: Organized components into logical folders (`layout/`, `editor/`, `ui/`) following Next.js 14 App Router conventions, making the codebase easily navigable and maintainable.

6. **Lucide Icons**: Used Lucide React icon library for consistent, beautiful icons that match modern design standards, avoiding the need to create or source individual icon SVGs.

### Development Approach

- **AI-First Rapid Prototyping**: Started with AI-generated component scaffolds, then iteratively refined with AI assistance for complex logic
- **Component Reusability**: Created reusable UI components (Button, DropdownMenu, Tooltip, etc.) that can be used throughout the application
- **Modern React Patterns**: Utilized React hooks (useState, useRef, useCallback, useEffect) and client components where interactivity was needed
- **Accessibility First**: All components built on Radix UI primitives ensure keyboard navigation and screen reader support out of the box
- **Incremental Feature Addition**: Built core editor first, then added rich text, then formatting toolbar, then slash menu - each feature tested and polished before moving to the next

## Technical Implementation Details

### Rich Text System
- **Mark Storage**: Formatting stored as ranges (start, end, type) in block.marks
- **Mark Adjustment**: Automatically adjusts mark ranges when text is inserted/deleted
- **Mark Normalization**: Merges adjacent same-type ranges and clamps to text bounds
- **Real-time Rendering**: Formatted text displayed via mirror overlay behind transparent textarea during editing

### Block System
- **Block Types**: paragraph, heading1, todo (extensible architecture)
- **Block Operations**: Split, merge, delete, reorder, convert type
- **State Management**: Immutable updates with proper React re-rendering

### Persistence
- **localStorage**: All document content, formatting, and page structure persisted
- **Data Validation**: Runtime type guards and sanitization for corrupted data recovery
- **Migration Support**: Handles version upgrades and legacy data formats

## License

This is a prototype project for demonstration purposes.
