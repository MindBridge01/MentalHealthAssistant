import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/login/mind-bridge-logo.png';
import './dashboard.css';

export function DashboardIcon({ name, className = '' }) {
  return <span className={`material-icons ${className}`} aria-hidden="true">{name}</span>;
}

export function DashboardHeading({ eyebrow, title, description, actions }) {
  return <div className="mb-page-heading"><div>{eyebrow && <p className="mb-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="mb-page-description">{description}</p>}</div>{actions && <div className="mb-heading-actions">{actions}</div>}</div>;
}

export function DashboardMetric({ label, value, hint, href, onClick }) {
  const content = <><span className="mb-metric-top"><span>{label}</span></span><strong>{value ?? '—'}</strong><span className="mb-metric-hint">{hint}</span></>;
  return href ? <Link className="mb-metric" to={href}>{content}</Link> : onClick ? <button className="mb-metric" onClick={onClick}>{content}</button> : <div className="mb-metric">{content}</div>;
}

export function DashboardEmpty({ icon = 'inbox', title, children, action }) {
  return <div className="mb-empty"><span className="mb-empty-icon"><DashboardIcon name={icon} /></span><h3>{title}</h3>{children && <p>{children}</p>}{action}</div>;
}

export default function DashboardShell({ roleLabel, title, navigation, children, sidebarNote, headerAction, className = '' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dialog = useRef(null);
  const menuButton = useRef(null);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const initials = (user?.name || 'Mind Bridge').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const closeMenu = () => { dialog.current?.close(); menuButton.current?.focus(); };
  useEffect(() => { const drawer = dialog.current; return () => drawer?.close(); }, []);
  async function signOut() {
    setSigningOut(true);
    try { await logout(); navigate('/login'); }
    catch { setLogoutError('Unable to sign out. Please try again.'); setSigningOut(false); }
  }
  const sidebar = mobile => <>
    <div className="mb-brand-row"><Link className="mb-brand" to="/"><span className="mb-logo"><img src={logo} alt="" /></span><span>mindbridge</span></Link>{mobile && <button className="mb-icon-button" onClick={closeMenu} aria-label="Close navigation"><DashboardIcon name="close" /></button>}</div>
    <p className="mb-sidebar-label">{roleLabel}</p>
    <nav aria-label={`${roleLabel} navigation`} className="mb-navigation">{navigation.map(item => item.href ? <Link key={item.label} to={item.href} aria-current={item.active ? 'page' : undefined} onClick={closeMenu}><DashboardIcon name={item.icon} /><span>{item.label}</span>{item.count > 0 && <b>{item.count}</b>}</Link> : <button type="button" key={item.label} aria-current={item.active ? 'page' : undefined} onClick={() => { item.onClick(); closeMenu(); }}><DashboardIcon name={item.icon} /><span>{item.label}</span>{item.count > 0 && <b>{item.count}</b>}</button>)}</nav>
    <div className="mb-sidebar-bottom">{sidebarNote && <div className="mb-sidebar-note">{sidebarNote}</div>}<Link className="mb-sidebar-home" to="/"><DashboardIcon name="west" />Back to home</Link><div className="mb-sidebar-user"><span className="mb-avatar">{initials}</span><div><strong>{user?.name || 'Mind Bridge member'}</strong><small>{roleLabel}</small></div></div><button className="mb-signout" onClick={signOut} disabled={signingOut}><DashboardIcon name="logout" />{signingOut ? 'Signing out…' : 'Sign out'}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>
  </>;
  return <div className={`mb-dashboard ${className}`}>
    <a className="mb-skip" href="#dashboard-content">Skip to content</a>
    <aside className="mb-sidebar">{sidebar(false)}</aside>
    <dialog className="mb-drawer" aria-label={`${roleLabel} navigation`} ref={dialog} onClick={event => { if (event.target === dialog.current) closeMenu(); }}><div className="mb-sidebar">{sidebar(true)}</div></dialog>
    <div className="mb-dashboard-body"><header className="mb-topbar"><div><button ref={menuButton} className="mb-icon-button mb-menu" aria-label="Open navigation" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}><DashboardIcon name="menu" /></button><span className="mb-breadcrumb"><span className="mb-breadcrumb-role">{roleLabel}</span><span>/</span><strong>{title}</strong></span></div><div className="mb-topbar-actions">{headerAction}<span className="mb-avatar" aria-label={user?.name || 'Your account'}>{initials}</span></div></header><main id="dashboard-content" className="mb-main" tabIndex={-1}>{children}<footer className="mb-footer"><span>© Mind Bridge</span><span>Small steps. Meaningful progress.</span></footer></main></div>
  </div>;
}
