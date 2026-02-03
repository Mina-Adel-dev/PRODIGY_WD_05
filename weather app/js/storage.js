/**
 * Storage module for caching weather data in localStorage
 */

const STORAGE_KEYS = {
    WEATHER_DATA: 'weatherwise_weather_data',
    LOCATION: 'weatherwise_location',
    UNITS: 'weatherwise_units',
    LAST_UPDATED: 'weatherwise_last_updated',
    RECENT_SEARCHES: 'weatherwise_recent_searches',
    FAVORITES: 'weatherwise_favorites'
};

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

class Storage {
    /**
     * Save weather data to cache
     */
    saveWeatherData(location, weatherData) {
        try {
            const cacheData = {
                location,
                weatherData,
                timestamp: Date.now()
            };
            
            localStorage.setItem(STORAGE_KEYS.WEATHER_DATA, JSON.stringify(cacheData));
            localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, Date.now().toString());
            
            // Update location separately for quick access
            localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(location));
            
            // Add to recent searches
            this.addRecentSearch(location);
            
            return true;
        } catch (error) {
            console.error('Error saving weather data to cache:', error);
            return false;
        }
    }

    /**
     * Get cached weather data
     */
    getWeatherData() {
        try {
            const cachedData = localStorage.getItem(STORAGE_KEYS.WEATHER_DATA);
            
            if (!cachedData) {
                return null;
            }
            
            const { location, weatherData, timestamp } = JSON.parse(cachedData);
            
            // Check if cache is still valid (within TTL)
            if (Date.now() - timestamp > CACHE_TTL) {
                this.clearWeatherData();
                return null;
            }
            
            return { location, weatherData };
        } catch (error) {
            console.error('Error reading cached weather data:', error);
            return null;
        }
    }

    /**
     * Get last known location
     */
    getLastLocation() {
        try {
            const locationData = localStorage.getItem(STORAGE_KEYS.LOCATION);
            return locationData ? JSON.parse(locationData) : null;
        } catch (error) {
            console.error('Error reading last location:', error);
            return null;
        }
    }

    /**
     * Clear cached weather data
     */
    clearWeatherData() {
        try {
            localStorage.removeItem(STORAGE_KEYS.WEATHER_DATA);
            localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
            return true;
        } catch (error) {
            console.error('Error clearing cached weather data:', error);
            return false;
        }
    }

    /**
     * Clear all cache (both localStorage and Service Worker caches)
     */
    clearAllCache() {
        try {
            // Clear localStorage cache
            localStorage.removeItem(STORAGE_KEYS.WEATHER_DATA);
            localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
            localStorage.removeItem(STORAGE_KEYS.LOCATION);
            localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
            localStorage.removeItem(STORAGE_KEYS.FAVORITES);
            
            return true;
        } catch (error) {
            console.error('Error clearing all cache:', error);
            return false;
        }
    }

    /**
     * Clear all user data - hard reset
     */
    async clearAllUserData(options = { keepUnits: true }) {
        try {
            // Clear localStorage keys
            localStorage.removeItem(STORAGE_KEYS.WEATHER_DATA);
            localStorage.removeItem(STORAGE_KEYS.LAST_UPDATED);
            localStorage.removeItem(STORAGE_KEYS.LOCATION);
            localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
            localStorage.removeItem(STORAGE_KEYS.FAVORITES);
            
            // Keep units preference if requested
            if (!options.keepUnits) {
                localStorage.removeItem(STORAGE_KEYS.UNITS);
            }
            
            return true;
        } catch (error) {
            console.error('Error clearing all user data:', error);
            return false;
        }
    }

    /**
     * Save temperature units preference
     */
    saveUnitsPreference(isCelsius) {
        try {
            localStorage.setItem(STORAGE_KEYS.UNITS, isCelsius ? 'celsius' : 'fahrenheit');
            return true;
        } catch (error) {
            console.error('Error saving units preference:', error);
            return false;
        }
    }

    /**
     * Get temperature units preference
     */
    getUnitsPreference() {
        try {
            const units = localStorage.getItem(STORAGE_KEYS.UNITS);
            return units === 'fahrenheit' ? false : true; // Default to Celsius
        } catch (error) {
            console.error('Error reading units preference:', error);
            return true; // Default to Celsius
        }
    }

    /**
     * Get last updated timestamp
     */
    getLastUpdated() {
        try {
            const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
            return timestamp ? parseInt(timestamp, 10) : null;
        } catch (error) {
            console.error('Error reading last updated timestamp:', error);
            return null;
        }
    }

    /**
     * Check if cache is available and valid
     */
    hasValidCache() {
        const cachedData = this.getWeatherData();
        return cachedData !== null;
    }

    /**
     * Get cache status message
     */
    getCacheStatus() {
        const lastUpdated = this.getLastUpdated();
        const hasCache = this.hasValidCache();
        
        if (!hasCache) {
            return 'No cached data available';
        }
        
        // Use simple time display for footer
        const date = new Date(lastUpdated);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Add a location to recent searches
     */
    addRecentSearch(location) {
        try {
            const recentSearches = this.getRecentSearches();
            
            // Remove duplicates
            const filtered = recentSearches.filter(item => 
                !(item.name === location.name && item.country === location.country)
            );
            
            // Add new item at the beginning
            filtered.unshift({
                name: location.name,
                country: location.country,
                admin1: location.admin1,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: Date.now()
            });
            
            // Keep only last 5 searches
            const limited = filtered.slice(0, 5);
            
            localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(limited));
            return true;
        } catch (error) {
            console.error('Error adding recent search:', error);
            return false;
        }
    }

    /**
     * Get recent searches
     */
    getRecentSearches() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting recent searches:', error);
            return [];
        }
    }

    /**
     * Remove a specific recent search
     */
    removeRecentSearch(location) {
        try {
            const recentSearches = this.getRecentSearches();
            const filtered = recentSearches.filter(item => 
                !(item.name === location.name && item.country === location.country)
            );
            
            localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error removing recent search:', error);
            return false;
        }
    }

    /**
     * Clear recent searches
     */
    clearRecentSearches() {
        try {
            localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
            return true;
        } catch (error) {
            console.error('Error clearing recent searches:', error);
            return false;
        }
    }

    /**
     * Add/remove a location from favorites
     */
    toggleFavorite(location) {
        try {
            const favorites = this.getFavorites();
            const index = favorites.findIndex(item => 
                item.name === location.name && item.country === location.country
            );
            
            if (index > -1) {
                // Remove from favorites
                favorites.splice(index, 1);
            } else {
                // Add to favorites
                favorites.push({
                    name: location.name,
                    country: location.country,
                    admin1: location.admin1,
                    latitude: location.latitude,
                    longitude: location.longitude
                });
            }
            
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
            return index === -1; // Return true if added, false if removed
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return false;
        }
    }

    /**
     * Get favorites
     */
    getFavorites() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    /**
     * Check if a location is a favorite
     */
    isFavorite(location) {
        try {
            const favorites = this.getFavorites();
            return favorites.some(item => 
                item.name === location.name && item.country === location.country
            );
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }

    /**
     * Remove a location from favorites
     */
    removeFavorite(location) {
        try {
            const favorites = this.getFavorites();
            const filtered = favorites.filter(item => 
                !(item.name === location.name && item.country === location.country)
            );
            
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return false;
        }
    }
}

export default new Storage();