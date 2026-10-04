import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { 
  Search, 
  Plus, 
  Minus, 
  MapPin, 
  Layers, 
  Crosshair, 
  ShieldCheck,
  Navigation,
  Volume2,
  VolumeX,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  CheckCircle2,
  Phone,
  X,
  Zap,
  UserCheck,
  Star,
  Check,
  Lock,
  AlertTriangle
} from 'lucide-react';

// Defensive Safeguard for Leaflet against undefined elements in DomUtil and PosAnimation
if (typeof L !== 'undefined') {
  if (L.DomUtil) {
    const originalGetPosition = L.DomUtil.getPosition;
    L.DomUtil.getPosition = function (el: any) {
      if (!el) {
        return new L.Point(0, 0);
      }
      try {
        return originalGetPosition.call(L.DomUtil, el) || new L.Point(0, 0);
      } catch {
        return el?._leaflet_pos || new L.Point(0, 0);
      }
    };

    const originalSetPosition = L.DomUtil.setPosition;
    L.DomUtil.setPosition = function (el: any, point: any) {
      if (!el) return;
      try {
        originalSetPosition.call(L.DomUtil, el, point);
      } catch {
        try {
          if (el) {
            el._leaflet_pos = point;
          }
        } catch {}
      }
    };
  }

  if (L.PosAnimation && L.PosAnimation.prototype) {
    const originalRun = L.PosAnimation.prototype.run;
    L.PosAnimation.prototype.run = function (el: any, newPos: any, duration: any, easeLinearity: any) {
      if (!el) return this;
      try {
        return originalRun.call(this, el, newPos, duration, easeLinearity);
      } catch {
        return this;
      }
    };
  }
}

export interface NavigationTrip {
  seeker: {
    id: string;
    name: string;
    profession: string;
    avatar: string;
    phone: string;
  };
  destination?: {
    lat: number;
    lng: number;
    name: string;
  };
}

interface OpenStreetMapProps {
  onRegisterLocate?: (locateFn: () => void) => void;
  onOpenAdmin?: () => void;
  activeTrip?: NavigationTrip | null;
  onEndTrip?: () => void;
  onSelectSeeker?: (seeker: any) => void;
  onHireSeeker?: (seeker: any) => void;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface NavStep {
  instruction: string;
  voiceText: string;
  distance: string;
  icon: 'up' | 'right' | 'left' | 'arrived';
  point: [number, number];
}

// Lady Voice Helper using Web Speech API
function speakLadyVoice(text: string, enabled: boolean = true) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prioritize natural female English voices
    const femaleVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('samantha') || 
       v.name.toLowerCase().includes('karen') || 
       v.name.toLowerCase().includes('zira') || 
       v.name.toLowerCase().includes('victoria') || 
       v.name.toLowerCase().includes('google uk english female') ||
       v.name.toLowerCase().includes('moira') || 
       v.name.toLowerCase().includes('fiona') || 
       v.name.toLowerCase().includes('tessa'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.pitch = 1.15; // natural warm female tone
    utterance.rate = 0.95;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Lady voice speech error:', err);
  }
}

