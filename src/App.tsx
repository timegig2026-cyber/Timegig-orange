import { useState, useRef, useEffect, useCallback } from 'react';
import OpenStreetMap from './components/OpenStreetMap';
import BottomNavBar from './components/BottomNavBar';
import ProfileModal from './components/ProfileModal';
import ActivationModal from './components/ActivationModal';
import AdminPortal from './components/AdminPortal';
import { getApplications } from './utils/applicationStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState('gigs');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFullyApproved, setIsFullyApproved] = useState(false);
  const locateRef = useRef<(() => void) | null>(null);

  const checkApprovedStatus = useCallback(() => {
    const apps = getApplications();
    const approved = apps.some(a => a.status === 'approved' || a.popStatus === 'pop_verified');
    setIsFullyApproved(approved);
    if (approved && isActivationOpen) {
      setIsActivationOpen(false);
      setActiveTab('gigs');
    }
  }, [isActivationOpen]);

  useEffect(() => {
    checkApprovedStatus();
    window.addEventListener('tenant_applications_updated', checkApprovedStatus);
    return () => window.removeEventListener('tenant_applications_updated', checkApprovedStatus);
  }, [checkApprovedStatus]);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-sans">
      <OpenStreetMap 
        onRegisterLocate={(fn) => { locateRef.current = fn; }} 
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenActivation={() => {
          if (!isFullyApproved) {
            setIsActivationOpen(true);
          }
        }}
        isFullyApproved={isFullyApproved}
      />

      <ActivationModal
        isOpen={isActivationOpen && !isFullyApproved}
        onClose={() => {
          setIsActivationOpen(false);
          setActiveTab('gigs');
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setActiveTab('gigs');
        }}
      />

      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
