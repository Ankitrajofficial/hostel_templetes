// =========================================
// MK HEIGHT Admin Dashboard JavaScript
// =========================================

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupEventListeners();
});

// =========================================
// Authentication Functions
// =========================================

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
        window.location.href = '/admin/login';
        return;
    }

    // Update UI with user info
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;
    document.getElementById('welcomeName').textContent = user.name;

    // Hide admin-only features for non-admin users
    if (user.role !== 'admin') {
        const userManagementNav = document.querySelector('[data-section="users"]');
        if (userManagementNav) {
            userManagementNav.style.display = 'none';
        }
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// =========================================
// Dashboard Data
// =========================================

async function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Always load new queries count for the badge
    loadNewQueriesCount();
    
    if (user && user.role === 'admin') {
        try {
            const response = await fetch('/api/users', {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const users = await response.json();
                updateStats(users);
                populateUsersTable(users);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }
}

// Load new queries count for sidebar badge
async function loadNewQueriesCount() {
    try {
        const response = await fetch('/api/queries?status=new', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const newCount = data.stats?.new || 0;
            const badge = document.getElementById('queriesNavBadge');
            
            if (badge) {
                if (newCount > 0) {
                    badge.textContent = newCount > 99 ? '99+' : newCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error loading queries count:', error);
    }
}

// Refresh badge count every 30 seconds
setInterval(loadNewQueriesCount, 30000);


function updateStats(users) {
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('activeUsers').textContent = users.filter(u => u.isActive).length;
    document.getElementById('totalManagers').textContent = users.filter(u => u.role === 'manager').length;
    document.getElementById('totalReception').textContent = users.filter(u => u.role === 'reception').length;
}

function populateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (!users.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-users-slash" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; background: rgba(212, 175, 55, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-user" style="color: var(--gold);"></i>
                    </div>
                    ${user.name}
                </div>
            </td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i>
                ${user.isActive ? 'Active' : 'Inactive'}
            </span></td>
            <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editUser('${user._id}')" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteUser('${user._id}')" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// =========================================
// Navigation
// =========================================

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });

    // User form submission
    document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);

    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);
}

function showSection(sectionId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });

    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'students': 'Students',
        'rooms': 'Room Occupancy',
        'rent': 'Rent Management',
        'activity': 'Activity Tracking',
        'users': 'User Management',
        'queries': 'Booking Queries',
        'trialstay': 'Trial Stay',
        'settings': 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';

    // Load section-specific data
    if (sectionId === 'activity') {
        loadActivityStats();
        loadActivityLogs();
    }
    
    if (sectionId === 'students') {
        loadStudents();
    }
    
    if (sectionId === 'rooms') {
        loadRoomOccupancy();
    }
    
    if (sectionId === 'rent') {
        initRentSection();
        loadRentStatus();
    }
    
    if (sectionId === 'queries') {
        loadQueries();
    }
    
    if (sectionId === 'trialstay') {
        loadTrialStayQueries();
    }
    
    if (sectionId === 'contactqueries') {
        loadContactQueries();
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        document.querySelector('.sidebar').classList.remove('active');
    }
}

function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

// =========================================
// User Management
// =========================================

let currentUsers = [];

function openAddUserModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-user-plus"></i> Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordGroup').style.display = 'block';
    document.getElementById('userPassword').required = true;
    document.getElementById('statusGroup').style.display = 'none';
    document.getElementById('userSubmitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Save User';
    document.getElementById('userModal').classList.add('active');
}

async function editUser(userId) {
    try {
        const response = await fetch('/api/users', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const users = await response.json();
            const user = users.find(u => u._id === userId);
            
            if (user) {
                document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit User';
                document.getElementById('userId').value = user._id;
                document.getElementById('userFullName').value = user.name;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userPassword').value = '';
                document.getElementById('userPassword').required = false;
                document.getElementById('passwordGroup').querySelector('small').textContent = 'Leave empty to keep current password';
                document.getElementById('userRoleSelect').value = user.role;
                document.getElementById('userStatus').value = user.isActive.toString();
                document.getElementById('statusGroup').style.display = 'block';
                document.getElementById('userSubmitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Update User';
                document.getElementById('userModal').classList.add('active');
            }
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        alert('Error loading user data');
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

async function handleUserFormSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const isEdit = !!userId;
    
    const userData = {
        name: document.getElementById('userFullName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRoleSelect').value
    };

    if (isEdit) {
        userData.isActive = document.getElementById('userStatus').value === 'true';
    }

    const password = document.getElementById('userPassword').value;
    if (password) {
        userData.password = password;
    }

    try {
        const url = isEdit ? `/api/users/${userId}` : '/api/users';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            closeUserModal();
            loadDashboardData();
            showNotification(data.message || 'User saved successfully', 'success');
        } else {
            showNotification(data.message || 'Error saving user', 'error');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showNotification('Connection error', 'error');
    }
}

async function deleteUser(userId) {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (currentUser && currentUser.id === userId) {
        showNotification('Cannot delete your own account', 'error');
        return;
    }

    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok) {
            loadDashboardData();
            showNotification(data.message || 'User deleted successfully', 'success');
        } else {
            showNotification(data.message || 'Error deleting user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Connection error', 'error');
    }
}

// =========================================
// Settings
// =========================================

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('changePasswordForm').reset();
            showNotification(data.message || 'Password changed successfully', 'success');
        } else {
            showNotification(data.message || 'Error changing password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Connection error', 'error');
    }
}

// =========================================
// Notifications
// =========================================

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
        color: white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    `;

    // Add animation keyframes if not exists
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(100px); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modal on outside click
document.getElementById('userModal').addEventListener('click', (e) => {
    if (e.target.id === 'userModal') {
        closeUserModal();
    }
});

// =========================================
// Activity Tracking
// =========================================

let activityCurrentPage = 1;

async function loadActivityStats() {
    try {
        const response = await fetch('/api/activity/stats', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const stats = await response.json();
            
            // Update stat cards
            document.getElementById('activeNowCount').textContent = stats.activeNow || 0;
            document.getElementById('todayLoginsCount').textContent = stats.todayLogins || 0;
            document.getElementById('weeklyActiveCount').textContent = stats.weeklyActiveUsers || 0;
            document.getElementById('todayActivitiesCount').textContent = stats.todayActivities || 0;
            
            // Update active users list
            const activeUsersList = document.getElementById('activeUsersList');
            if (stats.activeUsers && stats.activeUsers.length > 0) {
                activeUsersList.innerHTML = stats.activeUsers.map(user => `
                    <div class="active-user-chip">
                        <i class="fa-solid fa-circle"></i>
                        <span>${user.name}</span>
                        <span class="user-role-mini">${user.role}</span>
                    </div>
                `).join('');
            } else {
                activeUsersList.innerHTML = '<p class="no-data">No users currently active</p>';
            }
        }
    } catch (error) {
        console.error('Error loading activity stats:', error);
    }
}

async function loadActivityLogs(page = 1) {
    activityCurrentPage = page;
    const category = document.getElementById('activityCategoryFilter')?.value || '';
    const date = document.getElementById('activityDateFilter')?.value || '';
    
    let url = `/api/activity?page=${page}&limit=20`;
    if (category) url += `&category=${category}`;
    if (date) {
        url += `&startDate=${date}T00:00:00&endDate=${date}T23:59:59`;
    }
    
    try {
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            populateActivityTable(data.activities);
            renderActivityPagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

function populateActivityTable(activities) {
    const tbody = document.getElementById('activityTableBody');
    
    if (!activities || !activities.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-clipboard-list" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No activity logs found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = activities.map(activity => {
        const time = formatActivityTime(activity.timestamp);
        const userName = activity.userId?.name || 'Unknown User';
        const userEmail = activity.userId?.email || '';
        const actionDisplay = formatActionName(activity.action);
        const details = formatActivityDetails(activity.details);
        
        return `
            <tr>
                <td class="activity-time">
                    ${time.time}
                    <div class="date">${time.date}</div>
                </td>
                <td>
                    <span class="user-activity-link" onclick="viewUserActivity('${activity.userId?._id}')" title="${userEmail}">
                        ${userName}
                    </span>
                </td>
                <td class="action-cell">
                    ${getActionIcon(activity.action)} ${actionDisplay}
                </td>
                <td>
                    <span class="activity-badge ${activity.category}">${activity.category}</span>
                </td>
                <td class="activity-details" title="${details}">${details}</td>
                <td class="activity-ip">${activity.ip || '-'}</td>
            </tr>
        `;
    }).join('');
}

function formatActivityTime(timestamp) {
    const date = new Date(timestamp);
    return {
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
}

function formatActionName(action) {
    const names = {
        'login': 'Login',
        'logout': 'Logout',
        'google_login': 'Google Login',
        'register': 'Registration',
        'booking_create': 'Booking Created',
        'booking_update': 'Booking Updated',
        'booking_cancel': 'Booking Cancelled',
        'booking_payment': 'Payment Made',
        'user_create': 'User Created',
        'user_update': 'User Updated',
        'user_delete': 'User Deleted',
        'settings_update': 'Settings Updated',
        'page_view': 'Page View'
    };
    return names[action] || action;
}

function getActionIcon(action) {
    const icons = {
        'login': '<i class="fa-solid fa-right-to-bracket" style="color: var(--success);"></i>',
        'logout': '<i class="fa-solid fa-right-from-bracket" style="color: var(--danger);"></i>',
        'google_login': '<i class="fa-brands fa-google" style="color: var(--info);"></i>',
        'register': '<i class="fa-solid fa-user-plus" style="color: var(--purple);"></i>',
        'booking_create': '<i class="fa-solid fa-calendar-plus" style="color: var(--success);"></i>',
        'booking_update': '<i class="fa-solid fa-calendar-pen" style="color: var(--warning);"></i>',
        'booking_cancel': '<i class="fa-solid fa-calendar-xmark" style="color: var(--danger);"></i>',
        'user_create': '<i class="fa-solid fa-user-plus" style="color: var(--gold);"></i>',
        'settings_update': '<i class="fa-solid fa-gear" style="color: var(--gold);"></i>'
    };
    return icons[action] || '<i class="fa-solid fa-circle-dot"></i>';
}

function formatActivityDetails(details) {
    if (!details || Object.keys(details).length === 0) return '-';
    
    if (details.method) return `Method: ${details.method}`;
    if (details.page) return `Page: ${details.page}`;
    
    return JSON.stringify(details);
}

function renderActivityPagination(pagination) {
    const container = document.getElementById('activityPagination');
    if (!pagination || pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button class="pagination-btn" onclick="loadActivityLogs(${pagination.page - 1})" ${pagination.page <= 1 ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    for (let i = 1; i <= Math.min(pagination.pages, 5); i++) {
        html += `<button class="pagination-btn ${pagination.page === i ? 'active' : ''}" onclick="loadActivityLogs(${i})">${i}</button>`;
    }
    
    if (pagination.pages > 5) {
        html += `<span style="color: var(--text-muted);">...</span>`;
        html += `<button class="pagination-btn" onclick="loadActivityLogs(${pagination.pages})">${pagination.pages}</button>`;
    }
    
    // Next button
    html += `<button class="pagination-btn" onclick="loadActivityLogs(${pagination.page + 1})" ${pagination.page >= pagination.pages ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-right"></i>
    </button>`;
    
    container.innerHTML = html;
}

function refreshActivityData() {
    loadActivityStats();
    loadActivityLogs(activityCurrentPage);
    showNotification('Activity data refreshed', 'success');
}

async function viewUserActivity(userId) {
    if (!userId) return;
    
    try {
        const response = await fetch(`/api/activity/user/${userId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            showUserActivityModal(data);
        }
    } catch (error) {
        console.error('Error loading user activity:', error);
    }
}

