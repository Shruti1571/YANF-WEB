const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('yanf_admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function loginStep1(username, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login-step1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to authenticate.');
  return data;
}

export async function verifyOtp(username, otp) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, otp })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify OTP.');
  if (data.token) {
    localStorage.setItem('yanf_admin_token', data.token);
    localStorage.setItem('yanf_admin_user', JSON.stringify(data.user));
  }
  return data;
}

export async function uploadImageToDrive(file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload image to Google Drive.');
  return data;
}

export async function createBlogPost(blogData) {
  const res = await fetch(`${API_BASE_URL}/blogs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(blogData)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to publish blog post.');
  return data;
}

export async function fetchPublishedBlogs(category = '', search = '') {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE_URL}/blogs?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch blog posts.');
  return data;
}

export async function deleteBlogPost(id) {
  const res = await fetch(`${API_BASE_URL}/blogs/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders()
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete blog post.');
  return data;
}

export async function addNewAdminUser(adminData) {
  const res = await fetch(`${API_BASE_URL}/auth/add-admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(adminData)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create new admin user.');
  return data;
}
