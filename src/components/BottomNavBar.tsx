import { MapPin, User } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
}

export default function BottomNavBar({ activeTab, setActiveTab, onOpenProfile }: BottomNavBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[400] w-full bg-slate-900 border-t border-orange-500/20 px-6 py-3 flex items-center justify-around shadow-lg">
      <button
        onClick={() => setActiveTab('map')}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
          activeTab === 'map' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <MapPin size={20} />
        <span className="text-[11px]">Map</span>
      </button>

      <button
        onClick={() => {
          setActiveTab('profile');
          onOpenProfile();
        }}
        className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
          activeTab === 'profile' ? 'text-orange-400 font-bold' : 'text-slate-400 hover:text-white'
        }`}
      >
        <User size={20} />
        <span className="text-[11px]">Profile</span>
      </button>
    </div>
  );
}
