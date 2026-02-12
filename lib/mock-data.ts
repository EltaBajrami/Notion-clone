import { PageNode } from "./types"
import { createDefaultDocument, createBlock } from "./doc-defaults"

/**
 * Initial Notion-like sidebar structure
 * Returns a tree with Favorites, Private, and Shared sections
 * All pages have default documents attached
 */
export function getInitialSidebarData(): PageNode[] {
  return [
    {
      id: "favorites",
      title: "Favorites",
      icon: "⭐",
      doc: createDefaultDocument(),
      children: [
        {
          id: "fav-1",
          title: "Getting started",
          icon: "📄",
          parentId: "favorites",
          doc: createDefaultDocument(),
        },
        {
          id: "fav-2",
          title: "Quick notes",
          icon: "📝",
          parentId: "favorites",
          doc: createDefaultDocument(),
        },
      ],
    },
    {
      id: "private",
      title: "Private",
      icon: "🔒",
      doc: createDefaultDocument(),
      children: [
        {
          id: "quick-note",
          title: "Quick Note",
          icon: "📌",
          parentId: "private",
          doc: {
            title: "Quick Note",
            blocks: [
              {
                id: "qn-callout-1",
                type: "callout",
                icon: "💡",
                text: "Notion Tip: Use this template to write quick notes you can reference later and quickly create a rich document. You can embed links, images, to-do's, and more. Learn more about the different types of content blocks here.",
                marks: {
                  ranges: [
                    { start: 0, end: 12, type: "bold" }
                  ]
                }
              },
              {
                id: "qn-heading-1",
                type: "heading1",
                text: "Jot down some text",
              },
              {
                id: "qn-divider-1",
                type: "divider",
                text: "",
              },
              {
                id: "qn-para-1",
                type: "paragraph",
                text: "They found Mary, as usual, deep in the study of thorough-bass and human nature; and had some extracts to admire, and some new observations of threadbare morality to listen to. Catherine and Lydia had information for them of a different sort.",
              },
              {
                id: "qn-heading-2",
                type: "heading1",
                text: "Make a to-do list",
              },
              {
                id: "qn-divider-2",
                type: "divider",
                text: "",
              },
              {
                id: "qn-todo-1",
                type: "todo",
                text: "Wake up",
                checked: true,
              },
              {
                id: "qn-todo-2",
                type: "todo",
                text: "Brush teeth",
                checked: true,
              },
              {
                id: "qn-todo-3",
                type: "todo",
                text: "Eat breakfast",
                checked: false,
              },
              {
                id: "qn-heading-3",
                type: "heading1",
                text: "Create sub-pages",
              },
              {
                id: "qn-divider-3",
                type: "divider",
                text: "",
              },
              {
                id: "qn-page-1",
                type: "page",
                text: "Sub Page",
              },
              {
                id: "qn-heading-4",
                type: "heading1",
                text: "Embed links",
              },
              {
                id: "qn-divider-4",
                type: "divider",
                text: "",
              },
              {
                id: "qn-bookmark-1",
                type: "bookmark",
                text: "",
                url: "https://www.nytimes.com/2018/03/08/arts/chicago-museums-art.html",
                title: "Beyond Frank Lloyd Wright: A Broader View of Art in Chicago",
                description: "\"We had been aware of the Walker exhibit but hadn't quite known how to connect,\" said Steve Weaver, executive director of the Chicago Public Art",
                imageUrl: "https://static01.nyt.com/images/2018/03/15/arts/15ARTCHICAGO1/15ARTCHICAGO1-facebookJumbo.jpg",
              },
              {
                id: "qn-bookmark-2",
                type: "bookmark",
                text: "",
                url: "https://www.nytimes.com/2018/03/12/travel/havana-cuba.html",
                title: "Havana's Symphony of Sound",
                description: "Just before New Year's Eve, my wife and I left our two young children at home with my parents and sneaked down to Havana for a brief getaway. You",
                imageUrl: "https://static01.nyt.com/images/2018/03/18/travel/18cuba2/merlin_102835471_1d88add3-ed44-416f-8e16-5f52dbf1ed17-superJumbo.jpg",
              },
            ],
          },
        },
        {
          id: "task-list",
          title: "Task List",
          icon: "✔️",
          parentId: "private",
          doc: createDefaultDocument(),
        },
        {
          id: "journal",
          title: "Journal",
          icon: "📓",
          parentId: "private",
          doc: createDefaultDocument(),
        },
        {
          id: "personal-home",
          title: "Personal Home",
          icon: "🏡",
          parentId: "private",
          doc: createDefaultDocument(),
        },
        {
          id: "getting-started",
          title: "Getting Started",
          icon: "📄",
          parentId: "private",
          doc: {
            title: "Getting Started",
            blocks: [
              createBlock("paragraph", "Welcome to Notion!"),
            ],
          },
        },
        {
          id: "priv-1",
          title: "Personal",
          icon: "👤",
          parentId: "private",
          doc: createDefaultDocument(),
          children: [
            {
              id: "priv-1-1",
              title: "Goals",
              icon: "🎯",
              parentId: "priv-1",
              doc: createDefaultDocument(),
            },
            {
              id: "priv-1-2",
              title: "Journal",
              icon: "📔",
              parentId: "priv-1",
              doc: createDefaultDocument(),
            },
          ],
        },
        {
          id: "priv-2",
          title: "Projects",
          icon: "📁",
          parentId: "private",
          doc: createDefaultDocument(),
          children: [
            {
              id: "priv-2-1",
              title: "Project Alpha",
              icon: "📄",
              parentId: "priv-2",
              doc: createDefaultDocument(),
            },
            {
              id: "priv-2-2",
              title: "Project Beta",
              icon: "📄",
              parentId: "priv-2",
              doc: createDefaultDocument(),
            },
          ],
        },
        {
          id: "priv-3",
          title: "Archive",
          icon: "📦",
          parentId: "private",
          doc: createDefaultDocument(),
        },
      ],
    },
    {
      id: "shared",
      title: "Shared",
      icon: "👥",
      doc: createDefaultDocument(),
      children: [
        {
          id: "shared-1",
          title: "Team workspace",
          icon: "🏢",
          parentId: "shared",
          doc: createDefaultDocument(),
        },
        {
          id: "shared-2",
          title: "Collaboration",
          icon: "🤝",
          parentId: "shared",
          doc: createDefaultDocument(),
        },
      ],
    },
  ]
}

/**
 * Default expanded pages (root level sections)
 */
export function getDefaultExpandedIds(): string[] {
  return ["favorites", "private", "shared"]
}
