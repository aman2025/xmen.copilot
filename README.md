# AI Productivity Assistant

    This project is a Next.js application that implements an AI-powered productivity assistant similar to Office 365 Copilot, using the Gemini AI API.

    ## Tech Stack

    - Next.js 14+ with App Router
    - JavaScript (JSX files only, no TypeScript)
    - Tailwind CSS
    - shadcn/ui
    - API routes for Gemini AI integration
    - ESLint + Prettier configuration
    - Import alias using '@' prefix

    ## Project Structure

    ```
    app/
    ├── api/
    │   └── gemini/
    │       └── route.js
    components/
    │   └── ui/
    public/
    ```

    ## Features

    - Proper error handling for API responses
    - Loading states for AI operations
    - Responsive design for all components
    - Clean, modular code structure
    - Environment variables for API keys and sensitive data

    ## Layout Structure

    - Main Layout:
        - Center the main content area in the viewport
        - Apply consistent margins around the main content
        - Ensure the layout adapts smoothly across different screen sizes
        - Body background with an image
    - Sidebar:
        - Navigation menu bar on one side
        - Menu items with icons and text labels
        - Consistent spacing and alignment
    - Content Area:
        - Three rounded rectangular containers
        - Responsive grid/flow
        - Consistent border radius
        - Proper spacing between containers
        - Responsive sizing based on viewport width
    - Copilot Area:
        - Floating circular button at the bottom-right corner
        - Expands to a 400px rounded rectangular container with input and button

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
