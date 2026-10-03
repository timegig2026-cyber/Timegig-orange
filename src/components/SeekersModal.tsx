import { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Briefcase, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Plus, 
  CheckCircle2, 
  Filter, 
  UserCheck, 
  Clock,
  Send
} from 'lucide-react';

interface Seeker {
  id: string;
  name: string;
  profession: string;
  category: string;
  rate: string;
  location: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  available: boolean;
  phone: string;
  email: string;
  skills: string[];
}

interface SeekersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocateOnMap?: (locationName: string) => void;
}

const CATEGORIES = ['All', 'Trades', 'Tech & Digital', 'Hospitality', 'Logistics', 'Services'];

const INITIAL_SEEKERS: Seeker[] = [];

export default function SeekersModal({ isOpen, onClose, onLocateOnMap }: SeekersModalProps) {
  const [seekers, setSeekers] = useState<Seeker[]>(() => {
    try {
      const saved = localStorage.getItem('gigs_seekers');
      if (saved) {
        const parsed = JSON.parse(saved);
        const clean = Array.isArray(parsed)
          ? parsed.filter((s: any) => 
              s && 
              !s.id?.startsWith('s-') && 
              s.id !== 'sample' && 
              !['Sipho Zulu', 'Naledi Mokoena', 'Kagiso Dlamini', 'Amina Patel', 'Johan Van Der Merwe'].includes(s.name)
            )
          : [];
        localStorage.setItem('gigs_seekers', JSON.stringify(clean));
        return clean;
      }
    } catch (e) {}
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // New Seeker Form State
  const [newSeekerName, setNewSeekerName] = useState('');
  const [newSeekerProfession, setNewSeekerProfession] = useState('');
  const [newSeekerCategory, setNewSeekerCategory] = useState('Trades');
  const [newSeekerRate, setNewSeekerRate] = useState('');
  const [newSeekerLocation, setNewSeekerLocation] = useState('');
  const [newSeekerPhone, setNewSeekerPhone] = useState('');
  const [newSeekerSkills, setNewSeekerSkills] = useState('');

  // Contact Drawer
  const [contactedSeeker, setContactedSeeker] = useState<Seeker | null>(null);

  // Reload latest seekers when opened
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('gigs_seekers');
        if (saved) {
          const parsed = JSON.parse(saved);
          const clean = Array.isArray(parsed)
            ? parsed.filter((s: any) => 
                s && 
                !s.id?.startsWith('s-') && 
                s.id !== 'sample' && 
                !['Sipho Zulu', 'Naledi Mokoena', 'Kagiso Dlamini', 'Amina Patel', 'Johan Van Der Merwe'].includes(s.name)
              )
            : [];
          setSeekers(clean);
          localStorage.setItem('gigs_seekers', JSON.stringify(clean));
        } else {
          setSeekers([]);
        }
      } catch (e) {}
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('gigs_seekers', JSON.stringify(seekers));
    } catch (e) {}
  }, [seekers]);

  if (!isOpen) return null;

  const handleRegisterSeeker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeekerName.trim() || !newSeekerProfession.trim()) return;

    const created: Seeker = {
      id: `seeker-${Date.now()}`,
      name: newSeekerName.trim(),
      profession: newSeekerProfession.trim(),
      category: newSeekerCategory,
      rate: newSeekerRate.trim() || 'Negotiable',
      location: newSeekerLocation.trim() || 'Local Area',
      distance: '0.5 km away',
      rating: 5.0,
      reviewsCount: 1,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      available: true,
      phone: newSeekerPhone.trim() || '+27',
      email: '',
      skills: newSeekerSkills ? newSeekerSkills.split(',').map(s => s.trim()).filter(Boolean) : ['Reliable', 'Experienced']
    };

    setSeekers(prev => [created, ...prev]);
    setIsRegistering(false);
    setNewSeekerName('');
    setNewSeekerProfession('');
    setNewSeekerRate('');
    setNewSeekerLocation('');
    setNewSeekerPhone('');
    setNewSeekerSkills('');
  };

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
    <div className="fixed inset-0 z-[3200] w-full h-[100dvh] bg-slate-950/98 backdrop-blur-2xl flex flex-col font-sans overflow-hidden animate-fadeIn text-slate-100">
      
      {/* Top Header */}
      <header className="w-full bg-slate-900 border-b border-orange-500/30 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wide text-white">Job Seekers & Talent</h2>
              <span className="text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                {seekers.length} Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Discover local gig workers, freelancers, and service providers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Post Profile</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close Seekers"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-5">
        
        {/* Search Bar & Filters */}
        <div className="space-y-3">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-3.5 text-orange-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skill, profession, name, or location..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-colors shadow-inner"
            />
          </div>

          {/* Category Chips */}
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

        {/* Register Seeker Form (Collapsible) */}
        {isRegistering && (
          <div className="bg-slate-900 border-2 border-orange-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                <UserCheck size={18} />
                <span>Register as a Gig Seeker</span>
              </div>
              <button 
                onClick={() => setIsRegistering(false)} 
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRegisterSeeker} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={newSeekerName}
                  onChange={(e) => setNewSeekerName(e.target.value)}
                  placeholder="e.g. Michael Tembo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Profession / Gig Title</label>
                <input
                  type="text"
                  required
                  value={newSeekerProfession}
                  onChange={(e) => setNewSeekerProfession(e.target.value)}
                  placeholder="e.g. Carpenter & Furniture Repair"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={newSeekerCategory}
                  onChange={(e) => setNewSeekerCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="Trades">Trades</option>
                  <option value="Tech & Digital">Tech & Digital</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Hourly / Gig Rate</label>
                <input
                  type="text"
                  value={newSeekerRate}
                  onChange={(e) => setNewSeekerRate(e.target.value)}
                  placeholder="e.g. R250/hr or R350/gig"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Location / Province</label>
                <input
                  type="text"
                  value={newSeekerLocation}
                  onChange={(e) => setNewSeekerLocation(e.target.value)}
                  placeholder="e.g. Sandton, Gauteng"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newSeekerPhone}
                  onChange={(e) => setNewSeekerPhone(e.target.value)}
                  placeholder="e.g. +27 82 000 0000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={newSeekerSkills}
                  onChange={(e) => setNewSeekerSkills(e.target.value)}
                  placeholder="e.g. Cabinetry, Polishing, On-site quotes"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-black text-xs shadow-lg hover:brightness-110 cursor-pointer transition-all"
                >
                  Publish Seeker Profile
                </button>
              </div>
            </form>
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
                {searchQuery ? 'No Matching Seekers Found' : 'No Job Seekers Yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {searchQuery 
                  ? 'Try searching with different keywords or clearing your active filters.'
                  : 'The job seekers talent directory is currently empty. Post your profile to be the first talent visible to clients in this area!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsRegistering(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  <span>Post Your Seeker Profile</span>
                </button>
              )}
            </div>
          ) : (
            filteredSeekers.map((seeker) => (
              <div 
                key={seeker.id}
                className="bg-slate-900 border border-slate-800 hover:border-orange-500/40 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all hover:scale-[1.01]"
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
                        <span className="text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                          {seeker.category}
                        </span>
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

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    seeker.available ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    <Clock size={12} />
                    <span>{seeker.available ? 'Available for work now' : 'Book in advance'}</span>
                  </span>

                  <button
                    onClick={() => setContactedSeeker(seeker)}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Phone size={13} />
                    <span>Contact Seeker</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Contact Seeker Modal */}
      {contactedSeeker && (
        <div 
          className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setContactedSeeker(null)}
        >
          <div 
            className="bg-slate-900 border border-orange-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img 
                  src={contactedSeeker.avatar} 
                  alt={contactedSeeker.name} 
                  className="w-12 h-12 rounded-2xl object-cover border border-orange-500"
                />
                <div>
                  <h4 className="text-sm font-black text-white">{contactedSeeker.name}</h4>
                  <p className="text-xs text-orange-400 font-bold">{contactedSeeker.profession}</p>
                </div>
              </div>
              <button 
                onClick={() => setContactedSeeker(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Phone:</span>
                <a 
                  href={`tel:${contactedSeeker.phone}`}
                  className="font-bold text-white hover:text-orange-400 flex items-center gap-1.5"
                >
                  <Phone size={14} className="text-emerald-400" />
                  <span>{contactedSeeker.phone}</span>
                </a>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Rate:</span>
                <span className="font-bold text-amber-400">{contactedSeeker.rate}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="font-bold text-white">{contactedSeeker.location}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a 
                href={`tel:${contactedSeeker.phone}`}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black text-center shadow-lg transition-all"
              >
                Call Now
              </a>
              <button 
                onClick={() => setContactedSeeker(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
