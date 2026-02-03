# WeatherWise - Weather Application

A modern, responsive weather application that provides real-time weather forecasts using the Open-Meteo API.

## Features

### Core Features
- Real-time weather data from Open-Meteo API
- Search for any city worldwide with autocomplete suggestions
- Use device location for local weather
- Temperature units toggle (Celsius/Fahrenheit)
- 5-day weather forecast with min/max temperatures
- Current weather conditions with "feels like" temperature, humidity, wind speed/direction

### Innovations Implemented

#### 1. Caching System
- Automatic caching of last successful weather data in localStorage
- Cache expiration after 30 minutes
- Offline mode that displays cached data when API is unavailable
- Cache status indicator in footer
- Clear cache button for manual cache management

#### 2. Accessibility
- Full keyboard navigation for search and suggestions
- ARIA live regions for status announcements
- Proper focus indicators for all interactive elements
- Screen reader friendly markup
- Color contrast compliant design

#### 3. Performance Optimizations
- Debounced search input (300ms delay)
- AbortController for cancelling in-flight API requests
- Efficient DOM updates with minimal reflows
- Lazy loading of non-critical resources

#### 4. PWA Capabilities
- Installable as a standalone app
- Service Worker for offline functionality
- Web App Manifest for native-like experience
- Cached static assets for fast loading

#### 5. Enhanced Features
- **Day/Night Accuracy**: Uses Open-Meteo's `is_day` parameter for accurate day/night icons
- **Recent Searches & Favorites**: Save and quickly access your favorite locations
- **Cache Controls**: Manual cache clearing with visual feedback
- **Non-blocking Error Banners**: Network errors show cached data with warning banners instead of hiding weather display

## How to Run Locally

### Using a Local HTTP Server
Due to ES6 module restrictions, you need to run this application through a local HTTP server:

**With Python 3:**
```bash
python -m http.server 8003