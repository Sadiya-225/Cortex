# Cortex - AI-Powered Cloud IDE

## 🎯 What is Cortex?

Cortex is a **modern, AI-powered cloud IDE** that brings the intelligence of advanced code editors to your browser. Build, code, and collaborate in real-time with:

- **Intelligent AI Assistant** - Real-time code suggestions, quick edits (Cmd+K), and conversation-based development
- **In-Browser Execution** - Run your code instantly with WebContainer technology
- **Collaborative Editing** - Real-time code synchronization across team members
- **GitHub Integration** - Seamlessly import and export repositories
- **Multi-Language Support** - JavaScript, TypeScript, Python, CSS, HTML, JSON, and more

## Why Cortex Exists

Modern development has fragmented into multiple tools:

- 🖥️ Your local IDE for coding
- ☁️ Cloud platforms for deployment
- 💬 Separate AI tools for assistance
- 🔄 Git platforms for collaboration

**Cortex unifies this experience.** In one tab, you get:

- **Full-featured editor** with syntax highlighting, folding, and minimap
- **AI that understands your project** and can modify files autonomously
- **Live preview** of your running application
- **GitHub sync** for version control
- **Zero setup time** - just sign in and code

Think of it as **Cursor AI, but cloud-native and open-source.**

---

## ✨ Key Features

### 🤖 Intelligent AI Assistance

- **Code Suggestions** - Ghost text predictions as you type
- **Quick Edit (Cmd+K)** - Select code + describe changes in natural language
- **Conversation Mode** - Chat-based development with file-aware context
- **Agent Execution** - AI can create, modify, and organize your project files

### 💻 Professional Code Editor

- **Syntax Highlighting** - JS, TS, Python, CSS, HTML, JSON, Markdown
- **Advanced Features** - Line numbers, code folding, bracket matching, minimap
- **Theme Support** - Dark/light mode with One Dark theme by default
- **Multi-cursor Editing** - Edit multiple locations simultaneously
- **Tab Management** - Organize multiple files with intuitive tabs

### 🌐 Real-Time Collaboration

- **Live Updates** - See changes instantly with Convex real-time sync
- **Optimistic UI** - Responsive experience with instant feedback
- **File Synchronization** - Project changes sync across all clients

### 🚀 In-Browser Execution

- **WebContainer Terminal** - Run Node.js and npm commands in your browser
- **Live Preview** - See your application running in real-time
- **Full OS Simulation** - File system, package management, dev servers

### 📦 Version Control Integration

- **GitHub Import** - Clone any repository in seconds
- **GitHub Export** - Push your projects back to GitHub
- **Status Tracking** - Monitor import/export progress in real-time

### 📊 Project Management

