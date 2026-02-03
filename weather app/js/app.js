/**
 * Main application module
 */

import api from './api.js';
import ui from './ui.js';
import storage from './storage.js';

class WeatherApp {
    constructor() {
        this.currentLocation = null;
        this.debounceTimer = null;
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        // Initialize UI event listeners
        ui.initEventListeners(
            (query) => this.handleSearch(query),
            () => this.handleLocation(),
            () => this.handleRetry(),
            () => this.handleUnitsChange(),
            () => this.handleSaveFavorite(),
            () => this.handleClearCache()
        );
        
        // Initialize search input debouncing
        this.initSearchDebouncing();
        
        // Set up online/offline detection
        this.setupOnlineDetection();
        
        // Check for cached data on load
        this.checkCachedData();
        
        // Try to load weather for last location or default
        this.loadInitialWeather();
    }

    /**
     * Initialize search input with debouncing
     */
    initSearchDebouncing() {
        const searchInput = document.getElementById('city-search');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Clear previous timer
            clearTimeout(this.debounceTimer);
            
            // Hide suggestions if query is too short
            if (query.length < 2) {
                ui.hideSuggestions();
                return;
            }
            
            // Set new timer for debouncing
            this.debounceTimer = setTimeout(() => {
                this.fetchCitySuggestions(query);
            }, 300);
        });
    }

    /**
     * Set up online/offline detection
     */
    setupOnlineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            ui.hideBanner();
            console.log('Application is online');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Application is offline');
            
            // Check if we have cached data
            const cachedData = storage.getWeatherData();
            if (cachedData) {
                ui.renderWeather(cachedData.location, cachedData.weatherData, true);
                ui.showBanner('warning', 'You are offline. Showing cached data.', false);
            } else {
                ui.showBanner('error', 'You are offline. No cached data available.', false);
            }
        });
    }

    /**
     * Check for cached data and update UI
     */
    checkCachedData() {
        ui.updateCacheStatus();
    }

    /**
     * Load initial weather data
     */
    async loadInitialWeather() {
        // Try to get last location from cache
        const lastLocation = storage.getLastLocation();
        
        if (lastLocation) {
            // Load weather for last location
            await this.fetchWeatherForLocation(lastLocation);
        } else {
            // Load weather for a default location (London)
            const defaultLocation = {
                name: 'London',
                country: 'United Kingdom',
                latitude: 51.5074,
                longitude: -0.1278
            };
            await this.fetchWeatherForLocation(defaultLocation);
        }
    }

    /**
     * Handle search for a city
     */
    async handleSearch(query) {
        if (!query.trim()) {
            ui.showError('Search Error', 'Please enter a city name');
            return;
        }
        
        ui.showLoading();
        
        try {
            // Fetch city suggestions
            const signal = api.abortGeocodeRequest();
            const suggestions = await api.fetchCitySuggestions(query, signal);
            
            if (suggestions.length === 0) {
                // Check if we have cached data
                const cachedData = storage.getWeatherData();
                if (cachedData) {
                    ui.renderWeather(cachedData.location, cachedData.weatherData, true);
                    ui.showBanner('warning', `No results found for "${query}". Showing cached data.`, true);
                } else {
                    ui.showError('Location Not Found', `No results found for "${query}"`);
                }
                return;
            }
            
            // Use the first suggestion
            const location = {
                name: suggestions[0].name,
                country: suggestions[0].country,
                admin1: suggestions[0].admin1,
                latitude: suggestions[0].latitude,
                longitude: suggestions[0].longitude
            };
            
            await this.fetchWeatherForLocation(location);
        } catch (error) {
            console.error('Search error:', error);
            this.handleFetchError('Couldn\'t search for city.', error);
        }
    }

    /**
     * Handle location button click
     */
    async handleLocation() {
        ui.showLoading();
        
        // Stage 1: Geolocation only
        let position;
        try {
            position = await api.getUserLocation();
        } catch (geoErr) {
            console.error('Geolocation error:', geoErr);
            
            // CASE A: Geolocation denied/unavailable
            const cachedData = storage.getWeatherData();
            if (cachedData) {
                // Show cached data with warning banner
                ui.renderWeather(cachedData.location, cachedData.weatherData, true);
                ui.showBanner('warning', 'Location permission denied. Search a city or allow location and try again.', true);
            } else {
                // No cache, show error screen
                ui.hideLoading();
                ui.showError('Location Error', 'Location permission denied. Search a city or allow location and try again.');
            }
            return;
        }
        
        // Stage 2: Reverse geocode + fetch weather
        try {
            // Get location name from coordinates
            const signal = api.abortGeocodeRequest();
            const locationData = await api.reverseGeocode(
                position.latitude, 
                position.longitude, 
                signal
            );
            
            if (!locationData) {
                throw new Error('Could not determine location name');
            }
            
            const location = {
                name: locationData.name,
                country: locationData.country,
                admin1: locationData.admin1,
                latitude: position.latitude,
                longitude: position.longitude
            };
            
            await this.fetchWeatherForLocation(location);
        } catch (netErr) {
            console.error('Network/API error in location fetch:', netErr);
            // This is NOT a "location permission" issue, treat as fetch failure
            this.handleFetchError('Couldn\'t refresh weather.', netErr);
        }
    }

    /**
     * Handle retry button click
     */
    async handleRetry() {
        if (this.currentLocation) {
            await this.fetchWeatherForLocation(this.currentLocation);
        } else {
            await this.loadInitialWeather();
        }
    }

    /**
     * Handle units change
     */
    handleUnitsChange() {
        if (this.currentLocation) {
            // Re-render current weather with new units
            const cachedData = storage.getWeatherData();
            if (cachedData) {
                ui.renderWeather(cachedData.location, cachedData.weatherData, false);
            }
        }
    }

    /**
     * Handle save favorite
     */
    handleSaveFavorite() {
        // Handled by UI.toggleFavorite()
    }

    /**
     * Handle clear cache - hard reset
     */
    async handleClearCache() {
        try {
            // Clear localStorage user data
            const storageSuccess = await storage.clearAllUserData({ keepUnits: true });
            if (!storageSuccess) {
                throw new Error('Failed to clear localStorage data');
            }
            
            // Clear Cache Storage
            if ('caches' in window) {
                try {
                    const cacheKeys = await caches.keys();
                    await Promise.all(cacheKeys.map(key => caches.delete(key)));
                    console.log('Cache Storage cleared successfully');
                } catch (cacheError) {
                    console.warn('Could not clear Cache Storage:', cacheError);
                    // Continue even if cache clearing fails
                }
            }
            
            // Unregister service workers
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                    console.log('Service Workers unregistered successfully');
                } catch (swError) {
                    console.warn('Could not unregister Service Workers:', swError);
                    // Continue even if SW unregistration fails
                }
            }
            
            // Show success message
            ui.showBanner('success', 'Cache cleared. Reloading...', false);
            
            // Reload page after 500ms
            setTimeout(() => {
                // Use full reload with clean URL to ensure fresh start
                window.location.href = window.location.origin + window.location.pathname;
            }, 500);
            
        } catch (error) {
            console.error('Error in handleClearCache:', error);
            ui.showBanner('error', 'Failed to clear cache. Please try again.', true);
        }
    }

    /**
     * Handle fetch errors (network/API failures)
     * @param {string} userMsg - User-friendly message prefix
     * @param {Error} err - The error object (for logging only)
     */
    handleFetchError(userMsg, err) {
        console.error('Fetch error:', err);
        
        // Check if we have cached data
        const cachedData = storage.getWeatherData();
        
        if (cachedData) {
            // CASE B: Network/API fetch failed BUT cached weather exists
            ui.renderWeather(cachedData.location, cachedData.weatherData, true);
            const lastUpdated = storage.getLastUpdated();
            const timeAgo = ui.formatLastUpdated(lastUpdated);
            
            if (!navigator.onLine) {
                ui.showBanner('warning', 'You are offline. Showing cached data.', true);
            } else {
                ui.showBanner('warning', 'Can\'t reach Open-Meteo right now. Showing cached data.', true);
            }
        } else {
            // CASE C: Network/API fetch failed AND no cache exists
            ui.hideLoading();
            
            if (!navigator.onLine) {
                ui.showError('Network Error', 'You are offline. Please check your connection and try again.');
            } else {
                ui.showError('Network Error', 'Can\'t reach Open-Meteo right now. Please try again later.');
            }
        }
    }

    /**
     * Fetch city suggestions for search input
     */
    async fetchCitySuggestions(query) {
        try {
            const signal = api.abortGeocodeRequest();
            const suggestions = await api.fetchCitySuggestions(query, signal);
            ui.renderCitySuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            // Don't show error for suggestions, just hide them
            ui.hideSuggestions();
        }
    }

    /**
     * Fetch weather for a specific location
     */
    async fetchWeatherForLocation(location) {
        ui.showLoading();
        this.currentLocation = location;
        
        try {
            const signal = api.abortWeatherRequest();
            const weatherData = await api.fetchWeatherData(
                location.latitude,
                location.longitude,
                signal
            );
            
            if (!weatherData) {
                throw new Error('No weather data received');
            }
            
            // Save to cache
            storage.saveWeatherData(location, weatherData);
            
            // Update UI
            ui.renderWeather(location, weatherData, false);
            
            // CASE D: Success - hide banner
            ui.hideBanner();
            
        } catch (error) {
            console.error('Weather fetch error:', error);
            
            // Handle network/API fetch failure
            this.handleFetchError('Couldn\'t refresh weather.', error);
        }
    }
}

// Event listener for city selection with CustomEvent
document.addEventListener('cityselected', (e) => {
    const app = window.weatherApp;
    if (app && e.detail) {
        const city = e.detail;
        const location = {
            name: city.name,
            country: city.country,
            admin1: city.admin1,
            latitude: city.latitude,
            longitude: city.longitude
        };
        app.fetchWeatherForLocation(location);
    }
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});