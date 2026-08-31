const CACHE_NAME = 'stationery-mkononi-v2';
const STATIC_CACHE = 'stationery-static-v2';
const DYNAMIC_CACHE = 'stationery-dynamic-v2';
const IMAGE_CACHE = 'stationery-images-v2';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Cache strategies
const cacheStrategies = {
  // Cache first for static assets
  static: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  },

  // Network first for API calls
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw error;
    }
  },

  // Cache first for images
  imageFirst: async (request) => {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(IMAGE_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return new Response('Image not available offline', { status: 404 });
    }
  },

  // Stale while revalidate for dynamic content
  staleWhileRevalidate: async (request) => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    });
    
    return cached || fetchPromise;
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => 
            key !== STATIC_CACHE && 
            key !== DYNAMIC_CACHE && 
            key !== IMAGE_CACHE
          ).map((key) => caches.delete(key))
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and chrome-extension
  if (url.protocol === 'chrome-extension:') return;
  
  // Different strategies for different types of requests
  if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheStrategies.imageFirst(event.request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(cacheStrategies.networkFirst(event.request));
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(cacheStrategies.static(event.request));
  } else {
    event.respondWith(cacheStrategies.staleWhileRevalidate(event.request));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Implement order synchronization logic here
  console.log('Syncing offline orders...');
}

// Push Notification Handler
self.addEventListener('push', (event) => {
  let data = { 
    title: 'Stationery Mkononi', 
    body: 'Sasisho jipya la oda yako!', 
    url: '/notifications', 
    data: {},
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.type || 'stationery-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      ...(data.data || {}),
      url: data.url || data.data?.url || '/notifications',
    },
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/icons/icon-192.svg'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/orders')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/orders')
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement periodic data synchronization
  console.log('Periodic sync...');
}
