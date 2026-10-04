import { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Camera, 
  Mail, 
  Shield, 
  Check, 
  X, 
  CheckCircle2, 
  Phone, 
  MapPin, 
  Calendar, 
  Globe, 
  Plus, 
  Trash2, 
  Briefcase, 
  Sparkles, 
  Building2, 
  Share2, 
  ExternalLink,
  ChevronDown,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Info
} from 'lucide-react';
import { getApplications, ApplicationSubmission } from '../utils/applicationStorage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface UserProfileData {
  avatar: string;
  lastAvatarChangeTimestamp?: number; // Milliseconds timestamp of last avatar change (once a month restriction)
  isLocked?: boolean;                 // Whether profile is locked after editing
  name: string;
  middleName: string;
  surname: string;
  dateOfBirth: string;
  address: string;
  location: string;
  province: string;
  contactNumber: string;
  email: string;
  socialLinks: SocialLink[];
  skills: string[];
  workLookingFor: string;
  workTypes: string[];
  listedInSeekers: boolean;
  role: string;
}

export const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
];

export const POPULAR_SKILLS = [
  'Electrician',
  'Plumber',
  'Carpenter',
  'Web Developer',
  'Courier / Delivery Driver',
  'Housekeeper / Cleaner',
  'Painter',
  'Welder',
  'Gardener / Landscaper',
  'Graphic Designer',
  'Barista / Hospitality',
  'Tiler & Flooring',
  'Auto Mechanic',
  'Security Specialist'
];

export const WORK_PREFERENCES = [
  'Full-Time Gigs',
  'Part-Time Gigs',
  'Weekend Jobs',
  'Freelance & Contract',
  'Urgent / On-Demand Shifts',
  'Remote / Work from Home',
  'On-Site Physical Work'
];

export const SOCIAL_PLATFORMS = [
  'LinkedIn',
  'X (Twitter)',
  'Instagram',
  'Facebook',
  'GitHub',
  'TikTok',
  'YouTube',
  'Portfolio / Website',
  'WhatsApp Business',
  'Other'
];

