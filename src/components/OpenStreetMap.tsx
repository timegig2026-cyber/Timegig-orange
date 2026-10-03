import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation } from 'lucide-react';

export default function OpenStreetMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const getProfileLogo = () => {
    try {
      const saved = localStorage.getItem('submissions');
      if (saved) {
        const subs = JSON.parse(saved);
        const match = subs.slice().reverse().find((s: any) => s.files && s.files.face);
        if (match && match.files.face) {
          return match.files.face;
        }
      }
    } catch (e) {}
    return null;
  };

  const updateDeviceLocation = (lat: number, lng: number, accuracy: number = 50) => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      const profileLogo = getProfileLogo();

      const pinpointIcon = L.divIcon({
        className: 'custom-profile-pinpoint-marker',
        html: `
          <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-full">
            <div class="absolute -bottom-1 w-3 h-3 bg-orange-600 rotate-45 rounded-sm shadow-md"></div>
            <div class="relative flex items-center justify-center w-12 h-12 bg-white rounded-full border-3 border-orange-600 shadow-[0_6px_20px_rgba(249,115,22,0.9)] overflow-hidden">
              ${profileLogo 
                ? `<img src="${profileLogo}" alt="Profile Logo" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full bg-orange-100 flex items-center justify-center text-orange-700 font-black text-xs">ME</div>`
              }
            </div>
            <span class="absolute top-0 animate-ping inline-flex h-12 w-12 rounded-full bg-orange-500 opacity-60 pointer-events-none"></span>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: pinpointIcon }).addTo(map);
        markerRef.current.bindPopup('<div style="font-family:sans-serif;font-weight:bold;color:#c2410c;padding:4px;">📍 My Exact Location & Profile</div>');
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
        }).addTo(map);
      }

      map.setView([lat, lng], 16, { animate: true });
      markerRef.current.openPopup();
      setHasCenteredOnce(true);
      setIsLocating(false);
    }
  };

  const locateUser = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateDeviceLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
        },
        (error) => {
          console.warn('Geolocation error:', error.code, error.message);
          setIsLocating(false);
          // Fallback to default if GPS fails
          updateDeviceLocation(40.7128, -74.0060, 500);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      updateDeviceLocation(40.7128, -74.0060, 500);
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [40.7128, -74.0060],
      zoom: 13,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    L.control.zoom({ position: 'topleft' }).addTo(map);

    mapInstanceRef.current = map;

    // Try GPS immediately
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateDeviceLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
        },
        (error) => {
          console.warn('Initial geolocation error:', error.code, error.message);
          // Try IP fallback
          fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
              if (data && data.latitude && data.longitude && !hasCenteredOnce) {
                updateDeviceLocation(data.latitude, data.longitude, 1000);
              }
            })
            .catch(() => {});
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data && data.latitude && data.longitude && !hasCenteredOnce) {
            updateDeviceLocation(data.latitude, data.longitude, 1000);
          }
        })
        .catch(() => {});
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

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
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Find My Location Button */}
      <div className="absolute top-4 right-4 z-[400]">
        <button
          onClick={locateUser}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-3 rounded-2xl shadow-[0_8px_24px_rgba(249,115,22,0.6)] font-extrabold text-xs tracking-wide hover:scale-105 active:scale-95 transition-all border border-orange-300/60 backdrop-blur-md cursor-pointer"
          title="Find My Exact Location"
        >
          <Navigation size={18} className={isLocating ? 'animate-spin' : ''} />
          <span>{isLocating ? 'Locating...' : 'Find My Location'}</span>
        </button>
      </div>
    </div>
  );
}
