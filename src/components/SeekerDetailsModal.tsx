import React from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Calendar, 
  Building2, 
  Globe, 
  Navigation,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Seeker } from './SeekersModal';

interface SeekerDetailsModalProps {
  seeker: Seeker | null;
  isOpen: boolean;
  onClose: () => void;
  onHireSeeker: (seeker: Seeker) => void;
  onLocateOnMap?: (seeker: Seeker) => void;
}

export default function SeekerDetailsModal({
  seeker,
  isOpen,
  onClose,
  onHireSeeker,
  onLocateOnMap
}: SeekerDetailsModalProps) {
  if (!isOpen || !seeker) return null;

  const fullDisplayName = [
    seeker.name,
    seeker.middleName,
    seeker.surname
  ].filter(Boolean).join(' ') || seeker.name;

  return (
    <div className="fixed inset-0 z-[5200] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto animate-fadeIn font-sans">
      <div 
        className="bg-slate-900 border border-slate-800 sm:border-emerald-500/40 w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden text-slate-100 animate-slideUp sm:animate-scaleUp relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Seeker Details</h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Verified Talent Profile
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Close Details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-xs">
          
          {/* Hero Profile Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative shrink-0">
              <img
                src={seeker.avatar}
                alt={seeker.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-lg"
              />
              {seeker.available && (
                <div 
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow"
                  title="Ready to hire now"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base font-black text-white">{fullDisplayName}</h3>
                {seeker.isCurrentUser ? (
                  <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    You (Active Seeker)
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                    {seeker.category}
                  </span>
                )}
              </div>

              <p className="text-xs text-orange-300 font-bold">{seeker.profession}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-slate-400 text-[11px]">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star size={13} fill="currentColor" />
                  <span>{seeker.rating} ({seeker.reviewsCount} {seeker.reviewsCount === 1 ? 'review' : 'reviews'})</span>
                </span>

                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-emerald-400" />
                  <span>{seeker.location || 'Local Area'}</span>
                </span>

                <span className="text-slate-500">•</span>

                <span className="text-emerald-400 font-semibold">{seeker.distance}</span>
              </div>
            </div>

            <div className="text-center sm:text-right shrink-0">
              <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30 inline-block whitespace-nowrap shadow-inner">
                {seeker.rate || 'Negotiable'}
              </span>
            </div>
          </div>

          {/* Status Badge: Available & Ready to Hire */}
          <div className={`p-3 rounded-2xl flex items-center justify-between gap-3 border ${
            seeker.available 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : 'bg-slate-800/40 border-slate-700 text-slate-400'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${seeker.available ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="font-bold">
                {seeker.available ? 'Ready to Hire • Available for instant gig request' : 'Currently booked or offline'}
              </span>
            </div>
            <span className="text-[10px] uppercase font-black bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
              {seeker.available ? 'LIVE' : 'AWAY'}
            </span>
          </div>

          {/* Details Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {seeker.province && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Building2 size={11} className="text-orange-400" />
                  Province & Region
                </span>
                <p className="font-semibold text-white">{seeker.province}</p>
              </div>
            )}

            {seeker.address && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <MapPin size={11} className="text-emerald-400" />
                  Address / Suburb
                </span>
                <p className="font-semibold text-white">{seeker.address}</p>
              </div>
            )}

            {seeker.dateOfBirth && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Calendar size={11} className="text-amber-400" />
                  Date of Birth
                </span>
                <p className="font-semibold text-white">{seeker.dateOfBirth}</p>
              </div>
            )}

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Clock size={11} className="text-emerald-400" />
                Response Time
              </span>
              <p className="font-semibold text-emerald-300">Under 2 minutes (Instant notification)</p>
            </div>
          </div>

          {/* Type of Work Looking For */}
          {(seeker.workLookingFor || (seeker.workTypes && seeker.workTypes.length > 0)) && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-200">
                <Sparkles size={14} className="text-amber-400" />
                <span>Work Looking For on App</span>
              </div>

              {seeker.workLookingFor && (
                <p className="text-slate-300 leading-relaxed text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {seeker.workLookingFor}
                </p>
              )}

              {seeker.workTypes && seeker.workTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {seeker.workTypes.map((type, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verified Skills */}
          {seeker.skills && seeker.skills.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Verified Skills & Competencies</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {seeker.skills.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs font-semibold bg-slate-950 text-slate-200 px-3 py-1 rounded-xl border border-slate-700/80 shadow-sm flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Details */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Direct Contact & Communication
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {seeker.phone && (
                <a
                  href={`tel:${seeker.phone}`}
                  className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Phone size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Phone / Mobile</span>
                      <span className="font-bold text-white text-xs">{seeker.phone}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 group-hover:underline">Call</span>
                </a>
              )}

              {seeker.email && (
                <a
                  href={`mailto:${seeker.email}`}
                  className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Mail size={14} />
                    </div>
                    <div className="truncate max-w-[150px]">
                      <span className="text-[10px] text-slate-400 block">Email Address</span>
                      <span className="font-bold text-white text-xs truncate block">{seeker.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-400 group-hover:underline">Email</span>
                </a>
              )}
            </div>

            {/* Social Media Links */}
            {seeker.socialLinks && seeker.socialLinks.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Social Media & Portfolio Links
                </span>
                <div className="flex flex-wrap gap-2">
                  {seeker.socialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs transition-colors"
                    >
                      <Globe size={12} className="text-orange-400" />
                      <span>{link.platform}</span>
                      <ExternalLink size={10} className="text-slate-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center gap-3">
          {onLocateOnMap && (
            <button
              onClick={() => {
                onLocateOnMap(seeker);
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              <Navigation size={14} className="text-emerald-400" />
              <span>Locate on Map</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onHireSeeker(seeker);
            }}
            className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-black shadow-[0_4px_20px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap size={16} className="fill-white" />
            <span>Hire Seeker Now</span>
          </button>
        </div>

      </div>
    </div>
  );
}
