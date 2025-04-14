# AI Productivity Assistant
### Enhance X-MEN by integrating a copilot feature, using function calling to significantly boost its intelligence and capabilities
    This project is a Next.js application that implements an AI-powered productivity assistant, using the Mistral AI API.

    ## Tech Stack

    - Next.js 14+ with App Router
    - JavaScript (JSX files only, no TypeScript)
    - Tailwind CSS with Typography plugin
    - shadcn/ui components
    - Mistral AI & OpenAI integration
    - Prisma with PostgreSQL
    - Zustand for state management
    - TanStack Query for data fetching
    - ReactFlow for visualizations
    - ESLint + Prettier configuration

    ## Project Structure

    ```
    app/
    ├── api/
    │   └── assistant/
    │       └── route.js
    ├── layout.jsx
    ├── page.jsx
    components/
    ├── copilot/
    │   ├── Copilot.jsx
    │   └── Messages.jsx
    ├── ui/
    └── Sidebar.jsx
    utils/
    ├── ai-sdk/
    │   └── mistral.js
    store/
    prisma/
    public/
    ```

    ## Features

    - AI Integration
        - Dual LLM support (Mistral AI and OpenAI)
        - Function calling capabilities
        - Tool execution system
        - Real-time chat interface

    - Core Features
        - Proper error handling for API responses
        - Loading states for AI operations
        - Markdown rendering with React-Markdown
        - Tool approval dialog system
        - Chat history management

    - UI/UX
        - Responsive design for all components
        - Dark mode support
        - Custom animations and transitions
        - Interactive deployment diagrams
        - Floating copilot interface

    - Architecture
        - Clean, modular code structure
        - Global state management with Zustand
        - Server state with TanStack Query
        - PostgreSQL database with Prisma ORM
        - Environment variables for API keys and sensitive data

    ## Getting Started

    1.  Install dependencies:

        ```bash
        npm install
        ```

    2.  Run the development server:

        ```bash
        npm run dev
        ```

    3.  Open [http://localhost:3000](http://localhost:3000) in your browser.
