'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Loader2, Check, Crosshair } from 'lucide-react';
import { Button } from '../ui/Button';

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, addressText?: string) => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat,
  initialLng,
  onLocationSelect,
}) => {
  const [lat, setLat] = useState<number | null>(typeof initialLat === 'number' ? initialLat : null);
  const [lng, setLng] = useState<number | null>(typeof initialLng === 'number' ? initialLng : null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined' || lat === null || lng === null || mapInstanceRef.current) return;

    // Dynamically import Leaflet so SSR does not fail
    import('leaflet').then((L) => {
      // Import Leaflet CSS dynamically if not present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (mapContainerRef.current && !mapInstanceRef.current) {
        // Fix Leaflet Default Icon issue
        const customPinIcon = L.divIcon({
          className: 'custom-leaflet-pin',
          html: `<div style="background-color:#16a34a; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 10px 15px -3px rgba(0,0,0,0.3); border:3px solid white; transform:translate(-17px, -17px);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });

        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const marker = L.marker([lat, lng], {
          icon: customPinIcon,
          draggable: true,
        }).addTo(map);

        // Click to place marker
        map.on('click', (e: any) => {
          const newLat = e.latlng.lat;
          const newLng = e.latlng.lng;
          marker.setLatLng([newLat, newLng]);
          setLat(newLat);
          setLng(newLng);
          reverseGeocode(newLat, newLng);
        });

        // Drag marker
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setLat(pos.lat);
          setLng(pos.lng);
          reverseGeocode(pos.lat, pos.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        // Reverse geocode initial coords
        reverseGeocode(lat, lng);
      }
    });
  }, [lat, lng]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (lat !== null && lng !== null) return;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [lat, lng]);

  // Reverse Geocoding with OSM Nominatim API
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setResolvedAddress(address);
        onLocationSelect(latitude, longitude, address);
      } else {
        onLocationSelect(latitude, longitude);
      }
    } catch {
      onLocationSelect(latitude, longitude);
    }
  };

  // Browser High-Accuracy Geolocation
  const handleUseCurrentLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setLat(userLat);
          setLng(userLng);

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([userLat, userLng], 16, { animate: true, duration: 1.2 });
            markerRef.current.setLatLng([userLat, userLng]);
          }

          setIsLocating(false);
          reverseGeocode(userLat, userLng);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  // Search Tanzanian Places (Nominatim API)
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery}, Tanzania`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&countrycodes=tz&format=json&limit=1`
      );
      if (response.ok) {
        const results = await response.json();
        if (results.length > 0) {
          const foundLat = parseFloat(results[0].lat);
          const foundLng = parseFloat(results[0].lon);
          const foundName = results[0].display_name;

          setLat(foundLat);
          setLng(foundLng);
          setResolvedAddress(foundName);

          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([foundLat, foundLng], 16, { animate: true, duration: 1.2 });
            markerRef.current.setLatLng([foundLat, foundLng]);
          }

          onLocationSelect(foundLat, foundLng, foundName);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Bar: Search and Locate Me Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <form onSubmit={handleSearchLocation} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tafuta eneo... (mfano: UDSM, Mwenge, Posta, Kariakoo, CIVE Dodoma)"
            className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 bg-white"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tafuta'}
          </button>
        </form>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          isLoading={isLocating}
          leftIcon={<Crosshair className="w-3.5 h-3.5 text-brand-600" />}
          className="whitespace-nowrap"
        >
          Mahali Nilipo Sasa (GPS)
        </Button>
      </div>

      {/* Real Interactive Leaflet Container */}
      <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border-2 border-brand-500/40 shadow-md bg-slate-100">
        {lat === null || lng === null ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600" />
              <p className="text-xs font-semibold text-slate-600">Tafuta au ruhusu GPS ili kuonyesha ramani</p>
            </div>
          </div>
        ) : (
        <div ref={mapContainerRef} className="w-full h-full" />
        )}

        {/* Live GPS Coordinates Overlay */}
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-800 shadow-md border border-slate-200/80 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          <span>
            {lat !== null && lng !== null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Loading GPS...'}
          </span>
        </div>

        {/* Helper Hint */}
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-2.5 rounded-xl text-xs text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-between">
          <span className="line-clamp-1 text-[11px]">
            📍 {resolvedAddress || 'Bofya au buruta pin kuchagua eneo kamili'}
          </span>
          <span className="text-[10px] font-bold text-brand-700 uppercase whitespace-nowrap pl-2">
            Pin Ipo Hapa ✓
          </span>
        </div>
      </div>
    </div>
  );
};
