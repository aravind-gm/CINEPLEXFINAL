/**
 * API Service for the Movie Recommendation System
 * Handles all API calls to the backend
 */

// Define API base URL (update this to your actual backend URL)
const API_BASE_URL = 'https://cineplexfinal.onrender.com';

class ApiService {
    constructor() {
        this.baseUrl = 'https://cineplexfinal.onrender.com';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async apiCall(endpoint, options = {}) {
        const API_BASE_URL = 'https://cineplexfinal.onrender.com';  // Update to match your backend URL
        
        // Create an abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // Clear timeout on successful response
            
            // Log response details for debugging
            console.log(`API call to ${endpoint}: status ${response.status}`);
            
            if (!response.ok) {
                // Try to get error details from response
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.detail || `API error: ${response.statusText}`;
                } catch (e) {
                    errorMessage = `API error: ${response.statusText}`;
                }
                
                // Create error object with status code
                const error = new Error(errorMessage);
                error.status = response.status;
                throw error;
            }
            
            // Check if response is empty
            const text = await response.text();
            if (!text) {
                return null;
            }
            
            // Parse JSON response
            return JSON.parse(text);
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Server may be unavailable.');
            }
            console.error(`API call failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Helper method for TMDB image URLs
    getImageUrl(path) {
        if (!path) return '../assets/images/placeholder.jpg';
        return `${this.imageBaseUrl}${path}`;
    }

    // Core movie methods
    async getPopularMovies(page = 1) {
        try {
            const response = await this.apiCall(`/movies/popular?page=${page}`);
            return {
                movies: response.movies || [],
                current_page: page,
                total_pages: Math.ceil((response.total_results || 0) / 20) // Assuming 20 movies per page
            };
        } catch (error) {
            console.error('Error fetching popular movies:', error);
            return {
                movies: [],
                current_page: 1,
                total_pages: 1
            };
        }
    }

    async getGenres() {
        return this.apiCall('/movies/genres');
    }

    async getMovieDetails(movieId) {
        try {
            // Use the common apiCall method instead of direct fetch
            const response = await this.apiCall(`/movies/${movieId}`, {
                headers: this.getAuthHeaders() // Use the correct method name
            });
            return response;
        } catch (error) {
            console.error('Error fetching movie details:', error);
            throw error;
        }
    }

    async getSimilarMovies(movieId, page = 1, limit = 8) {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            const response = await this.apiCall(`/movies/${movieId}/similar?page=${page}&limit=${limit}`, {
                headers: headers
            });
            
            return {
                movies: response.results || [],
                current_page: page,
                total_pages: Math.ceil((response.total_results || 0) / limit)
            };
        } catch (error) {
            console.error('Error fetching similar movies:', error);
            if (error.status === 401) {
                // Handle unauthorized error gracefully
                return {
                    movies: [],
                    current_page: 1,
                    total_pages: 1,
                    error: 'Authentication required'
                };
            }
            return {
                movies: [],
                current_page: 1,
                total_pages: 1
            };
        }
    }

    async login(email, password) {
        // FastAPI OAuth expects x-www-form-urlencoded format
        const formData = new URLSearchParams();
        formData.append('username', email); // FastAPI OAuth uses username field
        formData.append('password', password);

        try {
            const response = await this.apiCall('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            });

            // Store token if successful
            if (response.access_token) {
                localStorage.setItem('token', response.access_token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await this.apiCall('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            return response;
        } catch (error) {
            const errorMessage = error.message || 'Registration failed';
            console.error('Registration error:', errorMessage);
            throw new Error(errorMessage);
        }
    }

    async getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token available for API call');
            return null;
        }
        
        try {
            return await this.apiCall('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error in getCurrentUser:', error);
            // If unauthorized, clear token
            if (error.status === 401) {
                localStorage.removeItem('token');
            }
            throw error;
        }
    }

    async searchMovies(query, page = 1) {
        try {
            console.log(`Searching movies with query: ${query}, page: ${page}`);
            
            if (!query?.trim()) {
                return {
                    page: 1,
                    results: [],
                    total_pages: 0,
                    total_results: 0
                };
            }
            
            const encodedQuery = encodeURIComponent(query.trim());
            const response = await this.apiCall(`/movies/search?query=${encodedQuery}&page=${page}`);
            
            console.log('Search response:', response);
            return response;
            
        } catch (error) {
            console.error('Error searching movies:', error);
            return {
                page: 1,
                results: [],
                total_pages: 0,
                total_results: 0
            };
        }
    }

    async getMoviesByGenre(genreId, page = 1) {
        try {
            const response = await this.apiCall(`/movies/genre/${genreId}?page=${page}`);
            return {
                results: response.results || [],
                page: response.page || 1,
                total_pages: response.total_pages || 1,
                total_results: response.total_results || 0
            };
        } catch (error) {
            console.error('Error fetching genre movies:', error);
            return {
                results: [],
                page: 1,
                total_pages: 1,
                total_results: 0
            };
        }
    }
    
    async uploadProfilePicture(file) {
        const formData = new FormData();
        formData.append('avatar', file);

        return this.apiCall('/users/avatar', {
            method: 'POST',
            headers: {
                // Remove Content-Type to let browser set it with boundary
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
    }

    async updateProfile(formData) {
        const token = localStorage.getItem('token');
        
        console.log('Updating profile with data:', Object.fromEntries(formData));
        
        try {
            const response = await this.apiCall('/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            console.log('Profile update response:', response);
            
            if (!response) {
                throw new Error('No response from server');
            }
            
            return response;
        } catch (error) {
            console.error('Error in updateProfile:', error);
            throw error;
        }
    }

    async getAvatars() {
        return this.apiCall('/users/avatars');
    }

    async getPersonalizedRecommendations(limit = 12) {
        try {
            const response = await this.apiCall(`/recommendations/personalized?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response || [];
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return [];
        }
    }

    async getRecommendationsByGenre(genreId, limit = 8) {
        try {
            const response = await this.apiCall(`/recommendations/by-genre/${genreId}?limit=${limit}`);
            return response;
        } catch (error) {
            console.error('Error fetching genre recommendations:', error);
            throw error;
        }
    }

    async toggleWatchlist(movieId) {
        try {
            const response = await this.apiCall(`/users/watch-list/toggle`, {  // Changed from /users/watchlist
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ movie_id: movieId })
            });
            return response;
        } catch (error) {
            console.error('Error toggling watchlist:', error);
            throw error;
        }
    }

    async getWatchlist() {
        try {
            const response = await this.apiCall(`/users/watch-list`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.watchlist || [];
        } catch (error) {
            console.error('Error getting watchlist:', error);
            return []; // Return empty array instead of throwing
        }
    }

    async addToWatchHistory(movieId) {
        try {
            const response = await this.apiCall('/users/watch-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ movie_id: movieId })
            });
            return response;
        } catch (error) {
            console.error('Error adding to watch history:', error);
            throw error;
        }
    }

    async getWatchHistory(limit = 12) {
        try {
            const response = await this.apiCall(`/users/watch-history?limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.history || [];
        } catch (error) {
            console.error('Error getting watch history:', error);
            return [];
        }
    }

    async removeFromWatchHistory(movieId) {
        try {
            const response = await this.apiCall(`/users/watch-history/${movieId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response;
        } catch (error) {
            console.error('Error removing from watch history:', error);
            throw error;
        }
    }

    async updateUserDemographics(demographicData) {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication required');
        
        try {
            console.log('Sending demographic data to API:', demographicData);
            const response = await this.apiCall('/users/demographics', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(demographicData)
            });
            
            return response;
        } catch (error) {
            console.error('Update demographics error:', error);
            throw error;
        }
    }

    async getUserDemographics() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        return this.apiCall('/users/demographics', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
}

// Create and export an instance of the ApiService
const apiService = new ApiService();

// Make apiService global so it's accessible from other scripts
window.apiService = apiService;