// 30 Days in milliseconds (1 month)
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData>({
    avatar: '',
    lastAvatarChangeTimestamp: undefined,
    isLocked: false,
    name: '',
    middleName: '',
    surname: '',
    dateOfBirth: '',
    address: '',
    location: '',
    province: 'Gauteng',
    contactNumber: '',
    email: '',
    socialLinks: [],
    skills: [],
    workLookingFor: '',
    workTypes: [],
    listedInSeekers: false,
    role: 'Member'
  });

  const [approvedApp, setApprovedApp] = useState<ApplicationSubmission | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [lockAlertMessage, setLockAlertMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile or fallbacks on open
  useEffect(() => {
    if (!isOpen) return;

    try {
      // 1. Check approval status
      const apps = getApplications();
      const approved = apps.find(a => a.status === 'approved' || a.popStatus === 'pop_verified');
      setApprovedApp(approved || null);

      // 2. Load stored profile
      const savedProfile = localStorage.getItem('user_profile');
      let loadedProfile: Partial<UserProfileData> = {};
      if (savedProfile) {
        try {
          loadedProfile = JSON.parse(savedProfile);
        } catch (e) {}
      }

      // 3. Fallback face photo from submissions if not in profile
      let avatar = loadedProfile.avatar || '';
      if (!avatar) {
        const savedSubs = localStorage.getItem('submissions');
        if (savedSubs) {
          const subs = JSON.parse(savedSubs);
          const match = subs.slice().reverse().find((s: any) => s.files && s.files.face);
          if (match && match.files.face) {
            avatar = match.files.face;
          }
        }
      }

      // 4. Fallback email & contact info
      const fallbackEmail = loadedProfile.email || localStorage.getItem('currentUserEmail') || '';
      
      // If user had applied earlier, use application details as default if blank
      let name = loadedProfile.name || '';
      let surname = loadedProfile.surname || '';
      let contactNumber = loadedProfile.contactNumber || '';

      if (!name && apps.length > 0) {
        const latestApp = apps[0];
        if (latestApp.fullName) {
          const parts = latestApp.fullName.trim().split(' ');
          name = parts[0] || '';
          if (parts.length > 1) {
            surname = parts.slice(1).join(' ');
          }
        }
        if (!contactNumber && latestApp.phone) {
          contactNumber = latestApp.phone;
        }
      }

      setProfile(prev => ({
        ...prev,
        ...loadedProfile,
        avatar: avatar || prev.avatar,
        lastAvatarChangeTimestamp: loadedProfile.lastAvatarChangeTimestamp,
        isLocked: loadedProfile.isLocked ?? false,
        email: fallbackEmail,
        name: name || prev.name,
        surname: surname || prev.surname,
        contactNumber: contactNumber || prev.contactNumber,
        socialLinks: Array.isArray(loadedProfile.socialLinks) ? loadedProfile.socialLinks : [],
        skills: Array.isArray(loadedProfile.skills) ? loadedProfile.skills : [],
        workTypes: Array.isArray(loadedProfile.workTypes) ? loadedProfile.workTypes : [],
        province: loadedProfile.province || 'Gauteng'
      }));
    } catch (e) {
      console.error('Error loading profile', e);
    }
  }, [isOpen]);

  // Calculate if profile picture can be changed (once a month restriction)
  const now = Date.now();
  const lastChange = profile.lastAvatarChangeTimestamp || 0;
  const timeSinceLastChange = now - lastChange;
  const isAvatarChangeAllowed = !profile.lastAvatarChangeTimestamp || timeSinceLastChange >= ONE_MONTH_MS;
  const daysRemaining = Math.max(1, Math.ceil((ONE_MONTH_MS - timeSinceLastChange) / (24 * 60 * 60 * 1000)));
  const nextEligibleDate = new Date(lastChange + ONE_MONTH_MS).toLocaleDateString('en-ZA', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Handle clicking on avatar upload
  const handleAvatarClick = () => {
    if (profile.isLocked) {
      setLockAlertMessage('Profile is currently locked. Click "Unlock to Edit" to modify your profile.');
      setTimeout(() => setLockAlertMessage(''), 4000);
      return;
    }
    if (!isAvatarChangeAllowed) {
      setLockAlertMessage(`Profile picture / logo can only be changed once a month. Next change available in ${daysRemaining} day(s) on ${nextEligibleDate}.`);
      setTimeout(() => setLockAlertMessage(''), 4500);
      return;
    }
    fileInputRef.current?.click();
  };

  // Handle avatar photo upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (profile.isLocked) {
        setLockAlertMessage('Profile is locked.');
        return;
      }
      if (!isAvatarChangeAllowed) {
        setLockAlertMessage(`Profile picture / logo can only be changed once a month.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const updatedTime = Date.now();
        const updated = {
          ...profile,
          avatar: result,
          lastAvatarChangeTimestamp: updatedTime
        };
        setProfile(updated);

        // Save to submissions so Leaflet OpenStreetMap picks up the live face pin
        try {
          const savedSubs = localStorage.getItem('submissions');
          const subs = savedSubs ? JSON.parse(savedSubs) : [];
          subs.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            files: { face: result }
          });
          localStorage.setItem('submissions', JSON.stringify(subs));
          localStorage.setItem('user_profile', JSON.stringify(updated));
        } catch (err) {}

        setSaveSuccessMessage('Profile photo updated! (Next change available in 30 days)');
        setTimeout(() => setSaveSuccessMessage(''), 3500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add a new social media link
  const handleAddSocialLink = () => {
    if (profile.isLocked) {
      setLockAlertMessage('Profile is locked. Unlock to edit social media links.');
      setTimeout(() => setLockAlertMessage(''), 3000);
      return;
    }
    const newLink: SocialLink = {
      id: `social-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      platform: 'LinkedIn',
      url: ''
    };
    setProfile(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, newLink]
    }));
  };

  // Update a social media link
  const handleUpdateSocialLink = (id: string, field: 'platform' | 'url', value: string) => {
    if (profile.isLocked) return;
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  };

  // Remove a social media link
  const handleRemoveSocialLink = (id: string) => {
    if (profile.isLocked) {
      setLockAlertMessage('Profile is locked. Unlock to remove links.');
      setTimeout(() => setLockAlertMessage(''), 3000);
      return;
    }
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter(l => l.id !== id)
    }));
  };

  // Add custom skill
  const handleAddSkill = (skillToAdd?: string) => {
    if (profile.isLocked) {
      setLockAlertMessage('Profile is locked. Unlock to add skills.');
      setTimeout(() => setLockAlertMessage(''), 3000);
      return;
    }
    const val = (skillToAdd || skillInput).trim();
    if (!val) return;
    if (!profile.skills.includes(val)) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, val]
      }));
    }
    setSkillInput('');
  };

  // Remove skill
  const handleRemoveSkill = (skillToRemove: string) => {
    if (profile.isLocked) {
      setLockAlertMessage('Profile is locked. Unlock to remove skills.');
      setTimeout(() => setLockAlertMessage(''), 3000);
      return;
    }
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  // Toggle work type preference
  const handleToggleWorkType = (type: string) => {
    if (profile.isLocked) {
      setLockAlertMessage('Profile is locked. Unlock to change work preferences.');
      setTimeout(() => setLockAlertMessage(''), 3000);
      return;
    }
    setProfile(prev => {
      const exists = prev.workTypes.includes(type);
      return {
        ...prev,
        workTypes: exists 
          ? prev.workTypes.filter(t => t !== type)
          : [...prev.workTypes, type]
      };
    });
  };

  // Save profile helper
  const saveProfileData = (lockedState: boolean) => {
    try {
      const updatedProfile = {
        ...profile,
        isLocked: lockedState
      };
      setProfile(updatedProfile);
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      if (profile.email) {
        localStorage.setItem('currentUserEmail', profile.email);
      }

      // Only sync to seekers if user explicitly turned on listedInSeekers and provided details
      if (profile.listedInSeekers && (profile.name || profile.surname)) {
        try {
          const fullName = [profile.name, profile.middleName, profile.surname].filter(Boolean).join(' ');
          const savedSeekers = localStorage.getItem('gigs_seekers');
          const seekersList = savedSeekers ? JSON.parse(savedSeekers) : [];
          
          const userSeekerIdx = seekersList.findIndex((s: any) => s.id === 'user-profile-seeker');
          const seekerData = {
            id: 'user-profile-seeker',
            name: fullName || 'Local Talent',
            profession: profile.workLookingFor ? profile.workLookingFor.substring(0, 45) : (profile.skills[0] || 'Gig Worker'),
            category: 'Services',
            rate: 'Negotiable',
            location: [profile.location, profile.province].filter(Boolean).join(', ') || 'Local Area',
            distance: '0.1 km away',
            rating: 5.0,
            reviewsCount: 1,
            avatar: profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
            available: true,
            phone: profile.contactNumber || '',
            email: profile.email || '',
            skills: profile.skills.length > 0 ? profile.skills : ['Reliable', 'Prompt']
          };

          if (userSeekerIdx >= 0) {
            seekersList[userSeekerIdx] = seekerData;
          } else {
            seekersList.unshift(seekerData);
          }
          localStorage.setItem('gigs_seekers', JSON.stringify(seekersList));
        } catch (e) {}
      }

      window.dispatchEvent(new Event('user_profile_updated'));
      return true;
    } catch (err) {
      console.error('Failed to save profile', err);
      return false;
    }
  };

  // Action: Save profile and keep editing
  const handleSaveOnly = () => {
    if (saveProfileData(false)) {
      setSaveSuccessMessage('Profile saved successfully!');
      setTimeout(() => setSaveSuccessMessage(''), 2500);
    }
  };

  // Action: Finish Editing and Lock Profile
  const handleFinishEditingAndLock = () => {
    if (saveProfileData(true)) {
      setSaveSuccessMessage('Profile finished and locked! Your details are safely secured.');
      setTimeout(() => setSaveSuccessMessage(''), 3500);
    }
  };

  // Action: Unlock Profile to edit
  const handleUnlockProfile = () => {
    const updated = { ...profile, isLocked: false };
    setProfile(updated);
    try {
      localStorage.setItem('user_profile', JSON.stringify(updated));
    } catch (e) {}
    setSaveSuccessMessage('Profile unlocked for editing.');
    setTimeout(() => setSaveSuccessMessage(''), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-orange-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[92dvh] overflow-hidden text-white font-sans">
        
        {/* Header with Lock Status */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-gradient-to-r from-orange-600/20 via-amber-600/15 to-transparent border-b border-orange-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/30 rounded-xl text-orange-400 border border-orange-500/30">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide">User Profile</h2>
                
                {/* Profile Lock Status Badge */}
                {profile.isLocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Lock size={11} />
                    Profile Locked
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    <Unlock size={11} />
                    Edit Mode
                  </span>
                )}

                {approvedApp && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 size={11} />
                    Approved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {profile.isLocked 
                  ? 'Your profile is locked against accidental changes' 
                  : 'Editing mode — update your details and click Finish & Lock'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile.isLocked ? (
              <button
                type="button"
                onClick={handleUnlockProfile}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Unlock profile to edit"
              >
                <Unlock size={13} />
                <span>Unlock to Edit</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishEditingAndLock}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Finish editing and lock profile"
              >
                <Lock size={13} />
                <span>Lock Profile</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Profile"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Lock Alert / Restriction Warning */}
        {lockAlertMessage && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 px-5 py-2.5 flex items-center justify-between animate-fadeIn text-amber-300 text-xs font-bold">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <span>{lockAlertMessage}</span>
            </div>
            <button onClick={() => setLockAlertMessage('')} className="text-amber-400 hover:text-amber-200">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {saveSuccessMessage && (
          <div className="bg-emerald-600/20 border-b border-emerald-500/40 px-5 py-2.5 flex items-center justify-between animate-fadeIn text-emerald-300 text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button onClick={() => setSaveSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* 1. Avatar Photo (Face Only - Once a Month Restriction & Lock) */}
          <div className={`flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl border transition-all ${
            profile.isLocked 
              ? 'bg-slate-800/20 border-slate-700/40' 
              : 'bg-slate-800/40 border-slate-700/60'
          }`}>
            <div 
              className={`relative group ${
                profile.isLocked || !isAvatarChangeAllowed ? 'cursor-not-allowed' : 'cursor-pointer'
              }`} 
              onClick={handleAvatarClick}
            >
              <div className={`w-24 h-24 rounded-full border-4 overflow-hidden bg-slate-800 shadow-[0_0_20px_rgba(249,115,22,0.35)] flex items-center justify-center transition-all ${
                profile.isLocked || !isAvatarChangeAllowed 
                  ? 'border-slate-600 opacity-90' 
                  : 'border-orange-500/80 hover:border-orange-400'
              }`}>
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={42} className="text-orange-400/80" />
                )}
              </div>
              
              {/* Overlay Icon */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {profile.isLocked ? (
                  <Lock size={24} className="text-amber-400 drop-shadow" />
                ) : !isAvatarChangeAllowed ? (
                  <Clock size={24} className="text-amber-400 drop-shadow" />
                ) : (
                  <Camera size={24} className="text-white drop-shadow" />
                )}
              </div>

              {/* Status Pip */}
              <div className={`absolute bottom-0 right-0 p-1.5 rounded-full border-2 border-slate-900 shadow-md ${
                profile.isLocked || !isAvatarChangeAllowed ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
              }`}>
                {profile.isLocked || !isAvatarChangeAllowed ? <Lock size={12} /> : <Camera size={12} />}
              </div>
            </div>
            
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-sm font-black text-white">Profile Picture / Logo</h3>
                
                {/* Once a Month Tag */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  isAvatarChangeAllowed 
                    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' 
                    : 'text-amber-400 bg-amber-400/10 border-amber-400/30'
                }`}>
                  <Clock size={11} />
                  <span>Once a Month Policy</span>
                </span>

                <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-md border border-orange-400/30">
                  Live GPS Pin
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Face photo appears on your live map location pin. Users can only update their profile picture logo <strong>once a month</strong>.
              </p>

              {/* Monthly Policy Countdown or Availability */}
              <div className="pt-1">
                {profile.isLocked ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-slate-400 font-semibold">
                    <Lock size={13} className="text-amber-400" />
                    <span>Profile locked. Unlock to change picture.</span>
                  </div>
                ) : !isAvatarChangeAllowed ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-bold">
                    <Clock size={14} className="text-amber-400 shrink-0" />
                    <span>Photo change available in {daysRemaining} days (on {nextEligibleDate})</span>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={handleAvatarClick}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    <Camera size={14} />
                    <span>{profile.avatar ? 'Change Profile Photo / Logo' : 'Upload Profile Photo / Logo'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Locked Notice Banner */}
          {profile.isLocked && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-300 font-medium">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-400 shrink-0" />
                <span>Your profile is currently locked. Fields are in read-only mode to prevent accidental changes.</span>
              </div>
              <button
                type="button"
                onClick={handleUnlockProfile}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shrink-0 cursor-pointer shadow transition-all"
              >
                Unlock
              </button>
            </div>
          )}

          {/* 2. Personal Identity: Name, Middle Name (Optional), Surname, Date of Birth */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
              <User size={16} className="text-orange-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Name <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={profile.isLocked}
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sipho"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    profile.isLocked 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Middle Name <span className="text-slate-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  disabled={profile.isLocked}
                  value={profile.middleName}
                  onChange={(e) => setProfile(prev => ({ ...prev, middleName: e.target.value }))}
                  placeholder="Optional middle name"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    profile.isLocked 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Surname <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={profile.isLocked}
                  value={profile.surname}
                  onChange={(e) => setProfile(prev => ({ ...prev, surname: e.target.value }))}
                  placeholder="e.g. Khumalo"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    profile.isLocked 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                  }`}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
                <input
                  type="date"
                  disabled={profile.isLocked}
                  value={profile.dateOfBirth}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className={`w-full border rounded-xl pl-11 pr-4 py-2.5 text-xs text-white focus:outline-none transition-colors [color-scheme:dark] ${
                    profile.isLocked 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 3. Address, Location & Province */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
              <MapPin size={16} className="text-orange-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Address & Geographic Details</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Address
                </label>
                <input
                  type="text"
                  disabled={profile.isLocked}
                  value={profile.address}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. 14 Main Street, Apartment 4B"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    profile.isLocked 
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                      : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Location / City / Suburb
                  </label>
                  <input
                    type="text"
                    disabled={profile.isLocked}
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Sandton, Johannesburg"
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      profile.isLocked 
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                        : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Province
                  </label>
                  <div className="relative">
                    <select
                      disabled={profile.isLocked}
                      value={profile.province}
                      onChange={(e) => setProfile(prev => ({ ...prev, province: e.target.value }))}
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors appearance-none pr-9 ${
                        profile.isLocked 
                          ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                          : 'bg-slate-950 border-slate-700 focus:border-orange-500 cursor-pointer'
                      }`}
                    >
                      {SA_PROVINCES.map((prov) => (
                        <option key={prov} value={prov} className="bg-slate-900 text-white">
                          {prov}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Contact Details: Phone & Email */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
              <Phone size={16} className="text-orange-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Contact Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Contact Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
                  <input
                    type="tel"
                    disabled={profile.isLocked}
                    value={profile.contactNumber}
                    onChange={(e) => setProfile(prev => ({ ...prev, contactNumber: e.target.value }))}
                    placeholder="e.g. +27 82 123 4567"
                    className={`w-full border rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      profile.isLocked 
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                        : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
                  <input
                    type="email"
                    disabled={profile.isLocked}
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. name@example.com"
                    className={`w-full border rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      profile.isLocked 
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                        : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Social Media Links (User can add more links) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-orange-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Social Media Links</h3>
              </div>
              {!profile.isLocked && (
                <button
                  type="button"
                  onClick={handleAddSocialLink}
                  className="flex items-center gap-1 px-2.5 py-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Social Link</span>
                </button>
              )}
            </div>

            {profile.socialLinks.length === 0 ? (
              <div className="p-4 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                <Globe size={24} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">No social media links added yet.</p>
                {!profile.isLocked && (
                  <button
                    type="button"
                    onClick={handleAddSocialLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus size={14} className="text-orange-400" />
                    <span>Add First Link (LinkedIn, X, Instagram, etc.)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {profile.socialLinks.map((link) => (
                  <div 
                    key={link.id} 
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl"
                  >
                    <div className="sm:w-44 shrink-0">
                      <select
                        disabled={profile.isLocked}
                        value={link.platform}
                        onChange={(e) => handleUpdateSocialLink(link.id, 'platform', e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 text-xs text-orange-400 font-bold focus:outline-none ${
                          profile.isLocked ? 'bg-slate-950/60 border-slate-800 cursor-not-allowed' : 'bg-slate-900 border-slate-700 focus:border-orange-500'
                        }`}
                      >
                        {SOCIAL_PLATFORMS.map((plat) => (
                          <option key={plat} value={plat}>
                            {plat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex-1 relative">
                      <input
                        type="text"
                        disabled={profile.isLocked}
                        value={link.url}
                        onChange={(e) => handleUpdateSocialLink(link.id, 'url', e.target.value)}
                        placeholder={`Enter ${link.platform} link or username...`}
                        className={`w-full border rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                          profile.isLocked ? 'bg-slate-950/60 border-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-900 border-slate-700 focus:border-orange-500'
                        }`}
                      />
                    </div>

                    {!profile.isLocked && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialLink(link.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer self-end sm:self-center"
                        title="Remove Link"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Skills */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
              <Sparkles size={16} className="text-orange-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Skills</h3>
            </div>

            {/* Input to type custom skill */}
            {!profile.isLocked && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Type a skill (e.g. Residential Wiring, Graphic Design) and press Enter..."
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill()}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  Add Skill
                </button>
              </div>
            )}

            {/* Active Skills Badges */}
            {profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-xl text-xs font-bold"
                  >
                    <span>{skill}</span>
                    {!profile.isLocked && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-400 p-0.5 rounded-full transition-colors cursor-pointer"
                        title="Remove skill"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-2">No skills added yet.</div>
            )}

            {/* Quick suggested skills chips (Only in edit mode) */}
            {!profile.isLocked && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                  Popular suggestions (click to add):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map((item) => {
                    const alreadyAdded = profile.skills.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleAddSkill(item)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          alreadyAdded
                            ? 'bg-slate-800/60 text-slate-500 border-slate-800 cursor-not-allowed'
                            : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-orange-500/50 hover:bg-slate-800'
                        }`}
                      >
                        + {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 7. Looking for what type of work on the app */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
              <Briefcase size={16} className="text-orange-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Looking for What Type of Work on the App
              </h3>
            </div>

            {/* Work Preference Tags */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Gig / Job Work Preferences
              </label>
              <div className="flex flex-wrap gap-2">
                {WORK_PREFERENCES.map((pref) => {
                  const isSelected = profile.workTypes.includes(pref);
                  return (
                    <button
                      key={pref}
                      type="button"
                      disabled={profile.isLocked}
                      onClick={() => handleToggleWorkType(pref)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        profile.isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {isSelected ? <Check size={12} className="stroke-[3]" /> : <Plus size={12} />}
                      <span>{pref}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Description / Target Roles */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Describe the specific work, services, or gigs you are looking for
              </label>
              <textarea
                rows={3}
                disabled={profile.isLocked}
                value={profile.workLookingFor}
                onChange={(e) => setProfile(prev => ({ ...prev, workLookingFor: e.target.value }))}
                placeholder="e.g. Seeking urgent electrical call-outs, solar maintenance projects, or certified domestic wiring jobs around Sandton and Johannesburg North..."
                className={`w-full border rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors resize-none ${
                  profile.isLocked 
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 cursor-not-allowed' 
                    : 'bg-slate-950 border-slate-700 focus:border-orange-500'
                }`}
              />
            </div>
          </div>

          {/* Account Status Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${approvedApp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {approvedApp ? <CheckCircle2 size={18} /> : <Shield size={18} />}
              </div>
              <div>
                <p className="text-xs font-black text-white">
                  {approvedApp 
                    ? (approvedApp.type === 'tenant' ? 'Verified & Approved Tenant' : 'Verified & Approved Subscriber')
                    : 'Standard Member & GPS Active'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {approvedApp 
                    ? 'Eligible for passive income payouts and instant gig bookings'
                    : 'Submit verification in Activation tab to unlock passive monthly earnings'}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
              approvedApp ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}>
              {approvedApp ? 'Verified' : 'Member'}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {profile.isLocked ? (
              <button
                type="button"
                onClick={handleUnlockProfile}
                className="py-2.5 px-5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Unlock size={15} />
                <span>Unlock to Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSaveOnly}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={handleFinishEditingAndLock}
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock size={15} />
                  <span>Finish Editing & Lock</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
