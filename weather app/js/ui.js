/**
 * UI module for DOM manipulation and rendering
 */

import { getWeatherInfo, getWindDirection, formatDay, formatShortDate } from './codes.js';
import storage from './storage.js';

class UI {
    constructor() {
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorTitle: document.getElementById('error-title'),
            errorMessage: document.getElementById('error-message'),
            retryBtn: document.getElementById('retry-btn'),
            weatherDisplay: document.getElementById('weather-display'),
            banner: document.getElementById('banner'),
            bannerText: document.getElementById('banner-text'),
            bannerClose: document.getElementById('banner-close'),
            cacheStatus: document.getElementById('cache-status'),
            clearCacheBtn: document.getElementById('clear-cache-btn'),
            
            // Search elements
            citySearch: document.getElementById('city-search'),
            searchBtn: document.getElementById('search-btn'),
            searchSuggestions: document.getElementById('search-suggestions'),
            searchQuickAccess: document.getElementById('search-quick-access'),
            
            // Location elements
            locationBtn: document.getElementById('location-btn'),
            saveFavoriteBtn: document.getElementById('save-favorite-btn'),
            unitsToggle: document.getElementById('units-toggle'),
            
            // Weather display elements
            locationName: document.getElementById('location-name'),
            locationCountry: document.getElementById('location-country'),
            lastUpdated: document.getElementById('last-updated'),
            currentTemp: document.getElementById('current-temp'),
            tempUnit: document.getElementById('temp-unit'),
            weatherCondition: document.getElementById('weather-condition'),
            weatherIcon: document.getElementById('weather-icon'),
            feelsLike: document.getElementById('feels-like'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('wind-speed'),
            windDirection: document.getElementById('wind-direction'),
            forecastCards: document.getElementById('forecast-cards')
        };
        
        this.isCelsius = storage.getUnitsPreference();
        this.currentLocation = null;
        this.bannerTimer = null; // Store banner timer for cleanup
        this.updateUnitsToggle();
        this.renderQuickAccess();
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.elements.loading.hidden = false;
        this.elements.error.hidden = true;
        this.elements.weatherDisplay.hidden = true;
        this.hideBanner();
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.elements.loading.hidden = true;
    }

    /**
     * Show error state
     */
    showError(title, message) {
        this.elements.errorTitle.textContent = title;
        this.elements.errorMessage.textContent = message;
        this.elements.error.hidden = false;
        this.elements.loading.hidden = true;
        this.elements.weatherDisplay.hidden = true;
        this.hideBanner();
    }

    /**
     * Hide error state
     */
    hideError() {
        this.elements.error.hidden = true;
    }

    /**
     * Show banner message
     * @param {string} type - 'warning', 'error', 'info', 'success'
     * @param {string} message - Banner text (one sentence)
     * @param {boolean} autoHide - Whether to auto-hide after 8000ms (default: true)
     */
    showBanner(type, message, autoHide = true) {
        // Clear previous timer if exists
        if (this.bannerTimer) {
            clearTimeout(this.bannerTimer);
            this.bannerTimer = null;
        }
        
        this.elements.banner.className = `banner ${type}`;
        this.elements.bannerText.textContent = message;
        this.elements.banner.hidden = false;
        
        if (autoHide) {
            this.bannerTimer = setTimeout(() => {
                this.hideBanner();
            }, 8000);
        }
    }

    /**
     * Hide banner
     */
    hideBanner() {
        // Clear any pending timer
        if (this.bannerTimer) {
            clearTimeout(this.bannerTimer);
            this.bannerTimer = null;
        }
        
        this.elements.banner.hidden = true;
    }

    /**
     * Show weather display
     */
    showWeatherDisplay() {
        this.elements.weatherDisplay.hidden = false;
        this.elements.error.hidden = true;
        this.elements.loading.hidden = true;
    }

    /**
     * Update cache status display
     */
    updateCacheStatus() {
        this.elements.cacheStatus.textContent = storage.getCacheStatus();
    }

