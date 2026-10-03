import { useState, useEffect, useRef } from 'react';
import { User, Camera, Mail, Shield, Check, X, LogOut } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState({
    name: 'User',
    email: localStorage.getItem('currentUserEmail') || 'timegig2026@gmail.com',
    role: 'Member',
    avatar: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedSubs = localStorage.getItem('submissions');
        if (savedSubs) {
          const subs = JSON.parse(savedSubs);
          const match = subs.slice().reverse().find((s: any) => s.files && s.files.face);
          if (match && match.files.face) {
            setProfile(prev => ({ ...prev, avatar: match.files.face }));
          }
        }
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfile(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {}
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfile(prev => ({ ...prev, avatar: result }));
        // Save to submissions so OpenStreetMap picks it up
        try {
          const savedSubs = localStorage.getItem('submissions');
          const subs = savedSubs ? JSON.parse(savedSubs) : [];
          subs.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            files: { face: result }
          });
          localStorage.setItem('submissions', JSON.stringify(subs));
          localStorage.setItem('user_profile', JSON.stringify({ ...profile, avatar: result }));
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-orange-500/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-600/20 to-amber-600/20 border-b border-orange-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/30 rounded-xl text-orange-400">
              <User size={20} />
            </div>
            <h2 className="text-lg font-extrabold tracking-wide">User Profile</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar / Logo Upload */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full border-4 border-orange-500/80 overflow-hidden bg-slate-800 shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-orange-400" />
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1.5"
            >
              <Camera size={14} /> Change Profile Photo / Logo
            </button>
            <p className="text-[10px] text-slate-400 mt-1">This photo will appear on your exact map location pin</p>
          </div>

          {/* Details */}
          <div className="space-y-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-white bg-slate-900/80 px-3 py-2.5 rounded-xl border border-slate-700">
                <Mail size={16} className="text-orange-400" />
                <span>{profile.email}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</label>
              <div className="flex items-center justify-between mt-1 text-sm font-semibold text-white bg-slate-900/80 px-3 py-2.5 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-emerald-400" />
                  <span>Verified & Active GPS</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Online</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white py-3 rounded-2xl font-extrabold text-sm shadow-[0_4px_16px_rgba(249,115,22,0.4)] hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
            >
              Save & Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
