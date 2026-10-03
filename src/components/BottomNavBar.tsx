interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenActivation: () => void;
  onOpenSeekers: () => void;
  isFullyApproved?: boolean;
}

// WeChat-styled Seekers Icon (Contacts / Talent Directory)
function WeChatSeekersIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
        <path d="M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2H8V4z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M3 9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v2H3V9zm0 4h6v1a3 3 0 0 0 6 0v-1h6v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-6z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="15" rx="3" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 11h18" />
      <path d="M10 11v1.8a2 2 0 0 0 4 0V11" />
    </svg>
  );
}

// WeChat-styled GiGs Icon (Moments / Discover Map Pin)
function WeChatGigsIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C7.58 2 4 5.58 4 10c0 5.8 7.15 11.9 7.46 12.16a.8.8 0 0 0 1.08 0C12.85 21.9 20 15.8 20 10c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9.5c0 5.4 7 12.5 7 12.5s7-7.1 7-12.5C19 5.13 15.87 2 12 2z" />
      <circle cx="12" cy="9.5" r="2.8" />
    </svg>
  );
}

// WeChat-styled Activation Icon (WeChat Pay / Wallet / Cards)
function WeChatActivationIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 9.5h20v2H2z" fill="#ffffff" />
        <rect x="5.5" y="13.5" width="3.5" height="2.5" rx="0.6" fill="#ffffff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <rect x="5.5" y="13.5" width="3.5" height="2.5" rx="0.6" stroke="none" fill="currentColor" />
    </svg>
  );
}

// WeChat-styled Profile Icon (WeChat "Me" / 我 Tab)
function WeChatProfileIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor">
        <circle cx="12" cy="7.5" r="4.2" />
        <path d="M4.5 20.5c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5h-15z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7.5" r="4.2" />
      <path d="M4.5 20.5c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5" />
    </svg>
  );
}

export default function BottomNavBar({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenActivation,
  onOpenSeekers,
  isFullyApproved = false,
}: BottomNavBarProps) {
  return (
    <nav 
      aria-label="WeChat Style Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-[1500] w-full bg-[#fbfbfb] border-t border-[#dfdfdf] px-2 sm:px-6 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-1px_4px_rgba(0,0,0,0.04)] pointer-events-auto select-none"
    >
      {/* 1. Seekers Tab (Left) */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('seekers');
          onOpenSeekers();
        }}
        className={`flex-1 max-w-[80px] flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer ${
          activeTab === 'seekers' 
            ? 'text-[#07c160]' 
            : 'text-[#191919] hover:text-black'
        }`}
        title="Seekers"
      >
        <div className="relative flex items-center justify-center h-6">
          <WeChatSeekersIcon active={activeTab === 'seekers'} />
        </div>
        <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${
          activeTab === 'seekers' ? 'font-bold text-[#07c160]' : 'font-medium text-[#191919]'
        }`}>
          Seekers
        </span>
      </button>

      {/* 2. GiGs Tab (Center / Middle) */}
      <button
        type="button"
        onClick={() => setActiveTab('gigs')}
        className={`flex-1 max-w-[80px] flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer ${
          activeTab === 'gigs' 
            ? 'text-[#07c160]' 
            : 'text-[#191919] hover:text-black'
        }`}
        title="GiGs"
      >
        <div className="relative flex items-center justify-center h-6">
          <WeChatGigsIcon active={activeTab === 'gigs'} />
        </div>
        <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${
          activeTab === 'gigs' ? 'font-bold text-[#07c160]' : 'font-medium text-[#191919]'
        }`}>
          GiGs
        </span>
      </button>

      {/* 3. Activation Tab (Hidden when fully approved) */}
      {!isFullyApproved && (
        <button
          type="button"
          onClick={() => {
            setActiveTab('activation');
            onOpenActivation();
          }}
          className={`flex-1 max-w-[80px] flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer ${
            activeTab === 'activation' 
              ? 'text-[#07c160]' 
              : 'text-[#191919] hover:text-black'
          }`}
          title="Activation"
        >
          <div className="relative flex items-center justify-center h-6">
            <WeChatActivationIcon active={activeTab === 'activation'} />
          </div>
          <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${
            activeTab === 'activation' ? 'font-bold text-[#07c160]' : 'font-medium text-[#191919]'
          }`}>
            Activation
          </span>
        </button>
      )}

      {/* 4. Profile Tab (Right - WeChat "Me" Tab Style) */}
      <button
        type="button"
        onClick={() => {
          setActiveTab('profile');
          onOpenProfile();
        }}
        className={`flex-1 max-w-[80px] flex flex-col items-center justify-center py-0.5 transition-all cursor-pointer ${
          activeTab === 'profile' 
            ? 'text-[#07c160]' 
            : 'text-[#191919] hover:text-black'
        }`}
        title="Profile"
      >
        <div className="relative flex items-center justify-center h-6">
          <WeChatProfileIcon active={activeTab === 'profile'} />
        </div>
        <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${
          activeTab === 'profile' ? 'font-bold text-[#07c160]' : 'font-medium text-[#191919]'
        }`}>
          Profile
        </span>
      </button>
    </nav>
  );
}
