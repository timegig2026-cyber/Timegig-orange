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

    // Request GPS location when the map opens using high accuracy
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;

          if (mapInstanceRef.current) {
            // Custom "My Location" marker icon
            const myLocationIcon = L.divIcon({
              className: 'custom-my-location-marker',
              html: `
                <div class="relative flex items-center justify-center w-10 h-10">
                  <span class="absolute animate-ping inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                  <div class="relative inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full border-2 border-white shadow-[0_4px_16px_rgba(249,115,22,0.9)] text-white font-black">
                    <svg class="w-4 h-4 filter drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                  </div>
                </div>
              `,
              iconSize: [40, 40],
              iconAnchor: [20, 20],
            });

            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              markerRef.current = L.marker([lat, lng], { icon: myLocationIcon }).addTo(mapInstanceRef.current);
              markerRef.current.bindPopup('<div style="font-family:sans-serif;font-weight:bold;color:#c2410c;">My Exact GPS Location</div>');
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

            // Automatically center map on the user's exact GPS location after successful response
            if (!hasCenteredOnce) {
              mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
              setHasCenteredOnce(true);
            }
          }
        },
        (error) => {
          console.warn('Geolocation error:', error.code, error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
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
