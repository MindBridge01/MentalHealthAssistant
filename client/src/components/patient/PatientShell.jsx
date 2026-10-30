import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardShell, { DashboardIcon } from '../dashboard/DashboardShell';
import SosDialog from './SosDialog';

const navigation = [
  { label: 'Overview', href: '/patient/dashboard', icon: 'space_dashboard' },
  { label: 'AI chat', href: '/patient/chat', icon: 'chat_bubble_outline' },
  { label: 'Assessments', href: '/patient/assessments', icon: 'psychology' },
  { label: 'Activities', href: '/patient/activities', icon: 'self_improvement' },
  { label: 'Community', href: '/patient/community', icon: 'diversity_3' },
  { label: 'Find a professional', href: '/patient/doctors', icon: 'medical_services' },
  { label: 'Appointments', href: '/patient/appointments', icon: 'event_available' },
];

export default function PatientShell({ children }) {
  const { pathname, hash } = useLocation();
  const [isSosOpen, setSosOpen] = useState(false);

  useEffect(() => {
    if (hash === '#sos') setSosOpen(true);
  }, [hash]);

  const activeItem = navigation.find(item => pathname.startsWith(item.href));

  return (
    <DashboardShell
      roleLabel="Patient space"
      title={activeItem?.label || 'Your care'}
      navigation={navigation.map(item => ({ ...item, active: pathname.startsWith(item.href) }))}
      headerAction={
        <button type="button" className="mb-button mb-button--danger" onClick={() => setSosOpen(true)}>
          <DashboardIcon name="support" />SOS support
        </button>
      }
      sidebarNote={
        <>
          <strong>At your own pace.</strong>
          There is no right way to start. Choose the support that feels right for you.
          <button type="button" onClick={() => setSosOpen(true)}>
            <DashboardIcon name="support" />Need urgent support?
          </button>
        </>
      }
    >
      {children}
      <SosDialog open={isSosOpen} onClose={() => setSosOpen(false)} />
    </DashboardShell>
  );
}
