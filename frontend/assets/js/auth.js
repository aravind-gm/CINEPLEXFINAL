/**
 * Authentication Handler for the Movie Recommendation System
 * Manages user authentication state and UI updates
 */

// Function to ensure apiService is available
function getApiService() {
    // First try window.apiService (global)
    if (window.apiService) return window.apiService;
    
    // If that fails, check if it's directly accessible 
    if (typeof apiService !== 'undefined') return apiService;
    
    // Last resort - create a new instance
    console.warn("API Service not found, creating temporary instance");
    return new ApiService();
}

class AuthHandler {
    constructor() {
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginBtn = document.getElementById('login-btn') || document.getElementById('login-btn-main');
        this.registerBtn = document.getElementById('register-btn') || document.getElementById('register-btn-main');
        this.logoutBtn = document.getElementById('logout-btn');
        
        // Initialize modals safely
        this.initializeModals();

        this.isLoggedIn = false;
        this.currentUser = null;
        
        // DOM elements
        this.authButtons = document.getElementById('auth-buttons');
        this.userInfo = document.getElementById('user-info');
        this.usernameEl = document.getElementById('username');
        
        // Add guest mode property
        this.isGuestMode = localStorage.getItem('isGuestMode') === 'true';

        this.init();
    }

    initializeModals() {
        try {
            this.loginModal = document.getElementById('loginModal');
            this.registerModal = document.getElementById('registerModal');
            
            if (this.registerModal) {
                // Do not clone the modal DOM element - this is causing the form reset
                const existingModal = bootstrap.Modal.getInstance(this.registerModal);
                if (existingModal) {
                    existingModal.dispose();
                }
                
                this.registerModalInstance = new bootstrap.Modal(this.registerModal, {
                    backdrop: 'static',
                    keyboard: false
                });
            }
            
            if (this.loginModal) {
                const existingModal = bootstrap.Modal.getInstance(this.loginModal);
                if (existingModal) {
                    existingModal.dispose();
                }
                this.loginModalInstance = new bootstrap.Modal(this.loginModal);
            }
        } catch (error) {
            console.error('Error initializing modals:', error);
        }
    }
    
    async init() {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Check if in guest mode
                if (this.isGuestMode) {
                    // Get guest user from localStorage
                    this.currentUser = JSON.parse(localStorage.getItem('user'));
                    this.isLoggedIn = true;
                    this.updateUI();
                } else {
                    // Normal login flow
                    this.currentUser = await apiService.getCurrentUser();
                    this.isLoggedIn = true;
                    this.updateUI();
                }
            } catch (error) {
                console.error('Error getting current user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('isGuestMode');
                this.isLoggedIn = false;
                this.updateUI();
            }
        } else {
            this.isLoggedIn = false;
            this.updateUI();
        }
        
        this.setupEventListeners();

        // Add global logout handler
        document.querySelectorAll('#logout-btn, #profile-logout-btn').forEach(btn => {
            btn?.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }
    
    setupEventListeners() {
        // Login button click
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => {
                this.loginModalInstance?.show();
            });
        }
        
        // Register button click
        if (this.registerBtn) {
            this.registerBtn.addEventListener('click', () => {
                this.registerModalInstance?.show();
            });
        }
        
