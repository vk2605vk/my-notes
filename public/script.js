// public/script.js - Full-Stack Notes with Multi-Role Administration (User, Admin, Super Admin)

// ========================================================
// 1. SELECTING DOM ELEMENTS
// ========================================================

// Main Views & States
const guestState = document.getElementById('guest-state');
const notesView = document.getElementById('notes-view');
const adminView = document.getElementById('admin-view');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const notesGrid = document.getElementById('notes-grid');
const toast = document.getElementById('toast');

// Header Controls & Role Badges
const guestHeaderControls = document.getElementById('guest-header-controls');
const userHeaderControls = document.getElementById('user-header-controls');
const userDisplayName = document.getElementById('user-display-name');
const userRoleBadge = document.getElementById('user-role-badge');
const viewNotesTabBtn = document.getElementById('view-notes-tab-btn');
const viewAdminTabBtn = document.getElementById('view-admin-tab-btn');
const headerLoginBtn = document.getElementById('header-login-btn');
const headerSignupBtn = document.getElementById('header-signup-btn');
const heroLoginBtn = document.getElementById('hero-login-btn');
const heroSignupBtn = document.getElementById('hero-signup-btn');
const logoutBtn = document.getElementById('logout-btn');

// Note Action Buttons
const openCreateModalBtn = document.getElementById('open-create-modal-btn');
const emptyCreateBtn = document.getElementById('empty-create-btn');
const retryBtn = document.getElementById('retry-btn');

// Admin Dashboard Elements
const adminViewTitle = document.getElementById('admin-view-title');
const adminViewSubtitle = document.getElementById('admin-view-subtitle');
const refreshAdminBtn = document.getElementById('refresh-admin-btn');
const statTotalUsers = document.getElementById('stat-total-users');
const statTotalNotes = document.getElementById('stat-total-notes');
const statCountUsers = document.getElementById('stat-count-users');
const statCountAdmins = document.getElementById('stat-count-admins');
const statCountSuperAdmins = document.getElementById('stat-count-superadmins');
const adminUsersTbody = document.getElementById('admin-users-tbody');
const adminAccessNote = document.getElementById('admin-access-note');

// Auth Modal Elements
const authModal = document.getElementById('auth-modal');
const authModalTitle = document.getElementById('auth-modal-title');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const authForm = document.getElementById('auth-form');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authError = document.getElementById('auth-error');
const closeAuthBtn = document.getElementById('close-auth-btn');

// Note Form Modal Elements
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

// View Note Modal Elements
const viewModal = document.getElementById('view-modal');
const viewNoteTitle = document.getElementById('view-note-title');
const viewNoteDate = document.getElementById('view-note-date');
const viewNoteContent = document.getElementById('view-note-content');
const closeViewBtn = document.getElementById('close-view-btn');
const viewDoneBtn = document.getElementById('view-done-btn');
const viewEditBtn = document.getElementById('view-edit-btn');
const viewDeleteBtn = document.getElementById('view-delete-btn');

// Delete Modal Elements
const deleteModal = document.getElementById('delete-modal');
const deleteNoteName = document.getElementById('delete-note-name');
const closeDeleteBtn = document.getElementById('close-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// State Variables
let currentUser = null;     // { id, username, role } or null
let currentView = 'notes';  // 'notes' or 'admin'
let activeNote = null;
let authMode = 'login';

// ========================================================
// 2. AUTHENTICATION & SESSION MANAGEMENT
// ========================================================

/**
 * Check active session on page load
 */
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();

    if (data.user) {
      setLoggedInUI(data.user);
      switchView('notes');
    } else {
      setLoggedOutUI();
    }
  } catch (err) {
    console.error('Check auth error:', err);
    setLoggedOutUI();
  }
}

/**
 * Update UI for logged-in user with role badge & navigation
 */
