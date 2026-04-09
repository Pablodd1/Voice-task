// Dashboard Application

let currentUser = null;
let allClaims = [];
let allCalls = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initNavigation();
    initLogout();
    initAddClaimModal();
    initSimulateCallModal();
    initUploadArea();
    initSettingsForm();
    initTableFilters();
    initCardLinks();
    loadDashboard();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('lunabill_token');
    const user = localStorage.getItem('lunabill_user');
    
    if (!token || !user) {
        window.location.href = '/auth.html';
        return;
    }
    
    currentUser = JSON.parse(user);
    updateUserInfo();
}

// Update user info in sidebar
function updateUserInfo() {
    if (!currentUser) return;
    
    const avatar = document.getElementById('user-avatar');
    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    
    if (avatar) avatar.textContent = (currentUser.firstName || 'U')[0].toUpperCase();
    if (name) name.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    if (email) email.textContent = currentUser.email;
}

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');
    
    const pageTitles = {
        'overview': 'Dashboard Overview',
        'claims': 'Claims Management',
        'calls': 'Call Logs',
        'upload': 'Upload Claims',
        'settings': 'Account Settings'
    };
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show active page
            pages.forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(`page-${page}`);
            if (targetPage) targetPage.classList.add('active');
            
            // Update page title
            if (pageTitle) pageTitle.textContent = pageTitles[page] || 'Dashboard';
            
            // Load page data
            if (page === 'claims') loadClaims();
            if (page === 'calls') loadCalls();
            if (page === 'overview') loadDashboard();
        });
    });
}

// Card links navigation
function initCardLinks() {
    document.querySelectorAll('.card-link, [data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (!page) return;
            
            const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
            if (navLink) navLink.click();
        });
    });
}

// Logout
function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('lunabill_token')}` }
                });
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                localStorage.removeItem('lunabill_token');
                localStorage.removeItem('lunabill_user');
                window.location.href = '/auth.html';
            }
        });
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const token = localStorage.getItem('lunabill_token');
        
        // Load claim stats
        const claimRes = await fetch('/api/claims/stats/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (claimRes.ok) {
            const claimData = await claimRes.json();
            const stats = claimData.stats;
            
            document.getElementById('stat-total-claims').textContent = stats.totalClaims || 0;
            document.getElementById('stat-paid-claims').textContent = stats.paidClaims || 0;
            document.getElementById('stat-pending-claims').textContent = stats.pendingClaims || 0;
            document.getElementById('stat-denied-claims').textContent = stats.deniedClaims || 0;
            document.getElementById('stat-total-billed').textContent = `$${(stats.totalBilledAmount || 0).toLocaleString()}`;
        }
        
        // Load call stats
        const callRes = await fetch('/api/calls/stats/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (callRes.ok) {
            const callData = await callRes.json();
            const callStats = callData.stats;
            
            document.getElementById('stat-total-calls').textContent = callStats.totalCalls || 0;
            document.getElementById('stat-completed-calls').textContent = callStats.completedCalls || 0;
            document.getElementById('stat-avg-duration').textContent = callStats.avgDuration ? `${Math.round(callStats.avgDuration)}s` : '0s';
        }
        
        // Load recent claims
        const claimsRes = await fetch('/api/claims', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (claimsRes.ok) {
            const claimsData = await claimsRes.json();
            allClaims = claimsData.claims || [];
            
            const recentClaimsBody = document.getElementById('recent-claims-body');
            const recentClaims = allClaims.slice(0, 5);
            
            if (recentClaims.length === 0) {
                recentClaimsBody.innerHTML = '<tr><td colspan="5" class="empty-state">No claims yet. <a href="#" data-page="upload">Upload claims</a></td></tr>';
            } else {
                recentClaimsBody.innerHTML = recentClaims.map(claim => `
                    <tr>
                        <td><strong>${claim.claimNumber}</strong></td>
                        <td>${claim.patientName}</td>
                        <td>${claim.payerName}</td>
                        <td>${claim.billedAmount ? `$${parseFloat(claim.billedAmount).toLocaleString()}` : '-'}</td>
                        <td><span class="status-badge ${claim.status}">${claim.status}</span></td>
                    </tr>
                `).join('');
            }
        }
        
        // Load recent calls
        const callsRes = await fetch('/api/calls', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (callsRes.ok) {
            const callsData = await callsRes.json();
            allCalls = callsData.calls || [];
            
            const recentCallsBody = document.getElementById('recent-calls-body');
            const recentCalls = allCalls.slice(0, 5);
            
            if (recentCalls.length === 0) {
                recentCallsBody.innerHTML = '<tr><td colspan="4" class="empty-state">No calls yet. <a href="#" data-page="claims">Select a claim</a></td></tr>';
            } else {
                recentCallsBody.innerHTML = recentCalls.map(call => `
                    <tr>
                        <td><strong>${call.claimNumber || 'N/A'}</strong></td>
                        <td><span class="status-badge ${call.status}">${call.status}</span></td>
                        <td>${call.duration ? `${call.duration}s` : '-'}</td>
                        <td>${call.summary ? call.summary.substring(0, 50) + '...' : '-'}</td>
                    </tr>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Load claims
