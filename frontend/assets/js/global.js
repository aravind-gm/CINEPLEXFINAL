class GlobalSearch {
    constructor() {
        this.setupSearchHandlers();
    }

    setupSearchHandlers() {
        // Get all search forms across pages
        const searchForms = document.querySelectorAll('.search-form');
        
        searchForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const searchInput = form.querySelector('input[type="search"]');
                const query = searchInput?.value?.trim();
                
                if (query) {
                    // Redirect to search results page with query
                    window.location.href = `/pages/search.html?query=${encodeURIComponent(query)}`;
                }
            });
        });
    }
}

// Initialize global search on all pages
document.addEventListener('DOMContentLoaded', () => {
    new GlobalSearch();
});

// This script ensures apiService is globally available
window.addEventListener('DOMContentLoaded', () => {
    // Check if apiService already exists
    if (!window.apiService && typeof apiService !== 'undefined') {
        window.apiService = apiService;
    }
    
    // If it still doesn't exist, create it
    if (!window.apiService) {
        console.warn("Creating global apiService instance");
        // Simplified temporary version if api.js hasn't loaded yet
        window.apiService = {
            baseUrl: 'https://cineplexfinal.onrender.com',
            // Add minimal required methods
            login: async (email, password) => {
                // Redirect to full implementation once loaded
                if (typeof apiService !== 'undefined') {
                    return apiService.login(email, password);
                }
                // Otherwise basic implementation
                // ...
            }
        };
    }
});

// This script ensures global services are properly initialized

// Make sure apiService is globally available
document.addEventListener('DOMContentLoaded', () => {
    // Initialize toast container if needed
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Check authentication state from localStorage
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        // Check if we're on landing page but already logged in
        if (window.location.pathname.includes('landing.html')) {
            // Redirect to index
            window.location.href = 'index.html';
        }
    } else {
        // Not logged in, handle auth-required pages
        const isAuthRequired = document.body.classList.contains('auth-required');
        if (isAuthRequired && !window.location.pathname.includes('landing.html')) {
            // Redirect to landing
            window.location.href = '../landing.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }
});