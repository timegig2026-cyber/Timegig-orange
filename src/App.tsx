import { useState, useEffect } from 'react';
import { ShieldCheck, Upload, Check, X, Compass, User as UserIcon, Clock, Plus, Trash2, Edit2, Download, Eye, Briefcase, Landmark, Link as LinkIcon, Users, CheckCircle, ArrowLeft, Settings } from 'lucide-react';

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

export default function App() {
  const [view, setView] = useState<'activation' | 'profile' | 'tenant-portal'>('activation');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
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
  const [tenantUserPrice, setTenantUserPrice] = useState<number>(35.00); // Customizable price
  const [tenantSubUsers, setTenantSubUsers] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('tenantSubUsers');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'user', status: 'approved', files: { face: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' } },
      { id: '2', type: 'user', status: 'pending', files: { face: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' } }
    ];
  });

  // State for adding a temporary social link in input
  const [newSocial, setNewSocial] = useState('');

  // Persist values to localStorage on state change
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

  const hasApprovedSubmission = submissions.some(s => s.status === 'approved');
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
        <header className="p-4 border-b border-orange-200 bg-white flex justify-between items-center"><h1 className="font-bold text-orange-600">Admin Expedition</h1><button onClick={() => setIsAdminOpen(false)} className="text-sm font-bold text-orange-800">Close</button></header>
        <main className="flex-1 p-6 space-y-6">
          {activeAdminTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Dynamic Link Generator */}
              <div className="bg-white p-6 rounded-3xl border border-orange-200 space-y-3 shadow-sm">
                <h3 className="font-extrabold text-orange-950 text-base">Referral Control</h3>
                <button onClick={generateLink} className="bg-orange-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-orange-200">Generate Map Link</button>
                {shareLink && <p className="text-sm break-all bg-orange-50 p-4 rounded-xl border border-orange-200">{shareLink}</p>}
              </div>

              {/* Editable Base Subscription Fees */}
              <div className="bg-white p-6 rounded-3xl border border-orange-200 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-orange-100 pb-2">
                  <Settings className="text-orange-600" size={18} />
                  <h3 className="font-extrabold text-orange-950 text-base">Global Subscription Fee Settings</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tenant Subscription Monthly Fee (R)</label>
                    <input 
                      type="number" 
                      value={tenantSubPrice} 
                      onChange={(e) => setTenantSubPrice(Number(e.target.value))}
                      className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold text-orange-900 outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">User Subscription Monthly Fee (R)</label>
                    <input 
                      type="number" 
                      value={userSubPrice} 
                      onChange={(e) => setUserSubPrice(Number(e.target.value))}
                      className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl font-bold text-orange-900 outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeAdminTab === 'submissions' && (
            <div className="space-y-4">
              {submissions.map(s => (
                <div key={s.id} className="p-4 border border-orange-200 rounded-2xl bg-white space-y-2">
                  <p className="font-bold text-orange-800 uppercase tracking-wide text-xs">Type: {s.type}</p>
                  <p className="text-sm">Status: {s.status}</p>
                  <div className="flex gap-2 flex-wrap py-2">
                    {Object.entries(s.files).map(([key, val]) => (
                      <div key={key} className="relative group">
                        <img src={val as string} alt={key} className="w-20 h-20 object-cover cursor-pointer rounded-lg border-2 border-orange-200" onClick={() => setSelectedImage(val as string)} />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 rounded capitalize">{key}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2"><button onClick={() => setSubmissions(prev => prev.map(sub => sub.id === s.id ? {...sub, status: 'approved'} : sub))} className="bg-emerald-600 text-white p-2 rounded-full"><Check size={16}/></button><button onClick={() => setSubmissions(prev => prev.map(sub => sub.id === s.id ? {...sub, status: 'rejected'} : sub))} className="bg-red-600 text-white p-2 rounded-full"><X size={16}/></button></div>
                </div>
              ))}
              {submissions.length === 0 && <p className="text-slate-400 italic text-center py-10">No submissions to show yet.</p>}
            </div>
          )}
        </main>
        {selectedImage && (<div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setSelectedImage(null)}><img src={selectedImage} alt="Full Screen" className="max-w-full max-h-full rounded-lg" /></div>)}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 p-4 flex justify-around"><button onClick={() => setActiveAdminTab('overview')} className={activeAdminTab === 'overview' ? 'font-bold text-orange-600' : 'text-slate-500'}>Overview</button><button onClick={() => setActiveAdminTab('submissions')} className={activeAdminTab === 'submissions' ? 'font-bold text-orange-600' : 'text-slate-500'}>Submissions</button></footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 text-slate-900 font-sans flex flex-col pb-20 relative">
      <header className="fixed top-4 right-4 z-10"><button onClick={() => setIsAdminOpen(true)} className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"><ShieldCheck size={24} /></button></header>
      
      <main className="flex-1 p-6">
        {view === 'activation' && (
          <>
            <h1 className="text-3xl font-extrabold mb-8 text-orange-950 tracking-tighter">Start Your Adventure</h1>
            
            {isReviewing ? (
              <div className="p-6 bg-white border-2 border-orange-200 rounded-3xl shadow-sm text-center space-y-4 animate-in slide-in-from-bottom duration-300">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600 animate-pulse">
                  <Clock size={32} />
                </div>
                <h2 className="font-extrabold text-xl text-orange-950">Under Review</h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Our rangers are verifying your documents and subscription details. Review takes <strong>15 to 25 minutes</strong>.
                </p>
                <button onClick={() => setIsReviewing(false)} className="bg-orange-600 text-white px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider">Dismiss</button>
              </div>
            ) : (
              <>
                {!selectedSub && (
                  <div className="space-y-4">
                    <div className="p-6 border-2 border-orange-200 rounded-3xl bg-white shadow-sm"><h2 className="font-bold text-lg text-orange-800">Tenant Expedition (R{tenantSubPrice.toFixed(2)})</h2><button onClick={() => setSelectedSub('tenant')} className="bg-orange-600 text-white px-6 py-3 mt-4 rounded-full font-bold shadow-md shadow-orange-100 hover:bg-orange-700">Embark</button></div>
                    <div className="p-6 border-2 border-orange-200 rounded-3xl bg-white shadow-sm"><h2 className="font-bold text-lg text-orange-800">User Journey (R{userSubPrice.toFixed(2)})</h2><button onClick={() => setSelectedSub('user')} className="bg-orange-600 text-white px-6 py-3 mt-4 rounded-full font-bold shadow-md shadow-orange-100 hover:bg-orange-700">Join</button></div>
                  </div>
                )}
                {selectedSub === 'tenant' && (
                  <div className="space-y-6 p-6 bg-white rounded-3xl border border-orange-200 shadow-sm">
                    <div className="flex justify-between items-center"><h2 className="font-extrabold text-xl text-orange-900">Tenant Details (R{tenantSubPrice.toFixed(2)})</h2><button onClick={() => setSelectedSub(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Back</button></div>
                    
                    <div className="space-y-4">
                      <label className="block p-4 border border-orange-200 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors relative overflow-hidden min-h-[80px] flex items-center justify-center">
                        {draftFace ? (
                          <div className="flex items-center gap-3 w-full">
                            <img src={draftFace} alt="Face draft" className="w-12 h-12 rounded-lg object-cover border-2 border-orange-200" />
                            <span className="text-sm font-semibold text-orange-900">Face Photo loaded live!</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium"><Upload className="inline mr-2 text-orange-600" size={16}/> Upload Face Photo</span>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLocalFileRead(e, setDraftFace)} />
                      </label>

                      <label className="block p-4 border border-orange-200 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors relative overflow-hidden min-h-[80px] flex items-center justify-center">
                        {draftIdDoc ? (
                          <div className="flex items-center gap-3 w-full">
                            <img src={draftIdDoc} alt="ID Doc draft" className="w-12 h-12 rounded-lg object-cover border-2 border-orange-200" />
                            <span className="text-sm font-semibold text-orange-900">ID Document loaded live!</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-medium"><Upload className="inline mr-2 text-orange-600" size={16}/> Upload ID</span>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLocalFileRead(e, setDraftIdDoc)} />
                      </label>
                    </div>

                    <button 
                      disabled={!draftFace || !draftIdDoc} 
                      onClick={submitTenant} 
                      className={`w-full py-4 rounded-full font-bold shadow-md transition-all ${draftFace && draftIdDoc ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      Submit Application
                    </button>
                  </div>
                )}
                {selectedSub === 'user' && (
                  <div className="space-y-6 p-6 bg-white rounded-3xl border border-orange-200 shadow-sm">
                    <div className="flex justify-between items-center"><h2 className="font-extrabold text-xl text-orange-900">User Journey (R{userSubPrice.toFixed(2)})</h2><button onClick={() => setSelectedSub(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Back</button></div>
                    
                    <div className="bg-orange-100 p-4 rounded-2xl text-sm text-orange-950 font-semibold space-y-1">
                      <p>Bank: Capitec</p>
                      <p>Acc: 1334067366</p>
                      <p>Ref: User29</p>
                    </div>

                    <label className="block p-4 border border-orange-200 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors relative overflow-hidden min-h-[80px] flex items-center justify-center">
                      {draftPop ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={draftPop} alt="PoP draft" className="w-12 h-12 rounded-lg object-cover border-2 border-orange-200" />
                          <span className="text-sm font-semibold text-orange-900">PoP Loaded live!</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium"><Upload className="inline mr-2 text-orange-600" size={16}/> Upload PoP</span>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLocalFileRead(e, setDraftPop)} />
                    </label>

                    <button 
                      disabled={!draftPop} 
                      onClick={submitUser} 
                      className={`w-full py-4 rounded-full font-bold shadow-md transition-all ${draftPop ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      Submit Proof of Payment
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-extrabold text-orange-950 tracking-tighter">Explorer Profile</h1>
              <button 
                onClick={() => setIsProfileLocked(!isProfileLocked)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                {isProfileLocked ? <><Edit2 size={12}/> Edit</> : <><Check size={12}/> Submit & Lock</>}
              </button>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white p-6 rounded-3xl border-2 border-orange-200 space-y-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-300 overflow-hidden">
                    {latestFaceImage ? (
                      <img src={latestFaceImage} alt="Profile Logo" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-orange-600" />
                    )}
                  </div>
                  {hasApprovedSubmission && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white flex items-center justify-center" title="Verified Explorer">
                      <Check size={12} className="stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-extrabold text-xl text-orange-900">
                    {profile.name || profile.surname ? `${profile.name} ${profile.surname}` : 'Adventurer #1024'}
                  </h2>
                  <p className="text-sm text-slate-500">{profile.email || 'Joined October 2026'}</p>
                </div>
              </div>

              {/* ID Documents Gallery View */}
              {idDocuments.length > 0 && (
                <div className="border-t border-orange-100 pt-4">
                  <h3 className="font-bold text-orange-900 text-sm mb-3">ID Document Gallery</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {idDocuments.map((doc, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-orange-100 bg-orange-50/50 aspect-[4/3] flex flex-col items-center justify-center">
                        <img src={doc} alt={`ID Doc ${idx}`} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                          <button onClick={() => setSelectedImage(doc)} className="bg-white p-1.5 rounded-full text-slate-900 hover:scale-110 transition-transform"><Eye size={14}/></button>
                          <button onClick={() => handleDownload(doc, `ID_Doc_${idx}.png`)} className="bg-white p-1.5 rounded-full text-slate-900 hover:scale-110 transition-transform"><Download size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-orange-100 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Subscription Level:</span>
                  <span className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                    {submissions.length > 0 ? `${submissions[submissions.length - 1].type} - ${submissions[submissions.length - 1].status}` : 'Free Tier'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Expedition Rank:</span>
                  <span className="font-bold text-orange-900">{hasApprovedSubmission ? 'Verified Explorer' : 'Novice Explorer'}</span>
                </div>
              </div>
            </div>

            {/* Editable Profile Information Form */}
            <div className="bg-white p-6 rounded-3xl border-2 border-orange-200 space-y-4 shadow-sm">
              <h3 className="font-extrabold text-orange-950 text-lg border-b border-orange-100 pb-2">Personal Records</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Name</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Middle Name (Optional)</label>
                  <input 
                    type="text" 
                    value={profile.middleName} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, middleName: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Surname</label>
                  <input 
                    type="text" 
                    value={profile.surname} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, surname: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Date of Birth</label>
                  <input 
                    type="date" 
                    value={profile.dob} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, dob: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-600 block">Address</label>
                  <input 
                    type="text" 
                    value={profile.address} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Location</label>
                  <input 
                    type="text" 
                    value={profile.location} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Province</label>
                  <input 
                    type="text" 
                    value={profile.province} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, province: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Contact Number</label>
                  <input 
                    type="tel" 
                    value={profile.contactNumber} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, contactNumber: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    disabled={isProfileLocked}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-orange-50/50 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none disabled:bg-slate-100 disabled:text-slate-500" 
                  />
                </div>
              </div>

              {/* Social Media Links section */}
              <div className="space-y-2 border-t border-orange-100 pt-4">
                <label className="font-bold text-slate-600 block text-sm">Social Media Links</label>
                {!isProfileLocked && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add link..." 
                      value={newSocial}
                      onChange={(e) => setNewSocial(e.target.value)}
                      className="flex-1 p-2 bg-orange-50/50 border border-orange-100 rounded-xl outline-none" 
                    />
                    <button onClick={addSocialLink} className="bg-orange-600 text-white p-2 rounded-xl"><Plus size={20}/></button>
                  </div>
                )}
                <div className="space-y-2">
                  {profile.socialLinks.map((link, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-orange-50/50 border border-orange-100 p-2.5 rounded-xl">
                      <span className="text-xs text-slate-700 truncate">{link}</span>
                      {!isProfileLocked && (
                        <button onClick={() => removeSocialLink(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'tenant-portal' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('activation')} className="p-2 bg-white rounded-full shadow-sm hover:bg-orange-100 transition-colors"><ArrowLeft size={18} /></button>
              <h1 className="text-3xl font-extrabold text-orange-950 tracking-tighter">Tenant Portal</h1>
            </div>

            {tenantSubTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl border-2 border-orange-200 shadow-sm relative overflow-hidden">
                    <Landmark className="absolute right-4 bottom-4 w-12 h-12 text-orange-100" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Subscription cost</p>
                    <p className="text-3xl font-black text-orange-950">R{tenantSubPrice.toFixed(2)}<span className="text-xs font-bold text-slate-400">/mo</span></p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border-2 border-orange-200 shadow-sm relative overflow-hidden">
                    <Users className="absolute right-4 bottom-4 w-12 h-12 text-orange-100" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Subscribers Profit</p>
                    <p className="text-3xl font-black text-emerald-600">R{userProfitBalance.toFixed(2)}<span className="text-xs font-bold text-slate-400">/mo</span></p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{approvedUsersCount} Active User Subscriptions</p>
                  </div>
                </div>

                <div className="bg-orange-900 text-white p-6 rounded-3xl shadow-md space-y-2">
                  <h3 className="font-extrabold text-xl">Net Monthly Profit Balance</h3>
                  <p className="text-4xl font-black text-emerald-300">R{netProfit.toFixed(2)}</p>
                  <p className="text-xs font-medium text-orange-200">Earned directly through explorer referrals after subscription cost.</p>
                </div>
              </div>
            )}

            {tenantSubTab === 'submissions' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h3 className="font-extrabold text-lg text-orange-950">User Submissions</h3></div>
                <div className="space-y-3">
                  {tenantSubUsers.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-2xl border-2 border-orange-100 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <img src={user.files.face} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-orange-200" />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">User #{user.id}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {user.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.status === 'pending' ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => setTenantSubUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'approved' } : u))} className="bg-emerald-500 text-white p-1.5 rounded-full hover:bg-emerald-600"><Check size={14}/></button>
                            <button onClick={() => setTenantSubUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'rejected' } : u))} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"><X size={14}/></button>
                          </div>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${user.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
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
              <div className="bg-white p-6 rounded-3xl border-2 border-orange-200 space-y-6 shadow-sm">
                <div>
                  <h3 className="font-extrabold text-xl text-orange-950">Referral Expedition</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">Direct others to embark on user journeys using your unique ref parameter.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Set Custom Monthly Subscription Fee</label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-950">R</span>
                    <input 
                      type="number" 
                      value={tenantUserPrice} 
                      onChange={(e) => setTenantUserPrice(Number(e.target.value))}
                      className="w-32 p-2 bg-orange-50 border border-orange-100 rounded-xl font-bold text-orange-900 outline-none" 
                    />
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 flex justify-between items-center">
                  <div className="flex items-center gap-2 truncate">
                    <LinkIcon className="text-orange-600 shrink-0" size={16} />
                    <span className="text-xs font-mono text-slate-600 select-all truncate">{window.location.origin}/activate?ref=tenant-1024</span>
                  </div>
                  <button onClick={() => alert("Copied link to clipboard!")} className="text-orange-600 hover:text-orange-800 font-bold text-xs uppercase shrink-0">Copy</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Circle loading overlay when submitted */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin"></div>
            <div className="absolute w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
              <Compass className="w-8 h-8 animate-pulse" />
            </div>
          </div>
          <p className="mt-6 font-black text-orange-950 text-2xl uppercase tracking-widest animate-pulse">Submitted</p>
          <p className="text-xs text-slate-500 mt-2 font-semibold">Your files have uploaded successfully.</p>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Full Screen" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      {/* Primary or Secondary bottom menu bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 p-4 flex justify-around">
        {view === 'tenant-portal' ? (
          <>
            <button onClick={() => setTenantSubTab('overview')} className={`flex flex-col items-center gap-1 transition-colors ${tenantSubTab === 'overview' ? 'text-orange-700 font-bold' : 'text-slate-400'}`}>
              <Landmark size={22} /><span className="text-[10px] uppercase tracking-wider">Overview</span>
            </button>
            <button onClick={() => setTenantSubTab('submissions')} className={`flex flex-col items-center gap-1 transition-colors ${tenantSubTab === 'submissions' ? 'text-orange-700 font-bold' : 'text-slate-400'}`}>
              <Users size={22} /><span className="text-[10px] uppercase tracking-wider">Submissions</span>
            </button>
            <button onClick={() => setTenantSubTab('referral')} className={`flex flex-col items-center gap-1 transition-colors ${tenantSubTab === 'referral' ? 'text-orange-700 font-bold' : 'text-slate-400'}`}>
              <LinkIcon size={22} /><span className="text-[10px] uppercase tracking-wider">Referral</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => setView('activation')} 
              className={`flex flex-col items-center gap-1 transition-colors ${view === 'activation' ? 'text-orange-700 font-bold' : 'text-slate-400'}`}
            >
              <Compass size={24} />
              <span className="text-xs uppercase tracking-widest">Map</span>
            </button>
            
            {isTenantApproved && (
              <button 
                onClick={() => setView('tenant-portal')} 
                className={`flex flex-col items-center gap-1 transition-colors ${view === 'tenant-portal' ? 'text-orange-700 font-bold' : 'text-slate-400'}`}
              >
                <Briefcase size={24} />
                <span className="text-xs uppercase tracking-widest">Portal</span>
              </button>
            )}

            <button 
              onClick={() => setView('profile')} 
              className={`flex flex-col items-center gap-1 transition-colors ${view === 'profile' ? 'text-orange-700 font-bold' : 'text-slate-400'}`}
            >
              <UserIcon size={24} />
              <span className="text-xs uppercase tracking-widest">Profile</span>
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
