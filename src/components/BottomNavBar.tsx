import { MapPin, User, CreditCard } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenActivation: () => void;
  isFullyApproved?: boolean;
}

export default function BottomNavBar({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenActivation,
  isFullyApproved = false,
}: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1500] w-full bg-slate-900/98 backdrop-blur-xl border-t border-orange-500/30 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.7)] pointer-events-auto">
      {/* 1. GiGs Tab */}
      <button
        onClick={() => setActiveTab('gigs')}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
          activeTab === 'gigs' ? 'text-orange-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
        }`}
      >
        <MapPin size={22} />
        <span className="text-xs font-semibold tracking-wide">GiGs</span>
      </button>

      {/* 2. Activation Tab (hidden when user is fully approved) */}
      {!isFullyApproved && (
        <button
          onClick={() => {
            setActiveTab('activation');
            onOpenActivation();
          }}
          className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
            activeTab === 'activation' ? 'text-orange-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard size={22} />
          <span className="text-xs font-semibold tracking-wide">Activation</span>
        </button>
      )}

      {/* 3. Profile Tab */}
      <button
        onClick={() => {
          setActiveTab('profile');
          onOpenProfile();
        }}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
          activeTab === 'profile' ? 'text-orange-400 font-bold scale-105' : 'text-slate-400 hover:text-white'
        }`}
      >
        <User size={22} />
        <span className="text-xs font-semibold tracking-wide">Profile</span>
      </button>
    </nav>
  );
}