async function loadClaims() {
    try {
        const token = localStorage.getItem('lunabill_token');
        const res = await fetch('/api/claims', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            allClaims = data.claims || [];
            renderClaimsTable(allClaims);
        }
    } catch (error) {
        console.error('Load claims error:', error);
    }
}

function renderClaimsTable(claims) {
    const tbody = document.getElementById('all-claims-body');
    
    if (claims.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No claims found</td></tr>';
        return;
    }
    
    tbody.innerHTML = claims.map(claim => `
        <tr>
            <td><strong>${claim.claimNumber}</strong></td>
            <td>${claim.patientName}</td>
            <td>${claim.payerName}</td>
            <td>${claim.billedAmount ? `$${parseFloat(claim.billedAmount).toLocaleString()}` : '-'}</td>
            <td><span class="status-badge ${claim.status}">${claim.status}</span></td>
            <td>${claim.callAttempts || 0}</td>
            <td>${claim.lastCalled ? new Date(claim.lastCalled).toLocaleDateString() : 'Never'}</td>
            <td>
                <button class="btn-sm" onclick="simulateCallForClaim(${claim.id})">📞 Call</button>
                <button class="btn-sm btn-danger" onclick="deleteClaim(${claim.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Table filters
function initTableFilters() {
    const searchInput = document.getElementById('claim-search');
    const statusFilter = document.getElementById('claim-status-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterClaims);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterClaims);
    }
}

function filterClaims() {
    const search = document.getElementById('claim-search').value.toLowerCase();
    const status = document.getElementById('claim-status-filter').value;
    
    let filtered = allClaims;
    
    if (search) {
        filtered = filtered.filter(c => 
            c.claimNumber.toLowerCase().includes(search) ||
            c.patientName.toLowerCase().includes(search) ||
            c.payerName.toLowerCase().includes(search)
        );
    }
    
    if (status) {
        filtered = filtered.filter(c => c.status === status);
    }
    
    renderClaimsTable(filtered);
}

// Load calls
async function loadCalls() {
    try {
        const token = localStorage.getItem('lunabill_token');
        const res = await fetch('/api/calls', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            allCalls = data.calls || [];
            renderCallsTable(allCalls);
        }
    } catch (error) {
        console.error('Load calls error:', error);
    }
}

function renderCallsTable(calls) {
    const tbody = document.getElementById('all-calls-body');
    
    if (calls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No calls found</td></tr>';
        return;
    }
    
    tbody.innerHTML = calls.map(call => `
        <tr>
            <td><strong>${call.claimNumber || 'N/A'}</strong></td>
            <td>${call.phoneNumber}</td>
            <td><span class="status-badge ${call.status}">${call.status}</span></td>
            <td>${call.duration ? `${call.duration}s` : '-'}</td>
            <td>${call.summary ? call.summary.substring(0, 60) + '...' : '-'}</td>
            <td>${call.startTime ? new Date(call.startTime).toLocaleString() : '-'}</td>
        </tr>
    `).join('');
}

// Add Claim Modal
function initAddClaimModal() {
    const addBtn = document.getElementById('add-claim-btn');
    const modal = document.getElementById('add-claim-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const form = document.getElementById('add-claim-form');
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const token = localStorage.getItem('lunabill_token');
                const res = await fetch('/api/claims', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await res.json();
                
                if (res.ok) {
                    modal.classList.remove('active');
                    form.reset();
                    loadClaims();
                    loadDashboard();
                } else {
                    alert(result.error || 'Failed to add claim');
                }
            } catch (error) {
                console.error('Add claim error:', error);
                alert('Failed to add claim');
            }
        });
    }
}

// Delete claim
async function deleteClaim(id) {
    if (!confirm('Are you sure you want to delete this claim?')) return;
    
    try {
        const token = localStorage.getItem('lunabill_token');
        const res = await fetch(`/api/claims/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            loadClaims();
            loadDashboard();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to delete claim');
        }
    } catch (error) {
        console.error('Delete claim error:', error);
        alert('Failed to delete claim');
    }
}

