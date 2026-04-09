// Auth page JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initAuthTabs();
    initLoginForm();
    initRegisterForm();
});

// Tab switching
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });
}

// Login form
function initLoginForm() {
    const form = document.getElementById('login-form');
    const messageDiv = document.getElementById('login-message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const submitBtn = document.getElementById('login-btn');
        submitBtn.textContent = 'Signing in...';
        submitBtn.disabled = true;
        messageDiv.textContent = '';
        messageDiv.className = 'auth-message';
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }
            
            // Store token
            localStorage.setItem('lunabill_token', result.token);
            localStorage.setItem('lunabill_user', JSON.stringify(result.user));
            
            messageDiv.textContent = 'Login successful! Redirecting...';
            messageDiv.classList.add('success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
            
        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.classList.add('error');
            submitBtn.textContent = 'Sign In';
            submitBtn.disabled = false;
        }
    });
}

// Register form
function initRegisterForm() {
    const form = document.getElementById('register-form');
    const messageDiv = document.getElementById('register-message');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validate passwords match
        if (data.password !== data.confirmPassword) {
            messageDiv.textContent = 'Passwords do not match';
            messageDiv.classList.add('error');
            return;
        }
        
        // Remove confirmPassword from data
        delete data.confirmPassword;
        
        const submitBtn = document.getElementById('register-btn');
        submitBtn.textContent = 'Creating account...';
        submitBtn.disabled = true;
        messageDiv.textContent = '';
        messageDiv.className = 'auth-message';
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }
            
            // Store token
            localStorage.setItem('lunabill_token', result.token);
            localStorage.setItem('lunabill_user', JSON.stringify(result.user));
            
            messageDiv.textContent = 'Account created! Redirecting to dashboard...';
            messageDiv.classList.add('success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
            
        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.classList.add('error');
            submitBtn.textContent = 'Create Account';
            submitBtn.disabled = false;
        }
    });
}