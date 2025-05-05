# AI Productivity Assistant

An AI-powered productivity assistant built with Next.js, integrating Mistral AI and OpenAI to enhance X-MEN with copilot functionality and function calling capabilities.

## Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **Language**: JavaScript (JSX)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide React
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Mistral AI, OpenAI
- **Markdown Rendering**: React Markdown with remark-gfm

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── chat/           # Chat API endpoints
│   │   └── message-flow/   # Message flow logic
│   ├── globals.css         # Global styles
│   ├── layout.jsx          # Root layout
│   ├── page.jsx            # Main page component
│   └── providers.jsx       # Context providers
├── components/             # React components
│   ├── copilot/            # Copilot-specific components
│   │   ├── ChatView.jsx    # Chat interface
│   │   ├── Copilot.jsx     # Main copilot component
│   │   └── Messages.jsx    # Message rendering
│   ├── ui/                 # UI components (shadcn)
│   └── Sidebar.jsx         # Navigation sidebar
├── core/                   # Core application logic
│   ├── assistant-message/  # Assistant message handling
│   ├── context/            # Application context
│   ├── controller/         # Application controllers
│   └── task/               # Task-related logic
├── lib/                    # Utility libraries
├── prisma/                 # Database schema and migrations
│   └── schema.prisma       # Prisma schema
├── public/                 # Static assets
├── store/                  # State management
│   ├── useChatStore.js     # Chat state store
│   └── chatActions.js      # Chat actions
├── tool-calls/             # AI tool call definitions
└── utils/                  # Utility functions
    └── ai-sdk/             # AI SDK helpers
```

## Layout Structure

- **Main Layout**:
  - Centered content with consistent margins
  - Responsive design across screen sizes
  - Custom background image
  - Border with shadow effect

- **Sidebar**:
  - Navigation menu with icon and text labels
  - Active state highlighting
  - Footer with settings options

- **Content Area**:
  - Three rounded rectangular containers
  - Responsive grid layout
  - Consistent styling with proper spacing
  - Scrollable content areas

- **Copilot Feature**:
  - Floating circular button at bottom-right
  - Expandable chat interface (400px width)
  - Support for markdown rendering
  - Tool execution capabilities

## Getting Started

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with the following:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
   MISTRAL_API_KEY="your-mistral-api-key"
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- AI-powered chat interface with Mistral and OpenAI integration
- Function calling capabilities for enhanced intelligence
- Database persistence for chat history
- Tool execution and approval workflow
