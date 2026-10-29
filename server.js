// server.js - Full-Stack Notes App with User Authentication

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./server/database');

const app = express();
const PORT = 3000;

// 1. Built-in middleware to parse incoming JSON bodies
app.use(express.json());

// 2. Session Middleware: Manages login state using HTTP-only cookies
app.use(session({
  // The secret is used to digitally sign the session ID cookie so it cannot be forged
  secret: 'my-notes-super-secret-session-key',
  resave: false,             // Do not re-save unchanged sessions
  saveUninitialized: false,  // Do not create empty sessions for visitors who aren't logged in
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie lasts for 7 days (in milliseconds)
    httpOnly: true,                  // Crucial: prevents client JavaScript from accessing cookie (XSS defense)
    secure: false                    // 'true' is used only in production with HTTPS
  }
}));

// 3. Request Logger: Prints incoming HTTP traffic live to your terminal
app.use((req, res, next) => {
  const user = req.session.username ? `[${req.session.username} (${req.session.role || 'User'})]` : '[Guest]';
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} ${user}`);
  next();
});

// 4. Serve static frontend files (HTML, CSS, JS) from the "public" folder
app.use(express.static('public'));

// ========================================================
// SECURITY GUARDS (MIDDLEWARES)
// ========================================================

// Guard 1: Any logged-in member (User, Admin, or Super Admin)
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

// Guard 2: Club Monitors and Presidents (Admin or Super Admin)
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (req.session.role !== 'Admin' && req.session.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
  next();
}

// Guard 3: Club President ONLY (Super Admin)
function requireSuperAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (req.session.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Forbidden. Super Admin privileges required.' });
  }
  next();
}

// ========================================================
// AUTHENTICATION ROUTES (Register, Login, Logout, Check)
// ========================================================

// 1. POST /api/auth/register — Create a new user account
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation 1: Username checks
    if (!username || !username.trim() || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    // Validation 2: Password strength checks
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username is already taken
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existingUser) {
      return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
    }

    // Hash the password using bcrypt with 10 salt rounds
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    // Save the new user to SQLite
    const insertStmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    const result = insertStmt.run(cleanUsername, passwordHash);

    // Automatically log the user in by saving their ID, username, and default role in the session
    req.session.userId = result.lastInsertRowid;
    req.session.username = cleanUsername;
    req.session.role = 'User';

    // If there were any existing unassigned notes, claim them for this first user!
    db.prepare('UPDATE notes SET user_id = ? WHERE user_id IS NULL').run(result.lastInsertRowid);

    res.status(201).json({
      id: result.lastInsertRowid,
      username: cleanUsername,
      role: 'User',
      message: 'Account created successfully!'
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Failed to register account.' });
  }
});

// 2. POST /api/auth/login — Authenticate existing user
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Look up the user in SQLite
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(cleanUsername);

    // If user does not exist OR password does not match the bcrypt hash
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Store user ID, username, and role in session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role || 'User';

    res.json({
      id: user.id,
      username: user.username,
      role: user.role || 'User',
      message: 'Logged in successfully!'
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

// 3. POST /api/auth/logout — Destroy session and clear cookie
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out. Please try again.' });
    }
    // Instruct the browser to delete the session cookie
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

// 4. GET /api/auth/me — Check who is currently logged in (fetches fresh role)
app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.userId) {
    // Query database directly to get the user's latest role (in case they were just promoted!)
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.session.userId);
    if (user) {
      req.session.role = user.role; // Keep session synced
      return res.json({ user });
    }
  }
  res.json({ user: null });
});

// ========================================================
// ADMIN & SUPER ADMIN API ROUTES
// ========================================================

// 1. GET /api/admin/stats — Retrieve system-wide statistics (Admin & Super Admin)
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalNotes = db.prepare('SELECT COUNT(*) as count FROM notes').get().count;
    const usersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'User'").get().count;
    const adminsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Admin'").get().count;
    const superAdminsCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Super Admin'").get().count;

    res.json({
      totalUsers,
      totalNotes,
      roles: {
        users: usersCount,
        admins: adminsCount,
        superAdmins: superAdminsCount
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err.message);
    res.status(500).json({ error: 'Failed to retrieve admin stats.' });
  }
});

// 2. GET /api/admin/users — List all users with their note counts (Admin & Super Admin)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    const usersListQuery = `
      SELECT u.id, u.username, u.role, u.created_at, COUNT(n.id) as note_count
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id
      GROUP BY u.id
      ORDER BY u.id ASC
    `;
    const users = db.prepare(usersListQuery).all();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users list:', err.message);
    res.status(500).json({ error: 'Failed to retrieve users list.' });
  }
});

// 3. PUT /api/admin/users/:id/role — Change a user's role (Super Admin ONLY)
app.put('/api/admin/users/:id/role', requireSuperAdmin, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { newRole } = req.body;

    // Allowed roles
    const validRoles = ['User', 'Admin', 'Super Admin'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: `Invalid role. Allowed roles are: ${validRoles.join(', ')}` });
    }

    // Safety Rule: You cannot change your own role to prevent accidental lockout
    if (targetUserId === req.session.userId) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    // Check if target user exists
    const targetUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update role in SQLite
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetUserId);

    res.json({
      message: `User "${targetUser.username}" role updated to "${newRole}".`,
      user: { id: targetUserId, username: targetUser.username, role: newRole }
    });
  } catch (err) {
    console.error('Error updating user role:', err.message);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// 4. DELETE /api/admin/users/:id — Delete a user account and their notes (Super Admin ONLY)
app.delete('/api/admin/users/:id', requireSuperAdmin, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    // Safety Rule: You cannot delete your own Super Admin account!
    if (targetUserId === req.session.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete user's notes first, then delete user
    db.prepare('DELETE FROM notes WHERE user_id = ?').run(targetUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(targetUserId);

    res.json({ message: `User "${targetUser.username}" and their notes were deleted.` });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ========================================================
// USER-SCOPED NOTES API (Protected with requireAuth)
// ========================================================

// 1. GET /api/notes — Retrieve ONLY the logged-in user's notes
app.get('/api/notes', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    // Strictly filter by user_id so users can only see their own notes!
    const notes = db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY id DESC').all(userId);
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// 2. POST /api/notes — Create a note belonging to the logged-in user
app.post('/api/notes', requireAuth, (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.session.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Note title is required and cannot be empty.' });
    }

    const insertQuery = db.prepare('INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)');
    const result = insertQuery.run(userId, title.trim(), content ? content.trim() : '');

    const newNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newNote);
  } catch (err) {
    console.error('Error creating note:', err.message);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// 3. GET /api/notes/:id — Retrieve a single note (verifying ownership)
app.get('/api/notes/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(id, userId);

    if (!note) {
      return res.status(404).json({ error: `Note with ID ${id} was not found.` });
    }

    res.json(note);
  } catch (err) {
    console.error('Error fetching note by id:', err.message);
    res.status(500).json({ error: 'Failed to retrieve note.' });
  }
});

// 4. PUT /api/notes/:id — Update a note (verifying ownership)
app.put('/api/notes/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.session.userId;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Note title is required and cannot be empty.' });
    }

    const updateQuery = db.prepare(`
      UPDATE notes 
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `);
    const result = updateQuery.run(title.trim(), content ? content.trim() : '', id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: `Note with ID ${id} was not found or you do not have permission.` });
    }

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    res.json(updatedNote);
  } catch (err) {
    console.error('Error updating note:', err.message);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// 5. DELETE /api/notes/:id — Delete a note (verifying ownership)
app.delete('/api/notes/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const deleteQuery = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?');
    const result = deleteQuery.run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: `Note with ID ${id} was not found or you do not have permission.` });
    }

    res.json({ message: `Note with ID ${id} was successfully deleted.` });
  } catch (err) {
    console.error('Error deleting note:', err.message);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
