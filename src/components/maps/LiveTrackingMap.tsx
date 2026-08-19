'use client';

import React, { useEffect, useState } from 'react';
import { getSocket } from '../../lib/socket';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LiveTrackingMapProps {
  orderId: string;
  deliveryId?: string;
  stationeryLocation: Coordinates;
  stationeryName?: string;
  customerLocation: Coordinates;
  customerAddress?: string;
  initialRiderLocation?: Coordinates;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  orderId,
  deliveryId,
  stationeryLocation,
  stationeryName = 'Stationery Shop',
  customerLocation,
  customerAddress = 'Delivery Destination',
  initialRiderLocation,
}) => {
  const [riderLocation, setRiderLocation] = useState<Coordinates | null>(
    initialRiderLocation || stationeryLocation
  );
  const [isLive, setIsLive] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    if (orderId) {
      socket.emit('join:order', orderId);
    }
    if (deliveryId) {
      socket.emit('join:delivery', deliveryId);
    }

    const handleLocationUpdate = (data: {
      latitude: number;
      longitude: number;
      speed?: number;
    }) => {
      if (data.latitude && data.longitude) {
        setRiderLocation({ lat: data.latitude, lng: data.longitude });
        setIsLive(true);
        if (data.speed !== undefined) setSpeed(data.speed);
      }
    };

    socket.on('tracking:location_update', handleLocationUpdate);

    return () => {
      socket.off('tracking:location_update', handleLocationUpdate);
      if (orderId) socket.emit('leave:order', orderId);
    };
  }, [orderId, deliveryId]);

  // Render OpenStreetMap Leaflet iframe or styled canvas with live coords
  const mapCenterLat = riderLocation?.lat || stationeryLocation.lat;
  const mapCenterLng = riderLocation?.lng || stationeryLocation.lng;

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${Math.min(
    stationeryLocation.lng,
    customerLocation.lng,
    riderLocation?.lng || customerLocation.lng
  ) - 0.01}%2C${Math.min(
    stationeryLocation.lat,
    customerLocation.lat,
    riderLocation?.lat || customerLocation.lat
  ) - 0.01}%2C${Math.max(
    stationeryLocation.lng,
    customerLocation.lng,
    riderLocation?.lng || customerLocation.lng
  ) + 0.01}%2C${Math.max(
    stationeryLocation.lat,
    customerLocation.lat,
    riderLocation?.lat || customerLocation.lat
  ) + 0.01}&layer=mapnik&marker=${mapCenterLat}%2C${mapCenterLng}`;

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      {/* Live Status Overlay */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-md border border-slate-200/80 text-xs font-semibold">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isLive ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isLive ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          ></span>
        </span>
        <span className="text-slate-800">
          {isLive ? 'Live GPS Tracking (Active)' : 'GPS Connected'}
        </span>
        {speed !== null && <span className="text-slate-500 pl-1">({Math.round(speed)} km/h)</span>}
      </div>

      {/* Embedded High-Res Interactive Map View */}
      <iframe
        title="Live Delivery Map"
        className="w-full h-full border-0"
        src={osmUrl}
        loading="lazy"
      />

      {/* Route Info Cards */}
      <div className="absolute bottom-3 left-3 right-3 z-20 grid grid-cols-2 gap-2">
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-100 shadow-md">
          <div className="text-[10px] uppercase font-bold text-amber-600">Pickup Shop</div>
          <div className="text-xs font-semibold text-slate-800 truncate">{stationeryName}</div>
        </div>
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-100 shadow-md">
          <div className="text-[10px] uppercase font-bold text-emerald-600">Dropoff Point</div>
          <div className="text-xs font-semibold text-slate-800 truncate">{customerAddress}</div>
        </div>
      </div>
    </div>
  );
};
