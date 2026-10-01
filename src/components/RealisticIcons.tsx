interface RealisticIconProps {
  active: boolean;
  locked?: boolean;
}

export function RealisticSeekersIcon({ active }: RealisticIconProps) {
  return (
    <div className={`relative w-8 h-8 flex items-center justify-center transition-all duration-200 ${active ? 'scale-105 -translate-y-0.5' : 'opacity-85 hover:opacity-100'}`}>
      <svg viewBox="0 0 48 48" className="w-8 h-8 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Chrome Bezel */}
          <linearGradient id="seekersBezel" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#d1d5db" />
            <stop offset="70%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </linearGradient>

          {/* Lens Background */}
          <radialGradient id="seekersLens" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={active ? "#ffedd5" : "#f8fafc"} />
            <stop offset="50%" stopColor={active ? "#fb923c" : "#94a3b8"} />
            <stop offset="100%" stopColor={active ? "#c2410c" : "#475569"} />
          </radialGradient>

          {/* Specular Highlight */}
          <linearGradient id="lensGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Gold Radar Line */}
          <linearGradient id="goldBeam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
        </defs>

        {/* Outer Metallic Ring */}
        <circle cx="24" cy="24" r="21" fill="url(#seekersBezel)" />
        <circle cx="24" cy="24" r="18" fill="url(#seekersLens)" />

        {/* Inner Radar Grid */}
        <circle cx="24" cy="24" r="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="2 2" fill="none" />
        <circle cx="24" cy="24" r="7" stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />
        <line x1="24" y1="6" x2="24" y2="42" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
        <line x1="6" y1="24" x2="42" y2="24" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />

        {/* Seeker / Candidate Silhouette with 3D Emboss */}
        <circle cx="24" cy="18" r="4.5" fill="#ffffff" className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
        <path d="M 16 32 C 16 26.5, 20 25, 24 25 C 28 25, 32 26.5, 32 32 Z" fill="#ffffff" className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />

        {/* Magnifying Loupe Overlay */}
        <circle cx="29" cy="21" r="7" stroke="url(#goldBeam)" strokeWidth="2.2" fill="none" className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        <line x1="34" y1="26" x2="40" y2="32" stroke="url(#goldBeam)" strokeWidth="3" strokeLinecap="round" />

        {/* Realistic Glass Curved Sheen */}
        <path d="M 10 18 Q 24 10 38 18 A 18 18 0 0 0 10 18 Z" fill="url(#lensGloss)" />

        {/* Active Indicator Glow Pip */}
        {active && (
          <circle cx="24" cy="40" r="1.8" fill="#4ade80" className="filter drop-shadow-[0_0_4px_#22c55e]" />
        )}
      </svg>
    </div>
  );
}

export function RealisticGigsIcon({ active }: RealisticIconProps) {
  return (
    <div className={`relative w-8 h-8 flex items-center justify-center transition-all duration-200 ${active ? 'scale-105 -translate-y-0.5' : 'opacity-85 hover:opacity-100'}`}>
      <svg viewBox="0 0 48 48" className="w-8 h-8 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Leather Briefcase Body */}
          <linearGradient id="leatherBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={active ? "#ea580c" : "#64748b"} />
            <stop offset="50%" stopColor={active ? "#9a3412" : "#334155"} />
            <stop offset="100%" stopColor={active ? "#7c2d12" : "#1e293b"} />
          </linearGradient>

          {/* Brass / Chrome Hardware */}
          <linearGradient id="metalHardware" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#ca8a04" />
            <stop offset="70%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>

          {/* Top Flap Highlight */}
          <linearGradient id="leatherFlap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={active ? "#fb923c" : "#94a3b8"} />
            <stop offset="100%" stopColor={active ? "#c2410c" : "#475569"} />
          </linearGradient>
        </defs>

        {/* 3D Realistic Handle */}
        <path d="M 18 13 C 18 8, 30 8, 30 13" stroke="url(#metalHardware)" strokeWidth="3" strokeLinecap="round" fill="none" className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
        <rect x="16" y="12" width="4" height="3" rx="1" fill="url(#metalHardware)" />
        <rect x="28" y="12" width="4" height="3" rx="1" fill="url(#metalHardware)" />

        {/* Main Briefcase Body */}
        <rect x="7" y="14" width="34" height="24" rx="4" fill="url(#leatherBody)" className="filter drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]" />

        {/* Perimeter Leather Stitch Line */}
        <rect x="8.5" y="15.5" width="31" height="21" rx="3" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" strokeDasharray="1.5 1.5" fill="none" />

        {/* Upper Envelope Flap */}
        <path d="M 7 14 L 24 26 L 41 14 Z" fill="url(#leatherFlap)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />

        {/* Center Metal Clasp / Latch */}
        <rect x="21" y="23" width="6" height="7" rx="1.5" fill="url(#metalHardware)" className="filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
        <circle cx="24" cy="26" r="1" fill="#451a03" />

        {/* Corner Reinforcement Brackets */}
        <path d="M 7 34 Q 7 38 11 38 L 12 38 Q 9 38 9 35 Z" fill="url(#metalHardware)" />
        <path d="M 41 34 Q 41 38 37 38 L 36 38 Q 39 38 39 35 Z" fill="url(#metalHardware)" />

        {/* Top Gloss Edge */}
        <line x1="10" y1="15" x2="38" y2="15" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeLinecap="round" />

        {/* Active Glow Pip */}
        {active && (
          <circle cx="24" cy="41" r="1.8" fill="#4ade80" className="filter drop-shadow-[0_0_4px_#22c55e]" />
        )}
      </svg>
    </div>
  );
}