    /**
     * Format timestamp to readable "time ago" string
     * @param {number} timestampMs - Timestamp in milliseconds
     * @returns {string} Human-readable time string
     */
    formatLastUpdated(timestampMs) {
        if (!timestampMs) return 'unknown time';
        
        const now = Date.now();
        const diff = now - timestampMs;
        
        // Less than a minute ago
        if (diff < 60000) {
            return 'just now';
        }
        
        // Less than 5 minutes ago
        if (diff < 300000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} min ago`;
        }
        
        // Less than an hour ago
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} min ago`;
        }
        
        // Less than a day ago
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        }
        
        // More than a day ago - use locale date/time
        const date = new Date(timestampMs);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Render weather data
     */
    renderWeather(location, weatherData, isCached = false) {
        const { current, daily } = weatherData;
        this.currentLocation = location;
        
        // Update favorite button state
        this.updateFavoriteButton(location);
        
        // Update location info
        this.elements.locationName.textContent = location.name;
        this.elements.locationCountry.textContent = `${location.country}${location.admin1 ? `, ${location.admin1}` : ''}`;
        
        // Update last updated info
        const timestamp = storage.getLastUpdated();
        this.elements.lastUpdated.textContent = isCached 
            ? `Cached data: ${this.formatLastUpdated(timestamp)}`
            : `Updated: ${this.formatLastUpdated(timestamp)}`;
        
        // Convert temperatures based on units
        const tempUnit = this.isCelsius ? '°C' : '°F';
        const speedUnit = this.isCelsius ? 'km/h' : 'mph';
        
        const currentTemp = this.isCelsius ? current.temperature_2m : this.celsiusToFahrenheit(current.temperature_2m);
        const feelsLikeTemp = this.isCelsius ? current.apparent_temperature : this.celsiusToFahrenheit(current.apparent_temperature);
        const windSpeed = this.isCelsius ? current.wind_speed_10m : this.kmhToMph(current.wind_speed_10m);
        
        // Update current weather
        this.elements.currentTemp.textContent = Math.round(currentTemp);
        this.elements.tempUnit.textContent = tempUnit;
        
        // Get weather condition with day/night info
        const isDay = current.is_day === 1;
        const weatherInfo = getWeatherInfo(current.weather_code, isDay);
        this.elements.weatherCondition.textContent = weatherInfo.label;
        this.elements.weatherIcon.textContent = weatherInfo.icon;
        
        // Update weather details
        this.elements.feelsLike.textContent = `${Math.round(feelsLikeTemp)}${tempUnit}`;
        this.elements.humidity.textContent = `${current.relative_humidity_2m}%`;
        this.elements.windSpeed.textContent = `${Math.round(windSpeed)} ${speedUnit}`;
        this.elements.windDirection.textContent = getWindDirection(current.wind_direction_10m);
        
        // Render forecast
        this.renderForecast(daily, tempUnit, isDay);
        
        // Update cache status
        this.updateCacheStatus();
        
        // Show weather display
        this.showWeatherDisplay();
        
        // Update quick access
        this.renderQuickAccess();
    }

    /**
     * Render 5-day forecast
     */
    renderForecast(dailyData, tempUnit, isDay) {
        this.elements.forecastCards.innerHTML = '';
        
        // Show next 5 days (skip today)
        for (let i = 1; i <= 5 && i < dailyData.time.length; i++) {
            const day = dailyData.time[i];
            const weatherCode = dailyData.weather_code[i];
            const maxTemp = this.isCelsius ? dailyData.temperature_2m_max[i] : this.celsiusToFahrenheit(dailyData.temperature_2m_max[i]);
            const minTemp = this.isCelsius ? dailyData.temperature_2m_min[i] : this.celsiusToFahrenheit(dailyData.temperature_2m_min[i]);
            
            const weatherInfo = getWeatherInfo(weatherCode, isDay);
            
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';
            forecastCard.innerHTML = `
                <div class="forecast-day">${formatDay(day)}</div>
                <div class="forecast-date">${formatShortDate(day)}</div>
                <div class="forecast-icon">${weatherInfo.icon}</div>
                <div class="forecast-condition">${weatherInfo.label}</div>
                <div class="forecast-temps">
                    <div class="forecast-temp-high">
                        <div class="temp-label">High</div>
                        <div class="temp-value">${Math.round(maxTemp)}${tempUnit}</div>
                    </div>
                    <div class="forecast-temp-low">
                        <div class="temp-label">Low</div>
                        <div class="temp-value">${Math.round(minTemp)}${tempUnit}</div>
                    </div>
                </div>
            `;
            
            this.elements.forecastCards.appendChild(forecastCard);
        }
    }

    /**
     * Render city suggestions dropdown
     */
    renderCitySuggestions(suggestions) {
        this.elements.searchSuggestions.innerHTML = '';
        
        if (suggestions.length === 0) {
            this.elements.searchSuggestions.classList.remove('show');
            return;
        }
        
        suggestions.forEach(city => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.tabIndex = 0;
            
            // Use textContent for safety instead of innerHTML
            const nameSpan = document.createElement('span');
            nameSpan.className = 'suggestion-name';
            nameSpan.textContent = city.name;
            
            const countrySpan = document.createElement('span');
            countrySpan.className = 'suggestion-country';
            countrySpan.textContent = `${city.country}${city.admin1 ? `, ${city.admin1}` : ''}`;
            
            suggestionItem.appendChild(nameSpan);
            suggestionItem.appendChild(countrySpan);
            
            suggestionItem.addEventListener('click', () => {
                this.selectCity(city);
            });
            
            suggestionItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectCity(city);
                }
            });
            
            this.elements.searchSuggestions.appendChild(suggestionItem);
        });
        
        this.elements.searchSuggestions.classList.add('show');
    }

    /**
     * Select a city from suggestions
     */
    selectCity(city) {
        this.elements.citySearch.value = city.name;
        this.elements.searchSuggestions.classList.remove('show');
        
        // Trigger search with CustomEvent
        document.dispatchEvent(new CustomEvent('cityselected', { 
            detail: city 
        }));
    }

    /**
     * Hide suggestions dropdown
     */
    hideSuggestions() {
        this.elements.searchSuggestions.classList.remove('show');
    }

    /**
     * Render quick access (recent searches and favorites)
     */
    renderQuickAccess() {
        const recentSearches = storage.getRecentSearches();
        const favorites = storage.getFavorites();
        
        this.elements.searchQuickAccess.innerHTML = '';
        
        // Show favorites first
        favorites.forEach(fav => {
            const item = this.createQuickAccessItem(fav, true);
            this.elements.searchQuickAccess.appendChild(item);
        });
        
        // Show recent searches (excluding favorites)
        recentSearches.forEach(search => {
            const isAlreadyFavorite = favorites.some(fav => 
                fav.name === search.name && fav.country === search.country
            );
            
            if (!isAlreadyFavorite) {
                const item = this.createQuickAccessItem(search, false);
                this.elements.searchQuickAccess.appendChild(item);
            }
        });
    }

    /**
     * Create a quick access item
     */
    createQuickAccessItem(location, isFavorite) {
        const item = document.createElement('div');
        item.className = `quick-access-item ${isFavorite ? 'favorite' : ''}`;
        item.style.position = 'relative'; // Ensure proper positioning
        item.title = isFavorite ? 'Favorite location' : 'Recent search';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = location.name;
        nameSpan.style.flex = '1';
        item.appendChild(nameSpan);
        
        if (isFavorite) {
            const starSpan = document.createElement('span');
            starSpan.textContent = '★';
            starSpan.style.marginLeft = '3px';
            starSpan.style.color = '#ffd700';
            item.appendChild(starSpan);
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'quick-access-remove';
        removeBtn.textContent = '×';
        removeBtn.setAttribute('aria-label', `Remove ${location.name} from ${isFavorite ? 'favorites' : 'recent searches'}`);
        removeBtn.title = isFavorite ? 'Remove from favorites' : 'Remove from recent';
        
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (isFavorite) {
                storage.removeFavorite(location);
                this.showBanner('info', `Removed ${location.name} from favorites`, true);
            } else {
                // Remove from recent searches
                storage.removeRecentSearch(location);
                this.showBanner('info', `Removed ${location.name} from recent searches`, true);
            }
            this.renderQuickAccess();
        });
        
        item.appendChild(removeBtn);
        
        item.addEventListener('click', (e) => {
            // Only trigger if the remove button was not clicked
            if (!e.target.closest('.quick-access-remove')) {
                // Use CustomEvent for city selection
                document.dispatchEvent(new CustomEvent('cityselected', { 
                    detail: location 
                }));
            }
        });
        
        return item;
    }

    /**
     * Update favorite button state
     */
    updateFavoriteButton(location) {
        if (!location) return;
        
        const isFavorite = storage.isFavorite(location);
        if (isFavorite) {
            this.elements.saveFavoriteBtn.classList.add('saved');
        } else {
            this.elements.saveFavoriteBtn.classList.remove('saved');
        }
    }

    /**
     * Update units toggle UI
     */
    updateUnitsToggle() {
        if (this.isCelsius) {
            this.elements.unitsToggle.classList.remove('fahrenheit');
        } else {
            this.elements.unitsToggle.classList.add('fahrenheit');
        }
    }

    /**
     * Toggle temperature units
     */
    toggleUnits() {
        this.isCelsius = !this.isCelsius;
        storage.saveUnitsPreference(this.isCelsius);
        this.updateUnitsToggle();
        
        // Trigger units change event with CustomEvent
        document.dispatchEvent(new CustomEvent('unitschanged'));
    }

    /**
     * Toggle favorite status for current location
     */
    toggleFavorite() {
        if (!this.currentLocation) return false;
        
        const wasAdded = storage.toggleFavorite(this.currentLocation);
        this.updateFavoriteButton(this.currentLocation);
        this.renderQuickAccess();
        
        if (wasAdded) {
            this.showBanner('success', `Added ${this.currentLocation.name} to favorites!`, true);
        } else {
            this.showBanner('info', `Removed ${this.currentLocation.name} from favorites`, true);
        }
        
        return wasAdded;
    }

    /**
     * Check if it's daytime based on current hour
     */
    isDaytime() {
        const hour = new Date().getHours();
        return hour >= 6 && hour < 18;
    }

    /**
     * Convert Celsius to Fahrenheit
     */
    celsiusToFahrenheit(celsius) {
        return (celsius * 9/5) + 32;
    }

    /**
     * Convert km/h to mph
     */
    kmhToMph(kmh) {
        return kmh * 0.621371;
    }

    /**
     * Initialize UI event listeners
     */
    initEventListeners(onSearch, onLocation, onRetry, onUnitsToggle, onSaveFavorite, onClearCache) {
        // Search button click
        this.elements.searchBtn.addEventListener('click', () => {
            const query = this.elements.citySearch.value.trim();
            if (query) {
                onSearch(query);
                this.hideSuggestions();
            }
        });
        
        // Search input enter key
        this.elements.citySearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = this.elements.citySearch.value.trim();
                if (query) {
                    onSearch(query);
                    this.hideSuggestions();
                }
            }
        });
        
        // Location button click
        this.elements.locationBtn.addEventListener('click', onLocation);
        
        // Retry button click
        this.elements.retryBtn.addEventListener('click', onRetry);
        
        // Units toggle click
        this.elements.unitsToggle.addEventListener('click', () => {
            this.toggleUnits();
            onUnitsToggle();
        });
        
        // Save favorite button click
        this.elements.saveFavoriteBtn.addEventListener('click', () => {
            this.toggleFavorite();
            onSaveFavorite();
        });
        
        // Clear cache button click
        this.elements.clearCacheBtn.addEventListener('click', onClearCache);
        
        // Banner close button
        this.elements.bannerClose.addEventListener('click', () => {
            this.hideBanner();
        });
        
        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!this.elements.searchSuggestions.contains(e.target) && 
                !this.elements.citySearch.contains(e.target)) {
                this.hideSuggestions();
            }
        });
        
        // Keyboard navigation for suggestions
        this.elements.citySearch.addEventListener('keydown', (e) => {
            const suggestions = this.elements.searchSuggestions.querySelectorAll('.suggestion-item');
            
            if (suggestions.length === 0) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (suggestions[0]) suggestions[0].focus();
            }
        });
        
        this.elements.searchSuggestions.addEventListener('keydown', (e) => {
            const suggestions = Array.from(this.elements.searchSuggestions.querySelectorAll('.suggestion-item'));
            const currentIndex = suggestions.findIndex(item => item === document.activeElement);
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % suggestions.length;
                suggestions[nextIndex].focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1;
                suggestions[prevIndex].focus();
            } else if (e.key === 'Escape') {
                this.hideSuggestions();
                this.elements.citySearch.focus();
            }
        });
    }
}

export default new UI();