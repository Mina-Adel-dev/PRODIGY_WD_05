/**
 * Weather code mapping for Open-Meteo API
 * Converts WMO weather codes to human-readable text and icons
 */

const WEATHER_CODES = {
    0: { 
        label: 'Clear Sky', 
        icon: '☀️',
        dayIcon: '☀️',
        nightIcon: '🌙'
    },
    1: { 
        label: 'Mainly Clear', 
        icon: '🌤️',
        dayIcon: '🌤️',
        nightIcon: '🌙☁️'
    },
    2: { 
        label: 'Partly Cloudy', 
        icon: '⛅',
        dayIcon: '⛅',
        nightIcon: '☁️🌙'
    },
    3: { 
        label: 'Overcast', 
        icon: '☁️',
        dayIcon: '☁️',
        nightIcon: '☁️'
    },
    45: { 
        label: 'Foggy', 
        icon: '🌫️',
        dayIcon: '🌫️',
        nightIcon: '🌫️'
    },
    48: { 
        label: 'Depositing Rime Fog', 
        icon: '🌫️',
        dayIcon: '🌫️',
        nightIcon: '🌫️'
    },
    51: { 
        label: 'Light Drizzle', 
        icon: '🌧️',
        dayIcon: '🌧️',
        nightIcon: '🌧️'
    },
    53: { 
        label: 'Moderate Drizzle', 
        icon: '🌧️',
        dayIcon: '🌧️',
        nightIcon: '🌧️'
    },
    55: { 
        label: 'Dense Drizzle', 
        icon: '🌧️',
        dayIcon: '🌧️',
        nightIcon: '🌧️'
    },
    56: { 
        label: 'Light Freezing Drizzle', 
        icon: '🌧️❄️',
        dayIcon: '🌧️❄️',
        nightIcon: '🌧️❄️'
    },
    57: { 
        label: 'Dense Freezing Drizzle', 
        icon: '🌧️❄️',
        dayIcon: '🌧️❄️',
        nightIcon: '🌧️❄️'
    },
    61: { 
        label: 'Slight Rain', 
        icon: '🌦️',
        dayIcon: '🌦️',
        nightIcon: '🌧️'
    },
    63: { 
        label: 'Moderate Rain', 
        icon: '🌧️',
        dayIcon: '🌧️',
        nightIcon: '🌧️'
    },
    65: { 
        label: 'Heavy Rain', 
        icon: '⛈️',
        dayIcon: '⛈️',
        nightIcon: '⛈️'
    },
    66: { 
        label: 'Light Freezing Rain', 
        icon: '🌧️❄️',
        dayIcon: '🌧️❄️',
        nightIcon: '🌧️❄️'
    },
    67: { 
        label: 'Heavy Freezing Rain', 
        icon: '🌧️❄️',
        dayIcon: '🌧️❄️',
        nightIcon: '🌧️❄️'
    },
    71: { 
        label: 'Slight Snowfall', 
        icon: '🌨️',
        dayIcon: '🌨️',
        nightIcon: '🌨️'
    },
    73: { 
        label: 'Moderate Snowfall', 
        icon: '🌨️',
        dayIcon: '🌨️',
        nightIcon: '🌨️'
    },
    75: { 
        label: 'Heavy Snowfall', 
        icon: '❄️',
        dayIcon: '❄️',
        nightIcon: '❄️'
    },
    77: { 
        label: 'Snow Grains', 
        icon: '❄️',
        dayIcon: '❄️',
        nightIcon: '❄️'
    },
    80: { 
        label: 'Slight Rain Showers', 
        icon: '🌦️',
        dayIcon: '🌦️',
        nightIcon: '🌧️'
    },
    81: { 
        label: 'Moderate Rain Showers', 
        icon: '🌧️',
        dayIcon: '🌧️',
        nightIcon: '🌧️'
    },
    82: { 
        label: 'Violent Rain Showers', 
        icon: '⛈️',
        dayIcon: '⛈️',
        nightIcon: '⛈️'
    },
    85: { 
        label: 'Slight Snow Showers', 
        icon: '🌨️',
        dayIcon: '🌨️',
        nightIcon: '🌨️'
    },
    86: { 
        label: 'Heavy Snow Showers', 
        icon: '❄️',
        dayIcon: '❄️',
        nightIcon: '❄️'
    },
    95: { 
        label: 'Thunderstorm', 
        icon: '⛈️',
        dayIcon: '⛈️',
        nightIcon: '⛈️'
    },
    96: { 
        label: 'Thunderstorm with Slight Hail', 
        icon: '⛈️🌨️',
        dayIcon: '⛈️🌨️',
        nightIcon: '⛈️🌨️'
    },
    99: { 
        label: 'Thunderstorm with Heavy Hail', 
        icon: '⛈️🌨️',
        dayIcon: '⛈️🌨️',
        nightIcon: '⛈️🌨️'
    }
};

/**
 * Get weather information from a WMO weather code
 * @param {number} code - WMO weather code
 * @param {boolean} isDay - Whether it's daytime (for icon selection)
 * @returns {object} Weather info with label and icon
 */
export function getWeatherInfo(code, isDay = true) {
    const weatherInfo = WEATHER_CODES[code] || { 
        label: 'Unknown', 
        icon: '🌈',
        dayIcon: '🌈',
        nightIcon: '🌈'
    };
    
    return {
        label: weatherInfo.label,
        icon: isDay ? weatherInfo.dayIcon : weatherInfo.nightIcon
    };
}

/**
 * Convert wind direction in degrees to compass direction
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} Compass direction (e.g., "N", "NE", "E")
 */
export function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Format date to display as day name
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted day name
 */
export function formatDay(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    
    // Otherwise return day name
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format date to display as short date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted short date (e.g., "Mon, Jan 15")
 */
export function formatShortDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}