- **Dashboard** - Overview of all your projects
- **File Explorer** - Intuitive directory navigation with VSCode-style icons
- **File Operations** - Create, rename, delete files and folders
- **Auto-Save** - Debounced saving prevents data loss

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.09+ and npm/pnpm
- **Free Accounts** (all have generous free tiers):
  - [Clerk](https://clerk.com) - Authentication
  - [Convex](https://convex.dev) - Real-time Database
  - [Inngest](https://inngest.com) - Background Jobs
  - [OpenAI](https://openai.com) or [Google AI Studio](https://aistudio.google.com) - AI API
  - [Firecrawl](https://firecrawl.dev) - Web Scraping (optional)
  - [Sentry](https://sentry.io) - Error Tracking (optional)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Sadiya-125/Cortex.git
   cd Cortex
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env.local
   ```

4. **Set up your `.env.local`:**

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
   CLERK_SECRET_KEY=your_key_here

   # Convex Database
   NEXT_PUBLIC_CONVEX_URL=your_url_here
   CONVEX_DEPLOYMENT=your_deployment
   CORTEX_CONVEX_INTERNAL_KEY=generate_random_string

   # AI Provider (choose one - OpenAI recommended)
   OPENAI_API_KEY=your_key_here
   # OR
   GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

   # Optional Services
   FIRECRAWL_API_KEY=your_key_here
   SENTRY_DSN=your_dsn_here
   ```

5. **Start the development servers:**

   Terminal 1 - Convex Backend:

   ```bash
   npx convex dev
   ```

   Terminal 2 - Next.js Frontend:

   ```bash
   npm run dev
   ```

   Terminal 3 - Inngest Workflows:

   ```bash
   npx --ignore-scripts=false inngest-cli@latest dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
cortex/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── github/               # GitHub integration endpoints
│   │   │   ├── messages/             # Conversation API
│   │   │   ├── suggestion/           # AI suggestions
│   │   │   └── quick-edit/           # Cmd+K quick edit
│   │   ├── projects/[projectId]/    # Project IDE
│   │   ├── layout.tsx                # Root layout & metadata
│   │   └── page.tsx                  # Dashboard
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components (50+)
│   │   ├── ai-elements/              # AI conversation components
│   │   ├── providers.tsx             # Clerk + Convex + Theme
│   │   └── theme-provider.tsx        # Dark/light mode
│   │
│   ├── features/
│   │   ├── auth/                     # Authentication flows
│   │   ├── conversations/            # AI chat system
│   │   │   ├── inngest/              # Background message processing
│   │   │   ├── components/           # UI components
│   │   │   └── hooks/                # Custom hooks
│   │   ├── editor/                   # Code editor
│   │   │   ├── extensions/           # CodeMirror extensions
│   │   │   └── store/                # Tab state (Zustand)
│   │   ├── preview/                  # WebContainer preview
│   │   └── projects/                 # Project management
│   │       ├── components/           # File explorer, navbar, etc.
│   │       └── hooks/                # Project queries/mutations
│   │
│   ├── inngest/                      # Inngest client setup
│   ├── lib/                          # Utilities & helpers
│   └── instrumentation.ts            # Monitoring setup
│
├── convex/                           # Backend Database
│   ├── schema.ts                     # Database schema
│   ├── projects.ts                   # Project CRUD
│   ├── files.ts                      # File operations
│   ├── conversations.ts              # Conversation management
│   └── system.ts                     # Internal API for Inngest
│
├── public/                           # Static assets
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js + Sentry config
├── tailwind.config.js                # Tailwind CSS
└── README.md                         # You are here!
```

---

## 🎯 Features Implemented

### Phase 1: Editor & Core Features ✅

- ✅ Multi-language code editor (CodeMirror 6)
- ✅ Real-time file synchronization
- ✅ File explorer with create/rename/delete
- ✅ Tab-based navigation
- ✅ Authentication (Clerk + GitHub OAuth)
- ✅ Dashboard with project management

### Phase 2: AI Capabilities ✅

- ✅ Real-time code suggestions (ghost text)
- ✅ Quick edit with Cmd+K (select + describe)
- ✅ Conversation-based development
- ✅ AI agent with autonomous file editing
- ✅ Conversation history and management

### Phase 3: Execution & Integration ✅

- ✅ WebContainer for in-browser code execution
- ✅ Terminal emulator (xterm.js)
- ✅ Live preview panel
- ✅ GitHub import/export
- ✅ AI-powered project generation
- ✅ Error tracking (Sentry)

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server (Next.js, Convex, Inngest)
npm run lint         # Run ESLint

# Production
npm run build        # Build for production
npm run start        # Start production server
```

---

## 🌟 How It Works

### Creating a New Project

1. Click "New Project" on the dashboard
2. Describe what you want to build in natural language
3. Cortex's AI agent generates the complete project structure
4. Start editing and running your code immediately

### Using AI Assistance

1. **Code Suggestions** - Just start typing, suggestions appear as ghost text
2. **Quick Edit** - Select code, press Cmd+K, describe changes
3. **Ask Cortex** - Use the conversation sidebar for complex tasks
4. **AI Agent** - The assistant can modify files, create folders, and organize your project

### Running Your Code

1. Write your code in the editor
2. WebContainer automatically executes it in the browser
3. See output in the Terminal tab
4. Preview rendered output in the Preview panel

### Publishing to GitHub

1. Click the export button (top-right)
2. Select "Export to GitHub"
3. Authorize with your GitHub account
4. Choose repository name and visibility
5. Cortex pushes your project automatically

---

## 🔐 Security & Privacy

- **No Data Collection** - Your code stays in your browser and our database
- **Encrypted Transmission** - All data encrypted in transit
- **GitHub OAuth** - Only used for repository operations, never stored
- **Self-Hosted Option** - Deploy Cortex on your own infrastructure

---

## 📚 API Documentation

### AI Agent Tools

The AI agent in Cortex has access to these tools:

- `createFiles` - Create multiple files in a folder
- `createFolder` - Create a new directory
- `readFiles` - Read file contents
- `updateFile` - Modify file content
- `deleteFiles` - Remove files
- `renameFile` - Move or rename files
- `listFiles` - List directory contents
- `scrapeUrls` - Fetch and process web content

### REST API Endpoints

#### Conversations

- `POST /api/messages` - Send message to AI
- `POST /api/messages/cancel` - Cancel processing

#### Suggestions

- `POST /api/suggestion` - Get code suggestions
- `POST /api/quick-edit` - Cmd+K quick edit

#### GitHub

- `POST /api/github/import` - Import from GitHub
- `POST /api/github/export` - Export to GitHub
- `POST /api/github/export/cancel` - Cancel export

#### Projects

- `POST /api/projects/create-with-prompt` - AI-generated project

---

<div align="center">

**Built with ❤️ for Developers Who Want to Code Smarter, Not Harder.**

</div>
