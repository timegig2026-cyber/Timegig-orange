import { useState, useRef } from 'react';
import OpenStreetMap from './components/OpenStreetMap';
import BottomNavBar from './components/BottomNavBar';
import ProfileModal from './components/ProfileModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const locateRef = useRef<(() => void) | null>(null);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-sans">
      <OpenStreetMap onRegisterLocate={(fn) => { locateRef.current = fn; }} />

      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setActiveTab('map');
        }}
      />
    </div>
  );
}
