/**
 * Profile page JavaScript
 * Handles user profile display and management
 */

class ProfilePage {
    constructor() {
        // DOM elements
        this.profileUsername = document.getElementById('profile-username');
        this.profileEmail = document.getElementById('profile-email');
        this.moviesRatedCount = document.getElementById('movies-rated-count');
        this.moviesWatchedCount = document.getElementById('movies-watched-count');
        this.favoriteGenres = document.getElementById('favorite-genres');
        this.recentlyWatchedContainer = document.getElementById('recently-watched');
        this.watchlistContainer = document.getElementById('watchlist');
        this.editProfileForm = document.getElementById('edit-profile-form');
        this.loginBtnMain = document.getElementById('login-btn-main');
        this.registerBtnMain = document.getElementById('register-btn-main');
        this.avatarGrid = document.getElementById('avatar-grid');
        this.avatarPreview = document.getElementById('avatar-preview');
        
        // Add demographic elements
        this.profileFullName = document.getElementById('profile-fullname');
        this.profileAge = document.getElementById('profile-age');
        this.profileGender = document.getElementById('profile-gender');
        this.profileLocation = document.getElementById('profile-location');
        this.profileMaritalStatus = document.getElementById('profile-marital-status');
        this.profileFavoriteCountries = document.getElementById('profile-favorite-countries');
        
        // Remove these lines as we're not using them anymore
        // this.avatarPicker = document.getElementById('avatar-picker');
        // this.selectedAvatarInput = document.getElementById('selected-avatar');
        
        // User data
        this.userData = null;
        
        // Base path for avatars
        this.avatarsPath = '../assets/images/avatars';

        // Check if in guest mode
        this.isGuestMode = localStorage.getItem('isGuestMode') === 'true';

        // Initialize
        this.init();
    }

    async init() {
        // Load default avatars first
        await this.loadDefaultAvatars();
        
        // Then bind events
        this.bindEvents();
        
        // Finally load user profile if logged in
        const token = localStorage.getItem('token');
        if (token) {
            await this.loadUserProfile();
        }
    }
    