function showUserActivityModal(data) {
    // Create dynamic modal for user activity
    const existingModal = document.getElementById('userActivityModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'userActivityModal';
    modal.className = 'modal active';
    modal.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    
    const lastLogin = data.stats.lastLogin ? new Date(data.stats.lastLogin).toLocaleString() : 'Never';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-clock"></i> User Activity: ${data.user.name}</h3>
                <button class="modal-close" onclick="document.getElementById('userActivityModal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                    <div style="background: var(--secondary-dark); padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--gold);">${data.stats.totalActivities}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Total Activities</div>
                    </div>
                    <div style="background: var(--secondary-dark); padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${data.stats.loginCount}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Total Logins</div>
                    </div>
                    <div style="background: var(--secondary-dark); padding: 16px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 0.9rem; color: var(--text-primary);">${lastLogin}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Last Login</div>
                    </div>
                </div>
                
                <h4 style="margin-bottom: 12px;">Recent Activity</h4>
                <div style="background: var(--secondary-dark); border-radius: 8px; overflow: hidden;">
                    ${data.activities.slice(0, 10).map(activity => `
                        <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                ${getActionIcon(activity.action)} 
                                <span style="margin-left: 8px;">${formatActionName(activity.action)}</span>
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.85rem;">
                                ${new Date(activity.timestamp).toLocaleString()}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// =========================================
// Student Management
// =========================================

let allStudents = [];

async function loadStudents() {
    const status = document.getElementById('studentStatusFilter')?.value || '';
    const coaching = document.getElementById('studentCoachingFilter')?.value || '';
    
    let url = '/api/students';
    const params = [];
    if (status) params.push(`status=${status}`);
    if (coaching) params.push(`coaching=${coaching}`);
    if (params.length) url += '?' + params.join('&');
    
    try {
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            allStudents = await response.json();
            populateStudentsTable(allStudents);
            updateStudentStats();
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function updateStudentStats() {
    const total = allStudents.length;
    const active = allStudents.filter(s => s.status === 'active').length;
    const rooms = new Set(allStudents.filter(s => s.status === 'active' && s.roomNumber).map(s => s.roomNumber)).size;
    
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('activeStudents').textContent = active;
    document.getElementById('occupiedRooms').textContent = rooms;
}

function populateStudentsTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    
    if (!students || !students.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-user-graduate" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No students found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = students.map(student => {
        const photoHtml = student.photoUrl 
            ? `<img src="${student.photoUrl}" alt="" class="student-photo">`
            : `<div class="student-photo-placeholder"><i class="fa-solid fa-user"></i></div>`;
        
        const statusClass = student.status === 'active' ? 'active' : 'inactive';
        const statusLabel = student.status === 'active' ? 'Active' : 'Checked Out';
        
        return `
            <tr>
                <td>${photoHtml}</td>
                <td>
                    <div style="font-weight: 500;">${student.userId?.name || 'N/A'}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${student.fatherName ? 'S/o ' + student.fatherName : ''}</div>
                </td>
                <td>${student.roomNumber || '-'}</td>
                <td>${student.coaching || '-'}</td>
                <td>${student.userId?.phone || '-'}</td>
                <td><span class="status-badge ${statusClass}">
                    <i class="fa-solid fa-circle" style="font-size: 0.5rem;"></i>
                    ${statusLabel}
                </span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewStudent('${student._id}')" title="View">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="editStudent('${student._id}')" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteStudent('${student._id}')" title="Checkout">
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterStudents() {
    const search = document.getElementById('studentSearch')?.value?.toLowerCase() || '';
    
    if (!search) {
        populateStudentsTable(allStudents);
        return;
    }
    
    const filtered = allStudents.filter(s => 
        s.userId?.name?.toLowerCase().includes(search) ||
        s.userId?.email?.toLowerCase().includes(search) ||
        s.roomNumber?.toLowerCase().includes(search) ||
        s.fatherName?.toLowerCase().includes(search) ||
        s.coaching?.toLowerCase().includes(search)
    );
    
    populateStudentsTable(filtered);
}

function openAddStudentModal() {
    document.getElementById('studentModalTitle').innerHTML = '<i class="fa-solid fa-user-plus"></i> Add New Student';
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    document.getElementById('studentPhotoPreview').style.display = 'none';
    document.getElementById('photoPlaceholder').style.display = 'flex';
    document.getElementById('studentJoiningDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('studentSubmitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Save Student';
    document.getElementById('studentModal').classList.add('active');
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('active');
}

function previewStudentPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('studentPhotoPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('photoPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Student form submission
document.getElementById('studentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('studentId').value;
    const isEdit = !!studentId;
    
    const formData = new FormData();
    
    // Add all form fields
    formData.append('name', document.getElementById('studentName').value);
    formData.append('email', document.getElementById('studentEmail').value);
    formData.append('phone', document.getElementById('studentPhone').value);
    formData.append('fatherName', document.getElementById('studentFatherName').value);
    formData.append('motherName', document.getElementById('studentMotherName').value);
    formData.append('dateOfBirth', document.getElementById('studentDOB').value);
    formData.append('gender', document.getElementById('studentGender').value);
    formData.append('bloodGroup', document.getElementById('studentBloodGroup').value);
    formData.append('aadharNumber', document.getElementById('studentAadhar').value);
    formData.append('address', document.getElementById('studentAddress').value);
    formData.append('city', document.getElementById('studentCity').value);
    formData.append('state', document.getElementById('studentState').value);
    formData.append('pincode', document.getElementById('studentPincode').value);
    formData.append('emergencyContactName', document.getElementById('emergencyName').value);
    formData.append('emergencyContactPhone', document.getElementById('emergencyPhone').value);
    formData.append('emergencyContactRelation', document.getElementById('emergencyRelation').value);
    formData.append('roomNumber', document.getElementById('studentRoomNumber').value);
    formData.append('roomType', document.getElementById('studentRoomType').value);
    formData.append('joiningDate', document.getElementById('studentJoiningDate').value);
    formData.append('checkoutDate', document.getElementById('studentCheckoutDate').value);
    formData.append('monthlyRent', document.getElementById('studentMonthlyRent').value);
    formData.append('rentDueDay', document.getElementById('studentRentDueDay').value);
    formData.append('coaching', document.getElementById('studentCoaching').value);
    formData.append('course', document.getElementById('studentCourse').value);
    formData.append('batch', document.getElementById('studentBatch').value);
    formData.append('targetExam', document.getElementById('studentTargetExam').value);
    formData.append('notes', document.getElementById('studentNotes').value);
    
    // Add photo if selected
    const photoInput = document.getElementById('studentPhoto');
    if (photoInput.files && photoInput.files[0]) {
        formData.append('photo', photoInput.files[0]);
    }
    
    try {
        const url = isEdit ? `/api/students/${studentId}` : '/api/students';
        const method = isEdit ? 'PUT' : 'POST';
        
        const token = localStorage.getItem('token');
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeStudentModal();
            loadStudents();
            showNotification(data.message || 'Student saved successfully', 'success');
        } else {
            showNotification(data.message || 'Error saving student', 'error');
        }
    } catch (error) {
        console.error('Error saving student:', error);
        showNotification('Connection error', 'error');
    }
});

async function viewStudent(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const student = await response.json();
            showStudentDetailsModal(student);
        }
    } catch (error) {
        console.error('Error loading student:', error);
    }
}

function showStudentDetailsModal(student) {
    const existingModal = document.getElementById('studentDetailsModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'studentDetailsModal';
    modal.className = 'modal active';
    modal.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    
    const photoHtml = student.photoUrl 
        ? `<img src="${student.photoUrl}" alt="" style="width: 120px; height: 150px; object-fit: cover; border-radius: 10px;">`
        : `<div style="width: 120px; height: 150px; background: rgba(212, 175, 55, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-user" style="font-size: 3rem; color: var(--gold);"></i></div>`;
    
    const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-';
    const joining = student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : '-';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-user-graduate"></i> Student Details</h3>
                <button class="modal-close" onclick="document.getElementById('studentDetailsModal').remove()">&times;</button>
            </div>
            <div style="padding: 20px; display: grid; grid-template-columns: 150px 1fr; gap: 20px;">
                <div style="text-align: center;">
                    ${photoHtml}
                    <div style="margin-top: 10px; font-weight: 600;">${student.userId?.name || 'N/A'}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">Room: ${student.roomNumber || '-'}</div>
                </div>
                <div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div><strong>Father:</strong> ${student.fatherName || '-'}</div>
                        <div><strong>Mother:</strong> ${student.motherName || '-'}</div>
                        <div><strong>DOB:</strong> ${dob}</div>
                        <div><strong>Gender:</strong> ${student.gender || '-'}</div>
                        <div><strong>Blood Group:</strong> ${student.bloodGroup || '-'}</div>
                        <div><strong>Aadhar:</strong> ${student.aadharNumber || '-'}</div>
                        <div><strong>Phone:</strong> ${student.userId?.phone || '-'}</div>
                        <div><strong>Email:</strong> ${student.userId?.email || '-'}</div>
                        <div><strong>Coaching:</strong> ${student.coaching || '-'}</div>
                        <div><strong>Target:</strong> ${student.targetExam || '-'}</div>
                        <div><strong>Joining:</strong> ${joining}</div>
                        <div><strong>Room Type:</strong> ${student.roomType || '-'}</div>
                    </div>
                    <div style="margin-top: 16px;">
                        <strong>Address:</strong> ${student.address || '-'}, ${student.city || ''} ${student.state || ''} ${student.pincode || ''}
                    </div>
                    <div style="margin-top: 10px;">
                        <strong>Emergency Contact:</strong> ${student.emergencyContact?.name || '-'} (${student.emergencyContact?.relation || '-'}) - ${student.emergencyContact?.phone || '-'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

async function editStudent(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const student = await response.json();
            
            document.getElementById('studentModalTitle').innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit Student';
            document.getElementById('studentId').value = student._id;
            document.getElementById('studentName').value = student.userId?.name || '';
            document.getElementById('studentEmail').value = student.userId?.email || '';
            document.getElementById('studentPhone').value = student.userId?.phone || '';
            document.getElementById('studentFatherName').value = student.fatherName || '';
            document.getElementById('studentMotherName').value = student.motherName || '';
            document.getElementById('studentDOB').value = student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '';
            document.getElementById('studentGender').value = student.gender || '';
            document.getElementById('studentBloodGroup').value = student.bloodGroup || '';
            document.getElementById('studentAadhar').value = student.aadharNumber || '';
            document.getElementById('studentAddress').value = student.address || '';
            document.getElementById('studentCity').value = student.city || '';
            document.getElementById('studentState').value = student.state || '';
            document.getElementById('studentPincode').value = student.pincode || '';
            document.getElementById('emergencyName').value = student.emergencyContact?.name || '';
            document.getElementById('emergencyPhone').value = student.emergencyContact?.phone || '';
            document.getElementById('emergencyRelation').value = student.emergencyContact?.relation || '';
            document.getElementById('studentRoomNumber').value = student.roomNumber || '';
            document.getElementById('studentRoomType').value = student.roomType || '';
            document.getElementById('studentJoiningDate').value = student.joiningDate ? student.joiningDate.split('T')[0] : '';
            document.getElementById('studentCheckoutDate').value = student.checkoutDate ? student.checkoutDate.split('T')[0] : '';
            document.getElementById('studentMonthlyRent').value = student.monthlyRent || '';
            document.getElementById('studentRentDueDay').value = student.rentDueDay || '1';
            document.getElementById('studentCoaching').value = student.coaching || '';
            document.getElementById('studentCourse').value = student.course || '';
            document.getElementById('studentBatch').value = student.batch || '';
            document.getElementById('studentTargetExam').value = student.targetExam || '';
            document.getElementById('studentNotes').value = student.notes || '';
            
            // Show photo if exists
            if (student.photoUrl) {
                document.getElementById('studentPhotoPreview').src = student.photoUrl;
                document.getElementById('studentPhotoPreview').style.display = 'block';
                document.getElementById('photoPlaceholder').style.display = 'none';
            }
            
            document.getElementById('studentSubmitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Update Student';
            document.getElementById('studentModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading student:', error);
    }
}

async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to checkout this student?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/students/${studentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadStudents();
            showNotification(data.message || 'Student checked out successfully', 'success');
        } else {
            showNotification(data.message || 'Error checking out student', 'error');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        showNotification('Connection error', 'error');
    }
}

// Close student modal on outside click
document.getElementById('studentModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'studentModal') {
        closeStudentModal();
    }
});

// =========================================
// Room Occupancy Panel
// =========================================

let currentFloor = 1;
let roomOccupancyData = {};

async function loadRoomOccupancy() {
    try {
        // Load overall occupancy stats
        const response = await fetch('/api/rooms/occupancy', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            roomOccupancyData = data.occupancy;
            
            // Update stats
            document.getElementById('totalRoomsCount').textContent = data.stats.totalRooms;
            document.getElementById('occupiedRoomsCount').textContent = data.stats.occupiedRooms;
            document.getElementById('availableRoomsCount').textContent = data.stats.availableRooms;
            document.getElementById('occupancyRate').textContent = data.stats.occupancyRate + '%';
        }
        
        // Load current floor data
        loadFloorData(currentFloor);
    } catch (error) {
        console.error('Error loading room occupancy:', error);
    }
}

async function loadFloorData(floorNumber) {
    currentFloor = floorNumber;
    document.getElementById('currentFloorNumber').textContent = floorNumber;
    
    // Update active tab
    document.querySelectorAll('.floor-tab').forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.floor) === floorNumber);
    });
    
    try {
        const response = await fetch(`/api/rooms/floor/${floorNumber}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            renderFloorRooms(data.layout, data.rooms);
        }
    } catch (error) {
        console.error('Error loading floor data:', error);
    }
}

function renderFloorRooms(layout, rooms) {
    // Lift side upper
    const liftSideUpper = document.getElementById('liftSideUpper');
    liftSideUpper.innerHTML = layout.liftSide.upper.map(room => 
        createRoomBox(room, rooms[room])
    ).join('');
    
    // Lift side lower
    const liftSideLower = document.getElementById('liftSideLower');
    liftSideLower.innerHTML = layout.liftSide.lower.map(room => 
        createRoomBox(room, rooms[room])
    ).join('');
    
    // Opposite side upper
    const oppositeSideUpper = document.getElementById('oppositeSideUpper');
    oppositeSideUpper.innerHTML = layout.oppositeSide.upper.map(room => 
        createRoomBox(room, rooms[room])
    ).join('');
    
    // Opposite side lower
    const oppositeSideLower = document.getElementById('oppositeSideLower');
    oppositeSideLower.innerHTML = layout.oppositeSide.lower.map(room => 
        createRoomBox(room, rooms[room])
    ).join('');
}

function createRoomBox(roomNumber, roomData) {
    const status = roomData?.status || 'available';
    const students = roomData?.students || [];
    const hasOccupants = students.length > 0;
    
    const icon = status === 'available' ? 'fa-door-closed' : 
                 status === 'partial' ? 'fa-user' : 'fa-users';
    
    return `
        <div class="room-box ${status}" 
             onclick="showRoomPopup(event, ${roomNumber}, ${JSON.stringify(roomData || {}).replace(/"/g, '&quot;')})"
             title="Room ${roomNumber}">
            <span class="room-number">${roomNumber}</span>
            <i class="room-icon fa-solid ${icon}"></i>
        </div>
    `;
}

function showRoomPopup(event, roomNumber, roomData) {
    // Remove any existing popup
    const existingPopup = document.querySelector('.room-popup');
    if (existingPopup) existingPopup.remove();
    
    const status = roomData?.status || 'available';
    const students = roomData?.students || [];
    
    let content = '';
    if (students.length > 0) {
        content = students.map(s => `
            <div class="occupant">
                <div class="occupant-photo">
                    ${s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : '<i class="fa-solid fa-user"></i>'}
                </div>
                <div class="occupant-info">
                    <div class="occupant-name">${s.name}</div>
                    <div class="occupant-coaching">${s.coaching || 'No coaching'}</div>
                </div>
            </div>
        `).join('');
    } else {
        content = '<p style="color: var(--text-muted);">Room is available</p>';
    }
    
    const popup = document.createElement('div');
    popup.className = 'room-popup';
    popup.innerHTML = `
        <div class="room-popup-header">
            <h4>Room ${roomNumber}</h4>
            <button class="room-popup-close" onclick="this.closest('.room-popup').remove()">&times;</button>
        </div>
        <div class="room-popup-status" style="margin-bottom: 12px;">
            <span style="padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; 
                background: ${status === 'available' ? '#10b981' : status === 'partial' ? '#f59e0b' : '#ef4444'}; 
                color: white;">
                ${status === 'available' ? 'Available' : status === 'partial' ? 'Partially Occupied' : 'Occupied'}
            </span>
        </div>
        ${content}
    `;
    
    // Position popup near the clicked element
    const rect = event.target.getBoundingClientRect();
    popup.style.left = Math.min(rect.left, window.innerWidth - 250) + 'px';
    popup.style.top = (rect.bottom + 10) + 'px';
    
    document.body.appendChild(popup);
    
    // Close popup when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target) && !e.target.closest('.room-box')) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        });
    }, 100);
}

// Floor tab click handlers
document.getElementById('floorTabs')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('floor-tab')) {
        const floor = parseInt(e.target.dataset.floor);
        loadFloorData(floor);
    }
});

// =========================================
// Rent Management
// =========================================

let allRentData = [];

function initRentSection() {
    // Set current month in selector
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthSelector = document.getElementById('rentMonthSelector');
    if (monthSelector) {
        monthSelector.value = currentMonth;
    }
}

async function loadRentStatus() {
    const month = document.getElementById('rentMonthSelector')?.value || getCurrentMonth();
    
    try {
        const response = await fetch(`/api/rent/status?month=${month}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            allRentData = data.students;
            
            // Update stats
            document.getElementById('rentTotalStudents').textContent = data.stats.totalStudents;
            document.getElementById('rentTotalDue').textContent = '₹' + data.stats.totalDue.toLocaleString();
            document.getElementById('rentTotalPaid').textContent = '₹' + data.stats.totalPaid.toLocaleString();
            document.getElementById('rentTotalPending').textContent = '₹' + data.stats.totalPending.toLocaleString();
            
            // Populate table
            populateRentTable(allRentData);
        }
    } catch (error) {
        console.error('Error loading rent status:', error);
    }
}

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function populateRentTable(students) {
    const tbody = document.getElementById('rentTableBody');
    
    if (!students || !students.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-indian-rupee-sign" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No rent data found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = students.map(student => {
        const paidAmount = student.payment?.amountPaid || 0;
        const statusClass = student.status;
        const statusLabel = student.status.charAt(0).toUpperCase() + student.status.slice(1);
        
        return `
            <tr data-status="${student.status}">
                <td>
                    <div style="font-weight: 500;">${student.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${student.phone || ''}</div>
                </td>
                <td>${student.room}</td>
                <td class="rent-amount">₹${student.monthlyRent.toLocaleString()}</td>
                <td class="rent-paid">₹${paidAmount.toLocaleString()}</td>
                <td><span class="rent-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <button class="btn-icon" onclick="openPaymentModal('${student.studentId}', '${student.name}', ${student.monthlyRent}, ${paidAmount})" title="Record Payment">
                        <i class="fa-solid fa-plus-circle"></i>
                    </button>
                    <button class="btn-icon" onclick="viewPaymentHistory('${student.studentId}')" title="View History">
                        <i class="fa-solid fa-history"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterRentTable() {
    const statusFilter = document.getElementById('rentStatusFilter')?.value || '';
    
    if (!statusFilter) {
        populateRentTable(allRentData);
        return;
    }
    
    const filtered = allRentData.filter(s => s.status === statusFilter);
    populateRentTable(filtered);
}

function openPaymentModal(studentId, name, monthlyRent, amountPaid) {
    const month = document.getElementById('rentMonthSelector')?.value || getCurrentMonth();
    
    document.getElementById('paymentStudentId').value = studentId;
    document.getElementById('paymentMonth').value = month;
    document.getElementById('paymentAmountDue').value = '₹' + monthlyRent.toLocaleString();
    document.getElementById('paymentAmountPaid').value = amountPaid || monthlyRent;
    
    document.getElementById('paymentStudentInfo').innerHTML = `
        <div class="student-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="student-details">
            <h4>${name}</h4>
            <span>Payment for ${month}</span>
        </div>
    `;
    
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

// Payment form submission
document.getElementById('paymentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('paymentStudentId').value;
    const month = document.getElementById('paymentMonth').value;
    const amountPaid = parseFloat(document.getElementById('paymentAmountPaid').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const transactionId = document.getElementById('paymentTransactionId').value;
    const notes = document.getElementById('paymentNotes').value;
    
    try {
        const response = await fetch('/api/rent/payment', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                studentId,
                month,
                amountPaid,
                paymentMethod,
                transactionId,
                notes
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closePaymentModal();
            loadRentStatus();
            showNotification(data.message || 'Payment recorded successfully', 'success');
        } else {
            showNotification(data.message || 'Error recording payment', 'error');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        showNotification('Connection error', 'error');
    }
});

async function viewPaymentHistory(studentId) {
    try {
        const response = await fetch(`/api/rent/history/${studentId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            showPaymentHistoryModal(data);
        }
    } catch (error) {
        console.error('Error loading payment history:', error);
    }
}

