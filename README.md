<p align="center">
  <img src="https://img.shields.io/badge/CodeAdda-v2.0-7c3aed?style=for-the-badge&labelColor=0d0d1a" alt="CodeAdda v2.0" />
</p>

<h1 align="center">💻 CodeAdda — Real-Time Collaborative Code Editor</h1>

<p align="center">
  <strong>Code together. Learn together. Build together.</strong><br/>
  A real-time collaborative code editor with multi-language support, live chat, AI assistance, and interview mode — built for pair programming, coding interviews, and team collaboration.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47a248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Supabase-Auth-3fcf8e?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Monaco-Editor-007acc?style=flat-square&logo=visualstudiocode&logoColor=white" alt="Monaco" />
  <img src="https://img.shields.io/badge/License-MIT-a855f7?style=flat-square" alt="MIT License" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running Locally](#-running-locally)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

---

## 🌟 Overview

**CodeAdda** is a full-stack, real-time collaborative code editor designed for:

- 👥 **Pair Programming** — Write code together in the same editor, see each other's cursors, and chat in real time.
- 🎯 **Coding Interviews** — A built-in interview mode with a timer, question bank, and live evaluation panel.
- 🤖 **AI-Powered Assistance** — Explain, debug, optimize, or document your code using Google's Gemini AI.
- 🚀 **Code Execution** — Run code in 6+ languages directly in the browser with instant output.

Whether you're prepping for interviews, teaching a friend to code, or just hacking on a project with your team — CodeAdda gives you a premium, distraction-free environment to do it in.

---

## ✨ Features

| Category | Features |
|----------|----------|
| 📝 **Editor** | Monaco Editor (VS Code engine), syntax highlighting, IntelliSense, bracket matching, multi-cursor |
| 🌐 **Languages** | JavaScript, TypeScript, Python, Java, C++, C |
| 👥 **Collaboration** | Real-time presence tracking, live user list, per-user color coding |
| 💬 **Chat** | In-room messaging with message history, typing indicators, user avatars |
| 🤖 **AI Assistant** | Explain, Debug, Optimize, and Comment modes powered by Gemini AI |
| ▶️ **Code Execution** | Run code in-browser via Judge0 API with stdin support |
| 📸 **Snapshots** | Save and restore code versions with Ctrl+S |
| 🎨 **Whiteboard** | Built-in drawing canvas for visual explanations |
| 🎯 **Interview Mode** | Timed sessions with DSA/system design question banks |
| 🔐 **Auth** | Google OAuth via Supabase + email/password fallback |
| 🌙 **UI/UX** | Glassmorphism design, dark theme, smooth animations, responsive layout |

---

## 🛠 Tech Stack

<table>
  <tr>
    <td><strong>Layer</strong></td>
    <td><strong>Technology</strong></td>
  </tr>
  <tr>
    <td>⚛️ Frontend</td>
    <td>React 18, TypeScript, Vite 5, Tailwind CSS, Framer Motion, shadcn/ui, Monaco Editor</td>
  </tr>
  <tr>
    <td>🖥️ Backend</td>
    <td>Node.js, Express 5, TypeScript (tsx)</td>
  </tr>
  <tr>
    <td>🗃️ Database</td>
    <td>MongoDB Atlas (Mongoose ODM)</td>
  </tr>
  <tr>
    <td>🔐 Authentication</td>
    <td>Supabase Auth (Google OAuth), JWT (local auth)</td>
  </tr>
  <tr>
    <td>📡 Realtime</td>
    <td>Supabase Realtime (broadcast + presence), server-side heartbeat polling</td>
  </tr>
  <tr>
    <td>⚙️ State</td>
    <td>Zustand</td>
  </tr>
  <tr>
    <td>🚀 Deployment</td>
    <td>Vercel (frontend), Render (backend)</td>
  </tr>
  <tr>
    <td>🔌 APIs</td>
    <td>Judge0 (code execution), Google Gemini (AI assistant)</td>
  </tr>
</table>

---

## 🏗 System Architecture

```mermaid
graph TB
    subgraph Client["🌐 Browser (React + Vite)"]
        UI["Monaco Editor + Chat UI"]
        Store["Zustand Store"]
        Hooks["useCollaboration Hook"]
    end

    subgraph Backend["🖥️ Express Server"]
        API["REST API"]
        Auth["Auth Routes"]
        Rooms["Room Routes"]
        Presence["In-Memory Presence"]
    end

    subgraph External["☁️ Cloud Services"]
        Supabase["Supabase (Auth + Realtime)"]
        MongoDB["MongoDB Atlas"]
        Judge0["Judge0 API"]
        Gemini["Google Gemini AI"]
    end

    UI --> Store
    Store --> Hooks
    Hooks -->|REST API| API
    Hooks -->|WebSocket| Supabase
    API --> Auth
    API --> Rooms
    API --> Presence
    Rooms --> MongoDB
    Auth --> MongoDB
    UI -->|Code Execution| Judge0
    UI -->|AI Queries| Gemini
    Hooks -->|Google OAuth| Supabase
```

---

## 📁 Project Structure

```
pair-code-palace/
├── public/                      # Static assets
├── server/                      # Express backend
│   ├── index.ts                 # Server entry point + middleware
│   ├── models/
│   │   └── index.ts             # Mongoose schemas (Room, ChatMessage, Snapshot, User)
│   └── routes/
│       ├── auth.ts              # Register / Login / Me endpoints
│       └── rooms.ts             # Room CRUD, chat, snapshots, presence
├── src/                         # React frontend
│   ├── components/
│   │   ├── editor/
│   │   │   ├── EditorNavbar.tsx  # Top bar (room ID, run, save, users)
│   │   │   ├── LeftSidebar.tsx   # Language picker, settings
│   │   │   ├── RightSidebar.tsx  # Chat, participants, AI, history, whiteboard
│   │   │   ├── OutputConsole.tsx # Code output + errors + stdin
│   │   │   └── InterviewPanel.tsx# Interview mode (timer, questions)
│   │   └── ui/                  # shadcn/ui components
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Supabase auth provider
│   │   └── ThemeContext.tsx      # Theme provider
│   ├── hooks/
│   │   ├── useCollaboration.ts  # Realtime join/leave/broadcast logic
│   │   ├── useCodeExecution.ts  # Judge0 API integration
│   │   └── useVersionHistory.ts # Snapshot management
│   ├── pages/
│   │   ├── Index.tsx            # Landing page
│   │   ├── Editor.tsx           # Main editor page
│   │   ├── LoginPage.tsx        # Auth page
│   │   └── NotFound.tsx         # 404
│   ├── services/
│   │   ├── aiService.ts         # Gemini AI integration
│   │   ├── compilerApi.ts       # Judge0 code execution
│   │   ├── mongoApi.ts          # Backend REST API client
│   │   ├── realtimeService.ts   # Supabase Realtime channel management
│   │   └── supabaseClient.ts    # Supabase client init
│   ├── store/
│   │   ├── useEditorStore.ts    # Global Zustand store
│   │   └── useAuthStore.ts      # Auth state
│   ├── App.tsx                  # Router + providers
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles + Tailwind
├── .env                         # Environment variables (not committed)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** ≥ 18 — [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** ≥ 9
- **MongoDB Atlas** account — [Create free cluster](https://www.mongodb.com/cloud/atlas)
- **Supabase** account — [Sign up](https://supabase.com)

### Clone the Repository

```bash
git clone https://github.com/quarkshiv/Code-Adda.git
cd Code-Adda
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# ── Supabase ──────────────────────────────────────────────────
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# ── APIs ──────────────────────────────────────────────────────
VITE_RAPIDAPI_KEY=your_rapidapi_key_for_judge0

# ── Backend (Express + MongoDB) ──────────────────────────────
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/codeadda
PORT=5000
JWT_SECRET=your_strong_random_jwt_secret

# ── Frontend → Backend ───────────────────────────────────────
VITE_API_URL=http://localhost:5000/api
```

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`.

<details>
<summary>📌 Where to get these values</summary>

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` / `public` key |
| `VITE_RAPIDAPI_KEY` | [RapidAPI](https://rapidapi.com) → Subscribe to Judge0 CE |
| `MONGODB_URI` | MongoDB Atlas → Connect → Connection String |
| `JWT_SECRET` | Any strong random string (use `openssl rand -hex 32`) |

</details>

---

## 💻 Running Locally

Start both the frontend and backend with a single command:

```bash
npm run dev:full
```

This runs concurrently:
- 🌐 **Frontend** → `http://localhost:8080`
- 🖥️ **Backend** → `http://localhost:5000/api`

<details>
<summary>Run frontend and backend separately</summary>

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
npm run server:dev
```

</details>

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run build` | Production build to `dist/` |
| `npm run server:dev` | Start Express with hot-reload (backend only) |
| `npm run server:start` | Start Express in production mode |
| `npm run dev:full` | Start both frontend + backend concurrently |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

---

## 📡 API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status + MongoDB connection check |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register with name, email, password |
| `POST` | `/api/auth/login` | Login with email + password |
| `GET` | `/api/auth/me` | Get current user (requires Bearer token) |

### Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rooms/:id` | Get room (auto-creates if not found) |
| `POST` | `/api/rooms` | Create a named room |
| `PATCH` | `/api/rooms/:id/code` | Save code to room |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rooms/:id/chat` | Get last 100 chat messages |
| `POST` | `/api/rooms/:id/chat` | Send a chat message |

### Snapshots

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rooms/:id/snapshots` | Get snapshots (max 30) |
| `POST` | `/api/rooms/:id/snapshots` | Save a new snapshot |

### Presence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rooms/:id/presence` | Get active users (heartbeat < 15s) |
| `POST` | `/api/rooms/:id/presence` | Send heartbeat |
| `DELETE` | `/api/rooms/:id/presence` | Remove user on leave |

---

## 🚢 Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Set **Framework Preset** to `Vite`, **Output Directory** to `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` → your Render backend URL + `/api`
   - `VITE_RAPIDAPI_KEY`
5. Deploy 🚀

### Backend → Render

1. Go to [render.com](https://render.com) → New **Web Service**
2. Connect your GitHub repo
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npx tsx server/index.ts`
4. Add environment variables:
   - `MONGODB_URI`
   - `PORT` = `5000`
   - `JWT_SECRET`
   - `NODE_ENV` = `production`
5. Deploy 🚀

> 💡 **Don't forget** to update CORS origins in `server/index.ts` with your Vercel URL, and add your Vercel URL to Supabase → Authentication → Redirect URLs.

---

## 📸 Screenshots

<!-- Add your screenshots here -->

<p align="center">
  <em>Screenshots coming soon — take a screenshot of your live app and replace this section!</em>
</p>

<!--
![Landing Page](./screenshots/landing.png)
![Editor View](./screenshots/editor.png)
![Chat & Collaboration](./screenshots/chat.png)
![AI Assistant](./screenshots/ai.png)
-->

---

## 🔮 Future Improvements

- [ ] 🎯 **Operational Transform / CRDT** — True character-level collaborative editing
- [ ] 🔊 **Voice & Video Chat** — WebRTC integration for live communication
- [ ] 📱 **Mobile Responsive** — Full mobile support with touch-friendly UI
- [ ] 🗂️ **Multi-File Projects** — File tree with folder support
- [ ] 🐳 **Docker Deployment** — One-command self-hosted setup
- [ ] 📊 **Analytics Dashboard** — Track coding time, languages used, collaboration stats
- [ ] 🔗 **Shareable Links** — Generate read-only spectator links
- [ ] 🌍 **i18n** — Multi-language UI support
- [ ] ⌨️ **Vim / Emacs Keybindings** — Editor mode presets
- [ ] 🧪 **Unit & E2E Tests** — Jest + Playwright test suite

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
4. **Push** to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

### Guidelines

- Follow existing code style and naming conventions
- Write meaningful commit messages ([Conventional Commits](https://www.conventionalcommits.org/))
- Add types for all new code (no `any` unless absolutely necessary)
- Test your changes locally before submitting

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

<table>
  <tr>
    <td align="center">
      <strong>Shivansh Shukla</strong><br/>
      <a href="https://github.com/quarkshiv">GitHub</a> •
      <a href="https://www.linkedin.com/in/shivansh-shukla-26807a356/">LinkedIn</a> •
      <a href="https://portfolio-phi-eight-30.vercel.app/">Portfolio</a>
    </td>
  </tr>
</table>

---

<p align="center">
  <sub>Built with ❤️ and lots of ☕ — <strong>CodeAdda</strong> © 2026</sub>
</p>
