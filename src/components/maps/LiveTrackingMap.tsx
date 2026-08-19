'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getSocket } from '../../lib/socket';
import { Compass, Navigation, MapPin, Bike, Building, Home, Zap } from 'lucide-react';

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
  const [riderLocation, setRiderLocation] = useState<Coordinates>(
    initialRiderLocation || stationeryLocation
  );
  const [isLive, setIsLive] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);

  // Initialize Interactive Leaflet Live Map
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
        // Custom Markers
        const shopIcon = L.divIcon({
          className: 'custom-shop-icon',
          html: `<div style="background-color:#d97706; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 8px 16px rgba(217,119,6,0.4); border:3px solid white; transform:translate(-18px, -18px); font-size:18px;">🏬</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const customerIcon = L.divIcon({
          className: 'custom-customer-icon',
          html: `<div style="background-color:#16a34a; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 8px 16px rgba(22,163,74,0.4); border:3px solid white; transform:translate(-18px, -18px); font-size:18px;">🏠</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const riderIcon = L.divIcon({
          className: 'custom-rider-icon',
          html: `<div style="position:relative; width:44px; height:44px; transform:translate(-22px, -22px);"><div style="position:absolute; inset:0; background-color:#2563eb; opacity:0.3; border-radius:50%; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div><div style="position:relative; width:44px; height:44px; background-color:#2563eb; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 10px 20px rgba(37,99,235,0.5); border:3px solid white; font-size:22px;">🛵</div></div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Add Shop & Customer Markers
        L.marker([stationeryLocation.lat, stationeryLocation.lng], { icon: shopIcon })
          .addTo(map)
          .bindPopup(`<b>${stationeryName}</b><br>Pickup Stationery Shop`);

        L.marker([customerLocation.lat, customerLocation.lng], { icon: customerIcon })
          .addTo(map)
          .bindPopup(`<b>${customerAddress}</b><br>Delivery Destination`);

        // Add Moving Rider Marker
        const currentRiderPos = initialRiderLocation || stationeryLocation;
        const riderMarker = L.marker([currentRiderPos.lat, currentRiderPos.lng], { icon: riderIcon })
          .addTo(map)
          .bindPopup(`<b>Delivery Rider</b><br>Live GPS Movement`);

        // Draw connecting polyline route
        const polyline = L.polyline(
          [
            [stationeryLocation.lat, stationeryLocation.lng],
            [currentRiderPos.lat, currentRiderPos.lng],
            [customerLocation.lat, customerLocation.lng],
          ],
          { color: '#2563eb', weight: 4, opacity: 0.8, dashArray: '8, 8' }
        ).addTo(map);

        // Fit map view to encompass all markers
        const bounds = L.latLngBounds([
          [stationeryLocation.lat, stationeryLocation.lng],
          [customerLocation.lat, customerLocation.lng],
          [currentRiderPos.lat, currentRiderPos.lng],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });

        mapInstanceRef.current = map;
        riderMarkerRef.current = riderMarker;
        routePolylineRef.current = polyline;
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Socket.IO listener for live GPS updates from active delivery rider
  useEffect(() => {
    const socket = getSocket();

    if (orderId) socket.emit('join:order', orderId);
    if (deliveryId) socket.emit('join:delivery', deliveryId);

    const handleLocationUpdate = (data: {
      latitude: number;
      longitude: number;
      speed?: number;
    }) => {
      if (data.latitude && data.longitude) {
        const newCoords = { lat: data.latitude, lng: data.longitude };
        setRiderLocation(newCoords);
        setIsLive(true);
        if (data.speed !== undefined) setSpeed(data.speed);

        // Update Rider Marker on Leaflet Map
        if (riderMarkerRef.current) {
          riderMarkerRef.current.setLatLng([data.latitude, data.longitude]);
        }

        // Update Polyline Route
        if (routePolylineRef.current) {
          routePolylineRef.current.setLatLngs([
            [stationeryLocation.lat, stationeryLocation.lng],
            [data.latitude, data.longitude],
            [customerLocation.lat, customerLocation.lng],
          ]);
        }
      }
    };

    socket.on('tracking:location_update', handleLocationUpdate);

    return () => {
      socket.off('tracking:location_update', handleLocationUpdate);
      if (orderId) socket.emit('leave:order', orderId);
    };
  }, [orderId, deliveryId, stationeryLocation, customerLocation]);

  return (
    <div className="relative w-full h-[340px] sm:h-[420px] rounded-3xl overflow-hidden border-2 border-brand-500/40 shadow-lg bg-slate-100">
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Live Status Overlay */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200/80 text-xs font-semibold">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isLive ? 'bg-emerald-400' : 'bg-blue-400'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isLive ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
          ></span>
        </span>
        <span className="text-slate-900 font-bold">
          {isLive ? 'Live GPS Active' : 'GPS Tracking Ready'}
        </span>
        {speed !== null && (
          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {Math.round(speed)} km/h
          </span>
        )}
      </div>

      {/* Bottom Route Cards */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] grid grid-cols-2 gap-2">
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-md">
          <div className="text-[10px] uppercase font-extrabold text-amber-700 flex items-center gap-1">
            <Building className="w-3 h-3" /> Duka (Pickup)
          </div>
          <div className="text-xs font-bold text-slate-900 truncate">{stationeryName}</div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-md">
          <div className="text-[10px] uppercase font-extrabold text-emerald-700 flex items-center gap-1">
            <Home className="w-3 h-3" /> Mteja (Dropoff)
          </div>
          <div className="text-xs font-bold text-slate-900 truncate">{customerAddress}</div>
        </div>
      </div>
    </div>
  );
};
