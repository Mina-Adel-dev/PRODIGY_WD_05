/**
 * Service Worker for WeatherWise PWA
 */

const CACHE_NAME = 'weatherwise-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/api.js',
    './js/codes.js',
    './js/storage.js',
    './js/ui.js',
    './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets v2');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network-first for app shell, cache-first for others
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip API calls (we want fresh data)
    if (requestUrl.hostname.includes('open-meteo.com')) {
        return;
    }
    
    // Check if this is an app shell file
    const isAppShell = STATIC_ASSETS.some(asset => 
        requestUrl.pathname.endsWith(asset) || 
        requestUrl.pathname === '/' || 
        requestUrl.pathname.endsWith('.js') ||
        requestUrl.pathname.endsWith('.css') ||
        requestUrl.pathname.endsWith('.html')
    );
    
    event.respondWith(
        (async () => {
            if (isAppShell) {
                // Network-first strategy for app shell
                try {
                    // Try network first
                    const networkResponse = await fetch(event.request);
                    
                    // Update cache with new response
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                    
                    return networkResponse;
                } catch (error) {
                    console.log('Network failed, falling back to cache for:', event.request.url);
                    
                    // Network failed, try cache
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // If both fail and it's an HTML request, return offline page
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                    
                    throw error;
                }
            } else {
                // Cache-first for other static assets
                const cachedResponse = await caches.match(event.request);
                
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Try network for non-cached assets
                try {
                    const networkResponse = await fetch(event.request);
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    // Network failed and no cache
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                }
            }
        })()
    );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }).then(() => {
            event.source.postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});