export function RealisticTenantIcon({ active, locked }: RealisticIconProps) {
  return (
    <div className={`relative w-8 h-8 flex items-center justify-center transition-all duration-200 ${active ? 'scale-105 -translate-y-0.5' : 'opacity-85 hover:opacity-100'}`}>
      <svg viewBox="0 0 48 48" className="w-8 h-8 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)]" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Main Tower Metallic Glass */}
          <linearGradient id="buildingGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={active ? "#fed7aa" : "#e2e8f0"} />
            <stop offset="50%" stopColor={active ? "#ea580c" : "#64748b"} />
            <stop offset="100%" stopColor={active ? "#9a3412" : "#1e293b"} />
          </linearGradient>

          {/* Secondary Tower */}
          <linearGradient id="subBuilding" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={active ? "#ffedd5" : "#f1f5f9"} />
            <stop offset="100%" stopColor={active ? "#c2410c" : "#475569"} />
          </linearGradient>

          {/* Brass Padlock */}
          <linearGradient id="padlockGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
        </defs>

        {/* Secondary Back Tower */}
        <rect x="9" y="16" width="12" height="22" rx="2" fill="url(#subBuilding)" className="filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" />
        {/* Windows on secondary */}
        <rect x="11" y="19" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
        <rect x="16" y="19" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
        <rect x="11" y="24" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
        <rect x="16" y="24" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
        <rect x="11" y="29" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.7)" />
        <rect x="16" y="29" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.7)" />

        {/* Main High-Rise Corporate Tower */}
        <rect x="21" y="8" width="18" height="30" rx="2.5" fill="url(#buildingGlass)" className="filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.4)]" />

        {/* Architectural Spire Antenna on top */}
        <line x1="30" y1="3" x2="30" y2="8" stroke={active ? "#fb923c" : "#cbd5e1"} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="30" cy="3" r="1.2" fill={active ? "#f97316" : "#e2e8f0"} />

        {/* Modern Window Grid */}
        <rect x="24" y="12" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="30" y="12" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="24" y="17" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="30" y="17" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="24" y="22" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="30" y="22" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="24" y="27" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="30" y="27" width="3.5" height="3" rx="0.5" fill="rgba(255,255,255,0.85)" />

        {/* Grand Entrance Canopy */}
        <rect x="25" y="33" width="8" height="5" rx="1" fill={active ? "#7c2d12" : "#0f172a"} />
        <line x1="29" y1="33" x2="29" y2="38" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />

        {/* Concrete Foundation Plinth */}
        <rect x="6" y="37" width="36" height="3" rx="1.5" fill="#475569" />

        {/* Realistic Padlock overlay if locked */}
        {locked && (
          <g className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            <path d="M 33 24 C 33 21, 39 21, 39 24 L 39 26 L 33 26 Z" stroke="#e2e8f0" strokeWidth="2" fill="none" />
            <rect x="31" y="26" width="10" height="8" rx="2" fill="url(#padlockGold)" stroke="#78350f" strokeWidth="0.8" />
            <circle cx="36" cy="29.5" r="1" fill="#451a03" />
            <line x1="36" y1="30.5" x2="36" y2="32.5" stroke="#451a03" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* Active Indicator Glow Pip */}
        {active && !locked && (
          <circle cx="24" cy="42" r="1.8" fill="#4ade80" className="filter drop-shadow-[0_0_4px_#22c55e]" />
        )}
      </svg>
    </div>
  );
}