        // Logout button click
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Login form submit
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
        }
        
        // Register form submit - use direct DOM access instead of this.registerForm
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            const api = getApiService();
            const response = await api.login(email, password);
            
            if (response.access_token) {
                // Login successful
                this.isLoggedIn = true;
                this.currentUser = response.user;
                
                // Close the modal
                if (this.loginModalInstance) {
                    this.loginModalInstance.hide();
                }
                
                // Show success message
                this.showToast('Login successful!', 'success');
                
                // Update UI
                this.updateUI();
                
                // Redirect to index page after a short delay
                setTimeout(() => {
                    // Check current page
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('landing.html')) {
                        window.location.href = 'index.html';
                    } else {
                        // If already on a different page, just refresh
                        window.location.reload();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error("Login error:", error);
            
            // Show error message
            const errorMessage = error.message || 'Invalid credentials. Please try again.';
            this.showToast(errorMessage, 'error');
            
            // Create alert for error message
            const alertEl = this.createAlert('danger');
            alertEl.innerText = errorMessage;
            
            // Add alert to login form
            const alertContainer = document.querySelector('#login-form .alert-container');
            if (alertContainer) {
                alertContainer.innerHTML = '';
                alertContainer.appendChild(alertEl);
            }
        }
    }

    async handleRegister() {
        try {
            const formData = {
                full_name: document.getElementById('register-fullname')?.value.trim(),
                age: parseInt(document.getElementById('register-age')?.value),
                email: document.getElementById('register-email')?.value.trim(),
                gender: document.getElementById('register-gender')?.value,
                password: document.getElementById('register-password')?.value,
                location: document.getElementById('register-location')?.value.trim(),
                marital_status: document.getElementById('register-marital-status')?.value,
                favorite_countries: document.getElementById('register-countries')?.value.trim(),
                username: document.getElementById('register-username')?.value.trim()
            };

            // Show loading state
            const submitBtn = this.registerForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';

            try {
                const response = await apiService.register(formData);
                this.showToast('Registration successful! Please login.', 'success');
                this.registerModalInstance?.hide();
                
                // Reset form
                this.registerForm.reset();
                
                // Show login modal after short delay
                setTimeout(() => {
                    this.loginModalInstance?.show();
                }, 1000);
            } catch (error) {
                this.showToast(error.message || 'Registration failed. Please try again.', 'danger');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Register';
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast('Registration failed. Please try again.', 'danger');
        }
    }

    createAlert(type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} mb-3`;
        alert.role = 'alert';
        document.querySelector('#registerModal .modal-body').insertBefore(
            alert,
            document.querySelector('#register-form')
        );
        return alert;
    }

    async fadeTransition(callback) {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease';
        await new Promise(resolve => setTimeout(resolve, 300));
        callback();
    }
    
    // Update logout to also clear guest mode
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isGuestMode');
        // Use relative path based on current location
        const path = window.location.pathname.includes('/pages/') ? '../landing.html' : 'landing.html';
        window.location.href = path;
    }
    
    updateUI() {
        if (this.authButtons && this.userInfo) {
            if (this.isLoggedIn && this.currentUser) {
                this.authButtons.classList.add('d-none');
                this.userInfo.classList.remove('d-none');
                if (this.usernameEl) {
                    this.usernameEl.textContent = this.currentUser.username;
                }
            } else {
                this.authButtons.classList.remove('d-none');
                this.userInfo.classList.add('d-none');
            }
        }
        
        // Update other UI elements based on authentication state
        const authRequiredElements = document.querySelectorAll('.auth-required');
        const noAuthElements = document.querySelectorAll('.no-auth');
        
        authRequiredElements.forEach(element => {
            if (this.isLoggedIn) {
                element.classList.remove('d-none');
            } else {
                element.classList.add('d-none');
            }
        });
        
        noAuthElements.forEach(element => {
            if (this.isLoggedIn) {
                element.classList.add('d-none');
            } else {
                element.classList.remove('d-none');
            }
        });

        // If in guest mode, show guest indicator
        if (this.isLoggedIn && this.isGuestMode) {
            const usernameEl = document.getElementById('username');
            if (usernameEl) {
                usernameEl.innerHTML = 'Guest <span class="badge bg-secondary ms-1">Guest Mode</span>';
            }
            
            // Hide any features that shouldn't be available to guests
            document.querySelectorAll('.no-guest').forEach(element => {
                element.classList.add('d-none');
            });
        }
    }
    
    showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type}`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // Create toast content
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        // Add toast to container
        toastContainer.appendChild(toast);
        
        // Initialize and show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }
}

// Initialize auth handler safely
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.authHandler = new AuthHandler();
    } catch (error) {
        console.error('Error initializing AuthHandler:', error);
    }
});