// Simulate Call Modal
function initSimulateCallModal() {
    const simulateBtns = [
        document.getElementById('simulate-call-btn'),
        document.getElementById('simulate-call-btn-2')
    ];
    const modal = document.getElementById('simulate-call-modal');
    const closeBtn = document.getElementById('simulate-modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const form = document.getElementById('simulate-call-form');
    const select = document.getElementById('simulate-claimId');
    
    simulateBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', async () => {
                // Populate claims dropdown
                if (allClaims.length === 0) {
                    await loadClaims();
                }
                
                select.innerHTML = '<option value="">Select a claim...</option>';
                allClaims.forEach(claim => {
                    select.innerHTML += `<option value="${claim.id}">${claim.claimNumber} - ${claim.patientName}</option>`;
                });
                
                modal.classList.add('active');
                document.getElementById('simulate-result').style.display = 'none';
            });
        }
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const token = localStorage.getItem('lunabill_token');
                const res = await fetch('/api/calls/simulate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await res.json();
                
                if (res.ok) {
                    const resultDiv = document.getElementById('simulate-result');
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = `
                        <h4>Call Simulation Complete</h4>
                        <p><strong>Status:</strong> <span class="status-badge ${result.call.status}">${result.call.status}</span></p>
                        <p><strong>Duration:</strong> ${result.call.duration}s</p>
                        <p><strong>Summary:</strong> ${result.call.summary}</p>
                        <p><strong>Next Steps:</strong> ${result.call.nextSteps}</p>
                    `;
                    
                    // Refresh data
                    loadClaims();
                    loadCalls();
                    loadDashboard();
                } else {
                    alert(result.error || 'Failed to simulate call');
                }
            } catch (error) {
                console.error('Simulate call error:', error);
                alert('Failed to simulate call');
            }
        });
    }
}

// Simulate call for specific claim
function simulateCallForClaim(claimId) {
    const modal = document.getElementById('simulate-call-modal');
    const select = document.getElementById('simulate-claimId');
    
    select.value = claimId;
    modal.classList.add('active');
    document.getElementById('simulate-result').style.display = 'none';
}

// Upload Area
function initUploadArea() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                handleFiles(fileInput.files);
            }
        });
    }
}

async function handleFiles(files) {
    const formData = new FormData();
    
    for (const file of files) {
        formData.append('files', file);
    }
    
    try {
        const token = localStorage.getItem('lunabill_token');
        const res = await fetch('/api/claims/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const result = await res.json();
        
        const resultsDiv = document.getElementById('upload-results');
        const resultsContent = document.getElementById('upload-results-content');
        
        resultsDiv.style.display = 'block';
        resultsContent.innerHTML = `
            <p><strong>Files Processed:</strong> ${result.resultsCount} claims imported successfully</p>
            ${result.errorsCount > 0 ? `<p style="color: var(--error);"><strong>Errors:</strong> ${result.errorsCount} rows had errors</p>` : ''}
        `;
        
        // Refresh claims
        loadClaims();
        loadDashboard();
        
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload files');
    }
}

// Settings Form
function initSettingsForm() {
    const form = document.getElementById('settings-form');
    const messageDiv = document.getElementById('settings-message');
    
    if (!form || !currentUser) return;
    
    // Populate form with current user data
    document.getElementById('settings-firstName').value = currentUser.firstName || '';
    document.getElementById('settings-lastName').value = currentUser.lastName || '';
    document.getElementById('settings-email').value = currentUser.email || '';
    document.getElementById('settings-practice').value = currentUser.practiceName || '';
    document.getElementById('settings-phone').value = currentUser.phone || '';
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const token = localStorage.getItem('lunabill_token');
            const res = await fetch('/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                messageDiv.textContent = 'Settings saved successfully!';
                messageDiv.className = 'settings-message success';
                
                // Update local user data
                const updatedUser = { ...currentUser, ...data };
                localStorage.setItem('lunabill_user', JSON.stringify(updatedUser));
                currentUser = updatedUser;
                updateUserInfo();
            } else {
                messageDiv.textContent = 'Failed to save settings';
                messageDiv.className = 'settings-message error';
            }
        } catch (error) {
            console.error('Settings save error:', error);
            messageDiv.textContent = 'Failed to save settings';
            messageDiv.className = 'settings-message error';
        }
    });
}