function setLoggedInUI(user) {
  currentUser = user;
  userDisplayName.textContent = `👤 ${user.username}`;

  // Configure role badge
  userRoleBadge.textContent = user.role || 'User';
  userRoleBadge.className = `role-badge ${getRoleBadgeClass(user.role)}`;

  // Show or hide Admin Dashboard tab based on permissions
  if (user.role === 'Admin' || user.role === 'Super Admin') {
    viewAdminTabBtn.classList.remove('hidden');
    viewAdminTabBtn.textContent = user.role === 'Super Admin' ? '👑 Admin Dashboard' : '🛡️ Admin Dashboard';
  } else {
    viewAdminTabBtn.classList.add('hidden');
  }

  guestHeaderControls.classList.add('hidden');
  userHeaderControls.classList.remove('hidden');
  guestState.classList.add('hidden');
}

/**
 * Helper to get CSS class for role badges
 */
function getRoleBadgeClass(role) {
  if (role === 'Super Admin') return 'role-super-admin';
  if (role === 'Admin') return 'role-admin';
  return 'role-user';
}

/**
 * Update UI for logged-out guest
 */
function setLoggedOutUI() {
  currentUser = null;
  guestHeaderControls.classList.remove('hidden');
  userHeaderControls.classList.add('hidden');
  notesView.classList.add('hidden');
  adminView.classList.add('hidden');
  guestState.classList.remove('hidden');
}

/**
 * Switch view between 'notes' and 'admin'
 */
function switchView(view) {
  currentView = view;

  if (view === 'notes') {
    viewNotesTabBtn.classList.add('active');
    viewAdminTabBtn.classList.remove('active');
    notesView.classList.remove('hidden');
    adminView.classList.add('hidden');
    openCreateModalBtn.classList.remove('hidden');
    fetchNotes();
  } else if (view === 'admin') {
    viewAdminTabBtn.classList.add('active');
    viewNotesTabBtn.classList.remove('active');
    notesView.classList.add('hidden');
    adminView.classList.remove('hidden');
    openCreateModalBtn.classList.add('hidden'); // Hide "+ New Note" while inside Admin Dashboard
    fetchAdminDashboard();
  }
}

// Navigation Tab Click Listeners
viewNotesTabBtn.addEventListener('click', () => switchView('notes'));
viewAdminTabBtn.addEventListener('click', () => switchView('admin'));

// Auth Modal Open/Close
function openAuthModal(mode = 'login') {
  authMode = mode;
  authError.classList.add('hidden');
  authUsernameInput.value = '';
  authPasswordInput.value = '';

  if (mode === 'login') {
    authModalTitle.textContent = 'Log In';
    authSubmitBtn.textContent = 'Log In';
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    authModalTitle.textContent = 'Create Account';
    authSubmitBtn.textContent = 'Sign Up';
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
  }

  authModal.classList.remove('hidden');
  authUsernameInput.focus();
}

function closeAuthModal() {
  authModal.classList.add('hidden');
}

tabLogin.addEventListener('click', () => openAuthModal('login'));
tabSignup.addEventListener('click', () => openAuthModal('signup'));
headerLoginBtn.addEventListener('click', () => openAuthModal('login'));
headerSignupBtn.addEventListener('click', () => openAuthModal('signup'));
heroLoginBtn.addEventListener('click', () => openAuthModal('login'));
heroSignupBtn.addEventListener('click', () => openAuthModal('signup'));
closeAuthBtn.addEventListener('click', closeAuthModal);

// Handle Login or Signup form submit
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = authUsernameInput.value.trim();
  const password = authPasswordInput.value;
  if (!username || !password) return;

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = authMode === 'login' ? 'Logging in...' : 'Creating account...';
  authError.classList.add('hidden');

  const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');

    closeAuthModal();
    setLoggedInUI({ id: data.id, username: data.username, role: data.role });
    showToast(authMode === 'login' ? `Welcome back, ${data.username}!` : `Account created! Welcome, ${data.username}!`, 'success');
    switchView('notes');
  } catch (err) {
    authError.textContent = err.message;
    authError.classList.remove('hidden');
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = authMode === 'login' ? 'Log In' : 'Sign Up';
  }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    showToast('Logged out successfully', 'success');
    setLoggedOutUI();
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Could not log out completely.', 'error');
  }
});

// ========================================================
// 3. ADMIN DASHBOARD LOGIC (ADMIN & SUPER ADMIN)
// ========================================================

/**
 * Fetch and render all statistics and user directory
 */