function showPaymentHistoryModal(data) {
    const existingModal = document.getElementById('paymentHistoryModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'paymentHistoryModal';
    modal.className = 'modal active';
    modal.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    
    const payments = data.payments || [];
    const paymentsHtml = payments.length > 0 ? payments.map(p => `
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
            <div>
                <strong>${p.month}</strong>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${p.paymentMethod || 'N/A'}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: var(--success); font-weight: 600;">₹${p.amountPaid.toLocaleString()}</div>
                <span class="rent-badge ${p.status}">${p.status}</span>
            </div>
        </div>
    `).join('') : '<p style="color: var(--text-muted); text-align: center;">No payment history</p>';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-history"></i> Payment History</h3>
                <button class="modal-close" onclick="document.getElementById('paymentHistoryModal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h4>${data.student?.name || 'Student'}</h4>
                    <span style="color: var(--text-muted);">Room: ${data.student?.room || '-'} | Monthly Rent: ₹${(data.student?.monthlyRent || 0).toLocaleString()}</span>
                </div>
                ${paymentsHtml}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Close payment modal on outside click
document.getElementById('paymentModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'paymentModal') {
        closePaymentModal();
    }
});

// =========================================
// Booking Queries Management
// =========================================

let allQueries = [];

async function loadQueries() {
    const status = document.getElementById('queryStatusFilter')?.value || '';
    
    // Fetch non-trial-stay queries that have room preference (actual booking queries)
    let url = '/api/queries?trial=false';
    if (status) url += `&status=${status}`;
    
    try {
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            // Filter to only include queries with roomPreference (actual booking queries)
            allQueries = (data.queries || []).filter(q => q.roomPreference && q.roomPreference !== '');
            
            // Calculate stats from filtered data
            const newCount = allQueries.filter(q => q.status === 'new').length;
            const contactedCount = allQueries.filter(q => q.status === 'contacted').length;
            const convertedCount = allQueries.filter(q => q.status === 'converted' || q.status === 'booked').length;
            
            // Update stats
            document.getElementById('queriesTotal').textContent = allQueries.length;
            document.getElementById('queriesNew').textContent = newCount;
            document.getElementById('queriesContacted').textContent = contactedCount;
            document.getElementById('queriesConverted').textContent = convertedCount;
            
            // Populate table
            populateQueriesTable(allQueries);
        }
    } catch (error) {
        console.error('Error loading queries:', error);
    }
}