    bindEvents() {
        // Edit profile form submit
        if (this.editProfileForm) {
            this.editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile(e);
            });
        }
        
        // Login button click (in the main content)
        if (this.loginBtnMain) {
            this.loginBtnMain.addEventListener('click', () => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            });
        }
        
        // Register button click (in the main content)
        if (this.registerBtnMain) {
            this.registerBtnMain.addEventListener('click', () => {
                const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
                registerModal.show();
            });
        }

        // Add preview for profile picture
        const avatarInput = document.getElementById('edit-avatar');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.querySelector('.user-avatar');
                        if (preview) {
                            preview.src = e.target.result;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Add edit demographics button click handler
        const editDemographicsBtn = document.getElementById('edit-demographics-btn');
        if (editDemographicsBtn) {
            editDemographicsBtn.addEventListener('click', () => {
                // Populate the form with current values
                document.getElementById('edit-fullname').value = this.userData.full_name || '';
                document.getElementById('edit-age').value = this.userData.age || '';
                document.getElementById('edit-gender').value = this.userData.gender || 'prefer not to say';
                document.getElementById('edit-location').value = this.userData.location || '';
                document.getElementById('edit-marital-status').value = this.userData.marital_status || 'prefer not to say';
                document.getElementById('edit-favorite-countries').value = this.userData.favorite_countries || '';
                
                // Show modal
                const demographicsModal = new bootstrap.Modal(document.getElementById('editDemographicsModal'));
                demographicsModal.show();
            });
        }
        
        // Add save demographics button click handler
        const saveDemographicsBtn = document.getElementById('save-demographics-btn');
        if (saveDemographicsBtn) {
            saveDemographicsBtn.addEventListener('click', async () => {
                // Get form values
                const demographicData = {
                    full_name: document.getElementById('edit-fullname').value,
                    age: parseInt(document.getElementById('edit-age').value) || null,
                    gender: document.getElementById('edit-gender').value,
                    location: document.getElementById('edit-location').value,
                    marital_status: document.getElementById('edit-marital-status').value,
                    favorite_countries: document.getElementById('edit-favorite-countries').value
                };
                
                // Update profile
                const success = await this.updateDemographics(demographicData);
                
                if (success) {
                    // Close modal
                    const demographicsModal = bootstrap.Modal.getInstance(document.getElementById('editDemographicsModal'));
                    demographicsModal.hide();
                }
            });
        }
    }
    
    async loadUserProfile() {
        try {
            // Show loading state
            this.showLoadingSpinner();
            
            // Get user data
            const token = localStorage.getItem('token');
            if (!token) {
                // No token found - show guest mode or redirect
                this.hideLoadingSpinner(document.querySelector('.spinner-overlay'));
                this.showGuestModeNotice();
                return;
            }

            // Fetch user data
            this.userData = await apiService.getCurrentUser();
            
            if (!this.userData) {
                throw new Error('Failed to load user data');
            }
            
            console.log('User data loaded:', this.userData);
            
            // Update the UI with user data
            this.updateProfileDisplay();
            
            // Hide spinner after loading
            this.hideLoadingSpinner(document.querySelector('.spinner-overlay'));
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.hideLoadingSpinner(document.querySelector('.spinner-overlay'));
            
            // Update UI to show error instead of infinite loading
            document.querySelectorAll('.demo-value').forEach(el => {
                el.innerHTML = '<span class="text-danger">Error loading data</span>';
            });
            
            this.showToast('Error loading profile: ' + error.message, 'danger');
            
            // If token is invalid, redirect to login page after short delay
            if (error.message && error.message.includes('401')) {
                setTimeout(() => {
                    localStorage.removeItem('token'); // Clear invalid token
                    window.location.href = '../landing.html';
                }, 2000);
            }
        }
    }
    
    // Add method to show guest mode notice
    showGuestModeNotice() {
        const container = document.querySelector('.container.py-5');
        if (!container) return;
        
        const notice = document.createElement('div');
        notice.className = 'alert alert-info mb-4';
        notice.innerHTML = `
            <h4 class="alert-heading"><i class="fas fa-info-circle me-2"></i>Guest Mode Active</h4>
            <p>You are browsing as a guest. To save your preferences, watch history, and access all features, please 
            <a href="../landing.html" class="alert-link">create an account</a>.</p>
            <hr>
            <p class="mb-0">Some features are limited or unavailable in guest mode.</p>
        `;
        
        container.insertBefore(notice, container.firstChild);
    }

    updateProfileDisplay() {
        console.log('Updating profile display with:', this.userData);

        // Update profile avatar
        if (this.userData.avatar_url) {
            const avatarElements = document.querySelectorAll('.user-avatar');
            avatarElements.forEach(el => {
                el.src = this.userData.avatar_url.startsWith('http') 
                    ? this.userData.avatar_url 
                    : `${this.avatarsPath}/${this.userData.avatar_url}`;
                el.onerror = () => {
                    el.src = '../assets/images/avatars/default.png';
                };
            });
        }
        
        // Update user info with fallbacks to placeholder text
        if (this.profileUsername) {
            this.profileUsername.textContent = this.userData.username || 'Username';
        }
        
        if (this.profileEmail) {
            this.profileEmail.textContent = this.userData.email || 'user@example.com';
        }
        
        // Update demographic information - handle multiple field name formats
        if (this.profileFullName) {
            this.profileFullName.textContent = this.userData.full_name || 'Not provided';
        }
        
        if (this.profileAge) {
            this.profileAge.textContent = this.userData.age || 'Not provided';
        }
        
        if (this.profileGender) {
            const gender = this.userData.gender || 'not provided';
            this.profileGender.textContent = gender.charAt(0).toUpperCase() + gender.slice(1);
        }
        
        if (this.profileLocation) {
            this.profileLocation.textContent = this.userData.location || 'Not provided';
        }
        
        if (this.profileMaritalStatus) {
            const status = this.userData.marital_status || 'not provided';
            this.profileMaritalStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
        
        if (this.profileFavoriteCountries) {
            this.profileFavoriteCountries.textContent = this.userData.favorite_countries || 'Not provided';
        }
        
        // Set up edit form fields
        try {
            if (document.getElementById('edit-fullname')) {
                document.getElementById('edit-fullname').value = this.userData.full_name || '';
            }
            if (document.getElementById('edit-age')) {
                document.getElementById('edit-age').value = this.userData.age || '';
            }
            if (document.getElementById('edit-gender')) {
                document.getElementById('edit-gender').value = this.userData.gender || 'prefer not to say';
            }
            if (document.getElementById('edit-location')) {
                document.getElementById('edit-location').value = this.userData.location || '';
            }
            if (document.getElementById('edit-marital-status')) {
                document.getElementById('edit-marital-status').value = this.userData.marital_status || 'prefer not to say';
            }
            if (document.getElementById('edit-favorite-countries')) {
                document.getElementById('edit-favorite-countries').value = this.userData.favorite_countries || '';
            }
        } catch (error) {
            console.error('Error setting up edit form:', error);
        }
    }
    
    async loadWatchHistory() {
        if (!this.recentlyWatchedContainer || !this.userData) return;
        
        const watchHistory = this.userData.watch_history || [];
        
        // Clear container
        this.recentlyWatchedContainer.innerHTML = '';
        
        if (watchHistory.length === 0) {
            this.recentlyWatchedContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>You haven't watched any movies yet.</p>
                    <a href="../index.html" class="btn btn-primary">Browse Movies</a>
                </div>
            `;
            return;
        }
        
        // Display recent watch history (last 6 movies)
        watchHistory.slice(0, 6).forEach(movie => {
            this.recentlyWatchedContainer.appendChild(this.createMovieCard(movie));
        });
    }
    
    async loadWatchlist() {
        if (!this.watchlistContainer || !this.userData) return;
        
        const watchlist = this.userData.watchlist || [];
        
        // Clear container
        this.watchlistContainer.innerHTML = '';
        
        if (watchlist.length === 0) {
            this.watchlistContainer.innerHTML = `
                <div class="col-12 text-center">
                    <p>Your watchlist is empty.</p>
                    <a href="../index.html" class="btn btn-primary">Browse Movies</a>
                </div>
            `;
            return;
        }
        
        // Display watchlist (up to 6 movies)
        watchlist.slice(0, 6).forEach(movie => {
            const movieCard = this.createMovieCard(movie);
            
            // Add remove from watchlist button
            const cardBody = movieCard.querySelector('.movie-card-body');
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn btn-sm btn-outline-danger mt-2';
            removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Remove';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeFromWatchlist(movie.id);
            });
            
            cardBody.appendChild(removeBtn);
            
            this.watchlistContainer.appendChild(movieCard);
        });
    }
    
    async updateProfile(e) {
        e.preventDefault();
        const spinner = this.showLoadingSpinner();
        
        try {
            const formData = new FormData();
            
            const username = document.getElementById('edit-username').value;
            const email = document.getElementById('edit-email').value;
            const password = document.getElementById('edit-password').value;
            const selectedAvatar = document.getElementById('selected-avatar').value;
            
            if (username) formData.append('username', username);
            if (email) formData.append('email', email);
            if (password) formData.append('password', password);
            if (selectedAvatar) formData.append('avatar', selectedAvatar);
            
            const response = await apiService.updateProfile(formData);
            
            // Update local user data
            this.userData = response;
            
            // Update display
            this.updateProfileDisplay();
            
            // Hide modal
            const editProfileModal = bootstrap.Modal.getInstance(
                document.getElementById('editProfileModal')
            );
            editProfileModal?.hide();
            
            this.showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast(
                error.response?.detail || error.message || 'Failed to update profile', 
                'danger'
            );
        } finally {
            this.hideLoadingSpinner(spinner);
        }
    }
    
    async removeFromWatchlist(movieId) {
        // In a real app, this would call the backend to remove the movie from watchlist
        
        // For this demo, we'll just simulate the removal
        if (this.userData && this.userData.watchlist) {
            this.userData.watchlist = this.userData.watchlist.filter(movie => movie.id !== movieId);
            
            // Reload watchlist
            this.loadWatchlist();
            
            // Show success message
            this.showToast('Movie removed from watchlist', 'success');
        }
    }
    
    createMovieCard(movie) {
        const movieCol = document.createElement('div');
        movieCol.className = 'col-lg-4 col-sm-6 mb-4';
        
        // Format release date
        const releaseDate = movie.release_date ? new Date(movie.release_date).toLocaleDateString() : 'Unknown';
        
        // Format genres (if available)
        let genresHtml = '';
        if (movie.genres && movie.genres.length > 0) {
            genresHtml = movie.genres.map(genre => genre.name).join(', ');
        }
        
        movieCol.innerHTML = `
            <div class="movie-card">
                <div class="position-relative">
                    <img src="${apiService.getImageUrl(movie.poster_path)}" class="movie-poster" alt="${movie.title}">
                    <span class="movie-rating">${movie.vote_average?.toFixed(1) || 'N/A'}</span>
                </div>
                <div class="movie-card-body">
                    <h5 class="movie-title">${movie.title}</h5>
                    <div class="movie-genres">${genresHtml || releaseDate}</div>
                    <div class="movie-card-footer">
                        <small class="text-muted">${releaseDate}</small>
                        <a href="movie.html?id=${movie.tmdb_id || movie.id}" class="btn btn-sm btn-primary">Details</a>
                    </div>
                </div>
            </div>
        `;
        
        return movieCol;
    }
    
    showLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'spinner-overlay';
        spinner.innerHTML = `
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(spinner);
        return spinner;
    }
    
    hideLoadingSpinner(spinner) {
        // Remove all spinners to prevent infinite loading state
        document.querySelectorAll('.spinner-overlay').forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        
        // Also try the specific spinner
        if (spinner && spinner.parentNode) {
            spinner.parentNode.removeChild(spinner);
        }
    }
    
    showToast(message, type = 'info') {
        // Check if authHandler exists first
        if (window.authHandler && typeof window.authHandler.showToast === 'function') {
            window.authHandler.showToast(message, type);
            return;
        }
        
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
        toast.className = `toast align-items-center text-white bg-${type === 'danger' ? 'danger' : type}`;
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

    loadDefaultAvatars() {
        const defaultAvatars = [
            'avatar1.png',
            'avatar2.png',
            'avatar3.png',
            'avatar4.png',
            'avatar5.png',
            'avatar6.png'
        ];

        // Use absolute paths for avatars
        this.renderAvatarGrid(defaultAvatars.map(filename => ({
            filename,
            url: `${this.avatarsPath}/${filename}`
        })));
    }

    async loadAvatars() {
        try {
            const response = await apiService.getAvatars();
            this.renderAvatarGrid(response.avatars);
        } catch (error) {
            console.error('Error loading avatars:', error);
        }
    }

    renderAvatarGrid(avatars) {
        if (!this.avatarGrid) return;

        this.avatarGrid.innerHTML = avatars.map(avatar => `
            <div class="avatar-item">
                <img src="${avatar.url}" 
                     class="avatar-option ${this.userData?.avatar_url === avatar.url ? 'selected' : ''}" 
                     data-avatar="${avatar.filename}"
                     alt="Avatar option">
            </div>
        `).join('');

        // Add click handlers
        this.avatarGrid.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => this.selectAvatar(option));
        });
    }

    async selectAvatar(element) {
        try {
            const avatarFilename = element.dataset.avatar;
            console.log('Selected avatar:', avatarFilename);

            if (!avatarFilename) {
                throw new Error('No avatar filename provided');
            }

            const formData = new FormData();
            formData.append('avatar', avatarFilename);

            // Keep existing user data
            formData.append('username', this.userData.username);
            formData.append('email', this.userData.email);

            const response = await apiService.updateProfile(formData);
            console.log('Profile update response:', response);
            
            // Update userData with the response
            if (response) {
                this.userData = {
                    ...this.userData,
                    avatar_url: avatarFilename // Use the filename directly
                };
                
                // Update UI
                this.updateProfileDisplay();
                
                // Update selected state in grid
                this.avatarGrid.querySelectorAll('.avatar-option').forEach(opt => {
                    opt.classList.toggle('selected', opt.dataset.avatar === avatarFilename);
                });
                
                // Close modal
                const modalElement = document.getElementById('avatarModal');
                if (modalElement) {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal?.hide();
                }
                
                this.showToast('Profile picture updated successfully', 'success');
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            this.showToast(error.message || 'Failed to update profile picture', 'danger');
        }
    }

    setupAvatarHandlers() {
        // Handle file upload
        if (this.avatarUpload) {
            this.avatarUpload.addEventListener('change', async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                try {
                    const response = await apiService.uploadProfilePicture(file);
                    this.userData.avatar_url = response.url;
                    this.updateProfileDisplay();
                    this.loadAvatars(); // Refresh avatar grid
                    
                    // Close modal
                    bootstrap.Modal.getInstance(document.getElementById('avatarModal'))?.hide();
                } catch (error) {
                    console.error('Error uploading avatar:', error);
                    this.showToast('Failed to upload avatar', 'danger');
                }
            });
        }
    }

    async updateDemographics(demographicData) {
        try {
            console.log('Updating demographics with:', demographicData);
            const response = await apiService.updateUserDemographics(demographicData);
            console.log('Demographics update response:', response);
            
            // Update local user data
            this.userData = {
                ...this.userData,
                ...demographicData
            };
            
            // Update display
            this.updateProfileDisplay();
            
            this.showToast('Demographics updated successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error updating demographics:', error);
            this.showToast('Failed to update demographics: ' + (error.message || 'Unknown error'), 'danger');
            return false;
        }
    }

    // Add this utility method to your ProfilePage class
    displayDebugInfo() {
        console.log('User data:', this.userData);
        
        // Create a debug section in the UI
        const debugSection = document.createElement('div');
        debugSection.className = 'card bg-dark border-secondary mt-4';
        debugSection.innerHTML = `
            <div class="card-header bg-dark border-secondary">
                <h4 class="m-0"><i class="fas fa-bug me-2"></i>Debug Information</h4>
            </div>
            <div class="card-body">
                <pre class="text-light">${JSON.stringify(this.userData, null, 2)}</pre>
            </div>
        `;
        
        // Append to main content
        document.querySelector('.container.py-5').appendChild(debugSection);
    }

    // Add this to your ProfilePage class
    showDebugInfo() {
        // Create debug panel
        const debugPanel = document.createElement('div');
        debugPanel.className = 'card bg-dark text-white mt-4';
        debugPanel.innerHTML = `
            <div class="card-header bg-dark d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Debug Info</h5>
                <button type="button" class="btn btn-sm btn-outline-danger">Clear Token</button>
            </div>
            <div class="card-body">
                <p><strong>Token:</strong> ${localStorage.getItem('token') ? 'Exists' : 'Missing'}</p>
                <pre class="bg-dark p-3 border">${JSON.stringify(this.userData || {}, null, 2)}</pre>
            </div>
        `;
        
        // Add to page
        document.querySelector('.container.py-5').appendChild(debugPanel);
        
        // Add clear token handler
        debugPanel.querySelector('button').addEventListener('click', () => {
            localStorage.removeItem('token');
            this.showToast('Token cleared, refreshing page...', 'warning');
            setTimeout(() => window.location.reload(), 1500);
        });
    }

    // Add this method to your ProfilePage class
    checkAuthStatus() {
        const token = localStorage.getItem('token');
        if (!token) {
            // No token, show guest view
            this.hideLoadingSpinner(document.querySelector('.spinner-overlay'));
            this.showGuestModeNotice();
            return false;
        }
        
        try {
            // Basic validation - not secure but helps with UI flow
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('Invalid token format');
            }
            
            // Decode payload (middle part)
            const payload = JSON.parse(atob(tokenParts[1]));
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp < now) {
                throw new Error('Token expired');
            }
            
            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('token');
            window.location.href = '../landing.html';
            return false;
        }
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    window.profilePage = new ProfilePage();

    // Add logout button event listener
    const logoutBtn = document.getElementById('profile-logout-btn');
    const dropdownLogoutBtn = document.getElementById('logout-btn');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../landing.html';
    };

    logoutBtn?.addEventListener('click', handleLogout);
    dropdownLogoutBtn?.addEventListener('click', handleLogout);
});

function toggleSidebar() {
    const sidebar = document.getElementById("mySidebar");
    const mainContent = document.getElementById("main-content");
    const overlay = document.querySelector(".sidebar-overlay");
    
    if (sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
        mainContent.classList.remove("shifted");
        overlay.style.display = "none";
    } else {
        sidebar.classList.add("active");
        mainContent.classList.add("shifted");
        overlay.style.display = "block";
    }
}