async function fetchAdminDashboard() {
  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Super Admin')) {
    showToast('Forbidden. Admin access required.', 'error');
    switchView('notes');
    return;
  }

  // Adjust dashboard titles based on role
  if (currentUser.role === 'Super Admin') {
    adminViewTitle.textContent = '👑 Super Admin Master Dashboard';
    adminViewSubtitle.textContent = 'Full administrative control: monitor clubhouse metrics and manage administrator privileges.';
    adminAccessNote.textContent = 'Super Admin controls active: full promote & delete permissions';
    adminAccessNote.style.color = '#059669';
    adminAccessNote.style.backgroundColor = '#ecfdf5';
  } else {
    adminViewTitle.textContent = '🛡️ Admin Monitor Dashboard';
    adminViewSubtitle.textContent = 'Clubhouse metrics and member directory.';
    adminAccessNote.textContent = 'Read-only mode (Super Admin required to alter roles)';
    adminAccessNote.style.color = '#3730a3';
    adminAccessNote.style.backgroundColor = '#e0e7ff';
  }

  try {
    const [statsRes, usersRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/users')
    ]);

    if (statsRes.status === 403 || usersRes.status === 403) {
      showToast('Forbidden. Admin privileges required.', 'error');
      switchView('notes');
      return;
    }

    const stats = await statsRes.json();
    const users = await usersRes.json();

    renderAdminStats(stats);
    renderAdminUsers(users);
  } catch (err) {
    console.error('Admin fetch error:', err);
    showToast('Failed to load administrative data.', 'error');
  }
}

refreshAdminBtn.addEventListener('click', fetchAdminDashboard);

/**
 * Render system statistics cards
 */
function renderAdminStats(stats) {
  statTotalUsers.textContent = stats.totalUsers || 0;
  statTotalNotes.textContent = stats.totalNotes || 0;
  statCountUsers.textContent = `${stats.roles.users || 0} Users`;
  statCountAdmins.textContent = `${stats.roles.admins || 0} Admins`;
  statCountSuperAdmins.textContent = `${stats.roles.superAdmins || 0} Super Admins`;
}

/**
 * Render users management table
 */
function renderAdminUsers(users) {
  adminUsersTbody.innerHTML = '';
  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin';

  users.forEach((u) => {
    const tr = document.createElement('tr');
    const isSelf = currentUser && currentUser.id === u.id;

    let actionCellContent = '';

    if (isSuperAdmin) {
      if (isSelf) {
        actionCellContent = `<span class="card-date">(You - Active Super Admin)</span>`;
      } else {
        actionCellContent = `
          <div class="table-actions">
            <select class="role-select" data-user-id="${u.id}" aria-label="Change role for ${u.username}">
              <option value="User" ${u.role === 'User' ? 'selected' : ''}>User</option>
              <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
              <option value="Super Admin" ${u.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
            </select>
            <button class="card-btn delete-btn delete-user-btn" data-user-id="${u.id}" data-username="${escapeHtml(u.username)}" title="Delete user account">
              🗑️ Delete
            </button>
          </div>
        `;
      }
    } else {
      actionCellContent = `<span class="card-date">${isSelf ? '(You)' : 'Read-only'}</span>`;
    }

    tr.innerHTML = `
      <td><strong>#${u.id}</strong></td>
      <td><strong>${escapeHtml(u.username)}</strong> ${isSelf ? '<small style="color:var(--primary); font-weight:700;">(You)</small>' : ''}</td>
      <td><span class="role-badge ${getRoleBadgeClass(u.role)}">${u.role}</span></td>
      <td>${u.note_count} note${u.note_count === 1 ? '' : 's'}</td>
      <td>${formatDate(u.created_at)}</td>
      <td>${actionCellContent}</td>
    `;

    adminUsersTbody.appendChild(tr);
  });

  // Attach event listeners for Super Admin controls
  if (isSuperAdmin) {
    // Role change dropdowns
    adminUsersTbody.querySelectorAll('.role-select').forEach((select) => {
      select.addEventListener('change', async (e) => {
        const targetUserId = e.target.getAttribute('data-user-id');
        const newRole = e.target.value;
        await updateUserRole(targetUserId, newRole);
      });
    });

    // Delete user buttons
    adminUsersTbody.querySelectorAll('.delete-user-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const targetUserId = e.target.getAttribute('data-user-id');
        const targetUsername = e.target.getAttribute('data-username');
        await deleteUserAccount(targetUserId, targetUsername);
      });
    });
  }
}