function populateQueriesTable(queries) {
    const tbody = document.getElementById('queriesTableBody');
    
    if (!queries || !queries.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-question-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No booking queries found
                </td>
            </tr>
        `;
        return;
    }
    
    const roomLabels = {
        'single': 'Single Room',
        'single_balcony': 'Single + Balcony',
        'double': 'Double Room',
        'double_balcony': 'Double + Balcony'
    };
    
    const pickupLabels = {
        'none': '-',
        'kota_junction': 'Kota Junction',
        'dakniya_talawa': 'Dakniya Talawa',
        'bus_stand': 'Bus Stand'
    };
    
    tbody.innerHTML = queries.map(query => {
        const date = new Date(query.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
        const statusClass = query.status;
        const statusLabel = query.status.charAt(0).toUpperCase() + query.status.slice(1);
        
        return `
            <tr>
                <td>${date}</td>
                <td>
                    <div style="font-weight: 500;">${query.name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${query.email}</div>
                </td>
                <td>${query.phone}</td>
                <td>${roomLabels[query.roomPreference] || '-'}</td>
                <td>${query.coaching || '-'}</td>
                <td>${pickupLabels[query.pickupLocation] || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="viewQuery('${query._id}')" title="View Details">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="updateQueryStatus('${query._id}')" title="Update Status">
                            <i class="fa-solid fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deleteQuery('${query._id}')" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewQuery(queryId) {
    try {
        const response = await fetch(`/api/queries/${queryId}`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const query = await response.json();
            showQueryDetailsModal(query);
            
            // If query was 'new', mark it as 'contacted' and refresh
            if (query.status === 'new') {
                await fetch(`/api/queries/${queryId}`, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status: 'contacted' })
                });
                // Refresh the queries list and badge count
                loadQueries();
                loadNewQueriesCount();
            }
        }
    } catch (error) {
        console.error('Error loading query:', error);
    }
}

function showQueryDetailsModal(query) {
    const existingModal = document.getElementById('queryDetailsModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'queryDetailsModal';
    modal.className = 'modal active';
    modal.style.cssText = 'display: flex; align-items: center; justify-content: center;';
    
    const date = new Date(query.createdAt).toLocaleString('en-IN');
    
    const roomLabels = {
        'single': 'Single Room - ₹13,000/month',
        'single_balcony': 'Single + Balcony - ₹14,000/month',
        'double': 'Double Room - ₹10,000/month',
        'double_balcony': 'Double + Balcony - ₹11,000/month'
    };
    
    const pickupLabels = {
        'none': 'No pickup needed',
        'kota_junction': 'Kota Junction Railway Station',
        'dakniya_talawa': 'Dakniya Talawa Railway Station',
        'bus_stand': 'Kota Bus Stand'
    };
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 85vh; overflow-y: auto;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-calendar-check"></i> Booking Query Details</h3>
                <button class="modal-close" onclick="document.getElementById('queryDetailsModal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div><strong>Name:</strong> ${query.name}</div>
                    <div><strong>Phone:</strong> <a href="tel:${query.phone}" style="color: var(--gold);">${query.phone}</a></div>
                    <div><strong>Email:</strong> <a href="mailto:${query.email}" style="color: var(--gold);">${query.email}</a></div>
                    <div><strong>City:</strong> ${query.city || '-'}</div>
                    <div style="grid-column: 1 / -1;"><strong>Address:</strong> ${query.address || '-'} ${query.state || ''}</div>
                </div>
                <hr style="border-color: var(--border-color); margin: 16px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div><strong>Course:</strong> ${query.course || '-'}</div>
                    <div><strong>Coaching:</strong> ${query.coaching || '-'}</div>
                    <div><strong>Room Preference:</strong> ${roomLabels[query.roomPreference] || '-'}</div>
                    <div><strong>Pickup:</strong> ${pickupLabels[query.pickupLocation] || '-'}</div>
                </div>
                ${query.message ? `<div style="margin-bottom: 20px;"><strong>Message:</strong><div style="background: var(--secondary-dark); padding: 12px; border-radius: 8px; margin-top: 8px;">${query.message}</div></div>` : ''}
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 20px;">Submitted: ${date}</div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <a href="https://wa.me/91${query.phone.replace(/\D/g, '')}" target="_blank" class="btn-primary" style="flex: 1; text-align: center;">
                        <i class="fa-brands fa-whatsapp"></i> WhatsApp
                    </a>
                    <a href="tel:${query.phone}" class="btn-secondary" style="flex: 1; text-align: center;">
                        <i class="fa-solid fa-phone"></i> Call
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

async function updateQueryStatus(queryId) {
    const query = allQueries.find(q => q._id === queryId);
    if (!query) return;
    
    const newStatus = prompt(`Update status for ${query.name}:\n\nCurrent: ${query.status}\n\nEnter new status (new, contacted, converted, closed):`);
    
    if (!newStatus || !['new', 'contacted', 'converted', 'closed'].includes(newStatus.toLowerCase())) {
        if (newStatus) showNotification('Invalid status. Use: new, contacted, converted, or closed', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/queries/${queryId}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: newStatus.toLowerCase() })
        });
        
        if (response.ok) {
            loadQueries();
            showNotification('Query status updated', 'success');
        } else {
            const data = await response.json();
            showNotification(data.message || 'Error updating status', 'error');
        }
    } catch (error) {
        console.error('Error updating query status:', error);
        showNotification('Connection error', 'error');
    }
}

