import { useState, useEffect } from 'react';
import { 
  UserSearch, 
  Briefcase, 
  Building2, 
  FileText, 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  Coins, 
  Users, 
  Check, 
  X, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Eye, 
  Link as LinkIcon, 
  Lock, 
  CheckCircle2, 
  MoreVertical, 
  SlidersHorizontal, 
  LogOut, 
  Upload, 
  ShieldCheck,
  Award
} from 'lucide-react';
import OpenStreetMap from './components/OpenStreetMap';
import { RealisticSeekersIcon, RealisticGigsIcon, RealisticTenantIcon } from './components/RealisticIcons';

type SubscriptionType = 'tenant' | 'user' | null;
type Submission = { id: string; type: SubscriptionType; status: 'pending' | 'approved' | 'rejected'; files: { face?: string; idDoc?: string; pop?: string } };

interface ProfileData {
  name: string;
  middleName?: string;
  surname: string;
  dob: string;
  address: string;
  location: string;
  province: string;
  contactNumber: string;
  email: string;
  socialLinks: string[];
}

const defaultProfile: ProfileData = {
  name: '',
  middleName: '',
  surname: '',
  dob: '',
  address: '',
  location: '',
  province: '',
  contactNumber: '',
  email: '',
  socialLinks: []
};

type ViewMode = 'seekers' | 'gigs' | 'activation' | 'profile' | 'tenant-portal';

