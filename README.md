# My Notes 📝

A clean, minimalist, full-stack multi-user notes application with **Role-Based Access Control (RBAC)**, built from scratch with Node.js, Express, SQLite, and vanilla frontend technologies.

---

## 🌟 Key Features

### 1. User Authentication & Multi-Tenancy
- 🔐 **Secure Registration & Login**: Passwords hashed with `bcryptjs` (salted, 10 rounds).
- 🍪 **Session Management**: Cookie-based server sessions via `express-session` with HTTP-only security cookies.
- 🗂️ **Private User Notes**: Each user has an isolated notebook (`user_id` foreign key); users can only see and manage their own notes.

### 2. Role-Based Access Control (RBAC)
- 📝 **User**: Can create, read, edit, and delete their own private notes.
- 🛡️ **Admin**: Can access the Administrative Dashboard, view system-wide metrics (total users, total notes), and inspect the member directory.
- 👑 **Super Admin**: Master permissions. Can promote or demote user roles (`User` ↔ `Admin`), manage administrator privileges, and delete accounts.

### 3. Note Management
- ✍️ **Create & Edit**: Rich modal forms with validation.
- 📖 **Reader View**: Modal for comfortable reading of note details and formatted dates.
- 🗑️ **Safe Deletion**: Confirmation dialogs preventing accidental deletions.
- 💾 **Persistent SQLite**: Data saved to `notes.db` with automated database migrations.
- ⚡ **Dynamic UI**: Loading spinners, empty notebook views, error states, and toast notifications.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3, Plain JavaScript (Fetch API, DOM manipulation).
- **Backend**: Node.js & Express REST API.
- **Security**: `bcryptjs` (password hashing), `express-session` (HTTP-only session cookies).
- **Database**: SQLite with `better-sqlite3` (parameterized queries for SQL injection defense).

---

## 🚀 Getting Started Locally

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

---

## 📡 API Reference

### Authentication Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & start session |
| `POST` | `/api/auth/logout` | Logged In | Destroy session & clear cookie |
| `GET` | `/api/auth/me` | Logged In | Check active session & role |

### Notes Endpoints (User-Scoped)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notes` | Logged In | Get all notes for current user |
| `GET` | `/api/notes/:id` | Logged In | Get a single note owned by current user |
| `POST` | `/api/notes` | Logged In | Create a new note |
| `PUT` | `/api/notes/:id` | Logged In | Update a note owned by current user |
| `DELETE` | `/api/notes/:id` | Logged In | Delete a note owned by current user |

### Administration Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Admin & Super Admin | System statistics & role counts |
| `GET` | `/api/admin/users` | Admin & Super Admin | List all registered members |
| `PUT` | `/api/admin/users/:id/role` | Super Admin ONLY | Change user role (`User`, `Admin`, `Super Admin`) |
| `DELETE` | `/api/admin/users/:id` | Super Admin ONLY | Permanently delete user and their notes |