async function deleteQuery(queryId) {
    if (!confirm('Are you sure you want to delete this query?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/queries/${queryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            loadQueries();
            showNotification('Query deleted successfully', 'success');
        } else {
            showNotification(data.message || 'Error deleting query', 'error');
        }
    } catch (error) {
        console.error('Error deleting query:', error);
        showNotification('Connection error', 'error');
    }
}

// =========================================
// Trial Stay Settings
// =========================================

async function loadSiteSettings() {
    try {
        const response = await fetch('/api/settings', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const settings = await response.json();
            
            // Populate Trial Stay form
            document.getElementById('trialStayEnabled').checked = settings.trialStay?.enabled || false;
            document.getElementById('trialStayPrice').value = settings.trialStay?.price || 500;
            document.getElementById('trialStayTitle').value = settings.trialStay?.title || 'Try Before You Stay';
            document.getElementById('trialStayDescription').value = settings.trialStay?.description || '';
            
            // Populate Room Settings
            if (settings.rooms) {
                // Single Room
                document.getElementById('roomSingleName').value = settings.rooms.single?.name || 'Single Room';
                document.getElementById('roomSinglePrice').value = settings.rooms.single?.price || 13000;
                document.getElementById('roomSingleDescription').value = settings.rooms.single?.description || '';
                document.getElementById('roomSingleImages').value = (settings.rooms.single?.images || ['assets/room-1.png']).join(', ');
                document.getElementById('roomSingleAvailable').value = settings.rooms.single?.available !== false ? 'true' : 'false';
                updateRoomAvailabilityButtons('single', settings.rooms.single?.available !== false);
                document.getElementById('roomSingleEnabled').checked = settings.rooms.single?.enabled !== false;
                
                // Single + Balcony
                document.getElementById('roomSingleBalconyName').value = settings.rooms.single_balcony?.name || 'Single Room + Balcony';
                document.getElementById('roomSingleBalconyPrice').value = settings.rooms.single_balcony?.price || 14000;
                document.getElementById('roomSingleBalconyDescription').value = settings.rooms.single_balcony?.description || '';
                document.getElementById('roomSingleBalconyImages').value = (settings.rooms.single_balcony?.images || ['assets/room-1.png']).join(', ');
                document.getElementById('roomSingleBalconyAvailable').value = settings.rooms.single_balcony?.available !== false ? 'true' : 'false';
                updateRoomAvailabilityButtons('single_balcony', settings.rooms.single_balcony?.available !== false);
                document.getElementById('roomSingleBalconyEnabled').checked = settings.rooms.single_balcony?.enabled !== false;
                
                // Double Room
                document.getElementById('roomDoubleName').value = settings.rooms.double?.name || 'Double Room';
                document.getElementById('roomDoublePrice').value = settings.rooms.double?.price || 10000;
                document.getElementById('roomDoubleDescription').value = settings.rooms.double?.description || '';
                document.getElementById('roomDoubleImages').value = (settings.rooms.double?.images || ['assets/room-1.png']).join(', ');
                document.getElementById('roomDoubleAvailable').value = settings.rooms.double?.available !== false ? 'true' : 'false';
                updateRoomAvailabilityButtons('double', settings.rooms.double?.available !== false);
                document.getElementById('roomDoubleEnabled').checked = settings.rooms.double?.enabled !== false;
                
                // Double + Balcony
                document.getElementById('roomDoubleBalconyName').value = settings.rooms.double_balcony?.name || 'Double Room + Balcony';
                document.getElementById('roomDoubleBalconyPrice').value = settings.rooms.double_balcony?.price || 11000;
                document.getElementById('roomDoubleBalconyDescription').value = settings.rooms.double_balcony?.description || '';
                document.getElementById('roomDoubleBalconyImages').value = (settings.rooms.double_balcony?.images || ['assets/room-1.png']).join(', ');
                document.getElementById('roomDoubleBalconyAvailable').value = settings.rooms.double_balcony?.available !== false ? 'true' : 'false';
                updateRoomAvailabilityButtons('double_balcony', settings.rooms.double_balcony?.available !== false);
                document.getElementById('roomDoubleBalconyEnabled').checked = settings.rooms.double_balcony?.enabled !== false;
                
                // Initialize image previews
                initRoomImagePreviews();
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Trial Stay form submission
document.getElementById('trialStayForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const trialStayData = {
        trialStay: {
            enabled: document.getElementById('trialStayEnabled').checked,
            price: parseInt(document.getElementById('trialStayPrice').value),
            title: document.getElementById('trialStayTitle').value,
            description: document.getElementById('trialStayDescription').value
        }
    };
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(trialStayData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Trial Stay settings saved!', 'success');
        } else {
            showNotification(data.message || 'Error saving settings', 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Connection error', 'error');
    }
});

// Load settings when settings section is viewed
const originalShowSection = typeof showSection === 'function' ? showSection : null;
if (document.querySelector('[data-section="settings"]')) {
    document.querySelector('[data-section="settings"]').addEventListener('click', () => {
        loadSiteSettings();
        loadWebsiteImages();
    });
}

// Also load on initial page load if settings section exists
if (document.getElementById('trialStayForm')) {
    loadSiteSettings();
}

// Room Settings form submission
document.getElementById('roomSettingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomsData = {
        rooms: {
            single: {
                name: document.getElementById('roomSingleName').value,
                price: parseInt(document.getElementById('roomSinglePrice').value),
                description: document.getElementById('roomSingleDescription').value,
                images: document.getElementById('roomSingleImages').value.split(',').map(s => s.trim()).filter(s => s),
                available: document.getElementById('roomSingleAvailable').value === 'true',
                enabled: document.getElementById('roomSingleEnabled').checked
            },
            single_balcony: {
                name: document.getElementById('roomSingleBalconyName').value,
                price: parseInt(document.getElementById('roomSingleBalconyPrice').value),
                description: document.getElementById('roomSingleBalconyDescription').value,
                images: document.getElementById('roomSingleBalconyImages').value.split(',').map(s => s.trim()).filter(s => s),
                available: document.getElementById('roomSingleBalconyAvailable').value === 'true',
                enabled: document.getElementById('roomSingleBalconyEnabled').checked
            },
            double: {
                name: document.getElementById('roomDoubleName').value,
                price: parseInt(document.getElementById('roomDoublePrice').value),
                description: document.getElementById('roomDoubleDescription').value,
                images: document.getElementById('roomDoubleImages').value.split(',').map(s => s.trim()).filter(s => s),
                available: document.getElementById('roomDoubleAvailable').value === 'true',
                enabled: document.getElementById('roomDoubleEnabled').checked
            },
            double_balcony: {
                name: document.getElementById('roomDoubleBalconyName').value,
                price: parseInt(document.getElementById('roomDoubleBalconyPrice').value),
                description: document.getElementById('roomDoubleBalconyDescription').value,
                images: document.getElementById('roomDoubleBalconyImages').value.split(',').map(s => s.trim()).filter(s => s),
                available: document.getElementById('roomDoubleBalconyAvailable').value === 'true',
                enabled: document.getElementById('roomDoubleBalconyEnabled').checked
            }
        }
    };
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(roomsData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Room settings saved!', 'success');
        } else {
            showNotification(data.message || 'Error saving settings', 'error');
        }
    } catch (error) {
        console.error('Error saving room settings:', error);
        showNotification('Connection error', 'error');
    }
});