export default function App() {
  const [view, setView] = useState<ViewMode>('seekers');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'submissions'>('overview');

  // --- Local Storage Persisted State ---
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('submissions');
    return saved ? JSON.parse(saved) : [];
  });

  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('profileData');
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  const [isProfileLocked, setIsProfileLocked] = useState<boolean>(() => {
    return localStorage.getItem('isProfileLocked') === 'true';
  });

  // Global subscription prices set by Admin
  const [tenantSubPrice, setTenantSubPrice] = useState<number>(() => {
    const saved = localStorage.getItem('tenantSubPrice');
    return saved ? Number(saved) : 299.99;
  });

  const [userSubPrice, setUserSubPrice] = useState<number>(() => {
    const saved = localStorage.getItem('userSubPrice');
    return saved ? Number(saved) : 29.99;
  });

  const [shareLink, setShareLink] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<SubscriptionType>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Live draft uploads for real-time preview
  const [draftFace, setDraftFace] = useState<string | null>(null);
  const [draftIdDoc, setDraftIdDoc] = useState<string | null>(null);
  const [draftPop, setDraftPop] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  // Tenant-specific Submissions & Pricing State
  const [tenantSubTab, setTenantSubTab] = useState<'overview' | 'submissions' | 'referral'>('overview');
  const [tenantUserPrice, setTenantUserPrice] = useState<number>(35.00);
  const [tenantSubUsers, setTenantSubUsers] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('tenantSubUsers');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'user', status: 'approved', files: { face: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' } },
      { id: '2', type: 'user', status: 'pending', files: { face: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' } }
    ];
  });

  const [newSocial, setNewSocial] = useState('');

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('profileData', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('isProfileLocked', String(isProfileLocked));
  }, [isProfileLocked]);

  useEffect(() => {
    localStorage.setItem('tenantSubUsers', JSON.stringify(tenantSubUsers));
  }, [tenantSubUsers]);

  useEffect(() => {
    localStorage.setItem('tenantSubPrice', String(tenantSubPrice));
  }, [tenantSubPrice]);

  useEffect(() => {
    localStorage.setItem('userSubPrice', String(userSubPrice));
  }, [userSubPrice]);

  const generateLink = () => setShareLink(`${window.location.origin}/activate?ref=${Math.random().toString(36).substring(7)}`);

  const handleLocalFileRead = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitTenant = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setSubmissions(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'tenant',
          status: 'pending',
          files: { face: draftFace || undefined, idDoc: draftIdDoc || undefined }
        }
      ]);
      setDraftFace(null);
      setDraftIdDoc(null);
      setIsSubmitting(false);
      setSelectedSub(null);
      setIsReviewing(true);
    }, 2000);
  };

  const submitUser = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setSubmissions(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'user',
          status: 'pending',
          files: { pop: draftPop || undefined }
        }
      ]);
      setDraftPop(null);
      setIsSubmitting(false);
      setSelectedSub(null);
      setIsReviewing(true);
    }, 2000);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out? This will reset your current session.")) {
      localStorage.clear();
      setSubmissions([]);
      setProfile(defaultProfile);
      setIsProfileLocked(false);
      setView('seekers');
      setIsMenuOpen(false);
    }
  };

  // Approved and Pending status checks
  const approvedSubmission = submissions.find(s => s.status === 'approved');
  const pendingSubmission = submissions.find(s => s.status === 'pending');
  const hasApprovedSubmission = !!approvedSubmission;
  const isTenantApproved = submissions.some(s => s.type === 'tenant' && s.status === 'approved');

  // Find latest uploaded face image for Profile logo
  const latestFaceImage = submissions.find(s => s.files.face)?.files.face || draftFace;

  // Gather uploaded ID documents across submissions
  const idDocuments = submissions
    .map(s => s.files.idDoc)
    .filter((doc): doc is string => !!doc);

  const addSocialLink = () => {
    if (newSocial.trim()) {
      setProfile(prev => ({
        ...prev,
        socialLinks: [...prev.socialLinks, newSocial.trim()]
      }));
      setNewSocial('');
    }
  };

  const removeSocialLink = (index: number) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const handleDownload = (imgUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Profit calculations
  const approvedUsersCount = tenantSubUsers.filter(u => u.status === 'approved').length;
  const userProfitBalance = approvedUsersCount * tenantUserPrice;
  const netProfit = userProfitBalance - tenantSubPrice;

  if (isAdminOpen) {
    return (
      <div className="min-h-screen bg-orange-50 text-slate-900 font-sans flex flex-col">
        <header className="p-3 border-b border-orange-200 bg-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
            <LayoutDashboard size={18} />
            <span>Job Opportunities Portal Dashboard</span>
          </div>
          <button onClick={() => setIsAdminOpen(false)} className="text-xs font-bold text-orange-800 bg-orange-100 px-2.5 py-1 rounded-full shadow-sm hover:bg-orange-200">Close Admin</button>
        </header>
        <main className="flex-1 p-4 space-y-4">
          {activeAdminTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-gradient-to-b from-white to-orange-50/50 p-4 rounded-2xl border-2 border-orange-200 space-y-2 shadow-[0_8px_16px_rgba(234,88,12,0.12)]">
                <h3 className="font-extrabold text-orange-950 text-sm flex items-center gap-1.5"><LinkIcon size={14} className="text-orange-600"/> Referral Control</h3>
                <button onClick={generateLink} className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-4 py-2 rounded-full font-bold text-xs shadow-[0_4px_12px_rgba(234,88,12,0.3)] active:translate-y-0.5">Generate Map Link</button>
                {shareLink && <p className="text-xs break-all bg-orange-50 p-2.5 rounded-xl border border-orange-200 font-mono">{shareLink}</p>}
              </div>

              <div className="bg-gradient-to-b from-white to-orange-50/50 p-4 rounded-2xl border-2 border-orange-200 space-y-3 shadow-[0_8px_16px_rgba(234,88,12,0.12)]">
                <div className="flex items-center gap-2 border-b border-orange-100 pb-1.5">
                  <SlidersHorizontal className="text-orange-600" size={16} />
                  <h3 className="font-extrabold text-orange-950 text-sm">Global Subscription Fee Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider block">Tenant Subscription Fee (R)</label>
                    <input 
                      type="number" 
                      value={tenantSubPrice} 
                      onChange={(e) => setTenantSubPrice(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-orange-200 rounded-lg font-bold text-orange-900 outline-none shadow-inner" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase tracking-wider block">User Subscription Fee (R)</label>
                    <input 
                      type="number" 
                      value={userSubPrice} 
                      onChange={(e) => setUserSubPrice(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-orange-200 rounded-lg font-bold text-orange-900 outline-none shadow-inner" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeAdminTab === 'submissions' && (
            <div className="space-y-3">
              {submissions.map(s => (
                <div key={s.id} className="p-3 border-2 border-orange-200 rounded-xl bg-white space-y-1.5 text-xs shadow-sm">
                  <p className="font-bold text-orange-800 uppercase tracking-wide">Type: {s.type}</p>
                  <p className="font-semibold">Status: <span className={`capitalize ${s.status === 'approved' ? 'text-emerald-600' : s.status === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}>{s.status}</span></p>
                  <div className="flex gap-2 flex-wrap py-1">
                    {Object.entries(s.files).map(([key, val]) => (
                      <div key={key} className="relative group">
                        <img src={val as string} alt={key} className="w-16 h-16 object-cover cursor-pointer rounded-lg border-2 border-orange-200 shadow-sm" onClick={() => setSelectedImage(val as string)} />
                        <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[7px] px-1 rounded capitalize">{key}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setSubmissions(prev => prev.map(sub => sub.id === s.id ? {...sub, status: 'approved'} : sub))} className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm"><Check size={12}/> Approve</button>
                    <button onClick={() => setSubmissions(prev => prev.map(sub => sub.id === s.id ? {...sub, status: 'rejected'} : sub))} className="bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm"><X size={12}/> Reject</button>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <p className="text-slate-400 italic text-center py-6 text-xs">No submissions to show yet.</p>}
            </div>
          )}
        </main>
        {selectedImage && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setSelectedImage(null)}><img src={selectedImage} alt="Full Screen" className="max-w-full max-h-full rounded-lg" /></div>)}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 p-2 flex justify-around"><button onClick={() => setActiveAdminTab('overview')} className={activeAdminTab === 'overview' ? 'font-bold text-orange-600 text-xs' : 'text-slate-500 text-xs'}>Overview</button><button onClick={() => setActiveAdminTab('submissions')} className={activeAdminTab === 'submissions' ? 'font-bold text-orange-600 text-xs' : 'text-slate-500 text-xs'}>Submissions</button></footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 text-slate-900 font-sans flex flex-col pb-16 relative" onClick={() => setIsMenuOpen(false)}>
      {/* Floating 4D Dropdown Menu Button (Top-Right) */}
      <div className="fixed top-3 right-3 z-30" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="p-2.5 bg-gradient-to-b from-white via-orange-50 to-orange-100 border-2 border-white/80 text-orange-900 rounded-full shadow-[0_6px_16px_rgba(234,88,12,0.25),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:scale-105 transition-all active:scale-95 flex items-center justify-center"
          aria-label="Menu"
        >
          <SlidersHorizontal size={18} className="text-orange-600 filter drop-shadow-[0_2px_4px_rgba(234,88,12,0.3)]" />
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-orange-200 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* 1. User Profile FIRST PLACE */}
            <button 
              onClick={() => { setView('profile'); setIsMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2.5 hover:bg-orange-50 transition-colors ${view === 'profile' ? 'text-orange-600 bg-orange-50/60' : 'text-slate-700'}`}
            >
              <FileText size={15} />
              <span>User Profile</span>
            </button>

            {/* 2. Activation */}
            <button 
              onClick={() => { setView('activation'); setIsMenuOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2.5 hover:bg-orange-50 transition-colors ${view === 'activation' ? 'text-orange-600 bg-orange-50/60' : 'text-slate-700'}`}
            >
              <CreditCard size={15} />
              <span>Activation</span>
            </button>

            {/* 3. Admin Panel */}
            <button 
              onClick={() => { setIsAdminOpen(true); setIsMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs font-bold text-orange-800 flex items-center gap-2.5 hover:bg-orange-100/50 transition-colors"
            >
              <ShieldCheck size={15} className="text-orange-600" />
              <span>Admin Panel</span>
            </button>

            <div className="my-1 border-t border-orange-100" />

            {/* 4. Logout Button */}
            <button 
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 flex items-center gap-2.5 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      <main className="flex-1 flex flex-col relative">
        {/* Seekers View - Empty State */}
        {view === 'seekers' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-300">
            {/* Empty view for Seekers */}
          </div>
        )}

        {/* GiGs View - OPENSTREETMAP NO-COST API FULL SCREEN */}
        {view === 'gigs' && (
          <OpenStreetMap />
        )}

        {view === 'activation' && (
          <div className="p-4 pt-12 space-y-4">
            <h1 className="text-2xl font-extrabold mb-4 text-orange-950 tracking-tighter">Job Portal Membership</h1>
            
            {isReviewing && !hasApprovedSubmission && (
              <div className="p-4 bg-gradient-to-b from-white to-orange-50 border-2 border-orange-200 rounded-2xl shadow-[0_8px_16px_rgba(234,88,12,0.12)] text-center space-y-3 animate-in slide-in-from-bottom duration-300">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600 animate-pulse shadow-inner">
                  <Clock size={24} />
                </div>
                <h2 className="font-extrabold text-base text-orange-950">Under Review</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our recruitment compliance team is verifying your documents and subscription details. Review takes <strong>15 to 25 minutes</strong>.
                </p>
                <button onClick={() => setIsReviewing(false)} className="bg-orange-600 text-white px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-md">Dismiss</button>
              </div>
            )}

            {/* SINGLE SUBSCRIPTION LOCKING LOGIC */}
            {hasApprovedSubmission ? (
              <div className="p-4 bg-gradient-to-b from-white to-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-[0_8px_20px_rgba(16,185,129,0.15)] space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                    <h2 className="font-extrabold text-base text-emerald-950">Membership Approved & Locked</h2>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Lock size={9} /> Active Pass
                  </span>
                </div>

                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1 text-xs shadow-inner">
                  <p className="font-bold text-emerald-900">
                    Your <span className="capitalize text-emerald-700 font-black">{approvedSubmission?.type} Subscription</span> is active.
                  </p>
                  <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                    You have selected and locked this tier. You can now access full job opportunity features.
                  </p>
                </div>

                {approvedSubmission?.type === 'tenant' && (
                  <button 
                    onClick={() => setView('tenant-portal')} 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-700 text-white py-2 rounded-full font-bold text-xs shadow-[0_4px_12px_rgba(234,88,12,0.3)] transition-all flex items-center justify-center gap-1.5 active:translate-y-0.5"
                  >
                    <Building2 size={14} /> Open Agency Tenant Portal
                  </button>
                )}
              </div>
            ) : !isReviewing && (
              <>
                {pendingSubmission ? (
                  <div className="p-4 bg-white border-2 border-amber-300 rounded-2xl shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Clock size={16} />
                      <h2 className="font-bold text-sm">Membership Choice Pending Review</h2>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      You selected a <span className="capitalize font-bold text-orange-950">{pendingSubmission.type} subscription</span>. It is currently under review. Once approved, your subscription choice will be locked.
                    </p>
                  </div>
                ) : (
                  <>
                    {!selectedSub && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Select 1 Membership Tier</p>
                        <div className="p-4 border-2 border-orange-200/80 rounded-2xl bg-gradient-to-b from-white via-white to-orange-50/40 shadow-[0_8px_16px_rgba(234,88,12,0.08)] hover:border-orange-400 transition-all">
                          <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                            <Building2 size={16} className="text-orange-600 filter drop-shadow-[0_1px_2px_rgba(234,88,12,0.3)]" />
                            <h2>Agency / Tenant Pass (R{tenantSubPrice.toFixed(2)}/mo)</h2>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Earn monthly referral commissions through your registered job seekers & gig workers.</p>
                          <button onClick={() => setSelectedSub('tenant')} className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-4 py-2 mt-3 rounded-full font-bold text-xs shadow-[0_4px_12px_rgba(234,88,12,0.3)] hover:opacity-95">Select Agency Tenant</button>
                        </div>
                        <div className="p-4 border-2 border-orange-200/80 rounded-2xl bg-gradient-to-b from-white via-white to-orange-50/40 shadow-[0_8px_16px_rgba(234,88,12,0.08)] hover:border-orange-400 transition-all">
                          <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                            <UserSearch size={16} className="text-orange-600 filter drop-shadow-[0_1px_2px_rgba(234,88,12,0.3)]" />
                            <h2>Job Seeker Pass (R{userSubPrice.toFixed(2)}/mo)</h2>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Direct access to apply for gig work, flexible jobs, and employer opportunities.</p>
                          <button onClick={() => setSelectedSub('user')} className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-4 py-2 mt-3 rounded-full font-bold text-xs shadow-[0_4px_12px_rgba(234,88,12,0.3)] hover:opacity-95">Select Job Seeker</button>
                        </div>
                      </div>
                    )}

                    {selectedSub === 'tenant' && (
                      <div className="space-y-4 p-4 bg-white rounded-2xl border-2 border-orange-200 shadow-sm">
                        <div className="flex justify-between items-center"><h2 className="font-extrabold text-base text-orange-900">Agency Tenant Registration (R{tenantSubPrice.toFixed(2)})</h2><button onClick={() => setSelectedSub(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Back</button></div>
                        
                        <div className="space-y-3">
                          <label className="block p-3 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors relative overflow-hidden min-h-[60px] flex items-center justify-center">
                            {draftFace ? (
                              <div className="flex items-center gap-2.5 w-full">
                                <img src={draftFace} alt="Face draft" className="w-10 h-10 rounded-lg object-cover border-2 border-orange-200" />
                                <span className="text-xs font-semibold text-orange-900">Profile Headshot loaded live!</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs font-medium"><Upload className="inline mr-1.5 text-orange-600" size={14}/> Upload Profile Headshot</span>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLocalFileRead(e, setDraftFace)} />
                          </label>

                          <label className="block p-3 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors relative overflow-hidden min-h-[60px] flex items-center justify-center">
                            {draftIdDoc ? (
                              <div className="flex items-center gap-2.5 w-full">
                                <img src={draftIdDoc} alt="ID Doc draft" className="w-10 h-10 rounded-lg object-cover border-2 border-orange-200" />
                                <span className="text-xs font-semibold text-orange-900">ID Document loaded live!</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs font-medium"><Upload className="inline mr-1.5 text-orange-600" size={14}/> Upload ID Document</span>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLocalFileRead(e, setDraftIdDoc)} />
                          </label>
                        </div>

                        <button 
                          disabled={!draftFace || !draftIdDoc} 
                          onClick={submitTenant} 
                          className={`w-full py-2.5 rounded-full font-bold text-xs shadow-sm transition-all ${draftFace && draftIdDoc ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        >
                          Submit Registration
                        </button>
                      </div>
                    )}

                    {selectedSub === 'user' && (
                      <div className="space-y-4 p-4 bg-white rounded-2xl border border-orange-200 shadow-sm">
                        <div className="flex justify-between items-center"><h2 className="font-extrabold text-base text-orange-900">Job Seeker Pass (R{userSubPrice.toFixed(2)})</h2><button onClick={() => setSelectedSub(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Back</button></div>
                        
                        <div className="bg-orange-100 p-3 rounded-xl text-xs text-orange-950 font-semibold space-y-0.5">
                          <p>Bank: Capitec</p>
                          <p>Acc: 1334067366</p>
                          <p>Ref: User29</p>
                        </div>

                        <label className="block p-3 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors relative overflow-hidden min-h-[60px] flex items-center justify-center">
                          {draftPop ? (
                            <div className="flex items-center gap-2.5 w-full">
                              <img src={draftPop} alt="PoP draft" className="w-10 h-10 rounded-lg object-cover border-2 border-orange-200" />
                              <span className="text-xs font-semibold text-orange-900">Proof of Payment Loaded live!</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-xs font-medium"><Upload className="inline mr-1.5 text-orange-600" size={14}/> Upload Proof of Payment</span>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLocalFileRead(e, setDraftPop)} />
                        </label>

                        <button 
                          disabled={!draftPop} 
                          onClick={submitUser} 
                          className={`w-full py-2.5 rounded-full font-bold text-xs shadow-sm transition-all ${draftPop ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        >
                          Submit Payment Proof
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {view === 'profile' && (
          <div className="p-4 pt-12 space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-extrabold text-orange-950 tracking-tighter">Applicant Resume & Profile</h1>
              <button 
                onClick={() => setIsProfileLocked(!isProfileLocked)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1 shadow-sm uppercase tracking-wider"
              >
                {isProfileLocked ? <><Edit2 size={10}/> Edit</> : <><Check size={10}/> Lock</>}
              </button>
            </div>

            {/* Profile Header Card */}
            <div className="bg-gradient-to-b from-white to-orange-50/40 p-4 rounded-2xl border-2 border-orange-200 space-y-4 shadow-[0_8px_16px_rgba(234,88,12,0.1)]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-300 overflow-hidden shadow-sm">
                    {latestFaceImage ? (
                      <img src={latestFaceImage} alt="Profile Logo" className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                  {hasApprovedSubmission && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border-2 border-white flex items-center justify-center" title="Verified Job Candidate">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-extrabold text-base text-orange-900">
                    {profile.name || profile.surname ? `${profile.name} ${profile.surname}` : 'Job Candidate #1024'}
                  </h2>
                  <p className="text-xs text-slate-500">{profile.email || 'Registered Applicant'}</p>
                </div>
              </div>

              {/* ID Documents Gallery View */}
              {idDocuments.length > 0 && (
                <div className="border-t border-orange-100 pt-3">
                  <h3 className="font-bold text-orange-900 text-xs mb-2">Verification & ID Records</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {idDocuments.map((doc, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-orange-100 bg-orange-50/50 aspect-[4/3] flex flex-col items-center justify-center shadow-sm">
                        <img src={doc} alt={`ID Doc ${idx}`} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                          <button onClick={() => setSelectedImage(doc)} className="bg-white p-1 rounded-full text-slate-900 hover:scale-110 transition-transform"><Eye size={12}/></button>
                          <button onClick={() => handleDownload(doc, `ID_Doc_${idx}.png`)} className="bg-white p-1 rounded-full text-slate-900 hover:scale-110 transition-transform"><Download size={12}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-orange-100 pt-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Pass Status:</span>
                  <span className="bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
                    {submissions.length > 0 ? `${submissions[submissions.length - 1].type} - ${submissions[submissions.length - 1].status}` : 'Free Tier'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Candidate Rank:</span>
                  <span className="font-bold text-orange-900">{hasApprovedSubmission ? 'Verified Candidate' : 'Applicant'}</span>
                </div>
              </div>
            </div>

            {/* Editable Profile Information Form */}
            <div className="bg-white p-4 rounded-2xl border border-orange-200 space-y-3 shadow-sm text-xs">
              <h3 className="font-extrabold text-orange-950 text-sm border-b border-orange-100 pb-1.5">Applicant Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Name</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Middle Name (Optional)</label>
                  <input 
                    type="text" 
                    value={profile.middleName} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, middleName: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Surname</label>
                  <input 
                    type="text" 
                    value={profile.surname} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, surname: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Date of Birth</label>
                  <input 
                    type="date" 
                    value={profile.dob} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5 md:col-span-2">
                  <label className="font-bold text-slate-600 block text-[11px]">Address</label>
                  <input 
                    type="text" 
                    value={profile.address} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Location</label>
                  <input 
                    type="text" 
                    value={profile.location} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Province</label>
                  <input 
                    type="text" 
                    value={profile.province} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Contact Number</label>
                  <input 
                    type="tel" 
                    value={profile.contactNumber} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, contactNumber: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="font-bold text-slate-600 block text-[11px]">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2 bg-orange-50/50 border border-orange-100 rounded-lg outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>
              </div>

              {/* Social Media Links section */}
              <div className="space-y-1.5 border-t border-orange-100 pt-3">
                <label className="font-bold text-slate-600 block text-[11px]">Work Portfolio & Links</label>
                {!isProfileLocked && (
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      placeholder="Add portfolio or profile URL..." 
                      value={newSocial}
                      onChange={(e) => setNewSocial(e.target.value)}
                      className="flex-1 p-1.5 bg-orange-50/50 border border-orange-100 rounded-lg outline-none text-xs" 
                    />
                    <button onClick={addSocialLink} className="bg-orange-600 text-white p-1.5 rounded-lg"><Plus size={16}/></button>
                  </div>
                )}
                <div className="space-y-1.5">
                  {profile.socialLinks.map((link, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-orange-50/50 border border-orange-100 p-2 rounded-lg">
                      <span className="text-[11px] text-slate-700 truncate">{link}</span>
                      {!isProfileLocked && (
                        <button onClick={() => removeSocialLink(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TENANT PORTAL - AGENCY RECRUITMENT HUB WITH 4D CARDS */}
        {view === 'tenant-portal' && (
          <div className="p-4 pt-12 space-y-4 animate-in slide-in-from-right duration-300 text-xs">
            <div className="flex items-center gap-2">
              <button onClick={() => setView('seekers')} className="p-1.5 bg-white rounded-full shadow-sm hover:bg-orange-100 transition-colors"><Building2 size={14} className="text-orange-600" /></button>
              <h1 className="text-xl font-black text-orange-950 tracking-tight">Agency Tenant Portal</h1>
            </div>

            {/* Tenant Sub-navigation */}
            <div className="flex bg-white p-1 rounded-xl border border-orange-200 shadow-sm">
              <button onClick={() => setTenantSubTab('overview')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${tenantSubTab === 'overview' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500'}`}>
                Overview
              </button>
              <button onClick={() => setTenantSubTab('submissions')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${tenantSubTab === 'submissions' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500'}`}>
                Candidate Requests
              </button>
              <button onClick={() => setTenantSubTab('referral')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${tenantSubTab === 'referral' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500'}`}>
                Referral Link
              </button>
            </div>

            {tenantSubTab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-gradient-to-b from-white to-orange-50/50 p-3.5 rounded-2xl border-2 border-orange-200 shadow-[0_8px_16px_rgba(234,88,12,0.1)] relative overflow-hidden">
                    <Coins className="absolute right-2 bottom-2 w-8 h-8 text-orange-200/60" />
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Agency Fee</p>
                    <p className="text-xl font-black text-orange-950">R{tenantSubPrice.toFixed(2)}<span className="text-[9px] font-bold text-slate-400">/mo</span></p>
                  </div>

                  <div className="bg-gradient-to-b from-white to-orange-50/50 p-3.5 rounded-2xl border-2 border-orange-200 shadow-[0_8px_16px_rgba(234,88,12,0.1)] relative overflow-hidden">
                    <TrendingUp className="absolute right-2 bottom-2 w-8 h-8 text-emerald-200/60" />
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Candidate Revenue</p>
                    <p className="text-xl font-black text-emerald-600">R{userProfitBalance.toFixed(2)}<span className="text-[9px] font-bold text-slate-400">/mo</span></p>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{approvedUsersCount} Active Candidates</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-950 via-slate-900 to-orange-900 text-white p-4 rounded-2xl shadow-[0_10px_24px_rgba(0,0,0,0.25)] space-y-1 border border-orange-800/40">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-orange-300">Net Monthly Agency Earnings</h3>
                  <p className="text-2xl font-black text-emerald-400 filter drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">R{netProfit.toFixed(2)}</p>
                  <p className="text-[10px] font-medium text-orange-200/80">Net commission earned directly through referred job seekers and gig candidates.</p>
                </div>
              </div>
            )}

            {tenantSubTab === 'submissions' && (
              <div className="space-y-2.5">
                <h3 className="font-extrabold text-xs text-orange-950 uppercase tracking-wider">Referred Candidate Submissions</h3>
                <div className="space-y-2">
                  {tenantSubUsers.map(user => (
                    <div key={user.id} className="bg-white p-2.5 rounded-xl border border-orange-100 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <img src={user.files.face} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-orange-200" />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Applicant #{user.id}</p>
                          <p className="text-[9px] text-slate-400 font-mono">Candidate ID: {user.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {user.status === 'pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => setTenantSubUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'approved' } : u))} className="bg-emerald-500 text-white p-1 rounded-full hover:bg-emerald-600 shadow-sm"><Check size={12}/></button>
                            <button onClick={() => setTenantSubUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'rejected' } : u))} className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"><X size={12}/></button>
                          </div>
                        ) : (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${user.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {user.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tenantSubTab === 'referral' && (
              <div className="bg-white p-4 rounded-2xl border border-orange-200 space-y-4 shadow-sm">
                <div>
                  <h3 className="font-extrabold text-sm text-orange-950">Candidate Referral Link</h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">Share your agency link to recruit job seekers under your referral account.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Set Monthly Candidate Subscription Fee</label>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-orange-950 text-xs">R</span>
                    <input 
                      type="number" 
                      value={tenantUserPrice} 
                      onChange={(e) => setTenantUserPrice(Number(e.target.value))}
                      className="w-24 p-1.5 bg-orange-50 border border-orange-100 rounded-lg font-bold text-orange-900 outline-none text-xs" 
                    />
                  </div>
                </div>

                <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-200 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 truncate">
                    <LinkIcon className="text-orange-600 shrink-0" size={14} />
                    <span className="text-[10px] font-mono text-slate-600 select-all truncate">{window.location.origin}/activate?ref=tenant-1024</span>
                  </div>
                  <button onClick={() => alert("Copied referral link to clipboard!")} className="text-orange-600 hover:text-orange-800 font-bold text-[10px] uppercase shrink-0 ml-2">Copy</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* REALISTIC THEME BOTTOM NAVIGATION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 backdrop-blur-md border-t border-slate-700/60 py-1.5 px-4 flex justify-around items-center z-20 shadow-[0_-10px_25px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] h-14">
        <button 
          onClick={() => setView('seekers')} 
          className={`flex flex-col items-center gap-0.5 transition-all group ${view === 'seekers' ? 'scale-105' : 'hover:scale-100'}`}
        >
          <RealisticSeekersIcon active={view === 'seekers'} />
          <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${view === 'seekers' ? 'text-orange-400 drop-shadow-[0_1px_4px_rgba(249,115,22,0.6)]' : 'text-slate-400 group-hover:text-slate-200'}`}>
            Seekers
          </span>
        </button>

        <button 
          onClick={() => setView('gigs')} 
          className={`flex flex-col items-center gap-0.5 transition-all group ${view === 'gigs' ? 'scale-105' : 'hover:scale-100'}`}
        >
          <RealisticGigsIcon active={view === 'gigs'} />
          <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${view === 'gigs' ? 'text-orange-400 drop-shadow-[0_1px_4px_rgba(249,115,22,0.6)]' : 'text-slate-400 group-hover:text-slate-200'}`}>
            GiGs
          </span>
        </button>

        <button 
          onClick={() => {
            if (isTenantApproved) {
              setView('tenant-portal');
            } else {
              alert("Tenant Portal is accessible once your Agency Tenant Subscription is approved by Admin!");
            }
          }} 
          className={`flex flex-col items-center gap-0.5 transition-all group relative ${!isTenantApproved ? 'opacity-65' : ''} ${view === 'tenant-portal' ? 'scale-105' : 'hover:scale-100'}`}
        >
          <RealisticTenantIcon active={view === 'tenant-portal'} locked={!isTenantApproved} />
          <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${view === 'tenant-portal' ? 'text-orange-400 drop-shadow-[0_1px_4px_rgba(249,115,22,0.6)]' : 'text-slate-400 group-hover:text-slate-200'}`}>
            Tenant Portal
          </span>
        </button>
      </footer>

      {/* Circle loading overlay when submitted */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin"></div>
            <div className="absolute w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 font-black text-orange-950 text-xl uppercase tracking-widest animate-pulse">Submitted</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold">Your registration files have uploaded successfully.</p>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Full Screen" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
