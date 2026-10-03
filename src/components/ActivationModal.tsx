import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Wifi, 
  Upload, 
  Camera, 
  FileText, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle,
  Building2,
  DollarSign,
  ShieldCheck,
  Send
} from 'lucide-react';
import { 
  getApplications, 
  saveApplication, 
  BANK_DETAILS, 
  ApplicationSubmission 
} from '../utils/applicationStorage';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivationModal({ isOpen, onClose }: ActivationModalProps) {
  const [selectedType, setSelectedType] = useState<'tenant' | 'user_subscription' | null>(null);
  const [applications, setApplications] = useState<ApplicationSubmission[]>([]);
  
  // Upload form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [idDocument, setIdDocument] = useState<string | null>(null);
  const [idDocName, setIdDocName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // PoP state
  const [popFile, setPopFile] = useState<string | null>(null);
  const [popFileName, setPopFileName] = useState('');

  const faceInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const popInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const list = getApplications();
    setApplications(list);

    // Pre-fill user details if available
    try {
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.name) setFullName(p.name);
        if (p.email) setEmail(p.email);
        if (p.phone) setPhone(p.phone);
        if (p.avatar && !facePhoto) setFacePhoto(p.avatar);
      } else {
        const currentEmail = localStorage.getItem('currentUserEmail') || '';
        setEmail(currentEmail);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    } else {
      setSelectedType(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('tenant_applications_updated', handleUpdate);
    return () => window.removeEventListener('tenant_applications_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const currentApp = selectedType 
    ? applications.find(a => a.type === selectedType) 
    : null;

  // Handle face photo upload (Face only)
  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMessage('Face photo size must be under 8MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFacePhoto(reader.result as string);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle ID document upload
  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 12 * 1024 * 1024) {
        setErrorMessage('ID document size must be under 12MB');
        return;
      }
      setIdDocName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdDocument(reader.result as string);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Application
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    if (!facePhoto) {
      setErrorMessage('Please upload your profile picture (face only)');
      return;
    }
    if (!idDocument) {
      setErrorMessage('Please upload your ID document from your device');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    const newApp: ApplicationSubmission = {
      id: `app-${Date.now()}`,
      type: selectedType,
      title: selectedType === 'tenant' ? 'Become a Tenant' : 'User Subscription',
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      facePhoto,
      idDocument,
      idDocumentName: idDocName || 'identity_document.jpg',
      status: 'pending_review',
      createdAt: new Date().toISOString(),
      reviewEstimatedMinutes: '15 to 25 minutes',
      refCode: selectedType === 'tenant' ? 'Ten29' : 'User29',
      popStatus: 'pending_pop',
    };

    saveApplication(newApp);

    // Also sync profile picture to map submissions so live pin updates
    try {
      const savedSubs = localStorage.getItem('submissions');
      const subs = savedSubs ? JSON.parse(savedSubs) : [];
      subs.push({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        files: { face: facePhoto }
      });
      localStorage.setItem('submissions', JSON.stringify(subs));
      localStorage.setItem('user_profile', JSON.stringify({ name: fullName, email, avatar: facePhoto }));
    } catch (err) {}

    loadData();
  };

  // Handle PoP upload
  const handlePopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPopFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPopFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit PoP
  const handleSubmitPoP = () => {
    if (!currentApp || !popFile) return;
    const updated: ApplicationSubmission = {
      ...currentApp,
      popDocument: popFile,
      popFileName: popFileName || 'Proof_of_Payment.pdf',
      popSubmittedAt: new Date().toISOString(),
      popStatus: 'pop_submitted',
    };
    saveApplication(updated);
    loadData();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const refCode = selectedType === 'tenant' ? BANK_DETAILS.tenantRef : BANK_DETAILS.userRef;

  return (
    <div 
      className="fixed inset-0 z-[3000] w-full h-[100dvh] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={selectedType ? undefined : onClose}
    >
      {/* Floating Close Button */}
      <button
        onClick={() => {
          if (selectedType) {
            setSelectedType(null);
          } else {
            onClose();
          }
        }}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[3100] p-2.5 sm:p-3 text-slate-400 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-full border border-slate-700/60 shadow-xl cursor-pointer backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
        title="Close"
      >
        <X size={20} />
      </button>

      {/* Floating Back Button when inside a card view */}
      {selectedType && (
        <button
          onClick={() => setSelectedType(null)}
          className="fixed top-4 left-4 sm:top-6 sm:left-6 z-[3100] px-3.5 py-2 text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 rounded-full border border-slate-700/60 shadow-xl cursor-pointer backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span>Back to Cards</span>
        </button>
      )}

      {/* VIEW 1: Show Only the Cards Filling the Screen */}
      {!selectedType && (
        <div 
          className="w-full max-w-lg h-full flex flex-col justify-center items-center gap-6 sm:gap-8 py-8 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* CARD 1: Become a Tenant */}
          <div 
            onClick={() => setSelectedType('tenant')}
            className="relative w-full aspect-[1.586/1] max-h-[44vh] rounded-3xl p-6 sm:p-7 bg-gradient-to-tr from-amber-950 via-amber-700 to-yellow-500 shadow-[0_20px_50px_rgba(217,119,6,0.45)] border-2 border-amber-300/60 flex flex-col justify-between overflow-hidden group select-none transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:shadow-[0_25px_60px_rgba(217,119,6,0.6)]"
          >
            {/* Holographic Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            {/* Top Row: Card Title & Contactless Symbol */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/50 flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-inner">
                  BT
                </div>
                <div>
                  <span className="font-black tracking-widest text-sm sm:text-base text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] uppercase block">
                    Become a Tenant
                  </span>
                  <span className="text-[10px] text-amber-200/90 font-bold tracking-tight">Earn passive monthly income</span>
                </div>
              </div>
              <Wifi size={24} className="text-amber-100 rotate-90 opacity-90 drop-shadow-sm" />
            </div>

            {/* Middle: Realistic Gold EMV Chip */}
            <div className="flex items-center gap-4 z-10 my-auto">
              <div className="w-12 h-9 sm:w-14 sm:h-10 rounded-lg bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 border border-yellow-400/90 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 opacity-40 p-0.5">
                  <div className="border-r border-b border-amber-800"></div>
                  <div className="border-b border-amber-800"></div>
                  <div className="border-r border-amber-800"></div>
                  <div></div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border border-amber-300/40 bg-white/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-amber-200/80"></div>
              </div>
            </div>

            {/* Bottom Details */}
            <div className="space-y-3 z-10">
              <div className="font-mono text-xl sm:text-2xl font-black tracking-[0.18em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] flex items-center justify-between">
                <span>4829 •••• •••• 9210</span>
                <span className="text-[10px] font-bold text-amber-100 bg-black/30 px-2 py-0.5 rounded-full border border-amber-300/30">
                  Click to Apply
                </span>
              </div>

              <div className="flex items-end justify-between text-xs sm:text-sm text-amber-100">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-amber-200/80 font-bold">Card</div>
                  <div className="font-black tracking-wider text-white uppercase drop-shadow-sm">Become a Tenant</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-amber-200/80 font-bold">Valid Thru</div>
                  <div className="font-mono font-bold text-white">09/29</div>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-red-600/90 shadow-md border border-white/20"></div>
                  <div className="w-8 h-8 rounded-full bg-amber-400/90 shadow-md border border-white/20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: User Subscription */}
          <div 
            onClick={() => setSelectedType('user_subscription')}
            className="relative w-full aspect-[1.586/1] max-h-[44vh] rounded-3xl p-6 sm:p-7 bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-900 shadow-[0_20px_50px_rgba(6,182,212,0.35)] border-2 border-cyan-400/50 flex flex-col justify-between overflow-hidden group select-none transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:shadow-[0_25px_60px_rgba(6,182,212,0.5)]"
          >
            {/* Holographic Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            {/* Top Row: Card Title & Contactless Symbol */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/60 flex items-center justify-center font-black text-cyan-300 text-xs sm:text-sm shadow-inner">
                  US
                </div>
                <div>
                  <span className="font-black tracking-widest text-sm sm:text-base text-cyan-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] uppercase block">
                    User Subscription
                  </span>
                  <span className="text-[10px] text-cyan-300/90 font-bold tracking-tight">Full Platform Access</span>
                </div>
              </div>
              <Wifi size={24} className="text-cyan-300 rotate-90 opacity-90 drop-shadow-sm" />
            </div>

            {/* Middle: Realistic Platinum EMV Chip */}
            <div className="flex items-center gap-4 z-10 my-auto">
              <div className="w-12 h-9 sm:w-14 sm:h-10 rounded-lg bg-gradient-to-br from-slate-200 via-slate-100 to-cyan-200 border border-slate-300 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 opacity-40 p-0.5">
                  <div className="border-r border-b border-slate-700"></div>
                  <div className="border-b border-slate-700"></div>
                  <div className="border-r border-slate-700"></div>
                  <div></div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border border-cyan-400/40 bg-white/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-cyan-300/80"></div>
              </div>
            </div>

            {/* Bottom Details */}
            <div className="space-y-3 z-10">
              <div className="font-mono text-xl sm:text-2xl font-black tracking-[0.18em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] flex items-center justify-between">
                <span>5294 •••• •••• 8104</span>
                <span className="text-[10px] font-bold text-cyan-200 bg-black/40 px-2 py-0.5 rounded-full border border-cyan-400/30">
                  Click to Apply
                </span>
              </div>

              <div className="flex items-end justify-between text-xs sm:text-sm text-slate-300">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-cyan-300/80 font-bold">Card</div>
                  <div className="font-black tracking-wider text-white uppercase drop-shadow-sm">User Subscription</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-cyan-300/80 font-bold">Valid Thru</div>
                  <div className="font-mono font-bold text-white">12/30</div>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-600/90 shadow-md border border-white/20"></div>
                  <div className="w-8 h-8 rounded-full bg-blue-500/90 shadow-md border border-white/20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Upload Flow OR Review Status OR Approved & Payment Flow */}
      {selectedType && (
        <div className="w-full max-w-lg bg-slate-900 border border-orange-500/30 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden text-white my-auto flex flex-col max-h-[92vh]">
          {/* Card Type Header Banner */}
          <div className={`px-6 py-4 border-b flex items-center justify-between ${
            selectedType === 'tenant' 
              ? 'bg-gradient-to-r from-amber-700/40 via-orange-600/30 to-slate-900 border-amber-500/30'
              : 'bg-gradient-to-r from-cyan-800/40 via-blue-700/30 to-slate-900 border-cyan-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl shadow-inner ${
                selectedType === 'tenant' ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
              }`}>
                {selectedType === 'tenant' ? <Building2 size={24} /> : <ShieldCheck size={24} />}
              </div>
              <div>
                <h2 className="text-lg font-black tracking-wide text-white">
                  {selectedType === 'tenant' ? 'Become a Tenant' : 'User Subscription'}
                </h2>
                <p className="text-[11px] text-slate-300 font-medium">
                  {selectedType === 'tenant' 
                    ? 'Earn a passive monthly income from user subscription fees'
                    : 'Unlock full platform access & membership features'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* SUB-VIEW A: SUBMISSION IN REVIEW (Circle Loading: 15 to 25 minutes) */}
            {currentApp && currentApp.status === 'pending_review' && (
              <div className="text-center py-6 space-y-6 flex flex-col items-center">
                {/* Animated Circle Loading Indicator */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                  <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
                    selectedType === 'tenant' ? 'border-amber-500' : 'border-cyan-400'
                  }`}></div>
                  <div className="flex flex-col items-center justify-center text-center p-2 z-10">
                    <Clock size={32} className={selectedType === 'tenant' ? 'text-amber-400 animate-pulse' : 'text-cyan-300 animate-pulse'} />
                    <span className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-wider">Reviewing</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    Under Admin Verification
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Review takes 15 to 25 minutes
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Your profile picture (face only) and ID document have been submitted to the administration team.
                    Once approved, you will receive bank transfer details to complete activation.
                  </p>
                </div>

                {/* Submission Snapshot Preview */}
                <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-around gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <img 
                      src={currentApp.facePhoto} 
                      alt="Submitted Face" 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-500/50 shadow-md"
                    />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile Photo</div>
                      <div className="text-xs font-bold text-white">Face Only Verified</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-orange-400">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID Document</div>
                      <div className="text-xs font-bold text-white truncate max-w-[100px]">{currentApp.idDocumentName || 'ID_Doc.jpg'}</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
                  <span>Reference Code:</span>
                  <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    {currentApp.refCode}
                  </span>
                </div>
              </div>
            )}

            {/* SUB-VIEW B: APPROVED - BANK TRANSFER PAYMENT (Capitec Matthews 1334067366) */}
            {currentApp && currentApp.status === 'approved' && (
              <div className="space-y-6">
                {/* Approval Banner */}
                <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={26} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                      Application Approved!
                    </h3>
                    <p className="text-xs text-slate-300">
                      Please pay your subscription fee via bank transfer to complete activation.
                    </p>
                  </div>
                </div>

                {/* Capitec Bank Details Card */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-orange-500/40 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                      Bank Transfer Details
                    </span>
                    <span className="text-[10px] font-black uppercase bg-orange-600/30 text-orange-300 px-2.5 py-0.5 rounded-full border border-orange-500/40">
                      Capitec Bank
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Bank Name */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium">Bank Name</span>
                      <span className="font-black text-white">{BANK_DETAILS.bankName}</span>
                    </div>

                    {/* Account Name */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium">Account Name</span>
                      <span className="font-black text-white">{BANK_DETAILS.accountName}</span>
                    </div>

                    {/* Account Number */}
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400 font-medium">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-amber-300">{BANK_DETAILS.accountNumber}</span>
                        <button
                          onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, 'acc')}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Copy Account Number"
                        >
                          {copiedField === 'acc' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Required Reference */}
                    <div className="flex items-center justify-between py-1 bg-orange-600/10 px-3 rounded-xl border border-orange-500/30">
                      <div>
                        <span className="text-orange-300 font-bold block text-[11px]">Payment Reference</span>
                        <span className="text-[10px] text-slate-400">Must include this exact reference</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-orange-400">{refCode}</span>
                        <button
                          onClick={() => copyToClipboard(refCode, 'ref')}
                          className="p-1.5 text-orange-400 hover:text-white bg-orange-600/30 rounded-lg transition-colors cursor-pointer"
                          title="Copy Reference"
                        >
                          {copiedField === 'ref' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Proof of Payment (PoP) Submission Section */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Upload Proof of Payment (PoP)
                    </span>
                    {currentApp.popStatus === 'pop_submitted' && (
                      <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                        PoP Under Admin Review
                      </span>
                    )}
                    {currentApp.popStatus === 'pop_verified' && (
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                        Payment Verified & Active
                      </span>
                    )}
                  </div>

                  {currentApp.popStatus === 'pop_verified' ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center space-y-1">
                      <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                      <div className="text-xs font-black text-emerald-300">Subscription Active & Verified!</div>
                      <div className="text-[11px] text-slate-300">
                        {selectedType === 'tenant' 
                          ? 'You are now earning passive monthly income from user subscription fees.'
                          : 'Your subscription is active with full access to GiGs.'}
                      </div>
                    </div>
                  ) : currentApp.popStatus === 'pop_submitted' ? (
                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-center space-y-2">
                      <Clock size={24} className="text-amber-400 mx-auto animate-pulse" />
                      <div className="text-xs font-black text-amber-300">Proof of Payment Submitted</div>
                      <div className="text-[11px] text-slate-300">
                        File: <span className="font-semibold text-white">{currentApp.popFileName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        The admin is verifying your payment with reference <span className="font-bold text-orange-400">{refCode}</span>.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input 
                        type="file" 
                        ref={popInputRef} 
                        onChange={handlePopUpload} 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                      />
                      <div 
                        onClick={() => popInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-900/50"
                      >
                        {popFile ? (
                          <div className="flex items-center justify-center gap-3">
                            <FileText size={24} className="text-orange-400" />
                            <div className="text-left">
                              <div className="text-xs font-bold text-white truncate max-w-[200px]">{popFileName}</div>
                              <div className="text-[10px] text-emerald-400 font-semibold">PoP file ready to submit</div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload size={22} className="text-orange-400 mx-auto" />
                            <div className="text-xs font-bold text-white">Upload Payment Receipt or Screenshot</div>
                            <div className="text-[10px] text-slate-400">PDF, JPG, PNG from device</div>
                          </div>
                        )}
                      </div>

                      {popFile && (
                        <button
                          onClick={handleSubmitPoP}
                          className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-extrabold shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Send size={15} />
                          <span>Submit Proof of Payment for Verification</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW C: REJECTED NOTICE (Allow Re-submission) */}
            {currentApp && currentApp.status === 'rejected' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Application Needs Revision</h3>
                  <p className="text-xs text-red-300">
                    {currentApp.rejectionReason || 'The submitted documents could not be verified by the admin.'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Please upload a clearer face-only photo and valid ID document.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const list = getApplications().filter(a => a.id !== currentApp.id);
                    localStorage.setItem('tenant_applications', JSON.stringify(list));
                    window.dispatchEvent(new Event('tenant_applications_updated'));
                    loadData();
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Submit New Application
                </button>
              </div>
            )}

            {/* SUB-VIEW D: NEW APPLICATION FORM (Upload Face Only & ID Document from device) */}
            {(!currentApp) && (
              <form onSubmit={handleSubmitApplication} className="space-y-5">
                {errorMessage && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Applicant Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <input 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Profile Picture: Face Only Upload */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={14} className="text-orange-400" />
                      <span>Profile Picture (Face Only)</span>
                    </label>
                    <span className="text-[10px] text-orange-400 font-bold">Required</span>
                  </div>

                  <input 
                    type="file" 
                    ref={faceInputRef} 
                    onChange={handleFaceUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  <div 
                    onClick={() => faceInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      facePhoto 
                        ? 'border-orange-500 bg-orange-950/20' 
                        : 'border-slate-700 hover:border-orange-400 bg-slate-950/50'
                    }`}
                  >
                    {facePhoto ? (
                      <div className="flex items-center justify-center gap-4">
                        <img 
                          src={facePhoto} 
                          alt="Face Preview" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-md"
                        />
                        <div className="text-left">
                          <div className="text-xs font-black text-white flex items-center gap-1">
                            <CheckCircle2 size={14} className="text-emerald-400" /> Face photo uploaded
                          </div>
                          <div className="text-[10px] text-slate-400">Click to change photo</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <div className="w-10 h-10 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto">
                          <Camera size={20} />
                        </div>
                        <div className="text-xs font-bold text-white">Upload Face Photo from Device</div>
                        <div className="text-[10px] text-slate-400">Camera or gallery (Clear face photo only)</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Upload ID Document from Device */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-orange-400" />
                      <span>ID Document (From Device)</span>
                    </label>
                    <span className="text-[10px] text-orange-400 font-bold">Required</span>
                  </div>

                  <input 
                    type="file" 
                    ref={idInputRef} 
                    onChange={handleIdUpload} 
                    accept="image/*,application/pdf" 
                    className="hidden" 
                  />

                  <div 
                    onClick={() => idInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                      idDocument 
                        ? 'border-orange-500 bg-orange-950/20' 
                        : 'border-slate-700 hover:border-orange-400 bg-slate-950/50'
                    }`}
                  >
                    {idDocument ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
                          <FileText size={24} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-black text-white flex items-center gap-1">
                            <CheckCircle2 size={14} className="text-emerald-400" /> ID Document selected
                          </div>
                          <div className="text-[10px] text-slate-300 font-semibold truncate max-w-[200px]">{idDocName}</div>
                          <div className="text-[10px] text-slate-400">Click to replace file</div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center mx-auto">
                          <Upload size={20} />
                        </div>
                        <div className="text-xs font-bold text-white">Upload ID Document from Device</div>
                        <div className="text-[10px] text-slate-400">National ID card, smart card, passport, or driver's license</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estimated Review Time Notice */}
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-300">
                  <Clock size={16} className="text-amber-400 shrink-0" />
                  <span>Submission verification review takes approximately <strong>15 to 25 minutes</strong>.</span>
                </div>

                {/* Submit Application Button */}
                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-2xl text-xs font-black tracking-wide shadow-xl hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    selectedType === 'tenant'
                      ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-amber-600/30'
                      : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 text-white shadow-cyan-600/30'
                  }`}
                >
                  <Send size={16} />
                  <span>Submit Application for Review</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
