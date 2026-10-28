# My Notes 📝

A clean, minimalist, full-stack personal notes application built from scratch for learning web development.

## Features

- ✍️ **Create Notes**: Add notes with a title and optional body content.
- 📋 **View Notes Grid**: Browse all saved notes neatly arranged (newest first).
- 📖 **Reader View**: Click any card to comfortably read full content and formatted dates.
- ✏️ **Edit Notes**: Update title or details at any time.
- 🗑️ **Delete Confirmation**: Safe deletion with a confirmation prompt.
- 💾 **Persistent Storage**: Saved in an auto-initialized SQLite database (`notes.db`).
- ⚡ **Real-Time UI**: Loading spinners, empty notebook screen, and friendly error toasts.

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS3, Plain JavaScript (Fetch API, DOM manipulation).
- **Backend**: Node.js & Express REST API.
- **Database**: SQLite with `better-sqlite3`.

## Getting Started Locally

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation & Run

1. Clone or download this project.
2. Open terminal in the project directory:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notes` | Get all saved notes (newest first) |
| `GET` | `/api/notes/:id` | Get a single note by ID |
| `POST` | `/api/notes` | Create a new note (`{ title, content }`) |
| `PUT` | `/api/notes/:id` | Update a note by ID (`{ title, content }`) |
| `DELETE` | `/api/notes/:id` | Delete a note by ID |