export default function OpenStreetMap({ 
  onRegisterLocate, 
  onOpenAdmin,
  activeTrip,
  onEndTrip,
  onSelectSeeker,
  onHireSeeker
}: OpenStreetMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const isVoiceMutedRef = useRef(false);

  // Ready to Hire Seeker on Map references
  const readySeekerMarkerRef = useRef<L.Marker | null>(null);
  const [isReadySeekerOnMap, setIsReadySeekerOnMap] = useState(() => {
    return localStorage.getItem('user_is_available_seeker') === 'true';
  });
  const [readySeekerData, setReadySeekerData] = useState<any>(null);

  // Navigation references
  const seekerMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const navigationIntervalRef = useRef<number | null>(null);

  const [mapType, setMapType] = useState<'street' | 'satellite'>(() => {
    return (localStorage.getItem('preferred_map_layer') as 'street' | 'satellite') || 'street';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasCenteredOnce, setHasCenteredOnce] = useState(false);

  // Live Navigation State
  const [navCurrentStepIndex, setNavCurrentStepIndex] = useState(0);
  const [navDistanceRemaining, setNavDistanceRemaining] = useState('1.6 km');
  const [navEta, setNavEta] = useState('4 mins');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  // User Gig Completed Modal State (Only User can Click on Gig Completed)
  const [isUserCompletionModalOpen, setIsUserCompletionModalOpen] = useState(false);
  const [gigRating, setGigRating] = useState(5);
  const [completionNote, setCompletionNote] = useState('');
  const [userVerifiedConsent, setUserVerifiedConsent] = useState(true);
  const [gigCompletedSuccess, setGigCompletedSuccess] = useState(false);
  const [unauthorizedSeekerAttempt, setUnauthorizedSeekerAttempt] = useState(false);

  // Security check: Determine if current user is the seeker
  // Only the hiring user (client) is authorized to click Gig Completed!
  const isCurrentSeeker = useMemo(() => {
    if (!activeTrip) return false;
    try {
      if (activeTrip.seeker.id === 'current-user-seeker') return true;
      const profileSaved = localStorage.getItem('user_profile');
      if (profileSaved) {
        const p = JSON.parse(profileSaved);
        const pFullName = [p.name, p.middleName, p.surname].filter(Boolean).join(' ').trim().toLowerCase();
        if (pFullName && pFullName === activeTrip.seeker.name?.trim().toLowerCase()) {
          return true;
        }
        if (p.phone && p.phone === activeTrip.seeker.phone) {
          return true;
        }
      }
    } catch (e) {}
    return false;
  }, [activeTrip]);

  // Sync ref
  useEffect(() => {
    isVoiceMutedRef.current = isVoiceMuted;
  }, [isVoiceMuted]);

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

    const isMarkerValid = Boolean(
      markerRef.current && 
      map.hasLayer(markerRef.current) && 
      (markerRef.current as any)._icon
    );

    if (isMarkerValid && markerRef.current) {
      try {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(popupHtml);
      } catch {
        try { map.removeLayer(markerRef.current); } catch {}
        markerRef.current = L.marker([lat, lng], { icon: pinpointIcon })
          .addTo(map)
          .bindPopup(popupHtml, { autoPan: false });
      }
    } else {
      if (markerRef.current) {
        try { map.removeLayer(markerRef.current); } catch {}
      }
      markerRef.current = L.marker([lat, lng], { icon: pinpointIcon })
        .addTo(map)
        .bindPopup(popupHtml, { autoPan: false });
    }

    const isCircleValid = Boolean(
      circleRef.current && 
      map.hasLayer(circleRef.current) && 
      (circleRef.current as any)._path
    );

    if (isCircleValid && circleRef.current) {
      try {
        circleRef.current.setLatLng([lat, lng]);
        circleRef.current.setRadius(Math.max(accuracy, 20));
      } catch {
        try { map.removeLayer(circleRef.current); } catch {}
        circleRef.current = L.circle([lat, lng], {
          radius: Math.max(accuracy, 20),
          color: '#f97316',
          fillColor: '#ea580c',
          fillOpacity: 0.12,
          weight: 1.5,
        }).addTo(map);
      }
    } else {
      if (circleRef.current) {
        try { map.removeLayer(circleRef.current); } catch {}
      }
      circleRef.current = L.circle([lat, lng], {
        radius: Math.max(accuracy, 20),
        color: '#f97316',
        fillColor: '#ea580c',
        fillOpacity: 0.12,
        weight: 1.5,
      }).addTo(map);
    }

    lastCoordsRef.current = { lat, lng };

    if (!hasCenteredOnce) {
      map.setView([lat, lng], 16, { animate: false });
      setHasCenteredOnce(true);
    }
  }, [createRefinedGpsIcon, hasCenteredOnce]);

  // Sync Ready to Hire Seeker on the Map
  const syncReadySeekerOnMap = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const isReady = localStorage.getItem('user_is_available_seeker') === 'true';
    setIsReadySeekerOnMap(isReady);

    if (!isReady) {
      if (readySeekerMarkerRef.current) {
        try {
          if (map.hasLayer(readySeekerMarkerRef.current)) {
            map.removeLayer(readySeekerMarkerRef.current);
          }
        } catch {}
        readySeekerMarkerRef.current = null;
      }
      setReadySeekerData(null);
      return;
    }

    // Build user seeker profile
    let profile: any = {};
    try {
      const saved = localStorage.getItem('user_profile');
      if (saved) profile = JSON.parse(saved);
    } catch {}

    let avatar = profile.avatar || '';
    if (!avatar) {
      try {
        const savedSubs = localStorage.getItem('submissions');
        if (savedSubs) {
          const subs = JSON.parse(savedSubs);
          const match = subs.slice().reverse().find((s: any) => s.files && s.files.face);
          if (match && match.files?.face) avatar = match.files.face;
        }
      } catch {}
    }
    if (!avatar) {
      avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
    }

    const fullName = [profile.name, profile.middleName, profile.surname].filter(Boolean).join(' ') || 'You (Ready to Hire)';
    const profession = profile.workLookingFor 
      ? profile.workLookingFor.substring(0, 45) 
      : (profile.skills?.[0] || 'Ready Gig Specialist');
    const location = [profile.location, profile.province].filter(Boolean).join(', ') || 'Current GPS Spot';

    const seekerObj = {
      id: 'current-user-seeker',
      name: fullName,
      middleName: profile.middleName,
      surname: profile.surname,
      profession: profession,
      category: 'Services',
      rate: 'Negotiable / Hourly',
      location: location,
      province: profile.province,
      address: profile.address,
      dateOfBirth: profile.dateOfBirth,
      distance: '0.1 km (Your Location)',
      rating: 5.0,
      reviewsCount: 1,
      avatar: avatar,
      available: true,
      phone: profile.contactNumber || localStorage.getItem('currentUserEmail') || '+27 82 000 0000',
      email: profile.email || localStorage.getItem('currentUserEmail') || '',
      skills: profile.skills?.length > 0 ? profile.skills : ['Reliable', 'Ready to Work', 'Direct Hire'],
      workLookingFor: profile.workLookingFor,
      workTypes: profile.workTypes,
      socialLinks: profile.socialLinks,
      isCurrentUser: true
    };

    setReadySeekerData(seekerObj);

    const lat = (lastCoordsRef.current?.lat || -26.2041) + 0.0006;
    const lng = (lastCoordsRef.current?.lng || 28.0473) + 0.0006;

    const readySeekerIcon = L.divIcon({
      className: 'custom-ready-seeker-map-marker',
      html: `
        <div style="position: relative; width: 48px; height: 56px; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <!-- Seeker Logo / Avatar Badge -->
          <div style="position: relative; width: 46px; height: 46px; border-radius: 9999px; background: #064e3b; border: 3px solid #10b981; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.7); overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 10;">
            <img src="${avatar}" alt="${fullName}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <!-- Live Online Indicator Dot -->
          <div style="position: absolute; top: 1px; right: 1px; width: 12px; height: 12px; border-radius: 9999px; background-color: #22c55e; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(34, 197, 94, 0.9); z-index: 20;"></div>
          <!-- Arrow Tip -->
          <div style="position: relative; top: -3px; width: 12px; height: 12px; background: #10b981; transform: rotate(45deg); border-right: 2px solid white; border-bottom: 2px solid white; z-index: 5;"></div>
        </div>
      `,
      iconSize: [48, 56],
      iconAnchor: [24, 56],
      popupAnchor: [0, -56]
    });

    const popupHtml = `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 8px; min-width: 220px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <img src="${avatar}" style="width: 40px; height: 40px; border-radius: 12px; object-fit: cover; border: 2px solid #10b981;" />
          <div style="flex: 1;">
            <div style="font-weight: 900; color: #0f172a; font-size: 13px; line-height: 1.2;">${fullName}</div>
            <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 2px;">${profession}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 10px; color: #166534; background: #dcfce7; padding: 3px 8px; border-radius: 8px; font-weight: 700;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #22c55e;"></span>
          <span>Ready to Hire • Active on Map</span>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
          <div><strong>Rate:</strong> ${seekerObj.rate}</div>
          <div><strong>Location:</strong> ${seekerObj.location}</div>
        </div>
        <button id="map-seeker-details-btn" style="width: 100%; padding: 7px 10px; background: #0f172a; color: white; border: none; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer;">
          View Seeker Details
        </button>
      </div>
    `;

    const isValid = Boolean(
      readySeekerMarkerRef.current &&
      map.hasLayer(readySeekerMarkerRef.current) &&
      (readySeekerMarkerRef.current as any)._icon
    );

    if (isValid && readySeekerMarkerRef.current) {
      try {
        readySeekerMarkerRef.current.setLatLng([lat, lng]);
        readySeekerMarkerRef.current.setIcon(readySeekerIcon);
        readySeekerMarkerRef.current.setPopupContent(popupHtml);
      } catch {
        try { map.removeLayer(readySeekerMarkerRef.current); } catch {}
        readySeekerMarkerRef.current = L.marker([lat, lng], { icon: readySeekerIcon })
          .addTo(map)
          .bindPopup(popupHtml, { autoPan: false });
      }
    } else {
      if (readySeekerMarkerRef.current) {
        try { map.removeLayer(readySeekerMarkerRef.current); } catch {}
      }
      readySeekerMarkerRef.current = L.marker([lat, lng], { icon: readySeekerIcon })
        .addTo(map)
        .bindPopup(popupHtml, { autoPan: false });
    }

    if (readySeekerMarkerRef.current) {
      readySeekerMarkerRef.current.on('popupopen', () => {
        const btn = document.getElementById('map-seeker-details-btn');
        if (btn) {
          btn.onclick = () => {
            if (onSelectSeeker) onSelectSeeker(seekerObj);
          };
        }
      });
      readySeekerMarkerRef.current.on('click', () => {
        if (onSelectSeeker) onSelectSeeker(seekerObj);
      });
    }
  }, [onSelectSeeker]);

  // Sync ready seeker listener
  useEffect(() => {
    syncReadySeekerOnMap();
    const handleStatusChange = () => {
      syncReadySeekerOnMap();
    };
    window.addEventListener('seeker_ready_status_changed', handleStatusChange);
    window.addEventListener('storage', handleStatusChange);
    return () => {
      window.removeEventListener('seeker_ready_status_changed', handleStatusChange);
      window.removeEventListener('storage', handleStatusChange);
    };
  }, [syncReadySeekerOnMap]);

  // Direct to exact spot handler without conflicting animations
  const directToExactSpot = useCallback(() => {
    if (mapInstanceRef.current && lastCoordsRef.current) {
      mapInstanceRef.current.setView(
        [lastCoordsRef.current.lat, lastCoordsRef.current.lng],
        17,
        { animate: false }
      );
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          updateDeviceLocation(latitude, longitude, accuracy);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 17, { animate: false });
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [updateDeviceLocation]);

  useEffect(() => {
    if (onRegisterLocate) {
      onRegisterLocate(directToExactSpot);
    }
  }, [onRegisterLocate, directToExactSpot]);

  // Switch Tile Layer
  const switchMapType = useCallback((type: 'street' | 'satellite') => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let newLayer: L.TileLayer;
    if (type === 'satellite') {
      newLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri',
          maxZoom: 19,
        }
      );
    } else {
      newLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }
      );
    }

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;
    setMapType(type);
    localStorage.setItem('preferred_map_layer', type);
  }, []);

  // Initialize Base Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = -26.2041;
    const initialLng = 28.0473;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    const initialLayerType = (localStorage.getItem('preferred_map_layer') as 'street' | 'satellite') || 'street';
    switchMapType(initialLayerType);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          updateDeviceLocation(latitude, longitude, accuracy);
        },
        () => {
          updateDeviceLocation(initialLat, initialLng, 100);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          updateDeviceLocation(latitude, longitude, accuracy);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } else {
      updateDeviceLocation(initialLat, initialLng, 100);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
          }
        } catch {}
        try {
          if (circleRef.current) {
            mapInstanceRef.current.removeLayer(circleRef.current);
          }
        } catch {}
        try {
          if (searchMarkerRef.current) {
            mapInstanceRef.current.removeLayer(searchMarkerRef.current);
          }
        } catch {}
        try {
          if (readySeekerMarkerRef.current) {
            mapInstanceRef.current.removeLayer(readySeekerMarkerRef.current);
          }
        } catch {}
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      circleRef.current = null;
      searchMarkerRef.current = null;
      readySeekerMarkerRef.current = null;
    };
  }, [switchMapType, updateDeviceLocation]);

  // Live Navigation & Lady Voice Guidance when activeTrip is active
  useEffect(() => {
    // Clean up previous navigation layers
    const cleanupLayers = () => {
      if (navigationIntervalRef.current) {
        clearInterval(navigationIntervalRef.current);
        navigationIntervalRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          if (seekerMarkerRef.current && mapInstanceRef.current.hasLayer(seekerMarkerRef.current)) {
            mapInstanceRef.current.removeLayer(seekerMarkerRef.current);
          }
        } catch {}
        try {
          if (destinationMarkerRef.current && mapInstanceRef.current.hasLayer(destinationMarkerRef.current)) {
            mapInstanceRef.current.removeLayer(destinationMarkerRef.current);
          }
        } catch {}
        try {
          if (routePolylineRef.current && mapInstanceRef.current.hasLayer(routePolylineRef.current)) {
            mapInstanceRef.current.removeLayer(routePolylineRef.current);
          }
        } catch {}
      }
      seekerMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routePolylineRef.current = null;
    };

    if (!activeTrip || !mapInstanceRef.current) {
      cleanupLayers();
      return;
    }

    cleanupLayers();

    const map = mapInstanceRef.current;
    const destLat = lastCoordsRef.current?.lat || -26.2041;
    const destLng = lastCoordsRef.current?.lng || 28.0473;

    // Seeker exact starting location (~1.6 km offset)
    const seekerStartLat = destLat + 0.0125;
    const seekerStartLng = destLng - 0.0105;

    // Build realistic street turn-by-turn waypoints
    const steps: NavStep[] = [
      {
        instruction: `Head south on Oxford Road toward ${activeTrip.destination?.name || 'Destination'}`,
        voiceText: `Seeker ${activeTrip.seeker.name} accepted your booking. Navigation starting now. Head south on Oxford Road towards destination.`,
        distance: '1.6 km',
        icon: 'up',
        point: [seekerStartLat, seekerStartLng]
      },
      {
        instruction: 'In 350 meters, turn left onto 5th Avenue',
        voiceText: 'In 350 meters, turn left onto 5th Avenue.',
        distance: '1.2 km',
        icon: 'left',
        point: [seekerStartLat - 0.0032, seekerStartLng + 0.0022]
      },
      {
        instruction: 'Continue straight along 5th Avenue for 500m',
        voiceText: 'Continue straight along 5th Avenue for 500 meters.',
        distance: '850 m',
        icon: 'up',
        point: [seekerStartLat - 0.0068, seekerStartLng + 0.0052]
      },
      {
        instruction: 'In 250 meters, turn right onto Rivonia Road',
        voiceText: 'In 250 meters, turn right onto Rivonia Road toward user destination.',
        distance: '450 m',
        icon: 'right',
        point: [seekerStartLat - 0.0098, seekerStartLng + 0.0084]
      },
      {
        instruction: 'Approaching user destination on your right in 100m',
        voiceText: 'Approaching user destination on your right in 100 meters.',
        distance: '150 m',
        icon: 'right',
        point: [destLat + 0.0012, destLng - 0.0010]
      },
      {
        instruction: `Arrived! ${activeTrip.seeker.name} has arrived at user destination. Waiting for user to confirm Gig Completed.`,
        voiceText: `You have arrived at your user destination. Seeker ${activeTrip.seeker.name} has arrived! User confirmation is required to complete this gig.`,
        distance: '0 m',
        icon: 'arrived',
        point: [destLat, destLng]
      }
    ];

    setNavCurrentStepIndex(0);
    setNavDistanceRemaining(steps[0].distance);
    setNavEta('4 mins');
    setHasArrived(false);

    // Initial Lady Voice announcement
    speakLadyVoice(steps[0].voiceText, !isVoiceMutedRef.current);

    // 1. Create Destination Marker
    const destIcon = L.divIcon({
      className: 'custom-destination-marker',
      html: `
        <div style="position: relative; width: 48px; height: 58px; display: flex; flex-direction: column; align-items: center;">
          <div style="width: 44px; height: 44px; border-radius: 9999px; background: linear-gradient(135deg, #ef4444, #b91c1c); border: 3px solid #ffffff; box-shadow: 0 8px 25px rgba(239, 68, 68, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10;">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill="white" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
          <div style="width: 12px; height: 12px; background: #b91c1c; transform: rotate(45deg); margin-top: -6px; border-right: 2px solid white; border-bottom: 2px solid white; z-index: 5;"></div>
        </div>
      `,
      iconSize: [48, 58],
      iconAnchor: [24, 58]
    });

    destinationMarkerRef.current = L.marker([destLat, destLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b>User Destination</b><br>${activeTrip.destination?.name || 'Selected Location'}`, { autoPan: false });

    // 2. Create Seeker Marker
    const seekerIcon = L.divIcon({
      className: 'custom-seeker-nav-marker',
      html: `
        <div style="position: relative; width: 56px; height: 68px; display: flex; flex-direction: column; align-items: center;">
          <!-- Green Radar Ring -->
          <div class="animate-ping" style="position: absolute; top: 0; width: 52px; height: 52px; border-radius: 9999px; background: rgba(16, 185, 129, 0.5); pointer-events: none;"></div>
          <!-- Seeker Avatar Badge -->
          <div style="position: relative; width: 50px; height: 50px; border-radius: 9999px; background: #064e3b; border: 3.5px solid #10b981; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.8); overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 10;">
            <img src="${activeTrip.seeker.avatar}" alt="${activeTrip.seeker.name}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <!-- Pin Pointer Arrow -->
          <div style="width: 14px; height: 14px; background: #10b981; transform: rotate(45deg); margin-top: -7px; border-right: 2.5px solid white; border-bottom: 2.5px solid white; z-index: 5;"></div>
          <!-- Live Pill -->
          <div style="position: absolute; bottom: -2px; background: #10b981; color: white; font-size: 9px; font-weight: 900; padding: 1px 5px; border-radius: 9999px; border: 1.5px solid white; white-space: nowrap; z-index: 20;">SEEKER</div>
        </div>
      `,
      iconSize: [56, 68],
      iconAnchor: [28, 68]
    });

    seekerMarkerRef.current = L.marker([seekerStartLat, seekerStartLng], { icon: seekerIcon })
      .addTo(map)
      .bindPopup(`<b>${activeTrip.seeker.name}</b><br>${activeTrip.seeker.profession}`, { autoPan: false });

    // 3. Draw Route Polyline
    const polylineCoords = steps.map(s => s.point);
    routePolylineRef.current = L.polyline(polylineCoords, {
      color: '#10b981',
      weight: 6,
      opacity: 0.9,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    // Fit map bounds cleanly without conflicting animations
    try {
      map.fitBounds(L.latLngBounds([[seekerStartLat, seekerStartLng], [destLat, destLng]]), {
        padding: [80, 80],
        animate: false
      });
    } catch (e) {}

    // 4. Animate Seeker Motion & Lady Voice Step Transitions
    let currentStep = 0;
    const totalSteps = steps.length;

    navigationIntervalRef.current = window.setInterval(() => {
      currentStep++;
      if (currentStep < totalSteps) {
        const step = steps[currentStep];
        setNavCurrentStepIndex(currentStep);
        setNavDistanceRemaining(step.distance);
        setNavEta(currentStep === totalSteps - 1 ? '0 min' : `${Math.max(1, 4 - currentStep)} mins`);

        // Safely move seeker marker
        if (
          seekerMarkerRef.current && 
          mapInstanceRef.current && 
          mapInstanceRef.current.hasLayer(seekerMarkerRef.current) &&
          (seekerMarkerRef.current as any)._icon
        ) {
          try {
            seekerMarkerRef.current.setLatLng(step.point);
          } catch {}
        }

        // Voice instruction by Lady Voice
        speakLadyVoice(step.voiceText, !isVoiceMutedRef.current);

        if (currentStep === totalSteps - 1) {
          setHasArrived(true);
          if (navigationIntervalRef.current) {
            clearInterval(navigationIntervalRef.current);
            navigationIntervalRef.current = null;
          }
        }
      }
    }, 4500);

    return () => {
      cleanupLayers();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeTrip?.seeker.id]);

  // Handle User Confirming Gig Completed (Only User can Click)
  const handleConfirmGigCompletedByUser = () => {
    if (!activeTrip) return;

    // Lady voice completion alert
    speakLadyVoice("Gig marked as completed by user. Thank you for using GiGs!", !isVoiceMutedRef.current);

    // Save to completed gigs history in localStorage
    try {
      const saved = localStorage.getItem('completed_gigs');
      const list = saved ? JSON.parse(saved) : [];
      list.unshift({
        id: `gig-${Date.now()}`,
        seekerId: activeTrip.seeker.id,
        seekerName: activeTrip.seeker.name,
        profession: activeTrip.seeker.profession,
        completedAt: new Date().toISOString(),
        rating: gigRating,
        note: completionNote || 'Gig completed & verified by hiring user',
        confirmedByUser: true
      });
      localStorage.setItem('completed_gigs', JSON.stringify(list));
    } catch (e) {}

    setIsUserCompletionModalOpen(false);
    setGigCompletedSuccess(true);

    setTimeout(() => {
      setGigCompletedSuccess(false);
      if (onEndTrip) onEndTrip();
    }, 2200);
  };

  // Handle Zoom In / Out
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Search Address or Suburb
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`
      );
      const data: SearchResult[] = await response.json();

      if (data && data.length > 0) {
        setSearchResults(data);
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);

        mapInstanceRef.current.setView([lat, lon], 16, { animate: false });

        const isSearchMarkerValid = Boolean(
          searchMarkerRef.current &&
          mapInstanceRef.current.hasLayer(searchMarkerRef.current) &&
          (searchMarkerRef.current as any)._icon
        );

        if (isSearchMarkerValid && searchMarkerRef.current) {
          try {
            searchMarkerRef.current.setLatLng([lat, lon]);
          } catch {}
        } else {
          if (searchMarkerRef.current && mapInstanceRef.current) {
            try { mapInstanceRef.current.removeLayer(searchMarkerRef.current); } catch {}
          }
          const searchIcon = L.divIcon({
            className: 'custom-search-marker',
            html: `
              <div style="width: 32px; height: 32px; background: #2563eb; border: 3px solid white; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          searchMarkerRef.current = L.marker([lat, lon], { icon: searchIcon }).addTo(
            mapInstanceRef.current
          );
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (!mapInstanceRef.current) return;
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    mapInstanceRef.current.setView([lat, lon], 16, { animate: false });

    const isSearchMarkerValid = Boolean(
      searchMarkerRef.current &&
      mapInstanceRef.current.hasLayer(searchMarkerRef.current) &&
      (searchMarkerRef.current as any)._icon
    );

    if (isSearchMarkerValid && searchMarkerRef.current) {
      try {
        searchMarkerRef.current.setLatLng([lat, lon]);
      } catch {}
    } else {
      if (searchMarkerRef.current && mapInstanceRef.current) {
        try { mapInstanceRef.current.removeLayer(searchMarkerRef.current); } catch {}
      }
      const searchIcon = L.divIcon({
        className: 'custom-search-marker',
        html: `
          <div style="width: 32px; height: 32px; background: #2563eb; border: 3px solid white; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      searchMarkerRef.current = L.marker([lat, lon], { icon: searchIcon }).addTo(
        mapInstanceRef.current
      );
    }

    setSearchResults([]);
  };

  // Turn-by-turn icon helper
  const getNavIcon = () => {
    if (hasArrived) return <CheckCircle2 size={24} className="text-emerald-400" />;
    if (navCurrentStepIndex === 1) return <CornerUpLeft size={24} className="text-orange-400" />;
    if (navCurrentStepIndex === 3 || navCurrentStepIndex === 4) return <CornerUpRight size={24} className="text-orange-400" />;
    return <ArrowUp size={24} className="text-emerald-400 animate-pulse" />;
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-sans">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Completion Success Toast */}
      {gigCompletedSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[5500] bg-emerald-600 border border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl animate-fadeIn flex items-center gap-2.5 font-bold text-sm">
          <CheckCircle2 size={20} className="text-white" />
          <span>Gig confirmed as completed by user! Trip finished.</span>
        </div>
      )}

      {/* LIVE NAVIGATION HUD: Appears when a seeker has accepted and is navigating */}
      {activeTrip && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[2000] w-[94%] max-w-lg pointer-events-auto animate-fadeIn">
          <div className="bg-slate-900/98 border-2 border-emerald-500/60 rounded-3xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-white space-y-3">
            
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-inner">
                  {getNavIcon()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {hasArrived ? 'Arrived • User Verification' : 'Seeker En Route'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      {navEta} • {navDistanceRemaining}
                    </span>
                  </div>
                  <p className="text-sm font-black text-white leading-tight mt-0.5">
                    {hasArrived 
                      ? `${activeTrip.seeker.name} has arrived at destination! Waiting for User to click Gig Completed.`
                      : (navCurrentStepIndex === 1 
                          ? 'In 350m, turn left onto 5th Avenue' 
                          : navCurrentStepIndex === 3 
                          ? 'In 250m, turn right onto Rivonia Road'
                          : navCurrentStepIndex === 4
                          ? 'Approaching user destination in 100m'
                          : `Head south on Oxford Road toward ${activeTrip.seeker.name}'s destination`
                        )}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Audio Voice Toggle & End Trip */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    const next = !isVoiceMuted;
                    setIsVoiceMuted(next);
                    if (!next) {
                      speakLadyVoice("Lady voice guidance unmuted.", true);
                    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isVoiceMuted 
                      ? 'bg-slate-800 text-slate-400 border-slate-700' 
                      : 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 shadow-md'
                  }`}
                  title={isVoiceMuted ? 'Unmute Lady Voice' : 'Mute Lady Voice'}
                >
                  {isVoiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                <button
                  onClick={onEndTrip}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                  title="Close Navigation"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Seeker Profile Strip & Only User can Click Gig Completed */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-800/80 text-xs gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeTrip.seeker.avatar}
                  alt={activeTrip.seeker.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <h4 className="font-black text-white text-xs leading-none">{activeTrip.seeker.name}</h4>
                  <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{activeTrip.seeker.profession}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <a
                  href={`tel:${activeTrip.seeker.phone}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 shadow transition-all"
                >
                  <Phone size={12} />
                  <span>Call</span>
                </a>

                {/* ONLY USER CAN CLICK ON GIG COMPLETED */}
                {hasArrived ? (
                  isCurrentSeeker ? (
                    <button
                      onClick={() => setUnauthorizedSeekerAttempt(true)}
                      className="px-3 py-1.5 bg-slate-800/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
                      title="Only the hiring user can click on gig completed"
                    >
                      <Lock size={13} className="text-amber-400" />
                      <span>Awaiting User Confirmation</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsUserCompletionModalOpen(true)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 animate-pulse"
                      title="Only user can click on gig completed"
                    >
                      <UserCheck size={14} className="stroke-[2.5]" />
                      <span>Gig Completed (Only User Can Click)</span>
                    </button>
                  )
                ) : (
                  <div className="flex items-center gap-1.5">
                    {!isCurrentSeeker && (
                      <button
                        onClick={() => setIsUserCompletionModalOpen(true)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 border border-slate-700 hover:border-emerald-500 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Only the hiring user can complete gig"
                      >
                        <UserCheck size={11} />
                        <span>User: Complete Gig</span>
                      </button>
                    )}
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 px-2 py-1 bg-slate-950 rounded-lg border border-slate-800">
                      <Navigation size={11} className="text-emerald-400" />
                      <span>Seeker En Route</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* USER GIG COMPLETION MODAL: Only user can click on gig completed */}
      {isUserCompletionModalOpen && activeTrip && (
        <div className="fixed inset-0 z-[5000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-white space-y-5 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Confirm Gig Completed</h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Only User Can Click On Gig Completed
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsUserCompletionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Exclusive User Authority Notice */}
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-200">
              <ShieldCheck size={22} className="text-emerald-400 shrink-0" />
              <p>
                <strong>User Security Rule:</strong> Only you as the hiring user can approve and click on <strong>Gig Completed</strong>. The seeker cannot mark the gig finished without your authorization.
              </p>
            </div>

            {/* Seeker Info Card */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3.5">
              <img
                src={activeTrip.seeker.avatar}
                alt={activeTrip.seeker.name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
              />
              <div className="flex-1">
                <h4 className="text-sm font-black text-white">{activeTrip.seeker.name}</h4>
                <p className="text-xs text-orange-400 font-bold">{activeTrip.seeker.profession}</p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>Arrived at destination • Service delivered</span>
                </p>
              </div>
            </div>

            {/* User Rating */}
            <div className="space-y-1.5 text-center">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Rate Seeker Work (User Review)
              </label>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setGigRating(star)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      size={24}
                      fill={star <= gigRating ? 'currentColor' : 'none'}
                      className={star <= gigRating ? 'text-amber-400' : 'text-slate-600'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Note */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Completion Notes / Comments (Optional)
              </label>
              <input
                type="text"
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="e.g. Excellent service, arrived on time!"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* User Verification Checkbox */}
            <label className="flex items-start gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors">
              <input
                type="checkbox"
                checked={userVerifiedConsent}
                onChange={(e) => setUserVerifiedConsent(e.target.checked)}
                className="mt-0.5 accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-300">
                I verify as the hiring user that this gig has been fulfilled to my satisfaction.
              </span>
            </label>

            {/* Final Confirmation Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsUserCompletionModalOpen(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Map
              </button>

              <button
                type="button"
                disabled={!userVerifiedConsent}
                onClick={handleConfirmGigCompletedByUser}
                className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                  userVerifiedConsent
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-98 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>Confirm Gig Completed (User Authority)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* UNAUTHORIZED SEEKER ATTEMPT MODAL */}
      {unauthorizedSeekerAttempt && (
        <div className="fixed inset-0 z-[5100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">User Only Action</h3>
                <span className="text-[11px] font-bold text-amber-400 block">
                  Seeker Authorization Restricted
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-amber-950/30 p-3 rounded-xl border border-amber-500/20">
              <strong>Only user can click on gig completed.</strong> As the seeker/provider, you cannot mark this gig finished. Please have the hiring user confirm completion on their device.
            </p>

            <button
              onClick={() => setUnauthorizedSeekerAttempt(false)}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer"
            >
              Understood (User Will Confirm)
            </button>
          </div>
        </div>
      )}

      {/* Floating Top Search Bar (Hidden when navigation is active) */}
      {!activeTrip && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1500] w-[92%] max-w-lg pointer-events-auto">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suburb, town, or address..."
              className="w-full bg-slate-900/95 text-white placeholder-slate-400 px-4 py-3 pl-11 pr-14 rounded-2xl border border-orange-500/40 focus:border-orange-500 focus:outline-none shadow-[0_8px_25px_rgba(0,0,0,0.65)] backdrop-blur-md text-xs sm:text-sm font-medium transition-all"
            />
            <MapPin size={18} className="absolute left-3.5 text-orange-400 pointer-events-none" />

            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md disabled:opacity-50"
              title="Search Location"
            >
              <Search size={16} />
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-slate-900/95 border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-orange-600/20 hover:text-white border-b border-slate-800 last:border-b-0 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <MapPin size={14} className="text-orange-400 shrink-0" />
                  <span className="truncate">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ready to Hire Seeker Active on Map Indicator */}
      {isReadySeekerOnMap && !activeTrip && (
        <div className="fixed top-20 left-4 z-[1400] bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 shadow-[0_8px_25px_rgba(16,185,129,0.3)] rounded-2xl p-2.5 flex items-center gap-2.5 text-xs text-white animate-fadeIn pointer-events-auto">
          <div className="relative flex items-center justify-center w-6 h-6">
            <span className="w-3 h-3 rounded-full bg-emerald-400 block animate-ping absolute" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 block relative border border-white" />
          </div>
          <div>
            <span className="font-black text-white text-[11px] block leading-tight">You are Live on Map</span>
            <span className="text-[10px] text-emerald-400 font-bold">Ready to be hired</span>
          </div>
          {readySeekerData && (
            <button
              onClick={() => {
                if (onSelectSeeker) onSelectSeeker(readySeekerData);
              }}
              className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[10px] font-black cursor-pointer shadow transition-all ml-1"
            >
              View
            </button>
          )}
        </div>
      )}

      {/* Floating Action Icons on Map Right Side (Icons Only) */}
      <div className="fixed top-20 right-4 z-[1500] flex flex-col gap-2.5 pointer-events-auto">
        {/* 1. Satellite / Street View Layer Switcher Icon */}
        <button
          onClick={() => switchMapType(mapType === 'street' ? 'satellite' : 'street')}
          className="w-11 h-11 bg-slate-900/95 hover:bg-slate-800 text-white border border-orange-500/40 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.75)] backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          title={`Switch to ${mapType === 'street' ? 'Satellite View' : 'Street View'}`}
        >
          <Layers size={18} className="text-orange-400 group-hover:rotate-180 transition-transform duration-300" />
        </button>

        {/* 2. Direct to Exact Spot Icon */}
        <button
          onClick={directToExactSpot}
          className="w-11 h-11 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border border-orange-400/40 rounded-2xl shadow-[0_8px_25px_rgba(249,115,22,0.6)] backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          title="Direct to exact spot"
        >
          <Crosshair size={18} className="text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* 3. Admin Icon */}
        <button
          onClick={onOpenAdmin}
          className="w-11 h-11 bg-slate-900/95 hover:bg-slate-800 text-white border border-orange-500/40 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.75)] backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer group"
          title="Open Admin Portal"
        >
          <ShieldCheck size={18} className="text-orange-400 group-hover:scale-110 transition-transform duration-300" />
        </button>
      </div>

      {/* Zoom Controls at Bottom Center Corner (Icons Only) */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[1500] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 p-1.5 rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.7)] pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="p-2.5 text-white bg-slate-800 hover:bg-orange-600 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
          title="Zoom In"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 text-white bg-slate-800 hover:bg-orange-600 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
          title="Zoom Out"
        >
          <Minus size={18} />
        </button>
      </div>
    </div>
  );
}
