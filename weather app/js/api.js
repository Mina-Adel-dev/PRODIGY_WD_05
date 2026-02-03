/**
 * API module for handling Open-Meteo API calls
 */

class API {
    constructor() {
        this.geocodeAbortController = null;
        this.weatherAbortController = null;
    }

    /**
     * Fetch city suggestions based on search query
     */
    async fetchCitySuggestions(query, signal) {
        if (!query || query.length < 2) {
            return [];
        }

        try {
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
            const response = await fetch(url, { signal });
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Geocoding request aborted');
                return [];
            }
            console.error('Error fetching city suggestions:', error);
            throw error;
        }
    }

    /**
     * Fetch weather data for given coordinates
     */
    async fetchWeatherData(latitude, longitude, signal) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
            const response = await fetch(url, { signal });
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Weather request aborted');
                return null;
            }
            console.error('Error fetching weather data:', error);
            throw error;
        }
    }

    /**
     * Reverse geocoding to get location name from coordinates
     */
    async reverseGeocode(latitude, longitude, signal) {
        try {
            const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en`;
            const response = await fetch(url, { signal });
            
            if (!response.ok) {
                throw new Error(`Reverse geocoding API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.results?.[0] || null;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Reverse geocoding request aborted');
                return null;
            }
            console.error('Error in reverse geocoding:', error);
            throw error;
        }
    }

    /**
     * Get user's current location using browser geolocation
     */
    getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    let errorMessage = 'Unable to retrieve your location';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location permission denied. Please allow location access.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out.';
                            break;
                    }
                    
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * Abort any ongoing geocode request
     */
    abortGeocodeRequest() {
        if (this.geocodeAbortController) {
            this.geocodeAbortController.abort();
        }
        this.geocodeAbortController = new AbortController();
        return this.geocodeAbortController.signal;
    }

    /**
     * Abort any ongoing weather request
     */
    abortWeatherRequest() {
        if (this.weatherAbortController) {
            this.weatherAbortController.abort();
        }
        this.weatherAbortController = new AbortController();
        return this.weatherAbortController.signal;
    }
}

export default new API();