import { useLocation } from 'react-router-dom';
import PortalShell from './PortalShell';

export default function LoginContainer({ children, role, requiresMfa = false, setup = false }) {
  const { search } = useLocation();
  const portalRole = role || (new URLSearchParams(search).get('portal') === 'doctor' ? 'doctor' : 'patient');
  return <PortalShell role={portalRole} kind={new URLSearchParams(search).get('help') === 'access' ? 'recovery' : setup ? 'setup' : requiresMfa ? 'mfa' : 'login'} activeStep={requiresMfa || setup ? 1 : 0}>{children}</PortalShell>;
}
