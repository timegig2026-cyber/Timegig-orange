import { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Briefcase, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Filter, 
  UserCheck, 
  Clock,
  Send,
  Zap,
  Power,
  Navigation,
  Check,
  AlertCircle,
  Eye,
  ChevronRight
} from 'lucide-react';
import SeekerDetailsModal from './SeekerDetailsModal';

export interface Seeker {
  id: string;
  name: string;
  middleName?: string;
  surname?: string;
  profession: string;
  category: string;
  rate: string;
  location: string;
  province?: string;
  address?: string;
  dateOfBirth?: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  available: boolean;
  phone: string;
  email: string;
  skills: string[];
  workLookingFor?: string;
  workTypes?: string[];
  socialLinks?: Array<{ platform: string; url: string }>;
  isCurrentUser?: boolean;
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

interface SeekersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocateOnMap?: (locationName: string) => void;
  onHireSeekerAndNavigate?: (trip: NavigationTrip) => void;
}

const CATEGORIES = ['All', 'Trades', 'Tech & Digital', 'Hospitality', 'Logistics', 'Services'];

export default function SeekersModal({ 
  isOpen, 
  onClose, 
  onLocateOnMap,
  onHireSeekerAndNavigate 
}: SeekersModalProps) {
  // On/Off button state for whether current user is available in Seekers
  const [isReadyForHire, setIsReadyForHire] = useState<boolean>(() => {
    return localStorage.getItem('user_is_available_seeker') === 'true';
  });

  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [selectedSeekerForDetails, setSelectedSeekerForDetails] = useState<Seeker | null>(null);

  // Hiring & Circular Loading State
  const [hiringSeeker, setHiringSeeker] = useState<Seeker | null>(null);
  const [hireProgress, setHireProgress] = useState(0);
  const [hireAccepted, setHireAccepted] = useState(false);

  // Helper to get or build user's seeker profile
  const getCurrentUserSeeker = (): Seeker => {
    let profile: any = {};
    try {
      const saved = localStorage.getItem('user_profile');
      if (saved) profile = JSON.parse(saved);
    } catch (e) {}

    // Fallback face photo from submissions if not in profile
    let avatar = profile.avatar || '';
    if (!avatar) {
      try {
        const savedSubs = localStorage.getItem('submissions');
        if (savedSubs) {
          const subs = JSON.parse(savedSubs);
          const match = subs.slice().reverse().find((s: any) => s.files && s.files.face);
          if (match && match.files.face) avatar = match.files.face;
        }
      } catch (e) {}
    }

    const fullName = [profile.name, profile.middleName, profile.surname].filter(Boolean).join(' ') || 'You (Ready to Hire)';
    const profession = profile.workLookingFor 
      ? profile.workLookingFor.substring(0, 45) 
      : (profile.skills?.[0] || 'Available Gig Specialist');
    const location = [profile.location, profile.province].filter(Boolean).join(', ') || 'Current GPS Spot';

    return {
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
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      available: true,
      phone: profile.contactNumber || localStorage.getItem('currentUserEmail') || '+27 82 000 0000',
      email: profile.email || localStorage.getItem('currentUserEmail') || '',
      skills: profile.skills?.length > 0 ? profile.skills : ['Reliable', 'Ready to Work', 'Direct Hire'],
      workLookingFor: profile.workLookingFor,
      workTypes: profile.workTypes,
      socialLinks: profile.socialLinks,
      isCurrentUser: true
    };
  };

  // Load and refresh seekers
  const refreshSeekers = () => {
    try {
      const saved = localStorage.getItem('gigs_seekers');
      let list: Seeker[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        list = Array.isArray(parsed)
          ? parsed.filter((s: any) => 
              s && 
              !s.id?.startsWith('s-') && 
              s.id !== 'sample' && 
              s.id !== 'current-user-seeker' &&
              !['Sipho Zulu', 'Naledi Mokoena', 'Kagiso Dlamini', 'Amina Patel', 'Johan Van Der Merwe'].includes(s.name)
            )
          : [];
      }

      // If user has ON state active, prepend the user seeker card
      const isUserOn = localStorage.getItem('user_is_available_seeker') === 'true';
      setIsReadyForHire(isUserOn);

      if (isUserOn) {
        const userSeeker = getCurrentUserSeeker();
        list = [userSeeker, ...list];
      }

      setSeekers(list);
    } catch (e) {
      setSeekers([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSeekers();
    }
  }, [isOpen]);

  // Toggle user ON/OFF in Seekers
  const handleToggleReadyForHire = () => {
    const nextState = !isReadyForHire;
    setIsReadyForHire(nextState);
    localStorage.setItem('user_is_available_seeker', nextState ? 'true' : 'false');

    if (nextState) {
      const userSeeker = getCurrentUserSeeker();
      setSeekers(prev => [userSeeker, ...prev.filter(s => s.id !== 'current-user-seeker')]);
      setToastMessage('Ready to Hire is ON! You now appear on the map & in Seekers.');
      window.dispatchEvent(new CustomEvent('seeker_ready_status_changed', { 
        detail: { isReadyForHire: true, seeker: userSeeker } 
      }));
    } else {
      setSeekers(prev => prev.filter(s => s.id !== 'current-user-seeker'));
      setToastMessage('Ready to Hire is OFF: You are removed from the map.');
      window.dispatchEvent(new CustomEvent('seeker_ready_status_changed', { 
        detail: { isReadyForHire: false } 
      }));
    }

    setTimeout(() => setToastMessage(''), 3500);
  };

  // Handle Hire Seeker click -> triggers Circular Loading
  const handleHireSeeker = (seeker: Seeker) => {
    setHiringSeeker(seeker);
    setHireProgress(0);
    setHireAccepted(false);

    // Circular loading simulation: 0 to 100% over 3.2 seconds
    const startTime = Date.now();
    const duration = 3200; // 3.2 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setHireProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setHireAccepted(true);

        // Female voice announcement upon seeker acceptance
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(`${seeker.name} accepted your gig booking. Navigation starting now.`);
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => 
              v.lang.startsWith('en') && 
              (v.name.toLowerCase().includes('female') || 
               v.name.toLowerCase().includes('samantha') || 
               v.name.toLowerCase().includes('zira') || 
               v.name.toLowerCase().includes('karen') || 
               v.name.toLowerCase().includes('victoria') || 
               v.name.toLowerCase().includes('google uk english female'))
            ) || voices.find(v => v.lang.startsWith('en'));

            if (femaleVoice) utterance.voice = femaleVoice;
            utterance.pitch = 1.15;
            utterance.rate = 0.98;
            window.speechSynthesis.speak(utterance);
          } catch (e) {}
        }

        // Direct to map after 1.5 seconds
        setTimeout(() => {
          if (onHireSeekerAndNavigate) {
            onHireSeekerAndNavigate({
              seeker: {
                id: seeker.id,
                name: seeker.name,
                profession: seeker.profession,
                avatar: seeker.avatar,
                phone: seeker.phone
              },
              destination: {
                lat: -26.2041,
                lng: 28.0473,
                name: 'Your Destination Location'
              }
            });
          }
          setHiringSeeker(null);
          setHireAccepted(false);
          setHireProgress(0);
          onClose();
        }, 1500);
      }
    }, 50);
  };

  if (!isOpen) return null;

  const filteredSeekers = seekers.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.skills.some(sk => sk.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesAvailable = !onlyAvailable || s.available;

    return matchesSearch && matchesCategory && matchesAvailable;
  });

  return (
    <div className="fixed inset-0 z-[3200] w-full h-[100dvh] bg-slate-950/98 backdrop-blur-2xl flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100 pb-16">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[3400] bg-emerald-600/90 text-white border border-emerald-400/50 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xl backdrop-blur-md animate-fadeIn flex items-center gap-2">
          <CheckCircle2 size={16} className="text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container without top bar */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-4 pt-5 sm:pt-6">
        
        {/* Search Bar & On/Off Ready to Hire Button Row */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search size={18} className="absolute left-3.5 text-orange-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skill, profession, or location..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-colors shadow-inner"
              />
            </div>

            {/* On / Off Button to appear in Seekers ready to be hired */}
            <button
              onClick={handleToggleReadyForHire}
              type="button"
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl border transition-all cursor-pointer shadow-lg shrink-0 select-none ${
                isReadyForHire
                  ? 'bg-emerald-600/90 hover:bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title={isReadyForHire ? 'Ready for Hire is ON - Tap to turn OFF' : 'Ready for Hire is OFF - Tap to appear in Seekers'}
            >
              {/* Toggle Switch Geometry */}
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative flex items-center ${
                isReadyForHire ? 'bg-emerald-950 justify-end' : 'bg-slate-700 justify-start'
              }`}>
                <div className={`w-3 h-3 rounded-full shadow-md transition-all ${
                  isReadyForHire ? 'bg-emerald-300' : 'bg-slate-400'
                }`} />
              </div>

              <div className="text-left leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider">Ready to Hire</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                    isReadyForHire ? 'bg-white text-emerald-800 font-extrabold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isReadyForHire ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 block">
                  {isReadyForHire ? 'Visible to Users' : 'Tap to Appear'}
                </span>
              </div>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="p-2.5 text-slate-400 hover:text-white rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer shrink-0"
              title="Close Seekers"
            >
              <X size={18} />
            </button>
          </div>

          {/* Category Chips & Filter */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Toggle Available Only */}
            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                onlyAvailable
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${onlyAvailable ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span>Available Now</span>
            </button>
          </div>
        </div>

        {/* Live Available Status Banner if User is ON */}
        {isReadyForHire && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">You are active & listed in Seekers. Clients can view and hire you right now.</span>
            </div>
            <button
              onClick={handleToggleReadyForHire}
              className="text-[11px] font-black underline hover:text-white shrink-0 cursor-pointer"
            >
              Turn OFF
            </button>
          </div>
        )}

        {/* Seekers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSeekers.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center flex flex-col items-center justify-center space-y-3 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                <Briefcase size={26} />
              </div>
              <h3 className="text-sm font-black text-white">
                {searchQuery ? 'No Matching Seekers Found' : 'No Job Seekers Available'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {searchQuery 
                  ? 'Try searching with different keywords.'
                  : 'Turn on the Ready to Hire button above to appear as the first available seeker in this area!'}
              </p>
              {!isReadyForHire && (
                <button
                  onClick={handleToggleReadyForHire}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Power size={14} />
                  <span>Turn ON & Appear in Seekers</span>
                </button>
              )}
            </div>
          ) : (
            filteredSeekers.map((seeker) => (
              <div 
                key={seeker.id}
                onClick={() => setSelectedSeekerForDetails(seeker)}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01] cursor-pointer hover:shadow-2xl ${
                  seeker.isCurrentUser 
                    ? 'border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-400' 
                    : 'border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img 
                        src={seeker.avatar} 
                        alt={seeker.name}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-orange-500/50 shadow-md"
                      />
                      {seeker.available && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-sm" title="Available now" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">{seeker.name}</h3>
                        {seeker.isCurrentUser ? (
                          <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            You (Ready)
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                            {seeker.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-orange-300 font-bold">{seeker.profession}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-orange-400" />
                          <span>{seeker.location}</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star size={12} fill="currentColor" />
                          <span>{seeker.rating} ({seeker.reviewsCount})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/30 block whitespace-nowrap">
                      {seeker.rate}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {seeker.distance}
                    </span>
                  </div>
                </div>

                {/* Skills Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                  {seeker.skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Action Buttons: View Details & HIRE NOW */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSeekerForDetails(seeker);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      title="View seeker profile & credentials"
                    >
                      <Eye size={12} className="text-emerald-400" />
                      <span>View Details</span>
                    </button>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      seeker.available ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      <Clock size={12} />
                      <span>{seeker.available ? 'Ready now' : 'Book ahead'}</span>
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHireSeeker(seeker);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg cursor-pointer transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  >
                    <Zap size={14} className="fill-white" />
                    <span>Hire Seeker</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Seeker Details Modal */}
      <SeekerDetailsModal
        seeker={selectedSeekerForDetails}
        isOpen={Boolean(selectedSeekerForDetails)}
        onClose={() => setSelectedSeekerForDetails(null)}
        onHireSeeker={(seeker) => {
          setSelectedSeekerForDetails(null);
          handleHireSeeker(seeker);
        }}
        onLocateOnMap={(seeker) => {
          setSelectedSeekerForDetails(null);
          if (onLocateOnMap) {
            onLocateOnMap(seeker.location || seeker.name);
          }
          onClose();
        }}
      />

      {/* Circle Loading Modal Waiting for Seeker to Accept */}
      {hiringSeeker && (
        <div className="fixed inset-0 z-[4500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-orange-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-6 relative overflow-hidden">
            
            {/* Background Accent Glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Animated Circular Progress Ring */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  className={`transition-all duration-150 ${
                    hireAccepted ? 'stroke-emerald-400' : 'stroke-orange-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray="326.7"
                  strokeDashoffset={326.7 - (326.7 * hireProgress) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              {/* Seeker Avatar Inside Circle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <img
                    src={hiringSeeker.avatar}
                    alt={hiringSeeker.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-slate-900 shadow-xl"
                  />
                  {hireAccepted ? (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg animate-bounce">
                      <Check size={16} className="text-white stroke-[3]" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg animate-spin">
                      <Clock size={13} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Headings */}
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white">
                {hireAccepted ? 'Gig Booking Accepted!' : 'Waiting for Seeker to Accept...'}
              </h3>
              
              <div className="text-xs text-slate-300">
                {hireAccepted ? (
                  <p className="text-emerald-400 font-bold">
                    {hiringSeeker.name} accepted your request! Directing to live GPS navigation on the map with voice guidance...
                  </p>
                ) : (
                  <p className="text-slate-400">
                    Transmitting gig request to <span className="text-white font-bold">{hiringSeeker.name}</span>. Reviewing your job location...
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Progress Indicator Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                <div 
                  className={`h-full transition-all duration-150 ${
                    hireAccepted ? 'bg-emerald-400' : 'bg-gradient-to-r from-orange-500 to-amber-400'
                  }`}
                  style={{ width: `${hireProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>{hireAccepted ? 'Accepted' : 'Connecting to GPS'}</span>
                <span>{hireProgress}%</span>
              </div>
            </div>

            {/* Cancel Request Button if Still Waiting */}
            {!hireAccepted && (
              <button
                onClick={() => {
                  setHiringSeeker(null);
                  setHireProgress(0);
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
              >
                Cancel Request
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