// =========================================
// Room Image Upload Functions
// =========================================

async function uploadRoomImages(roomType, input) {
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    showNotification(`Uploading ${files.length} image(s)...`, 'info');
    
    let uploadedCount = 0;
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch(`/api/settings/room-image/${roomType}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                uploadedCount++;
                // Update hidden input with new images list
                const imagesInput = document.getElementById(`room${capitalizeRoomType(roomType)}Images`);
                imagesInput.value = data.images.join(', ');
                
                // Render preview
                renderRoomImagePreview(roomType, data.images);
            } else {
                showNotification(data.message || `Upload failed for ${file.name}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification(`Error uploading ${file.name}`, 'error');
        }
    }
    
    if (uploadedCount > 0) {
        showNotification(`${uploadedCount} image(s) uploaded!`, 'success');
    }
    
    // Clear the input
    input.value = '';
}

function capitalizeRoomType(type) {
    // single -> Single, single_balcony -> SingleBalcony, double -> Double, double_balcony -> DoubleBalcony
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function renderRoomImagePreview(roomType, images) {
    const previewId = `room${capitalizeRoomType(roomType)}ImagePreview`;
    const previewContainer = document.getElementById(previewId);
    if (!previewContainer) return;
    
    // Clear existing content
    previewContainer.innerHTML = '';
    
    images.forEach(img => {
        // Create container div
        const div = document.createElement('div');
        div.style.cssText = 'position: relative; width: 80px; height: 60px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border-color); display: inline-block; margin-right: 5px; margin-bottom: 5px;';
        
        // Create image
        const image = document.createElement('img');
        image.src = `/${img}`;
        image.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
        
        // Create delete button
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.style.cssText = 'position: absolute; top: 2px; right: 2px; width: 22px; height: 22px; background: #e74c3c; color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 11px; z-index: 100; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
        btn.innerHTML = '<i class="fa-solid fa-times"></i>';
        btn.title = 'Remove Image';
        
        // Robust event listener
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            removeRoomImage(roomType, img);
        };
        
        div.appendChild(image);
        div.appendChild(btn);
        previewContainer.appendChild(div);
    });
}

async function removeRoomImage(roomType, imagePath) {
    console.log(`Attempting to remove image: ${imagePath} from ${roomType}`);
    if (!confirm('Remove this image?')) return;
    
    console.log('User confirmed removal');
    try {
        const response = await fetch(`/api/settings/room-image/${roomType}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ imagePath })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Update hidden input
            const imagesInput = document.getElementById(`room${capitalizeRoomType(roomType)}Images`);
            imagesInput.value = data.images.join(', ');
            
            // Re-render preview
            renderRoomImagePreview(roomType, data.images);
            
            showNotification('Image removed', 'success');
        } else {
            showNotification(data.message || 'Error removing image', 'error');
        }
    } catch (error) {
        console.error('Remove error:', error);
        showNotification('Connection error', 'error');
    }
}

// Initialize room image previews when settings load
function initRoomImagePreviews() {
    const roomTypes = ['single', 'single_balcony', 'double', 'double_balcony'];
    roomTypes.forEach(type => {
        const imagesInput = document.getElementById(`room${capitalizeRoomType(type)}Images`);
        if (imagesInput && imagesInput.value) {
            const images = imagesInput.value.split(',').map(s => s.trim()).filter(s => s);
            renderRoomImagePreview(type, images);
        }
    });
}

// Make functions globally available
window.removeRoomImage = removeRoomImage;

// =========================================
// Website Image Management Functions
// =========================================

async function uploadCarouselImages(input) {
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    showNotification(`Uploading ${files.length} carousel image(s)...`, 'info');
    
    let uploadedCount = 0;
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch('/api/settings/carousel', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                uploadedCount++;
                renderCarouselPreview(data.images);
            } else {
                showNotification(data.message || `Upload failed`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Connection error', 'error');
        }
    }
    
    if (uploadedCount > 0) {
        showNotification(`${uploadedCount} carousel image(s) uploaded!`, 'success');
    }
    input.value = '';
}

function renderCarouselPreview(images) {
    const container = document.getElementById('carouselImagePreview');
    if (!container) return;
    
    container.innerHTML = images.map((img) => `
        <div style="position: relative; width: 120px; height: 70px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border-color);">
            <img src="/${img}" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" onclick="removeCarouselImage('${img}')" 
                style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: #e74c3c; color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 10px;">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
    `).join('');
}

async function removeCarouselImage(imagePath) {
    if (!confirm('Remove this carousel image?')) return;
    
    try {
        const response = await fetch('/api/settings/carousel', {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ imagePath })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderCarouselPreview(data.images);
            showNotification('Carousel image removed', 'success');
        } else {
            showNotification(data.message || 'Error', 'error');
        }
    } catch (error) {
        console.error('Remove error:', error);
    }
}

async function uploadAboutImage(input) {
    if (!input.files || !input.files[0]) return;
    
    const formData = new FormData();
    formData.append('image', input.files[0]);
    
    showNotification('Uploading about image...', 'info');
    
    try {
        const response = await fetch('/api/settings/about-image', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderAboutPreview(data.imagePath);
            showNotification('About image uploaded!', 'success');
        } else {
            showNotification(data.message || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Connection error', 'error');
    }
    input.value = '';
}

function renderAboutPreview(imagePath) {
    const container = document.getElementById('aboutImagePreview');
    if (!container) return;
    
    if (imagePath) {
        container.innerHTML = `
            <div style="position: relative; width: 180px; height: 120px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border-color);">
                <img src="/${imagePath}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        `;
    } else {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">No image uploaded</p>';
    }
}

// Amenities Functions
async function uploadAmenitiesImages(input) {
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    showNotification(`Uploading ${files.length} amenities image(s)...`, 'info');
    
    let uploadedCount = 0;
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch('/api/settings/amenities', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                uploadedCount++;
                renderAmenitiesPreview(data.images);
            } else {
                showNotification(data.message || `Upload failed`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Connection error', 'error');
        }
    }
    
    if (uploadedCount > 0) {
        showNotification(`${uploadedCount} amenities image(s) uploaded!`, 'success');
    }
    input.value = '';
}

function renderAmenitiesPreview(images) {
    const container = document.getElementById('amenitiesImagePreview');
    if (!container) return;
    
    container.innerHTML = images.map((img) => `
        <div style="position: relative; width: 120px; height: 70px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border-color);">
            <img src="/${img}" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" onclick="removeAmenitiesImage('${img}')" 
                style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: #e74c3c; color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 10px;">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
    `).join('');
}

async function removeAmenitiesImage(imagePath) {
    if (!confirm('Remove this amenities image?')) return;
    
    try {
        const response = await fetch('/api/settings/amenities', {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ imagePath })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderAmenitiesPreview(data.images);
            showNotification('Amenities image removed', 'success');
        } else {
            showNotification(data.message || 'Error', 'error');
        }
    } catch (error) {
        console.error('Remove error:', error);
    }
}

// Campus Functions
async function uploadCampusImages(input) {
    if (!input.files || input.files.length === 0) return;
    
    const files = Array.from(input.files);
    showNotification(`Uploading ${files.length} campus image(s)...`, 'info');
    
    let uploadedCount = 0;
    
    for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch('/api/settings/campus', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                uploadedCount++;
                renderCampusPreview(data.images);
            } else {
                showNotification(data.message || `Upload failed`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification('Connection error', 'error');
        }
    }
    
    if (uploadedCount > 0) {
        showNotification(`${uploadedCount} campus image(s) uploaded!`, 'success');
    }
    input.value = '';
}

function renderCampusPreview(images) {
    const container = document.getElementById('campusImagePreview');
    if (!container) return;
    
    container.innerHTML = images.map((img) => `
        <div style="position: relative; width: 120px; height: 70px; border-radius: 8px; overflow: hidden; border: 2px solid var(--border-color);">
            <img src="/${img}" style="width: 100%; height: 100%; object-fit: cover;">
            <button type="button" onclick="removeCampusImage('${img}')" 
                style="position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: #e74c3c; color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 10px;">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
    `).join('');
}

