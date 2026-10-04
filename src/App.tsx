import { useState, useRef, useEffect, useCallback } from 'react';
import OpenStreetMap, { NavigationTrip } from './components/OpenStreetMap';
import BottomNavBar from './components/BottomNavBar';
import ProfileModal from './components/ProfileModal';
import ActivationModal from './components/ActivationModal';
import AdminPortal from './components/AdminPortal';
import SeekersModal, { Seeker } from './components/SeekersModal';
import SeekerDetailsModal from './components/SeekerDetailsModal';
import { getApplications } from './utils/applicationStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState('gigs');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isActivationOpen, setIsActivationOpen] = useState(false);
  const [isSeekersOpen, setIsSeekersOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFullyApproved, setIsFullyApproved] = useState(false);
  const [activeTrip, setActiveTrip] = useState<NavigationTrip | null>(null);
  const [selectedSeekerForDetails, setSelectedSeekerForDetails] = useState<Seeker | null>(null);
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

  const handleHireSeekerAndNavigate = (trip: NavigationTrip) => {
    setActiveTrip(trip);
    setIsSeekersOpen(false);
    setSelectedSeekerForDetails(null);
    setActiveTab('gigs');
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 font-sans">
      <OpenStreetMap 
        onRegisterLocate={(fn) => { locateRef.current = fn; }} 
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeTrip={activeTrip}
        onEndTrip={() => setActiveTrip(null)}
        onSelectSeeker={(seeker) => setSelectedSeekerForDetails(seeker)}
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
        onOpenSeekers={() => setIsSeekersOpen(true)}
        isFullyApproved={isFullyApproved}
      />

      <SeekersModal
        isOpen={isSeekersOpen}
        onClose={() => {
          setIsSeekersOpen(false);
          setActiveTab('gigs');
        }}
        onHireSeekerAndNavigate={handleHireSeekerAndNavigate}
        onLocateOnMap={() => {
          setIsSeekersOpen(false);
          setActiveTab('gigs');
          if (locateRef.current) locateRef.current();
        }}
      />

      <SeekerDetailsModal
        seeker={selectedSeekerForDetails}
        isOpen={Boolean(selectedSeekerForDetails)}
        onClose={() => setSelectedSeekerForDetails(null)}
        onHireSeeker={(seeker) => {
          setSelectedSeekerForDetails(null);
          handleHireSeekerAndNavigate({
            seeker: {
              id: seeker.id,
              name: seeker.name,
              profession: seeker.profession,
              avatar: seeker.avatar,
              phone: seeker.phone
            },
            destination: {
              lat: -26.2041,
              lng: 28.0473,
              name: 'Your Destination Location'
            }
          });
        }}
        onLocateOnMap={() => {
          setSelectedSeekerForDetails(null);
          setIsSeekersOpen(false);
          setActiveTab('gigs');
          if (locateRef.current) locateRef.current();
        }}
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
