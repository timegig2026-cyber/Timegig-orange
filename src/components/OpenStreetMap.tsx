import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function OpenStreetMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initialize Leaflet map with OpenStreetMap free tile layer
    const map = L.map(mapContainerRef.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    // Add OpenStreetMap standard free tile server (No costs / no API keys required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Zoom control in top-left
    L.control.zoom({ position: 'topleft' }).addTo(map);

    mapInstanceRef.current = map;

    const updateDeviceLocation = (lat: number, lng: number, accuracy: number) => {
      if (mapInstanceRef.current) {
        // Custom pinpoint map pin icon
        const pinpointIcon = L.divIcon({
          className: 'custom-pinpoint-marker',
          html: `
            <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-full">
              <div class="absolute -bottom-1 w-3 h-3 bg-orange-600 rotate-45 rounded-sm shadow-md"></div>
              <div class="relative flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full border-2 border-white shadow-[0_6px_20px_rgba(249,115,22,0.9)] text-white">
                <svg class="w-5 h-5 filter drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <span class="absolute top-0 animate-ping inline-flex h-10 w-10 rounded-full bg-orange-500 opacity-60 pointer-events-none"></span>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: pinpointIcon }).addTo(mapInstanceRef.current);
          markerRef.current.bindPopup('<div style="font-family:sans-serif;font-weight:bold;color:#c2410c;padding:4px;">📍 My Exact Device GPS Location</div>');
        }

        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng]);
          circleRef.current.setRadius(accuracy);
        } else {
          circleRef.current = L.circle([lat, lng], {
            radius: accuracy,
            color: '#f97316',
            fillColor: '#fdba74',
            fillOpacity: 0.3,
            weight: 2,
          }).addTo(mapInstanceRef.current);
        }

        // Automatically center map on the user's exact GPS location and open popup on first fix
        if (!hasCenteredOnce) {
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
          markerRef.current.openPopup();
          setHasCenteredOnce(true);
        }
      }
    };

    // Request device GPS location with high accuracy and watch position for real-time tracking
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => updateDeviceLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy),
        (error) => console.warn('getCurrentPosition error:', error.code, error.message),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (position) => updateDeviceLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy),
        (error) => console.warn('watchPosition error:', error.code, error.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    // Invalidate size to ensure map tiles fill the container completely
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [hasCenteredOnce]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
