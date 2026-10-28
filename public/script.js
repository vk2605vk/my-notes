// public/script.js - Frontend Connected to REST API

// ========================================================
// 1. SELECTING DOM ELEMENTS
// ========================================================

// Containers & States
const notesGrid = document.getElementById('notes-grid');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const toast = document.getElementById('toast');

// Buttons
const openCreateModalBtn = document.getElementById('open-create-modal-btn');
const emptyCreateBtn = document.getElementById('empty-create-btn');
const retryBtn = document.getElementById('retry-btn');

// Form Modal Elements
const noteFormModal = document.getElementById('note-form-modal');
const noteForm = document.getElementById('note-form');
const formModalTitle = document.getElementById('form-modal-title');
const noteIdInput = document.getElementById('note-id');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const titleError = document.getElementById('title-error');
const closeFormBtn = document.getElementById('close-form-btn');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const saveNoteBtn = document.getElementById('save-note-btn');

// View Modal Elements
const viewModal = document.getElementById('view-modal');
const viewNoteTitle = document.getElementById('view-note-title');
const viewNoteDate = document.getElementById('view-note-date');
const viewNoteContent = document.getElementById('view-note-content');
const closeViewBtn = document.getElementById('close-view-btn');
const viewDoneBtn = document.getElementById('view-done-btn');
const viewEditBtn = document.getElementById('view-edit-btn');
const viewDeleteBtn = document.getElementById('view-delete-btn');

// Delete Confirmation Modal Elements
const deleteModal = document.getElementById('delete-modal');
const deleteNoteName = document.getElementById('delete-note-name');
const closeDeleteBtn = document.getElementById('close-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Tracks the note currently open in view or delete modal
let activeNote = null;

// ========================================================
// 2. API FUNCTIONS (COMMUNICATING WITH THE BACKEND)
// ========================================================

/**
 * 1. FETCH ALL NOTES from GET /api/notes
 */
async function fetchNotes() {
  // Show the loading spinner and hide existing views
  showOnlyState('loading');

  try {
    const response = await fetch('/api/notes');

    // If server responded with an error status (like 500)
    if (!response.ok) {
      throw new Error(`Server returned error code: ${response.status}`);
    }

    // Parse the JSON array returned by Express
    const notes = await response.json();
    renderNotes(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    errorMessage.textContent = 'Could not connect to the server. Please verify your server is running.';
    showOnlyState('error');
  }
}

/**
 * 2. CREATE A NEW NOTE via POST /api/notes
 */
async function createNoteOnServer(title, content) {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Tells Express we are sending JSON text
    },
    body: JSON.stringify({ title, content }) // Converts our JS object into JSON text
  });

  const data = await response.json();

  if (!response.ok) {
    // If backend validation failed (e.g. 400 Bad Request)
    throw new Error(data.error || 'Failed to create note');
  }

  return data;
}

/**
 * 3. UPDATE AN EXISTING NOTE via PUT /api/notes/:id
 */
async function updateNoteOnServer(id, title, content) {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update note');
  }

  return data;
}

/**
 * 4. DELETE A NOTE via DELETE /api/notes/:id
 */
async function deleteNoteOnServer(id) {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete note');
  }

  return data;
}

// ========================================================
// 3. UI STATE HELPERS
// ========================================================

// Controls which primary state is visible on screen
function showOnlyState(state) {
  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorState.classList.add('hidden');
  notesGrid.classList.add('hidden');

  if (state === 'loading') loadingState.classList.remove('hidden');
  if (state === 'empty') emptyState.classList.remove('hidden');
  if (state === 'error') errorState.classList.remove('hidden');
  if (state === 'grid') notesGrid.classList.remove('hidden');
}

// Show a temporary floating message at the bottom right
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

// Format SQLite timestamps cleanly for display
function formatDate(dateString) {
  if (!dateString) return 'Just now';
  // SQLite timestamps come back as 'YYYY-MM-DD HH:MM:SS'
  const d = new Date(dateString.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? dateString : d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Security: Prevent script injection if note content contains HTML tags
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// ========================================================
// 4. RENDERING NOTES CARDS
// ========================================================

function renderNotes(notes) {
  if (!notes || notes.length === 0) {
    showOnlyState('empty');
    return;
  }

  showOnlyState('grid');
  notesGrid.innerHTML = '';

  notes.forEach((note) => {
    const card = document.createElement('article');
    card.className = 'note-card';

    card.innerHTML = `
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(note.title)}</h3>
      </div>
      <p class="card-preview">${escapeHtml(note.content || 'No details provided.')}</p>
      <div class="card-footer">
        <span class="card-date">${formatDate(note.created_at)}</span>
        <div class="card-actions">
          <button class="card-btn edit-btn" title="Edit note" aria-label="Edit">✏️</button>
          <button class="card-btn delete-btn" title="Delete note" aria-label="Delete">🗑️</button>
        </div>
      </div>
    `;

    // Click card to open full reader view
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-btn')) return;
      openViewModal(note);
    });

    // Click edit button
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(note);
    });

    // Click delete button
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(note);
    });

    notesGrid.appendChild(card);
  });
}

