
document.addEventListener('DOMContentLoaded', () => {
  const elements = {
      form: document.getElementById('user-form'),
      firstName: document.getElementById('first-name'),
      lastName: document.getElementById('last-name'),
      email: document.getElementById('email'),
      phone: document.getElementById('phone'),
      address: document.getElementById('address'),
      image: document.getElementById('image'),
      govtId: document.getElementById('govt-id'),
      imagePreview: document.getElementById('image-preview'),
      idPreview: document.getElementById('id-preview'),
      submitBtn: document.getElementById('submit-btn'),
      cancelBtn: document.getElementById('cancel-btn'),
      usersList: document.getElementById('users-list'),
      formTitle: document.getElementById('form-title')
  };

  const config = {
      apiBase: 'http://localhost:5000/api/users',
      uploadsBase: 'http://localhost:5000/uploads/',
      placeholderImage: './assets/placeholder-image.png',
      placeholderId: './assets/placeholder-id.png'
  };

  const state = {
      isEditing: false,
      currentId: null
  };

  function init() {
      loadUsers();
      setupEventListeners();
  }

  function setupEventListeners() {
      elements.form.addEventListener('submit', handleSubmit);
      elements.cancelBtn.addEventListener('click', resetForm);
      elements.image.addEventListener('change', (e) => previewFile(e, elements.imagePreview, 'image'));
      elements.govtId.addEventListener('change', (e) => previewFile(e, elements.idPreview, 'govtId'));
  }

  async function fetchUsers() {
      try {
          const response = await fetch(config.apiBase);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
      } catch (error) {
          console.error('Error fetching users:', error);
          throw error;
      }
  }

  async function fetchUser(id) {
      try {
          const response = await fetch(`${config.apiBase}/${id}`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
      } catch (error) {
          console.error('Error fetching user:', error);
          throw error;
      }
  }

  async function saveUser(data, id = null) {
      const url = id ? `${config.apiBase}/${id}` : config.apiBase;
      const method = id ? 'PUT' : 'POST';

      try {
          const response = await fetch(url, {
              method,
              body: data
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to save user');
          }

          return await response.json();
      } catch (error) {
          console.error('Error saving user:', error);
          throw error;
      }
  }

  async function deleteUserApi(id) {
      try {
          const response = await fetch(`${config.apiBase}/${id}`, {
              method: 'DELETE'
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete user');
          }
      } catch (error) {
          console.error('Error deleting user:', error);
          throw error;
      }
  }

  async function loadUsers() {
      try {
          elements.usersList.innerHTML = '<tr><td colspan="8">Loading users...</td></tr>';
          const users = await fetchUsers();
          renderUsers(users);
      } catch (error) {
          elements.usersList.innerHTML = `<tr><td colspan="8" class="error">Error: ${error.message}</td></tr>`;
      }
  }

  function renderUsers(users) {
      if (!Array.isArray(users)) {
          elements.usersList.innerHTML = '<tr><td colspan="8" class="error">Invalid data received from server</td></tr>';
          return;
      }

      if (users.length === 0) {
          elements.usersList.innerHTML = '<tr><td colspan="8">No users found</td></tr>';
          return;
      }

      elements.usersList.innerHTML = users.map(user => `
          <tr>
              <td>${user.firstName || ''}</td>
              <td>${user.lastName || ''}</td>
              <td>${user.email || ''}</td>
              <td>${user.phone || ''}</td>
              <td>${user.address || ''}</td>
              <td class="image-cell">
                  ${user.imageUrl ? `
                      <img src="${user.imageUrl}" class="user-image" 
                           onerror="handleImageError(this, 'profile')" 
                           alt="Profile Image">
                  ` : '<span class="no-file">No Image</span>'}
              </td>
              <td class="image-cell">
                  ${user.govtIdUrl ? (
                      user.govtIdUrl.toLowerCase().endsWith('.pdf') ?
                      `<a href="${user.govtIdUrl}" target="_blank" class="pdf-link">View PDF</a>` :
                      `<img src="${user.govtIdUrl}" class="user-image" 
                            onerror="handleImageError(this, 'id')" 
                            alt="Government ID">`
                  ) : '<span class="no-file">No ID</span>'}
              </td>
              <td class="actions">
                  <button class="edit-btn" data-id="${user.id}">Edit</button>
                  <button class="delete-btn" data-id="${user.id}">Delete</button>
              </td>
          </tr>
      `).join('');

      document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', () => startEdit(btn.dataset.id));
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
      });
  }

  function previewFile(event, container, type) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          if (file.type === 'application/pdf') {
              container.innerHTML = `
                  <div class="pdf-preview">
                      <i class="pdf-icon">PDF</i>
                      <span>${file.name}</span>
                  </div>`;
          } else {
              container.innerHTML = `
                  <img src="${e.target.result}" 
                       class="preview-image" 
                       alt="${type === 'image' ? 'Profile' : 'ID'} Preview">`;
          }
      };
      
      reader.onerror = () => {
          container.innerHTML = '<span class="error">Error loading file preview</span>';
      };
      
      reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
      event.preventDefault();

      if (!elements.firstName.value.trim() || !elements.email.value.trim()) {
          alert('First name and email are required fields');
          return;
      }

      try {
          const formData = new FormData();
          formData.append('firstName', elements.firstName.value.trim());
          formData.append('lastName', elements.lastName.value.trim());
          formData.append('email', elements.email.value.trim());
          formData.append('phone', elements.phone.value.trim());
          formData.append('address', elements.address.value.trim());

          if (elements.image.files[0]) formData.append('image', elements.image.files[0]);
          if (elements.govtId.files[0]) formData.append('govtId', elements.govtId.files[0]);

          await saveUser(formData, state.currentId);
          
          resetForm();
          await loadUsers();
          showToast('User saved successfully!');
      } catch (error) {
          alert(`Error: ${error.message}`);
      }
  }

  async function startEdit(id) {
      try {
          const user = await fetchUser(id);
          
          state.isEditing = true;
          state.currentId = id;
          
          elements.formTitle.textContent = 'Edit User';
          elements.submitBtn.textContent = 'Update';
          elements.cancelBtn.style.display = 'inline-block';
          
          elements.firstName.value = user.firstName || '';
          elements.lastName.value = user.lastName || '';
          elements.email.value = user.email || '';
          elements.phone.value = user.phone || '';
          elements.address.value = user.address || '';
          
          updatePreview(elements.imagePreview, user.imageUrl, 'profile');
          updatePreview(elements.idPreview, user.govtIdUrl, 'id');
      } catch (error) {
          alert(`Failed to load user for editing: ${error.message}`);
      }
  }

  function updatePreview(container, url, type) {
      if (!url) {
          container.innerHTML = `<span class="no-file">No current ${type === 'profile' ? 'image' : 'ID'}</span>`;
          return;
      }

      if (url.toLowerCase().endsWith('.pdf')) {
          container.innerHTML = `
              <div class="pdf-preview">
                  <i class="pdf-icon">PDF</i>
                  <span>Current ${type === 'profile' ? 'Profile' : 'Government ID'}</span>
              </div>`;
      } else {
          container.innerHTML = `
              <img src="${url}" 
                   class="preview-image" 
                   alt="Current ${type === 'profile' ? 'Profile' : 'Government ID'}"
                   onerror="this.src='${type === 'profile' ? config.placeholderImage : config.placeholderId}'">`;
      }
  }

  async function confirmDelete(id) {
      if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
      
      try {
          await deleteUserApi(id);
          await loadUsers();
          showToast('User deleted successfully!');
      } catch (error) {
          alert(`Failed to delete user: ${error.message}`);
      }
  }

  function resetForm() {
      elements.form.reset();
      elements.imagePreview.innerHTML = '';
      elements.idPreview.innerHTML = '';
      state.isEditing = false;
      state.currentId = null;
      elements.formTitle.textContent = 'Add New User';
      elements.submitBtn.textContent = 'Submit';
      elements.cancelBtn.style.display = 'none';
  }

  function showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
          toast.classList.add('fade-out');
          setTimeout(() => toast.remove(), 500);
      }, 3000);
  }

  window.handleImageError = function(img, type) {
      img.onerror = null;
      img.src = type === 'profile' ? config.placeholderImage : config.placeholderId;
      img.alt = type === 'profile' ? 'Profile image not available' : 'Government ID not available';
      img.style.width = '50px';
      img.style.height = '50px';
      img.style.objectFit = 'cover';
  };

  init();
});