async function removeCampusImage(imagePath) {
    if (!confirm('Remove this campus image?')) return;
    
    try {
        const response = await fetch('/api/settings/campus', {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ imagePath })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderCampusPreview(data.images);
            showNotification('Campus image removed', 'success');
        } else {
            showNotification(data.message || 'Error', 'error');
        }
    } catch (error) {
        console.error('Remove error:', error);
    }
}

// Load website images on settings load
async function loadWebsiteImages() {
    try {
        const response = await fetch('/api/settings', { headers: getAuthHeaders() });
        if (response.ok) {
            const { settings } = await response.json();
            if (settings.carouselImages) renderCarouselPreview(settings.carouselImages);
            if (settings.aboutImage) renderAboutPreview(settings.aboutImage);
            if (settings.amenitiesImages) renderAmenitiesPreview(settings.amenitiesImages);
            if (settings.campusImages) renderCampusPreview(settings.campusImages);
        }
    } catch (error) {
        console.error('Error loading website images:', error);
    }
}

// =========================================
// Trial Stay Queries Management
// =========================================

async function loadTrialStayNewCount() {
    try {
        const response = await fetch('/api/queries?status=new&trial=true', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            const queries = data.queries || [];
            const badge = document.getElementById('trialStayNavBadge');
            if (badge) {
                const count = queries.length;
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline-flex' : 'none';
            }
        }
    } catch (error) {
        console.error('Error loading trial stay count:', error);
    }
}