/**
 * Super Admin Action: Update a user's role
 */
async function updateUserRole(userId, newRole) {
  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newRole })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(data.message, 'success');
    await fetchAdminDashboard();
  } catch (err) {
    console.error('Update role error:', err);
    showToast(err.message, 'error');
    await fetchAdminDashboard();
  }
}

/**
 * Super Admin Action: Delete a user account and their notes
 */
async function deleteUserAccount(userId, username) {
  const confirmed = confirm(`Are you sure you want to permanently delete user "${username}" and all of their notes? This action cannot be undone.`);
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(data.message, 'success');
    await fetchAdminDashboard();
  } catch (err) {
    console.error('Delete user error:', err);
    showToast(err.message, 'error');
  }
}

// ========================================================
// 4. NOTES API CALLS (USER-SCOPED)
// ========================================================

async function fetchNotes() {
  if (!currentUser) return;

  showOnlyState('loading');

  try {
    const response = await fetch('/api/notes');

    if (response.status === 401) {
      setLoggedOutUI();
      return;
    }

    if (!response.ok) {
      throw new Error(`Server error code: ${response.status}`);
    }

    const notes = await response.json();
    renderNotes(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    errorMessage.textContent = 'Could not load your notes. Please check that the server is running.';
    showOnlyState('error');
  }
}

async function createNoteOnServer(title, content) {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create note');
  return data;
}

async function updateNoteOnServer(id, title, content) {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update note');
  return data;
}

async function deleteNoteOnServer(id) {
  const response = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete note');
  return data;
}

// ========================================================
// 5. UI STATE HELPERS
// ========================================================

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

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

function formatDate(dateString) {
  if (!dateString) return 'Just now';
  const d = new Date(dateString.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? dateString : d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// ========================================================
// 6. RENDERING NOTES CARDS
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

    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-btn')) return;
      openViewModal(note);
    });

    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(note);
    });

    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteModal(note);
    });

    notesGrid.appendChild(card);
  });
}

// ========================================================
// 7. NOTE MODALS MANAGEMENT
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

openCreateModalBtn.addEventListener('click', openCreateModal);
emptyCreateBtn.addEventListener('click', openCreateModal);
retryBtn.addEventListener('click', fetchNotes);

closeFormBtn.addEventListener('click', closeFormModal);
cancelFormBtn.addEventListener('click', closeFormModal);
closeViewBtn.addEventListener('click', closeViewModal);
viewDoneBtn.addEventListener('click', closeViewModal);
closeDeleteBtn.addEventListener('click', closeDeleteModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);

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

[authModal, noteFormModal, viewModal, deleteModal].forEach((modal) => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  });
});

noteForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = noteTitleInput.value.trim();
  const content = noteContentInput.value.trim();

  if (!title) {
    titleError.classList.remove('hidden');
    noteTitleInput.focus();
    return;
  }
  titleError.classList.add('hidden');

  const editingId = noteIdInput.value;
  saveNoteBtn.disabled = true;
  saveNoteBtn.textContent = 'Saving...';

  try {
    if (editingId) {
      await updateNoteOnServer(editingId, title, content);
      showToast('Note updated successfully!', 'success');
    } else {
      await createNoteOnServer(title, content);
      showToast('Note created successfully!', 'success');
    }

    closeFormModal();
    await fetchNotes();
  } catch (err) {
    console.error('Save note error:', err);
    showToast(err.message, 'error');
  } finally {
    saveNoteBtn.disabled = false;
    saveNoteBtn.textContent = 'Save Note';
  }
});

confirmDeleteBtn.addEventListener('click', async () => {
  if (!activeNote) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.textContent = 'Deleting...';

  try {
    await deleteNoteOnServer(activeNote.id);
    closeDeleteModal();
    showToast('Note deleted successfully', 'success');
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
// 8. INITIAL LOAD
// ========================================================
checkAuth();
