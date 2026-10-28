// server.js - Full REST API for My Notes App

const express = require('express');
const db = require('./server/database');

const app = express();
const PORT = 3000;

// Middleware to parse incoming JSON bodies
app.use(express.json());

// Request logger middleware: prints every incoming request into your terminal in real time
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next(); // 'next()' tells Express to continue to the actual route handler
});

// Serve static frontend files (HTML, CSS, JS) from the "public" folder
app.use(express.static('public'));

// ==========================================
// GROUP A: CREATE AND READ ROUTES
// ==========================================

// 1. POST /api/notes — Create a new note
app.post('/api/notes', (req, res) => {
  try {
    const { title, content } = req.body;

    // Backend validation: reject empty or missing titles
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Note title is required and cannot be empty.' });
    }

    // Parameterized SQL query: the '?' placeholders prevent SQL injection
    const insertQuery = db.prepare('INSERT INTO notes (title, content) VALUES (?, ?)');
    const result = insertQuery.run(title.trim(), content ? content.trim() : '');

    // Retrieve the newly inserted note using its generated row ID
    const newNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);

    // HTTP 201 indicates a resource was successfully created
    res.status(201).json(newNote);
  } catch (err) {
    console.error('Error creating note:', err.message);
    res.status(500).json({ error: 'Failed to create note due to server error.' });
  }
});

// 2. GET /api/notes — Retrieve all notes (newest first)
app.get('/api/notes', (req, res) => {
  try {
    // Order notes by id DESC so the newest notes appear at the top
    const notes = db.prepare('SELECT * FROM notes ORDER BY id DESC').all();
    res.json(notes);
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

// 3. GET /api/notes/:id — Retrieve a single note by ID
app.get('/api/notes/:id', (req, res) => {
  try {
    const { id } = req.params;

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);

    // If no note matches this ID, return HTTP 404 (Not Found)
    if (!note) {
      return res.status(404).json({ error: `Note with ID ${id} was not found.` });
    }

    res.json(note);
  } catch (err) {
    console.error('Error fetching note by id:', err.message);
    res.status(500).json({ error: 'Failed to retrieve note.' });
  }
});

// ==========================================
// GROUP B: UPDATE AND DELETE ROUTES
// ==========================================

// 4. PUT /api/notes/:id — Update an existing note
app.put('/api/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    // Validation: title must not be empty
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Note title is required and cannot be empty.' });
    }

    // Parameterized update query that also updates the updated_at timestamp
    const updateQuery = db.prepare(`
      UPDATE notes 
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    const result = updateQuery.run(title.trim(), content ? content.trim() : '', id);

    // If result.changes is 0, no row had that ID
    if (result.changes === 0) {
      return res.status(404).json({ error: `Note with ID ${id} was not found.` });
    }

    // Fetch and return the updated note
    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    res.json(updatedNote);
  } catch (err) {
    console.error('Error updating note:', err.message);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// 5. DELETE /api/notes/:id — Delete a note by ID
app.delete('/api/notes/:id', (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = db.prepare('DELETE FROM notes WHERE id = ?');
    const result = deleteQuery.run(id);

    // If result.changes is 0, the note did not exist
    if (result.changes === 0) {
      return res.status(404).json({ error: `Note with ID ${id} was not found.` });
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
