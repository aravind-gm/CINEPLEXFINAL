/**
 * API Service for the Movie Recommendation System
 * Handles all API calls to the backend
 */

// Define API base URL (already set to your Render URL)
const API_BASE_URL = 'https://cineplexfinal.onrender.com';

class ApiService {
    constructor() {
        // Use the direct API_BASE_URL constant instead of currentConfig
        this.baseUrl = API_BASE_URL;
        this.imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    // In your apiCall method, add better error handling for CORS issues
    async apiCall(endpoint, options = {}) {
        // Make sure endpoint starts with a slash
        const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = this.baseUrl + formattedEndpoint;
        
        // Default options
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            mode: 'cors',
            credentials: 'include'  // Include credentials for CORS requests
        };
        
        // Merge options
        const fetchOptions = { ...defaultOptions, ...options };
        
        // Log the request for debugging
        console.log('API request:', fetchOptions.method, endpoint, fetchOptions);
        
        try {
            const response = await fetch(url, fetchOptions);
            
            // Log response status
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                const errorResponse = {
                    status: response.status,
                    statusText: response.statusText
                };
                console.error('API error response:', errorResponse);
                
                try {
                    const errorText = await response.text();
                    console.error('Error response text:', errorText);
                    try {
                        const errorData = JSON.parse(errorText);
                        console.error('Error response data:', errorData);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    } catch (e) {
                        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
                    }
                } catch (e) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            
            // Check if response is empty
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        } catch (error) {
            console.error('API Error:', error);
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
            console.error('Registration error:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        return this.apiCall('/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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