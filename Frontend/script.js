document.addEventListener('DOMContentLoaded', () => {
  const userForm = document.getElementById('user-form');
  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const addressInput = document.getElementById('address');
  const imageInput = document.getElementById('image');
  const govtIdInput = document.getElementById('govt-id');
  const imagePreview = document.getElementById('image-preview');
  const idPreview = document.getElementById('id-preview');
  const submitBtn = document.getElementById('submit-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const usersList = document.getElementById('users-list');
  const formTitle = document.getElementById('form-title');

  const API_BASE = 'http://localhost:5000/api/users';
  const UPLOADS_BASE = 'http://localhost:5000/uploads/'; // Base URL for uploads

  let isEditing = false;
  let currentId = null;

  function init() {
    loadUsers();
    setupEventListeners();
  }

  function setupEventListeners() {
    userForm.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', resetForm);
    imageInput.addEventListener('change', (e) => previewFile(e, imagePreview));
    govtIdInput.addEventListener('change', (e) => previewFile(e, idPreview));
  }

  // Load and display users
  async function loadUsers() {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error('Failed to fetch users');

      const users = await res.json();
      renderUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      usersList.innerHTML = `<tr><td colspan="8">Error loading users: ${error.message}</td></tr>`;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('firstName', firstNameInput.value.trim());
      formData.append('lastName', lastNameInput.value.trim());
      formData.append('email', emailInput.value.trim());
      formData.append('phone', phoneInput.value.trim());
      formData.append('address', addressInput.value.trim());

      if (imageInput.files[0]) formData.append('image', imageInput.files[0]);
      if (govtIdInput.files[0]) formData.append('govtId', govtIdInput.files[0]);

      const url = isEditing ? `${API_BASE}/${currentId}` : API_BASE;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Form submission failed');
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Error: ${error.message}`);
    }
  }

  function previewFile(e, container) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (file.type === 'application/pdf') {
        container.innerHTML = `<div class="pdf-preview">
          <i class="pdf-icon">PDF</i>
          <span>${file.name}</span>
        </div>`;
      } else {
        container.innerHTML = `<img src="${ev.target.result}" style="max-width:100px; max-height:100px;">`;
      }
    };
    reader.readAsDataURL(file);
  }

  function renderUsers(users) {
    if (!users || !Array.isArray(users)) {
      usersList.innerHTML = `<tr><td colspan="8">Invalid user data</td></tr>`;
      return;
    }

    usersList.innerHTML = users.length > 0
      ? users.map(user => {
          // Construct proper image URLs - adjust path if needed
          const imageUrl = user.image ? `${UPLOADS_BASE}${user.image}` : null;
          const govtIdUrl = user.govtId ? `${UPLOADS_BASE}${user.govtId}` : null;

          return `
          <tr>
            <td>${user.firstName || ''}</td>
            <td>${user.lastName || ''}</td>
            <td>${user.email || ''}</td>
            <td>${user.phone || ''}</td>
            <td>${user.address || ''}</td>
            <td class="image-cell">
              ${imageUrl
                ? `<img src="${imageUrl}" class="user-image" onerror="this.onerror=null;this.parentElement.innerHTML='No Image'" alt="Profile">`
                : 'No Image'}
            </td>
            <td class="image-cell">
              ${govtIdUrl
                ? (user.govtId.toLowerCase().endsWith('.pdf')
                  ? `<a href="${govtIdUrl}" target="_blank" class="pdf-link">View PDF</a>`
                  : `<img src="${govtIdUrl}" class="user-image" onerror="this.onerror=null;this.parentElement.innerHTML='No ID'" alt="Govt ID">`)
                : 'No ID'}
            </td>
            <td>
              <button class="edit" data-id="${user.id}">Edit</button>
              <button class="delete" data-id="${user.id}">Delete</button>
            </td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="8">No users found</td></tr>`;

    document.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => startEdit(btn.dataset.id));
    });

    document.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this user?')) {
          try {
            const response = await fetch(`${API_BASE}/${btn.dataset.id}`, {
              method: 'DELETE'
            });

            if (response.ok) {
              await loadUsers();
            } else {
              throw new Error('Failed to delete user');
            }
          } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
          }
        }
      });
    });
  }

  async function startEdit(id) {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');

      const user = await response.json();

      isEditing = true;
      currentId = id;
      formTitle.textContent = 'Edit User';
      submitBtn.textContent = 'Update';
      cancelBtn.style.display = 'inline-block';

      // Fill form with user data
      firstNameInput.value = user.firstName || '';
      lastNameInput.value = user.lastName || '';
      emailInput.value = user.email || '';
      phoneInput.value = user.phone || '';
      addressInput.value = user.address || '';

      // Set previews for existing files
      if (user.image) {
        const imageUrl = `${UPLOADS_BASE}${user.image}`;
        imagePreview.innerHTML = `<img src="${imageUrl}" style="max-width:100px; max-height:100px;">`;
      } else {
        imagePreview.innerHTML = '';
      }

      if (user.govtId) {
        const govtIdUrl = `${UPLOADS_BASE}${user.govtId}`;
        if (user.govtId.toLowerCase().endsWith('.pdf')) {
          idPreview.innerHTML = `<div class="pdf-preview">
            <i class="pdf-icon">PDF</i>
            <span>Government ID</span>
          </div>`;
        } else {
          idPreview.innerHTML = `<img src="${govtIdUrl}" style="max-width:100px; max-height:100px;">`;
        }
      } else {
        idPreview.innerHTML = '';
      }
    } catch (error) {
      console.error('Error starting edit:', error);
      alert('Failed to load user for editing');
    }
  }

  function resetForm() {
    userForm.reset();
    imagePreview.innerHTML = '';
    idPreview.innerHTML = '';
    isEditing = false;
    currentId = null;
    formTitle.textContent = 'Add New User';
    submitBtn.textContent = 'Submit';
    cancelBtn.style.display = 'none';
  }

  init();
});