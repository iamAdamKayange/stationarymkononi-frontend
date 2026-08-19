'use client';

import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '../ui/Button';

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number, addressText?: string) => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat = -6.7725,
  initialLng = 39.2065,
  onLocationSelect,
}) => {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setLat(userLat);
          setLng(userLng);
          setIsLocating(false);
          onLocationSelect(userLat, userLng, 'Current GPS Location');
        },
        (error) => {
          console.warn('Geolocation error:', error);
          setIsLocating(false);
          // Fallback to default
          onLocationSelect(lat, lng);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${
    lat - 0.008
  }%2C${lng + 0.008}%2C${lat + 0.008}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          Chagua Mahali kwenye Ramani
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseCurrentLocation}
          isLoading={isLocating}
          leftIcon={<Navigation className="w-3.5 h-3.5 text-brand-600" />}
        >
          Mahali Nilipo Sasa
        </Button>
      </div>

      <div className="relative w-full h-[200px] sm:h-[240px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
        <iframe title="Location Picker" className="w-full h-full border-0" src={osmUrl} />
        <div className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-medium text-slate-700 shadow-xs border border-slate-200">
          GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
};