async function loadTrialStayQueries() {
    try {
        const response = await fetch('/api/queries?trial=true', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load trial stay queries');
        }
        
        const data = await response.json();
        const queries = data.queries || [];
        
        // Update stats
        const newCount = queries.filter(q => q.status === 'new').length;
        const contactedCount = queries.filter(q => q.status === 'contacted').length;
        const bookedCount = queries.filter(q => q.status === 'booked').length;
        
        document.getElementById('trialStayNewCount').textContent = newCount;
        document.getElementById('trialStayContactedCount').textContent = contactedCount;
        document.getElementById('trialStayBookedCount').textContent = bookedCount;
        document.getElementById('trialStayTotalCount').textContent = queries.length;
        
        // Update table
        renderTrialStayTable(queries);
        
        // Show empty state if no queries
        const emptyState = document.getElementById('trialStayEmptyState');
        const tableContainer = document.querySelector('#trialstay .table-container');
        if (queries.length === 0) {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tableContainer.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading trial stay queries:', error);
        showNotification('Failed to load trial stay queries', 'error');
    }
}

function renderTrialStayTable(queries) {
    const tbody = document.getElementById('trialStayTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = queries.map(query => {
        const date = new Date(query.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
        const arrivalDate = query.arrivalDate ? new Date(query.arrivalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-';
        const statusClass = query.status;
        const statusLabel = query.status.charAt(0).toUpperCase() + query.status.slice(1);
        
        return `
            <tr>
                <td style="white-space: nowrap;">${date}</td>
                <td>
                    <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${query.name}</div>
                    <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${query.email}</div>
                </td>
                <td style="white-space: nowrap;">${query.phone}</td>
                <td style="white-space: nowrap;">${arrivalDate}</td>
                <td style="text-align: center;">${query.numberOfGuests || 1}</td>
                <td style="text-align: center;">${query.stayDuration || 1}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon view" onclick="viewQuery('${query._id}')" title="View Details">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <a href="tel:${query.phone}" class="btn-icon" title="Call">
                            <i class="fa-solid fa-phone"></i>
                        </a>
                        <a href="https://wa.me/91${query.phone.replace(/\D/g, '')}" target="_blank" class="btn-icon success" title="WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Load trial stay badge count on page load
loadTrialStayNewCount();
setInterval(loadTrialStayNewCount, 30000);

// =========================================
// Staff Management Functions
// =========================================

let allStaff = [];

async function loadStaff() {
    try {
        const response = await fetch('/api/staff/all', {
            headers: getAuthHeaders()
        });
        if (response.ok) {
            allStaff = await response.json();
            renderStaffList();
        }
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

function renderStaffList() {
    const container = document.getElementById('staffList');
    if (!container) return;
    
    if (allStaff.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No staff members yet. Click "Add Staff Member" to get started.</p>';
        return;
    }
    
    container.innerHTML = allStaff.map(staff => `
        <div class="staff-admin-card" style="background: var(--secondary-dark); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color); ${!staff.isActive ? 'opacity: 0.6;' : ''}">
            <div style="display: flex; gap: 15px; align-items: flex-start;">
                <div style="width: 70px; height: 70px; border-radius: 50%; overflow: hidden; background: var(--primary-dark); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    ${staff.image 
                        ? `<img src="/${staff.image}" alt="${staff.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                        : `<i class="fa-solid fa-user" style="font-size: 1.5rem; color: var(--gold);"></i>`
                    }
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h4 style="margin: 0 0 4px; color: #fff; font-size: 1rem;">${staff.name}</h4>
                    <span style="display: inline-flex; align-items: center; gap: 5px; background: linear-gradient(135deg, var(--gold), #c9a227); color: #000; padding: 2px 10px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;">
                        <i class="fa-solid ${staff.icon}"></i> ${staff.role}
                    </span>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin: 8px 0 0; line-height: 1.4;">${staff.description || 'No description'}</p>
                    ${!staff.isActive ? '<span style="color: #ef4444; font-size: 0.75rem; display: block; margin-top: 5px;"><i class="fa-solid fa-eye-slash"></i> Hidden from website</span>' : ''}
                </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                <button onclick="editStaff('${staff._id}')" style="flex: 1; padding: 8px; background: var(--gold); color: #000; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                    <i class="fa-solid fa-edit"></i> Edit
                </button>
                <button onclick="deleteStaff('${staff._id}')" style="flex: 1; padding: 8px; background: transparent; color: #ef4444; border: 1px solid #ef4444; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function openStaffModal(staffId = null) {
    const modal = document.getElementById('staffModal');
    const form = document.getElementById('staffForm');
    const title = document.getElementById('staffModalTitle');
    const preview = document.getElementById('staffImagePreview');
    
    form.reset();
    document.getElementById('staffId').value = '';
    preview.innerHTML = '';
    
    if (staffId) {
        const staff = allStaff.find(s => s._id === staffId);
        if (staff) {
            title.innerHTML = '<i class="fa-solid fa-user-pen"></i> Edit Staff Member';
            document.getElementById('staffId').value = staff._id;
            document.getElementById('staffName').value = staff.name;
            document.getElementById('staffRole').value = staff.role;
            document.getElementById('staffDescription').value = staff.description || '';
            document.getElementById('staffIcon').value = staff.icon || 'fa-user-tie';
            document.getElementById('staffOrder').value = staff.order || 0;
            
            if (staff.image) {
                preview.innerHTML = `<img src="/${staff.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid var(--gold);">`;
            }
        }
    } else {
        title.innerHTML = '<i class="fa-solid fa-user-plus"></i> Add Staff Member';
    }
    
    modal.classList.add('active');
}

function editStaff(staffId) {
    openStaffModal(staffId);
}

function closeStaffModal() {
    document.getElementById('staffModal').classList.remove('active');
}

// Image preview for staff
document.getElementById('staffImageUpload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('staffImagePreview').innerHTML = `
                <img src="${e.target.result}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid var(--gold);">
            `;
        };
        reader.readAsDataURL(file);
    }
});

// Staff form submission
document.getElementById('staffForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const staffId = document.getElementById('staffId').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('staffName').value);
    formData.append('role', document.getElementById('staffRole').value);
    formData.append('description', document.getElementById('staffDescription').value);
    formData.append('icon', document.getElementById('staffIcon').value);
    formData.append('order', document.getElementById('staffOrder').value);
    formData.append('isActive', 'true');
    
    const imageFile = document.getElementById('staffImageUpload').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        const url = staffId ? `/api/staff/${staffId}` : '/api/staff';
        const method = staffId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(staffId ? 'Staff updated!' : 'Staff added!', 'success');
            closeStaffModal();
            loadStaff();
        } else {
            showNotification(data.message || 'Error saving staff', 'error');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        showNotification('Connection error', 'error');
    }
});

async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
        const response = await fetch(`/api/staff/${staffId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showNotification('Staff deleted', 'success');
            loadStaff();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Error deleting staff', 'error');
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        showNotification('Connection error', 'error');
    }
}

// Close staff modal on outside click
document.getElementById('staffModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'staffModal') {
        closeStaffModal();
    }
});

// Load staff when settings section is shown
const staffOriginalShowSection = showSection;
showSection = function(sectionId) {
    staffOriginalShowSection(sectionId);
    if (sectionId === 'settings' && allStaff.length === 0) {
        loadStaff();
    }
};

// ==========================================
// CONTACT QUERIES SECTION
// ==========================================
let allContactQueries = [];

async function loadContactQueries() {
    try {
        const response = await fetch('/api/queries?trial=false', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            // Filter only contact form submissions: not trial stay AND no room preference
            allContactQueries = (data.queries || []).filter(q => !q.isTrialStay && (!q.roomPreference || q.roomPreference === ''));
            
            // Calculate stats
            const newCount = allContactQueries.filter(q => q.status === 'new').length;
            const contactedCount = allContactQueries.filter(q => q.status === 'contacted').length;
            const closedCount = allContactQueries.filter(q => q.status === 'closed' || q.status === 'converted').length;
            
            // Update stats display
            document.getElementById('contactQueriesTotal').textContent = allContactQueries.length;
            document.getElementById('contactQueriesNew').textContent = newCount;
            document.getElementById('contactQueriesContacted').textContent = contactedCount;
            document.getElementById('contactQueriesClosed').textContent = closedCount;
            
            // Update badge
            const badge = document.getElementById('contactQueriesNavBadge');
            if (badge) {
                if (newCount > 0) {
                    badge.textContent = newCount;
                    badge.style.display = 'inline-flex';
                } else {
                    badge.style.display = 'none';
                }
            }
            
            // Render table
            renderContactQueriesTable(allContactQueries);
            
            // Show empty state if no queries
            const emptyState = document.getElementById('contactQueriesEmptyState');
            const tableContainer = document.querySelector('#contactqueries .table-container');
            if (allContactQueries.length === 0) {
                emptyState.style.display = 'block';
                tableContainer.style.display = 'none';
            } else {
                emptyState.style.display = 'none';
                tableContainer.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading contact queries:', error);
    }
}

function renderContactQueriesTable(queries) {
    const tbody = document.getElementById('contactQueriesTableBody');
    if (!queries || !queries.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No contact queries found</td></tr>';
        return;
    }
    
    tbody.innerHTML = queries.map(query => {
        const date = new Date(query.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        
        const statusColors = {
            new: '#ef4444',
            contacted: '#3b82f6',
            booked: '#10b981',
            converted: '#10b981',
            closed: '#6b7280'
        };
        
        const message = query.message?.substring(0, 50) + (query.message?.length > 50 ? '...' : '') || '-';
        
        return `
            <tr>
                <td>${date}</td>
                <td><strong>${query.name}</strong></td>
                <td><a href="tel:${query.phone}" style="color: var(--gold);">${query.phone}</a></td>
                <td><a href="mailto:${query.email}" style="color: var(--text-secondary);">${query.email}</a></td>
                <td title="${query.message || ''}">${message}</td>
                <td>
                    <select onchange="updateContactQueryStatus('${query._id}', this.value)" 
                            style="padding: 5px 10px; border-radius: 5px; border: 1px solid var(--border-color); background: var(--secondary-dark); color: var(--text-primary); cursor: pointer;">
                        <option value="new" ${query.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${query.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="closed" ${query.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <a href="https://wa.me/91${query.phone.replace(/\D/g, '')}" target="_blank" 
                           style="color: #25d366; font-size: 1.2rem;" title="WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                        <a href="tel:${query.phone}" style="color: #3b82f6; font-size: 1.2rem;" title="Call">
                            <i class="fa-solid fa-phone"></i>
                        </a>
                        <button onclick="deleteContactQuery('${query._id}')" 
                                style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem;" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function updateContactQueryStatus(queryId, status) {
    try {
        const response = await fetch(`/api/queries/${queryId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showNotification('Status updated successfully', 'success');
            loadContactQueries();
        } else {
            showNotification('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showNotification('Error updating status', 'error');
    }
}

async function deleteContactQuery(queryId) {
    if (!confirm('Are you sure you want to delete this query?')) return;
    
    try {
        const response = await fetch(`/api/queries/${queryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            showNotification('Query deleted successfully', 'success');
            loadContactQueries();
        } else {
            showNotification('Failed to delete query', 'error');
        }
    } catch (error) {
        console.error('Error deleting query:', error);
        showNotification('Error deleting query', 'error');
    }
}

// Load contact queries count on page load
loadContactQueriesCount();
async function loadContactQueriesCount() {
    try {
        const response = await fetch('/api/queries?status=new&trial=false', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            // Filter for contact form submissions: not trial stay AND no room preference
            const contactQueries = (data.queries || []).filter(q => !q.isTrialStay && (!q.roomPreference || q.roomPreference === ''));
            const badge = document.getElementById('contactQueriesNavBadge');
            if (badge && contactQueries.length > 0) {
                badge.textContent = contactQueries.length;
                badge.style.display = 'inline-flex';
            }
        }
    } catch (error) {
        console.error('Error loading contact queries count:', error);
    }
}

// =========================================
// Weekly Menu Functions
// =========================================

async function loadWeeklyMenu() {
    try {
        const response = await fetch('/api/settings', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const settings = await response.json();
            if (settings.weeklyMenu) {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                days.forEach(day => {
                    const menu = settings.weeklyMenu[day];
                    if (menu) {
                        const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
                        const breakfastEl = document.getElementById(`menu${dayCapitalized}Breakfast`);
                        const lunchEl = document.getElementById(`menu${dayCapitalized}Lunch`);
                        const dinnerEl = document.getElementById(`menu${dayCapitalized}Dinner`);
                        const specialEl = document.getElementById(`menu${dayCapitalized}Special`);
                        
                        if (breakfastEl) breakfastEl.value = menu.breakfast || '';
                        if (lunchEl) lunchEl.value = menu.lunch || '';
                        if (dinnerEl) dinnerEl.value = menu.dinner || '';
                        if (specialEl) specialEl.checked = menu.special || false;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading weekly menu:', error);
    }
}

async function saveWeeklyMenu(event) {
    event.preventDefault();
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weeklyMenu = {};
    
    days.forEach(day => {
        const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
        weeklyMenu[day] = {
            breakfast: document.getElementById(`menu${dayCapitalized}Breakfast`)?.value || '',
            lunch: document.getElementById(`menu${dayCapitalized}Lunch`)?.value || '',
            dinner: document.getElementById(`menu${dayCapitalized}Dinner`)?.value || '',
            special: document.getElementById(`menu${dayCapitalized}Special`)?.checked || false
        };
    });
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ weeklyMenu })
        });
        
        if (response.ok) {
            showNotification('Weekly menu saved successfully!', 'success');
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to save menu', 'error');
        }
    } catch (error) {
        console.error('Error saving weekly menu:', error);
        showNotification('Error saving menu', 'error');
    }
}

// Load weekly menu when settings section is shown
document.addEventListener('DOMContentLoaded', function() {
    // Load menu when settings section becomes visible
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'settings' && mutation.target.style.display !== 'none') {
                loadWeeklyMenu();
            }
        });
    });
    
    const settingsSection = document.getElementById('settings');
    if (settingsSection) {
        observer.observe(settingsSection, { attributes: true, attributeFilter: ['style'] });
    }
});

// =========================================
// Room Availability Button Handler
// =========================================

function setRoomAvailability(roomType, isAvailable, clickedBtn) {
    // Update hidden input value
    const inputIdMap = {
        'single': 'roomSingleAvailable',
        'single_balcony': 'roomSingleBalconyAvailable',
        'double': 'roomDoubleAvailable',
        'double_balcony': 'roomDoubleBalconyAvailable'
    };
    
    const hiddenInput = document.getElementById(inputIdMap[roomType]);
    if (hiddenInput) {
        hiddenInput.value = isAvailable.toString();
    }
    
    // Update button styling
    const btnGroup = clickedBtn.closest('.availability-btn-group');
    if (btnGroup) {
        const availableBtn = btnGroup.querySelector('.available-btn');
        const unavailableBtn = btnGroup.querySelector('.unavailable-btn');
        
        if (isAvailable) {
            // Set available button as active
            availableBtn.style.background = '#22c55e';
            availableBtn.style.color = 'white';
            availableBtn.style.border = 'none';
            availableBtn.classList.add('active');
            
            unavailableBtn.style.background = 'transparent';
            unavailableBtn.style.color = '#888';
            unavailableBtn.style.border = '1px solid #666';
            unavailableBtn.classList.remove('active');
        } else {
            // Set unavailable button as active
            unavailableBtn.style.background = '#dc2626';
            unavailableBtn.style.color = 'white';
            unavailableBtn.style.border = 'none';
            unavailableBtn.classList.add('active');
            
            availableBtn.style.background = 'transparent';
            availableBtn.style.color = '#888';
            availableBtn.style.border = '1px solid #666';
            availableBtn.classList.remove('active');
        }
    }
}

// Update availability buttons based on loaded settings
function updateRoomAvailabilityButtons(roomType, isAvailable) {
    const btnGroup = document.querySelector(`.availability-btn-group [data-room="${roomType}"]`)?.closest('.availability-btn-group');
    if (btnGroup) {
        const availableBtn = btnGroup.querySelector('.available-btn');
        const unavailableBtn = btnGroup.querySelector('.unavailable-btn');
        const hiddenInput = btnGroup.querySelector('input[type="hidden"]');
        
        // Handle boolean or string input
        const isAvailableBool = isAvailable === true || isAvailable === 'true';
        
        if (hiddenInput) hiddenInput.value = isAvailableBool.toString();
        
        if (isAvailableBool) {
            availableBtn.style.background = '#22c55e';
            availableBtn.style.color = 'white';
            availableBtn.style.border = 'none';
            availableBtn.classList.add('active');
            
            unavailableBtn.style.background = 'transparent';
            unavailableBtn.style.color = '#888';
            unavailableBtn.style.border = '1px solid #666';
            unavailableBtn.classList.remove('active');
        } else {
            unavailableBtn.style.background = '#dc2626';
            unavailableBtn.style.color = 'white';
            unavailableBtn.style.border = 'none';
            unavailableBtn.classList.add('active');
            
            availableBtn.style.background = 'transparent';
            availableBtn.style.color = '#888';
            availableBtn.style.border = '1px solid #666';
            availableBtn.classList.remove('active');
        }
    }
}
