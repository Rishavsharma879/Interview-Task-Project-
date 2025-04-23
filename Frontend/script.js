// Sample data storage (in a real app, you'd use a database)
let users = [];

// DOM elements
const userForm = document.getElementById('user-form');
const usersList = document.getElementById('users-list');
const imageInput = document.getElementById('image');
const govtIdInput = document.getElementById('govt-id');
const imagePreview = document.getElementById('image-preview');
const idPreview = document.getElementById('id-preview');

// Handle image previews
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" width="100">`;
        };
        reader.readAsDataURL(file);
    }
});

govtIdInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            idPreview.innerHTML = `<img src="${e.target.result}" width="100">`;
        };
        reader.readAsDataURL(file);
    }
});

// Form submission
userForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('user-id').value;
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    
    // Get image data
    const profileImage = imageInput.files[0];
    const govtId = govtIdInput.files[0];
    
    let profileImageSrc = '';
    let govtIdSrc = '';
    
    // Convert images to base64 for demo purposes
    // In a real app, you'd upload to server and store the path
    if (profileImage) {
        profileImageSrc = URL.createObjectURL(profileImage);
    }
    
    if (govtId) {
        govtIdSrc = URL.createObjectURL(govtId);
    }
    
    const userData = {
        id: userId || Date.now().toString(),
        firstName,
        lastName,
        email,
        phone,
        address,
        profileImage: profileImageSrc,
        govtId: govtIdSrc
    };
    
    if (userId) {
        // Update existing user
        const index = users.findIndex(user => user.id === userId);
        users[index] = userData;
    } else {
        // Add new user
        users.push(userData);
    }
    
    renderUsersList();
    userForm.reset();
    imagePreview.innerHTML = '';
    idPreview.innerHTML = '';
    document.getElementById('submit-btn').textContent = 'Submit';
    document.getElementById('user-id').value = '';
    document.getElementById('cancel-btn').style.display = 'none';
});

// Render users list
function renderUsersList() {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${user.firstName}</td>
            <td>${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.address}</td>
            <td>${user.profileImage ? `<img src="${user.profileImage}" width="50">` : 'No Image'}</td>
            <td>${user.govtId ? `<img src="${user.govtId}" width="50">` : 'No ID'}</td>
            <td>
                <button onclick="editUser('${user.id}')">Edit</button>
                <button onclick="deleteUser('${user.id}')">Delete</button>
            </td>
        `;
        
        usersList.appendChild(row);
    });
}

// Edit user
function editUser(id) {
    const user = users.find(user => user.id === id);
    if (user) {
        document.getElementById('user-id').value = user.id;
        document.getElementById('first-name').value = user.firstName;
        document.getElementById('last-name').value = user.lastName;
        document.getElementById('email').value = user.email;
        document.getElementById('phone').value = user.phone;
        document.getElementById('address').value = user.address;
        
        if (user.profileImage) {
            imagePreview.innerHTML = `<img src="${user.profileImage}" width="100">`;
        }
        
        if (user.govtId) {
            idPreview.innerHTML = `<img src="${user.govtId}" width="100">`;
        }
        
        document.getElementById('submit-btn').textContent = 'Update';
        document.getElementById('cancel-btn').style.display = 'inline-block';
    }
}

// Delete user
function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        users = users.filter(user => user.id !== id);
        renderUsersList();
    }
}

// Cancel edit
document.getElementById('cancel-btn').addEventListener('click', function() {
    userForm.reset();
    imagePreview.innerHTML = '';
    idPreview.innerHTML = '';
    document.getElementById('submit-btn').textContent = 'Submit';
    document.getElementById('user-id').value = '';
    this.style.display = 'none';
});

// Initialize
renderUsersList();