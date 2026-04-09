// LunaBill Frontend Application

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initNavigation();
    initAudioPlayer();
    initAnimatedCounters();
    initDemoForm();
    initSmoothScroll();
    initMobileMenu();
});

// Navigation scroll effect
function initNavigation() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
            header.style.padding = '12px 0';
        } else {
            header.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
            header.style.padding = '16px 0';
        }
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.right = '0';
            nav.style.background = 'white';
            nav.style.padding = '20px';
            nav.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
            
            const ul = nav.querySelector('ul');
            ul.style.flexDirection = 'column';
            ul.style.gap = '16px';
        });
    }
}

// Audio player simulation
function initAudioPlayer() {
    const playDemoBtn = document.getElementById('play-demo-btn');
    const audioPlayer = document.getElementById('audio-player');
    const audioPlayBtn = document.getElementById('audio-play');
    const progressBar = document.getElementById('audio-progress-bar');
    
    if (playDemoBtn && audioPlayer) {
        playDemoBtn.addEventListener('click', () => {
            audioPlayer.style.display = audioPlayer.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (audioPlayBtn && progressBar) {
        let isPlaying = false;
        let progress = 0;
        let interval;
        
        audioPlayBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            audioPlayBtn.textContent = isPlaying ? '⏸' : '▶';
            
            if (isPlaying) {
                interval = setInterval(() => {
                    progress += 0.5;
                    if (progress >= 100) {
                        progress = 0;
                        isPlaying = false;
                        audioPlayBtn.textContent = '▶';
                        clearInterval(interval);
                    }
                    progressBar.style.width = `${progress}%`;
                }, 100);
            } else {
                clearInterval(interval);
            }
        });
    }
}

// Animated counters
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000;
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, stepTime);
}

// Demo form submission
function initDemoForm() {
    const form = document.getElementById('demo-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            try {
                // In production, this would send to your API
                // const response = await fetch('/api/contact', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(data)
                // });
                
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Show success message
                form.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <div style="font-size: 4rem; margin-bottom: 20px;">✓</div>
                        <h3 style="color: #1A2B3C; margin-bottom: 12px;">Thank You!</h3>
                        <p style="color: #718096;">We'll contact you within 24 hours to schedule your demo.</p>
                    </div>
                `;
            } catch (error) {
                console.error('Form submission error:', error);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'background: #FED7D7; color: #C53030; padding: 12px; border-radius: 8px; margin-top: 16px;';
                errorDiv.textContent = 'Something went wrong. Please try again.';
                form.appendChild(errorDiv);
            }
        });
    }
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// API helper functions for dashboard integration
const API = {
    baseURL: window.location.origin,
    
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('lunabill_token');
        
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            }
        };
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        
        return response.json();
    },
    
    // Auth endpoints
    async register(data) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async login(data) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async logout() {
        return this.request('/api/auth/logout');
    },
    
    async getProfile() {
        return this.request('/api/auth/profile');
    },
    
    // Claims endpoints
    async getClaims() {
        return this.request('/api/claims');
    },
    
    async createClaim(data) {
        return this.request('/api/claims', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async updateClaim(id, data) {
        return this.request(`/api/claims/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    async deleteClaim(id) {
        return this.request(`/api/claims/${id}`, {
            method: 'DELETE'
        });
    },
    
    async uploadClaims(formData) {
        const token = localStorage.getItem('lunabill_token');
        const response = await fetch(`${this.baseURL}/api/claims/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }
        
        return response.json();
    },
    
    async getClaimStats() {
        return this.request('/api/claims/stats/summary');
    },
    
    // Calls endpoints
    async getCalls() {
        return this.request('/api/calls');
    },
    
    async initiateCall(data) {
        return this.request('/api/calls', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async simulateCall(data) {
        return this.request('/api/calls/simulate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async getCallStats() {
        return this.request('/api/calls/stats/summary');
    },
    
    // Dashboard endpoints
    async getDashboard() {
        return this.request('/api/dashboard');
    },
    
    async getRecentActivity() {
        return this.request('/api/dashboard/activity');
    },
    
    async getUpcomingCalls() {
        return this.request('/api/dashboard/upcoming');
    }
};

// Export API for use in dashboard
window.LunaBillAPI = API;