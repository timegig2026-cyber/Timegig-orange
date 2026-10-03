import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Search, Plus, Minus, MapPin, AlertTriangle } from 'lucide-react';

interface OpenStreetMapProps {
  onRegisterLocate?: (locateFn: () => void) => void;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function OpenStreetMap({ onRegisterLocate }: OpenStreetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  const createRefinedGpsIcon = useCallback(() => {
    const profileLogo = getProfileLogo();

    return L.divIcon({
      className: 'custom-gps-live-marker',
      html: `
        <div style="position: relative; width: 52px; height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
          <!-- GPS Radar Pulsing Wave Effect -->
          <div class="animate-gps-radar" style="position: absolute; top: 0px; left: 2px; width: 48px; height: 48px; border-radius: 9999px; background: rgba(249, 115, 22, 0.45); pointer-events: none; z-index: 1;"></div>
          
          <!-- Pin Head Badge with Profile Logo -->
          <div style="position: relative; width: 48px; height: 48px; border-radius: 9999px; background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%); border: 3px solid #ffffff; box-shadow: 0 8px 24px rgba(234, 88, 12, 0.65), 0 2px 8px rgba(0, 0, 0, 0.4); overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 10;">
            ${profileLogo
              ? `<img src="${profileLogo}" alt="User Profile" style="width: 100%; height: 100%; object-fit: cover;" />`
              : `<div style="width: 100%; height: 100%; background: linear-gradient(to bottom, #fed7aa, #fdba74); display: flex; align-items: center; justify-content: center; color: #9a3412; font-weight: 900; font-size: 13px; letter-spacing: 0.5px;">LIVE</div>`
            }
          </div>

          <!-- Live GPS Indicator Dot -->
          <div style="position: absolute; top: 1px; right: 2px; width: 13px; height: 13px; border-radius: 9999px; background-color: #22c55e; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(34, 197, 94, 0.9); z-index: 20;"></div>

          <!-- Pin Pointer Arrow Tip -->
          <div style="position: relative; top: -3px; width: 14px; height: 14px; background: #c2410c; transform: rotate(45deg); border-right: 2.5px solid #ffffff; border-bottom: 2.5px solid #ffffff; box-shadow: 2px 2px 5px rgba(0,0,0,0.3); z-index: 5;"></div>

          <!-- Target Ground Ring Indicator -->
          <div style="position: absolute; bottom: 0px; width: 8px; height: 4px; border-radius: 9999px; background: rgba(0, 0, 0, 0.35); filter: blur(1px); z-index: 2;"></div>
        </div>
      `,
      iconSize: [52, 64],
      iconAnchor: [26, 64],
      popupAnchor: [0, -66],
    });
  }, []);

  const updateDeviceLocation = useCallback((lat: number, lng: number, accuracy: number = 50) => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const pinpointIcon = createRefinedGpsIcon();

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px; min-width: 170px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background-color: #22c55e; box-shadow: 0 0 6px #22c55e;"></span>
          <span style="font-weight: 800; color: #c2410c; font-size: 13px;">Live GPS Position</span>
        </div>
        <div style="font-size: 11px; color: #475569; line-height: 1.4;">
          <div><strong>Lat:</strong> ${lat.toFixed(6)}</div>
          <div><strong>Lng:</strong> ${lng.toFixed(6)}</div>
          <div><strong>Accuracy:</strong> &plusmn;${Math.round(accuracy)}m</div>
        </div>
      </div>
    `;

    // Dynamic marker update
    if (markerRef.current) {
      markerRef.current.setIcon(pinpointIcon);
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setPopupContent(popupHtml);
    } else {
      markerRef.current = L.marker([lat, lng], {
        icon: pinpointIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      markerRef.current.bindPopup(popupHtml);
    }

    // Dynamic GPS accuracy radius circle update (translucent circle representing GPS accuracy)
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(accuracy);
    } else {
      circleRef.current = L.circle([lat, lng], {
        radius: accuracy,
        color: '#ea580c',
        weight: 1.5,
        opacity: 0.6,
        fillColor: '#f97316',
        fillOpacity: 0.16, // Translucent fill
        interactive: false,
      }).addTo(map);
      circleRef.current.bringToBack();
    }

    // Auto-center map on initial GPS fix
    if (!hasCenteredOnce) {
      map.setView([lat, lng], 16, { animate: true });
      markerRef.current.openPopup();
      setHasCenteredOnce(true);
    }

    setLocationError(null);
  }, [createRefinedGpsIcon, hasCenteredOnce]);

  const startWatchingLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      // Enforcing strict high accuracy GPS watchPosition settings
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          updateDeviceLocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.accuracy
          );
        },
        (error) => {
          console.warn('Geolocation watchPosition error:', error.code, error.message);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError('Location permission denied. Please enable location access in your browser settings.');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationError('Location information is unavailable.');
          } else if (error.code === error.TIMEOUT) {
            setLocationError('Location request timed out.');
          } else {
            setLocationError('Unable to retrieve exact GPS location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, [updateDeviceLocation]);

  useEffect(() => {
    if (onRegisterLocate) {
      onRegisterLocate(startWatchingLocation);
    }
  }, [onRegisterLocate, startWatchingLocation]);

  // Handle Search using OpenStreetMap Nominatim
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
      if (data && data.length > 0 && mapInstanceRef.current) {
        const topResult = data[0];
        const lat = parseFloat(topResult.lat);
        const lon = parseFloat(topResult.lon);
        const map = mapInstanceRef.current;

        map.setView([lat, lon], 16, { animate: true });

        if (searchMarkerRef.current) {
          searchMarkerRef.current.setLatLng([lat, lon]);
        } else {
          searchMarkerRef.current = L.marker([lat, lon]).addTo(map);
        }
        searchMarkerRef.current.bindPopup(`<div style="font-family:sans-serif;font-weight:bold;color:#1e293b;padding:4px;">🔍 ${topResult.display_name}</div>`).openPopup();
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    if (mapInstanceRef.current) {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const map = mapInstanceRef.current;

      map.setView([lat, lon], 16, { animate: true });

      if (searchMarkerRef.current) {
        searchMarkerRef.current.setLatLng([lat, lon]);
      } else {
        searchMarkerRef.current = L.marker([lat, lon]).addTo(map);
      }
      searchMarkerRef.current.bindPopup(`<div style="font-family:sans-serif;font-weight:bold;color:#1e293b;padding:4px;">🔍 ${result.display_name}</div>`).openPopup();
      setSearchResults([]);
      setSearchQuery(result.display_name);
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initialize Leaflet map with global placeholder until GPS fixes
    const map = L.map(mapContainerRef.current, {
      center: [0, 0],
      zoom: 2,
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

    mapInstanceRef.current = map;

    // Start real GPS watchPosition immediately with high accuracy enforced
    startWatchingLocation();

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
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [startWatchingLocation]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-900">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Location Error Box if permission denied or unavailable */}
      {locationError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] w-[90%] max-w-md bg-red-950/95 border border-red-500/80 text-red-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {locationError}
          </div>
          <button
            onClick={() => {
              setLocationError(null);
              startWatchingLocation();
            }}
            className="text-[10px] font-extrabold uppercase bg-red-600 hover:bg-red-500 text-white px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Floating Top Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] w-[92%] max-w-lg">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <div className="absolute left-3.5 text-orange-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search home number, street address, location, province..."
            className="w-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/40 text-white placeholder-slate-400 text-sm font-semibold pl-11 pr-24 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.7)] focus:outline-none focus:border-orange-500 transition-all"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-[410] divide-y divide-slate-800">
            {searchResults.map((result) => (
              <div
                key={result.place_id}
                onClick={() => selectSearchResult(result)}
                className="px-4 py-3 text-xs text-slate-200 hover:bg-orange-600/20 hover:text-white cursor-pointer transition-colors flex items-start gap-2.5"
              >
                <MapPin size={16} className="text-orange-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{result.display_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Controls at Bottom Center Corner */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[400] flex items-center gap-3 bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 px-4 py-2 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.7)]">
        <button
          onClick={handleZoomIn}
          className="p-2 text-white bg-slate-800 hover:bg-orange-600 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
          title="Zoom In"
        >
          <Plus size={18} />
        </button>
        <span className="text-xs font-bold text-slate-300 tracking-wider">ZOOM</span>
        <button
          onClick={handleZoomOut}
          className="p-2 text-white bg-slate-800 hover:bg-orange-600 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
}
