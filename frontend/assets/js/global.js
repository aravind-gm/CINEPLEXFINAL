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