// ========================================================
// 5. MODAL MANAGEMENT
// ========================================================

function openCreateModal() {
  formModalTitle.textContent = 'Create Note';
  noteIdInput.value = '';
  noteTitleInput.value = '';
  noteContentInput.value = '';
  titleError.classList.add('hidden');
  noteFormModal.classList.remove('hidden');
  noteTitleInput.focus();
}

function openEditModal(note) {
  formModalTitle.textContent = 'Edit Note';
  noteIdInput.value = note.id;
  noteTitleInput.value = note.title;
  noteContentInput.value = note.content || '';
  titleError.classList.add('hidden');
  noteFormModal.classList.remove('hidden');
  noteTitleInput.focus();
}

function closeFormModal() {
  noteFormModal.classList.add('hidden');
}

function openViewModal(note) {
  activeNote = note;
  viewNoteTitle.textContent = note.title;
  viewNoteContent.textContent = note.content || '(No additional text)';
  viewNoteDate.textContent = `Created on: ${formatDate(note.created_at)}`;
  viewModal.classList.remove('hidden');
}

function closeViewModal() {
  viewModal.classList.add('hidden');
}

function openDeleteModal(note) {
  activeNote = note;
  deleteNoteName.textContent = `"${note.title}"`;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
}

// ========================================================
// 6. EVENT LISTENERS
// ========================================================

// Open create form
openCreateModalBtn.addEventListener('click', openCreateModal);
emptyCreateBtn.addEventListener('click', openCreateModal);

// Retry on error
retryBtn.addEventListener('click', fetchNotes);

// Close modals
closeFormBtn.addEventListener('click', closeFormModal);
cancelFormBtn.addEventListener('click', closeFormModal);
closeViewBtn.addEventListener('click', closeViewModal);
viewDoneBtn.addEventListener('click', closeViewModal);
closeDeleteBtn.addEventListener('click', closeDeleteModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

// Edit & Delete actions from inside the Reader View
viewEditBtn.addEventListener('click', () => {
  const noteToEdit = activeNote;
  closeViewModal();
  if (noteToEdit) openEditModal(noteToEdit);
});

viewDeleteBtn.addEventListener('click', () => {
  const noteToDelete = activeNote;
  closeViewModal();
  if (noteToDelete) openDeleteModal(noteToDelete);
});

// Close when clicking modal backdrop
[noteFormModal, viewModal, deleteModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

// --------------------------------------------------------
// Handle Form Submission (Create or Edit Note)
// --------------------------------------------------------
noteForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Stop page reload

  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  // Client-side quick check
  if (!title) {
    titleError.classList.remove('hidden');
    noteTitleInput.focus();
    return;
  }
  titleError.classList.add('hidden');

  const editingId = noteIdInput.value;

  // Disable button while network request is in flight to prevent double submissions
  saveNoteBtn.disabled = true;
  saveNoteBtn.textContent = 'Saving...';

  try {
    if (editingId) {
      // 1. Send PUT request to update
      await updateNoteOnServer(editingId, title, content);
      showToast('Note updated successfully!', 'success');
    } else {
      // 2. Send POST request to create
      await createNoteOnServer(title, content);
      showToast('Note created successfully!', 'success');
    }

    closeFormModal();
    // Refresh the list directly from the database
    await fetchNotes();
  } catch (err) {
    console.error('Save note error:', err);
    showToast(err.message, 'error');
  } finally {
    saveNoteBtn.disabled = false;
    saveNoteBtn.textContent = 'Save Note';
  }
});

// --------------------------------------------------------
// Handle Delete Confirmation
// --------------------------------------------------------
confirmDeleteBtn.addEventListener('click', async () => {
  if (!activeNote) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  try {
    await deleteNoteOnServer(activeNote.id);
    closeDeleteModal();
    showToast('Note deleted successfully', 'success');
    // Refresh notes list from the database
    await fetchNotes();
  } catch (err) {
    console.error('Delete note error:', err);
    showToast(err.message, 'error');
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = 'Yes, Delete';
  }
});

// ========================================================
// 7. INITIAL LOAD
// ========================================================
// When the browser finishes loading the page, fetch real notes from SQLite
fetchNotes();
