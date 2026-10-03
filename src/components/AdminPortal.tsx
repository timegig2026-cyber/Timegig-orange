import { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  LayoutDashboard, 
  UserCheck, 
  Receipt, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Eye, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  ChevronRight, 
  ExternalLink,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { 
  getApplications, 
  updateApplicationStatus, 
  updateApplicationPoP, 
  BANK_DETAILS, 
  ApplicationSubmission 
} from '../utils/applicationStorage';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPortal({ isOpen, onClose }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'tenant_pop' | 'user_pop'>('overview');
  const [applications, setApplications] = useState<ApplicationSubmission[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'tenant' | 'user_subscription'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending_review' | 'approved' | 'rejected'>('all');
  
  // Image Inspection Zoom Modal
  const [inspectImage, setInspectImage] = useState<{ url: string; title: string } | null>(null);

  // Rejection modal
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadData = () => {
    setApplications(getApplications());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
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

  // Counts for badges
  const pendingVerifications = applications.filter(a => a.status === 'pending_review');
  const pendingTenantPoPs = applications.filter(a => a.type === 'tenant' && a.popStatus === 'pop_submitted');
  const pendingUserPoPs = applications.filter(a => a.type === 'user_subscription' && a.popStatus === 'pop_submitted');
  const approvedTenants = applications.filter(a => a.type === 'tenant' && (a.status === 'approved' || a.popStatus === 'pop_verified'));
  const approvedUsers = applications.filter(a => a.type === 'user_subscription' && (a.status === 'approved' || a.popStatus === 'pop_verified'));

  // Filtered applications for Verification tab
  const verificationList = applications.filter(app => {
    const matchesType = filterType === 'all' || app.type === filterType;
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Tenant PoP list
  const tenantPoPList = applications.filter(a => a.type === 'tenant' && a.popDocument);

  // User PoP list
  const userPoPList = applications.filter(a => a.type === 'user_subscription' && a.popDocument);

  const handleApprove = (id: string) => {
    updateApplicationStatus(id, 'approved');
    loadData();
  };

  const handleRejectConfirm = () => {
    if (!rejectingAppId) return;
    updateApplicationStatus(rejectingAppId, 'rejected', rejectionReason.trim() || 'Verification documents were not clear or valid.');
    setRejectingAppId(null);
    setRejectionReason('');
    loadData();
  };

  const handleVerifyPoP = (id: string) => {
    updateApplicationPoP(id, 'pop_verified', 'Payment verified in Capitec account.');
    loadData();
  };

  const handleDeclinePoP = (id: string) => {
    updateApplicationPoP(id, 'pop_rejected', 'Payment not found or reference mismatch.');
    loadData();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[3500] w-full h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden animate-fadeIn">
      
      {/* TOP MENU BAR */}
      <header className="w-full bg-slate-900 border-b border-orange-500/30 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-lg z-20">
        
        {/* Brand & Title */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600/30 text-orange-400 rounded-xl border border-orange-500/40">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-wide text-white">GiGs Admin</h1>
                <span className="text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                  Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Verification & Subscription Bank Transfer Management
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="sm:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Menu Features: Overview, Verification, Tenant PoP, User PoP */}
        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {/* 1. Overview */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <LayoutDashboard size={15} />
            <span>Overview</span>
          </button>

          {/* 2. Verification */}
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap relative ${
              activeTab === 'verification'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <UserCheck size={15} />
            <span>Verification</span>
            {pendingVerifications.length > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {pendingVerifications.length}
              </span>
            )}
          </button>

          {/* 3. Tenant PoP */}
          <button
            onClick={() => setActiveTab('tenant_pop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'tenant_pop'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Building2 size={15} />
            <span>Tenant PoP</span>
            {pendingTenantPoPs.length > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {pendingTenantPoPs.length}
              </span>
            )}
          </button>

          {/* 4. User PoP */}
          <button
            onClick={() => setActiveTab('user_pop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'user_pop'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Receipt size={15} />
            <span>User PoP</span>
            {pendingUserPoPs.length > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {pendingUserPoPs.length}
              </span>
            )}
          </button>
        </nav>

        {/* Exit Back to Map Button */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700 shadow-sm"
          >
            <X size={15} />
            <span>Back to Map</span>
          </button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ---------------- 1. OVERVIEW FEATURE ---------------- */}
        {activeTab === 'overview' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Bank Transfer Status Banner */}
            <div className="bg-gradient-to-r from-orange-950/70 via-slate-900 to-amber-950/70 border border-orange-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 bg-orange-600/20 px-2.5 py-1 rounded-full border border-orange-500/30 inline-block">
                  Receiving Bank Account
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Capitec Bank — {BANK_DETAILS.accountName}
                </h2>
                <p className="text-xs text-slate-300">
                  Approved tenants & subscribers transfer payments here. Tenant Ref: <span className="font-bold text-orange-400">Ten29</span> | User Ref: <span className="font-bold text-cyan-400">User29</span>
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-3 rounded-2xl">
                <div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Account Number</div>
                  <div className="font-mono text-base font-black text-amber-300">{BANK_DETAILS.accountNumber}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, 'overview_acc')}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedField === 'overview_acc' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Pending Verifications */}
              <div 
                onClick={() => setActiveTab('verification')}
                className="bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <UserCheck size={22} />
                  <span className="text-[10px] font-black uppercase bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">Action Needed</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{pendingVerifications.length}</div>
                <div className="text-xs text-slate-400 font-medium">Pending Verifications</div>
              </div>

              {/* Approved Tenants */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between text-orange-400 mb-2">
                  <Building2 size={22} />
                  <span className="text-[10px] font-black uppercase bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/30">Active</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{approvedTenants.length}</div>
                <div className="text-xs text-slate-400 font-medium">Active Tenants (Monthly Income)</div>
              </div>

              {/* Active User Subscriptions */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between text-cyan-400 mb-2">
                  <Users size={22} />
                  <span className="text-[10px] font-black uppercase bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">Subscribed</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{approvedUsers.length}</div>
                <div className="text-xs text-slate-400 font-medium">User Subscriptions</div>
              </div>

              {/* Pending PoP Proofs */}
              <div 
                onClick={() => setActiveTab('tenant_pop')}
                className="bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all hover:scale-[1.02] shadow-lg"
              >
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <Receipt size={22} />
                  <span className="text-[10px] font-black uppercase bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30">Payment Slips</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {pendingTenantPoPs.length + pendingUserPoPs.length}
                </div>
                <div className="text-xs text-slate-400 font-medium">PoP Proofs Awaiting Check</div>
              </div>

            </div>

            {/* Quick Application Review Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Recent Submissions</h3>
                  <p className="text-[11px] text-slate-400">Applications submitted for review</p>
                </div>
                <button
                  onClick={() => setActiveTab('verification')}
                  className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Go to Verification</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="divide-y divide-slate-800/80 overflow-x-auto">
                {applications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">No applications received yet.</div>
                ) : (
                  applications.slice(0, 5).map(app => (
                    <div key={app.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={app.facePhoto} 
                          alt={app.fullName} 
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-700 shrink-0 cursor-pointer"
                          onClick={() => setInspectImage({ url: app.facePhoto, title: `${app.fullName} - Face Photo` })}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{app.fullName}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              app.type === 'tenant' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                            }`}>
                              {app.type === 'tenant' ? 'Tenant (Ten29)' : 'User Sub (User29)'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">{app.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          app.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : app.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                        }`}>
                          {app.status === 'pending_review' ? 'Pending Review' : app.status}
                        </span>

                        <button
                          onClick={() => setActiveTab('verification')}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="View in Verification"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---------------- 2. VERIFICATION FEATURE ---------------- */}
        {activeTab === 'verification' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-black text-white">Document Verification</h2>
                <p className="text-xs text-slate-400">
                  View submitted profile pictures (face only) and ID documents. Approve or reject applications.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filterType === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setFilterType('tenant')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filterType === 'tenant' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Tenants
                  </button>
                  <button
                    onClick={() => setFilterType('user_subscription')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${filterType === 'user_subscription' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Subscribers
                  </button>
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* List of Applications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {verificationList.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                  No applications found for selected filters.
                </div>
              ) : (
                verificationList.map((app) => (
                  <div 
                    key={app.id} 
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            app.type === 'tenant' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {app.type === 'tenant' ? 'Become a Tenant' : 'User Subscription'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Ref: <span className="text-orange-400 font-bold">{app.refCode}</span>
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1">{app.fullName}</h3>
                        <div className="text-[11px] text-slate-400">{app.email} • {app.phone}</div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        app.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : app.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        {app.status === 'pending_review' ? 'Pending Review' : app.status}
                      </span>
                    </div>

                    {/* Submitted Documents Inspection: Face Photo & ID Document */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                      
                      {/* Document 1: Face Photo */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Profile Photo (Face Only)
                        </span>
                        <div 
                          onClick={() => setInspectImage({ url: app.facePhoto, title: `${app.fullName} — Face Photo` })}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700/80 group cursor-pointer bg-slate-950"
                        >
                          <img 
                            src={app.facePhoto} 
                            alt="Face" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                            <Eye size={16} />
                            <span>Zoom</span>
                          </div>
                        </div>
                      </div>

                      {/* Document 2: ID Document */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          ID Document ({app.idDocumentName || 'Doc'})
                        </span>
                        <div 
                          onClick={() => setInspectImage({ url: app.idDocument, title: `${app.fullName} — ID Document` })}
                          className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700/80 group cursor-pointer bg-slate-950"
                        >
                          <img 
                            src={app.idDocument} 
                            alt="ID Document" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                            <Eye size={16} />
                            <span>Zoom</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Admin Actions: Approve / Reject */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                      <div className="text-[10px] text-slate-400">
                        Submitted: {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => {
                              setRejectingAppId(app.id);
                              setRejectionReason('');
                            }}
                            className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        )}

                        {app.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(app.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={14} />
                            <span>Approve</span>
                          </button>
                        )}

                        {app.status === 'approved' && (
                          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 size={14} /> Approved & Ready for Bank Transfer
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ---------------- 3. TENANT POP FEATURE ---------------- */}
        {activeTab === 'tenant_pop' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header with Capitec details */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
                <Building2 size={18} />
                <span>Tenant Proof of Payment Verification</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Capitec Account: Matthews — 1334067366 (Ref: Ten29)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review submitted bank transfer slips for tenants. Once verified, tenant will earn monthly passive income from user subscription fees.
              </p>
            </div>

            {/* List of Tenant PoP Submissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tenantPoPList.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                  No Tenant Proof of Payment documents submitted yet.
                </div>
              ) : (
                tenantPoPList.map(app => (
                  <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            Tenant Payment (Ten29)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {app.popSubmittedAt ? new Date(app.popSubmittedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1">{app.fullName}</h3>
                        <div className="text-xs text-slate-400">{app.email}</div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        app.popStatus === 'pop_verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : app.popStatus === 'pop_rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        {app.popStatus === 'pop_verified' ? 'Verified & Active' : 'PoP Submitted'}
                      </span>
                    </div>

                    {/* PoP File Preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Uploaded PoP Receipt: {app.popFileName}
                      </span>
                      <div 
                        onClick={() => setInspectImage({ url: app.popDocument || '', title: `${app.fullName} — Tenant PoP Receipt` })}
                        className="relative h-48 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group cursor-pointer"
                      >
                        <img 
                          src={app.popDocument} 
                          alt="Tenant PoP Receipt" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                          <Eye size={18} />
                          <span>View Full Proof of Payment</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      {app.popStatus !== 'pop_rejected' && (
                        <button
                          onClick={() => handleDeclinePoP(app.id)}
                          className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Decline PoP
                        </button>
                      )}

                      {app.popStatus !== 'pop_verified' ? (
                        <button
                          onClick={() => handleVerifyPoP(app.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={15} />
                          <span>Verify PoP & Activate Tenant</span>
                        </button>
                      ) : (
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 size={16} /> Tenant Activated
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* ---------------- 4. USER POP FEATURE ---------------- */}
        {activeTab === 'user_pop' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header with Capitec details */}
            <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-extrabold uppercase tracking-wider">
                <Receipt size={18} />
                <span>User Subscription Proof of Payment Verification</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Capitec Account: Matthews — 1334067366 (Ref: User29)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review submitted bank transfer slips for user subscriptions. Once verified, subscriber gets full platform access.
              </p>
            </div>

            {/* List of User PoP Submissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {userPoPList.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 text-xs">
                  No User Subscription Proof of Payment documents submitted yet.
                </div>
              ) : (
                userPoPList.map(app => (
                  <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                            User Subscription (User29)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {app.popSubmittedAt ? new Date(app.popSubmittedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1">{app.fullName}</h3>
                        <div className="text-xs text-slate-400">{app.email}</div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        app.popStatus === 'pop_verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : app.popStatus === 'pop_rejected'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      }`}>
                        {app.popStatus === 'pop_verified' ? 'Verified & Active' : 'PoP Submitted'}
                      </span>
                    </div>

                    {/* PoP File Preview */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Uploaded PoP Receipt: {app.popFileName}
                      </span>
                      <div 
                        onClick={() => setInspectImage({ url: app.popDocument || '', title: `${app.fullName} — User PoP Receipt` })}
                        className="relative h-48 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 group cursor-pointer"
                      >
                        <img 
                          src={app.popDocument} 
                          alt="User PoP Receipt" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                          <Eye size={18} />
                          <span>View Full Proof of Payment</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                      {app.popStatus !== 'pop_rejected' && (
                        <button
                          onClick={() => handleDeclinePoP(app.id)}
                          className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Decline PoP
                        </button>
                      )}

                      {app.popStatus !== 'pop_verified' ? (
                        <button
                          onClick={() => handleVerifyPoP(app.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={15} />
                          <span>Verify PoP & Activate Subscription</span>
                        </button>
                      ) : (
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 size={16} /> Subscription Active
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </main>

      {/* MODAL: Full Screen Image Zoom Inspection */}
      {inspectImage && (
        <div 
          className="fixed inset-0 z-[4000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setInspectImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between text-white pb-3">
              <span className="text-sm font-bold truncate">{inspectImage.title}</span>
              <button 
                onClick={() => setInspectImage(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <img 
              src={inspectImage.url} 
              alt={inspectImage.title} 
              className="max-h-[80vh] w-auto rounded-2xl shadow-2xl border border-slate-700 object-contain"
            />
          </div>
        </div>
      )}

      {/* MODAL: Rejection Reason Dialog */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-[4000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-base font-black text-white">Reject Application</h3>
            </div>
            <p className="text-xs text-slate-300">
              Please enter the reason for rejection. The applicant will be notified to correct and re-upload their documents.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Profile photo must be face only / ID document is blurry or unreadable."
              className="w-full h-24 bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingAppId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
